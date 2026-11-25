import Foundation
import Observation

/// What can stand in the way of a result.
enum Problem: Equatable, Sendable {
    case denied
    case unavailable
    case timeout
    case offline
    case failed
    /// Nothing within 50 km in a covered country.
    case none
    /// The position is outside the covered countries.
    case notCovered
}

/// The app's one flow: a position from the device, the nearest pharmacies from the tiles.
///
/// The position lives here, in memory, for as long as the results are on screen. It is not
/// written anywhere and goes into no request.
@MainActor
@Observable
final class SearchModel {
    enum Phase: Equatable {
        /// The first window: nothing has been asked yet.
        case first
        case locating
        case searching
        case results
        case problem(Problem)
    }

    private(set) var phase: Phase = .first
    private(set) var position: LatLon?
    /// True when the user allows only an approximate position: the distances may then be off by kilometres.
    private(set) var positionIsApproximate = false
    private(set) var found: [Found] = []
    /// When nothing nearby was open at the time of the search: the nearest open one within 30 km.
    private(set) var farOpen: Found?
    /// When the results on screen were found, epoch seconds.
    private(set) var searchedAt: Int?
    /// True while a search runs behind results that are already on screen.
    private(set) var isRefreshing = false
    /// The pharmacy picked from the list or the map.
    var selectedID: String?

    private let store: TileStore
    private let locator: Locator
    private let clock: @Sendable () -> Int

    init(store: TileStore = TileStore(), locator: Locator? = nil, clock: @escaping @Sendable () -> Int = AppClock.now) {
        self.store = store
        self.locator = locator ?? Locator()
        self.clock = clock
    }

    /// Asks the device for its position and finds the nearest pharmacies. Results already on
    /// screen stay there until the new ones come.
    func search() async {
        guard phase != .locating, phase != .searching, !isRefreshing else { return }
        let hadResults = phase == .results
        if hadResults { isRefreshing = true } else { phase = .locating }
        defer { isRefreshing = false }

        do {
            let fix = try await locator.current()
            if !hadResults { phase = .searching }
            try await find(from: fix.position)
            positionIsApproximate = fix.approximate
        } catch let failure as Locator.Failure {
            switch failure {
            case .denied: phase = .problem(.denied)
            case .unavailable: phase = .problem(.unavailable)
            case .timeout: phase = .problem(.timeout)
            }
        } catch TileStore.Failure.offline {
            phase = .problem(.offline)
        } catch is CancellationError {
            if !hadResults { phase = .first }
        } catch {
            phase = .problem(.failed)
        }
    }

    private func find(from position: LatLon) async throws {
        let now = clock()
        var nearest = try await store.nearest(to: position, count: Config.nearCount, radius: Config.nearRadius)
        if nearest.isEmpty {
            nearest = try await store.nearest(to: position, count: Config.widerCount, radius: Config.widerRadius)
        }
        guard !nearest.isEmpty else {
            phase = .problem(try await store.covers(position) ? .none : .notCovered)
            return
        }

        // None of them open: look farther for one that is, and that stays open long enough to be worth the trip.
        var far: Found?
        if !nearest.contains(where: { HoursStatus.of($0.pharmacy, now: now).isOpen }) {
            far = try await store.nearest(to: position, count: 1, radius: Config.openRadius) { pharmacy in
                switch HoursStatus.of(pharmacy, now: now) {
                case .open24: true
                case .open(let closes), .soon(let closes): closes - now >= Config.staysOpenSeconds
                default: false
                }
            }.first
        }

        self.position = position
        found = nearest
        farOpen = far
        searchedAt = now
        if let selectedID, !nearest.contains(where: { $0.pharmacy.id == selectedID }) { self.selectedID = nil }
        phase = .results
    }

    #if DEBUG
    /// Debug builds only: puts a problem on screen, to look at its view (`DebugOptions`).
    func show(_ problem: Problem) {
        phase = .problem(problem)
    }
    #endif

    func listing(at now: Int) -> Listing {
        Listing(found: found, farOpen: farOpen, now: now)
    }
}
