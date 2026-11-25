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

    private let manager = CLLocationManager()
    private var waiting: CheckedContinuation<LatLon, Error>?
    private var deadline: Task<Void, Never>?

    override init() {
        super.init()
        manager.delegate = self
        // A pharmacy is a building: a hundred metres is enough, and it comes sooner than the best fix.
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func current(timeout seconds: Double = Config.locationTimeoutSeconds) async throws -> LatLon {
        finish(.failure(CancellationError()))
        return try await withCheckedThrowingContinuation { continuation in
            waiting = continuation
            deadline = Task { [weak self] in
                try? await Task.sleep(for: .seconds(seconds))
                if !Task.isCancelled { self?.finish(.failure(Failure.timeout)) }
            }
            proceed(with: manager.authorizationStatus)
        }
    }

    private func proceed(with status: CLAuthorizationStatus) {
        guard waiting != nil else { return }
        switch status {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            finish(.failure(Failure.denied))
        default:
            manager.requestLocation()
        }
    }

    private func finish(_ result: Result<LatLon, Error>) {
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
        guard let coordinate = locations.last?.coordinate else { return }
        let position = LatLon(lat: coordinate.latitude, lon: coordinate.longitude)
        Task { @MainActor in finish(.success(position)) }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let denied = (error as? CLError)?.code == .denied
        Task { @MainActor in finish(.failure(denied ? Failure.denied : Failure.unavailable)) }
    }
}
