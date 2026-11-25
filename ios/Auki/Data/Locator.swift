import CoreLocation
import Foundation

/// The device's position, once, when the user asks for it. Nothing is asked before that:
/// the system's permission question comes up only after "Näytä apteekit lähelläni" is pressed.
///
/// The position is handed back to the caller and kept nowhere else. It stays on the device:
/// the app's requests name map squares (`TileStore`).
@MainActor
final class Locator: NSObject, CLLocationManagerDelegate {
    enum Failure: Error, Equatable {
        case denied
        case unavailable
        case timeout
    }

    /// A position, and whether the user has allowed only an approximate one.
    struct Fix: Equatable, Sendable {
        var position: LatLon
        var approximate: Bool
    }

    private let manager = CLLocationManager()
    private var waiting: CheckedContinuation<Fix, Error>?
    private var deadline: Task<Void, Never>?
    private var timeout = Config.locationTimeoutSeconds

    override init() {
        super.init()
        manager.delegate = self
        // A pharmacy is a building: a hundred metres is enough, and it comes sooner than the best fix.
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func current(timeout seconds: Double = Config.locationTimeoutSeconds) async throws -> Fix {
        finish(.failure(CancellationError()))
        timeout = seconds
        return try await withCheckedThrowingContinuation { continuation in
            waiting = continuation
            proceed(with: manager.authorizationStatus)
        }
    }

    private func proceed(with status: CLAuthorizationStatus) {
        guard waiting != nil else { return }
        switch status {
        case .notDetermined:
            // No time limit runs while the system's question is on screen: reading it may take a while.
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            finish(.failure(Failure.denied))
        default:
            guard deadline == nil else { return }
            let seconds = timeout
            deadline = Task { [weak self] in
                try? await Task.sleep(for: .seconds(seconds))
                if !Task.isCancelled { self?.finish(.failure(Failure.timeout)) }
            }
            manager.requestLocation()
        }
    }

    private func finish(_ result: Result<Fix, Error>) {
        deadline?.cancel()
        deadline = nil
        waiting?.resume(with: result)
        waiting = nil
    }

    // MARK: CLLocationManagerDelegate

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in proceed(with: status) }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let coordinate = locations.last?.coordinate, CLLocationCoordinate2DIsValid(coordinate) else { return }
        let position = LatLon(lat: coordinate.latitude, lon: coordinate.longitude)
        let approximate = manager.accuracyAuthorization == .reducedAccuracy
        Task { @MainActor in finish(.success(Fix(position: position, approximate: approximate))) }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let denied = (error as? CLError)?.code == .denied
        Task { @MainActor in finish(.failure(denied ? Failure.denied : Failure.unavailable)) }
    }
}
