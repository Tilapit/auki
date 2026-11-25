import Foundation

/// The few numbers and addresses the app is built around.
enum Config {
    /// The data host: the static tiles the nightly pipeline publishes (PLAN.md 7.2). The web
    /// app reads the same files. A request names a square of 20 to 30 km, never a position.
    static let tilesOrigin = URL(string: "https://auki-data.vercel.app")!

    /// The search of PLAN.md 7.1: the nearest twenty within 10 km; if there are none, the
    /// nearest five within 50 km.
    static let nearCount = 20
    static let nearRadius = 10_000.0
    static let widerCount = 5
    static let widerRadius = 50_000.0

    /// When none of those is open: the nearest one within 30 km that is open and stays open half an hour.
    static let openRadius = 30_000.0
    static let staysOpenSeconds = 30 * 60

    /// An interval that ends this far away is, for today's purposes, open around the clock.
    static let noClosingInSightSeconds = 24 * 60 * 60

    /// How long the device is given to find a position.
    static let locationTimeoutSeconds = 15.0
}
