import Foundation

/// Reads `index.json` and the tiles from the data host, and finds the nearest pharmacies in them.
///
/// The privacy property of the whole design (PLAN.md 7.6, `docs/tiles.md`): a request names
/// a square of 20 to 30 km, never a position. Here that holds by construction. The only
/// addresses this type can build are the index and `/tiles/v1/10/{x}/{y}.json`, and a
/// position is only ever compared with what has been loaded, on the device.
actor TileStore {
    typealias Fetch = @Sendable (URL) async throws -> Data

    enum Failure: Error, Equatable {
        /// The device has no connection.
        case offline
        /// The data host did not give what was asked for, or gave something this app can't read.
        case unavailable
    }

    private let origin: URL
    private let fetch: Fetch
    private var index: TileIndex?
    private var indexReadAt: Date?
    private var tiles: [TileRef: [TilePharmacy]] = [:]

    /// The index is read again after this long: the data host lets it be cached for an hour.
    private static let indexLifetime: TimeInterval = 3600

    init(origin: URL = Config.tilesOrigin, fetch: @escaping Fetch = TileStore.network) {
        self.origin = origin
        self.fetch = fetch
    }

    /// The index: which squares exist, and when each country's data is from.
    func currentIndex() async throws -> TileIndex {
        if let index, let indexReadAt, Date().timeIntervalSince(indexReadAt) < Self.indexLifetime { return index }
        let fresh = try await decoded(TileIndex.self, from: origin.appending(path: Tiles.indexPath))
        guard fresh.v == Tiles.version else { throw Failure.unavailable }
        // A new run of the pipeline: the tiles in memory are yesterday's.
        if fresh.generated != index?.generated { tiles = [:] }
        index = fresh
        indexReadAt = Date()
        return fresh
    }

    /// The nearest pharmacies to a position, nearest first (`docs/tiles.md`, "Finding the nearest").
    /// It throws when a tile it needed could not be had: a list that may miss the nearest
    /// pharmacy is not shown as the answer.
    func nearest(to position: LatLon, count: Int, radius: Double, accept: (@Sendable (TilePharmacy) -> Bool)? = nil) async throws -> [Found] {
        let grid = try await currentIndex().grid
        while true {
            let step = Search.step(from: position, count: count, radius: radius, grid: grid, loaded: tiles, accept: accept)
            if step.done { return step.nearest }
            try await withThrowingTaskGroup(of: (TileRef, [TilePharmacy]).self) { group in
                for tile in step.need {
                    let url = origin.appending(path: Tiles.path(tile))
                    group.addTask { [fetch] in (tile, try TileFile.decode(try await Self.load(url, with: fetch)).pharmacies) }
                }
                for try await (tile, pharmacies) in group { tiles[tile] = pharmacies }
            }
        }
    }

    /// False where the index has no square for the position: outside the covered countries.
    func covers(_ position: LatLon) async throws -> Bool {
        try await currentIndex().grid.square(at: Tiles.tile(of: position)) != .outside
    }

    private func decoded<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T {
        let data = try await Self.load(url, with: fetch)
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw Failure.unavailable
        }
    }

    private static func load(_ url: URL, with fetch: Fetch) async throws -> Data {
        do {
            return try await fetch(url)
        } catch let error as URLError where [.notConnectedToInternet, .networkConnectionLost, .dataNotAllowed, .internationalRoamingOff].contains(error.code) {
            throw Failure.offline
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            throw Failure.unavailable
        }
    }

    // MARK: The network

    /// No cookies, no stored credentials, nothing kept on disk: the session forgets everything when the app goes.
    private static let session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpCookieStorage = nil
        configuration.httpShouldSetCookies = false
        configuration.urlCredentialStorage = nil
        configuration.timeoutIntervalForRequest = 15
        configuration.waitsForConnectivity = false
        return URLSession(configuration: configuration)
    }()

    static let network: Fetch = { url in
        let (data, response) = try await session.data(from: url)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw Failure.unavailable }
        return data
    }
}
