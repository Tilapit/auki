import Testing
@testable import Auki

/// `tests/vectors/search.json`: the nearest pharmacies through tiles, and how many tiles
/// that took. The answer must equal a search through every pharmacy there is.
struct SearchVectorTests {
    struct File: Decodable {
        var worlds: [World]
    }

    struct World: Decodable {
        var name: String
        var grid: Grid
        var tiles: [String: [Spot]]
        var searches: [Query]
    }

    struct Spot: Decodable {
        var id: String
        var lat: Double
        var lon: Double
    }

    struct Query: Decodable {
        var position: PositionJSON
        var count: Int
        var radius: Double
        var loads: Int
        var nearest: [Answer]
    }

    struct Answer: Decodable {
        var id: String
        var meters: Double
    }

    let file: File

    init() throws {
        file = try Vectors.load(File.self, from: "search")
    }

    @Test func theNearestThroughTilesAndHowManyTilesItTook() {
        #expect(file.worlds.count == 4)
        for world in file.worlds {
            let tiles = Dictionary(uniqueKeysWithValues: world.tiles.map { key, spots in (key, spots.map(pharmacy)) })
            for query in world.searches {
                let label = "\(world.name), \(query.count) within \(Int(query.radius)) m"
                var loaded: [TileRef: [TilePharmacy]] = [:]
                var step = Search.step(from: query.position.value, count: query.count, radius: query.radius, grid: world.grid, loaded: loaded)
                var rounds = 0
                while !step.done && rounds < 1000 {
                    for tile in step.need { loaded[tile] = tiles[tile.key] ?? [] }
                    step = Search.step(from: query.position.value, count: query.count, radius: query.radius, grid: world.grid, loaded: loaded)
                    rounds += 1
                }
                #expect(step.done, "\(label): the search ends")
                #expect(loaded.count == query.loads, "\(label): tiles loaded")
                #expect(step.nearest.map(\.pharmacy.id) == query.nearest.map(\.id), "\(label): which, and in what order")
                for (found, expected) in zip(step.nearest, query.nearest) {
                    #expect(isClose(found.meters, expected.meters), "\(label): the distance of \(expected.id)")
                }
            }
        }
    }

    @Test func aSearchForNoneIsEmptyAndNoCrash() {
        let world = file.worlds[0]
        let step = Search.step(from: world.searches[0].position.value, count: 0, radius: 10_000, grid: world.grid, loaded: [:])
        #expect(step.nearest.isEmpty)
    }

    @Test func theAnswerEqualsASearchThroughEveryPharmacy() {
        for world in file.worlds {
            let everyone = world.tiles.values.flatMap { $0.map(pharmacy) }
            for query in world.searches {
                var all: [Found] = []
                for pharmacy in everyone {
                    let meters = Geo.distanceMeters(query.position.value, pharmacy.position)
                    if meters <= query.radius { all.append(Found(pharmacy: pharmacy, meters: meters)) }
                }
                all.sort { (a: Found, b: Found) -> Bool in a.meters != b.meters ? a.meters < b.meters : a.pharmacy.id < b.pharmacy.id }
                let ids: [String] = all.prefix(query.count).map { (found: Found) -> String in found.pharmacy.id }
                #expect(ids == query.nearest.map(\.id), "\(world.name), \(query.count) within \(Int(query.radius)) m")
            }
        }
    }

    private func pharmacy(_ spot: Spot) -> TilePharmacy {
        TilePharmacy(id: spot.id, lat: spot.lat, lon: spot.lon, country: "FI", zone: "Europe/Helsinki", generated: 0, windowFrom: 0, windowUntil: 0, hours: .missing)
    }
}
