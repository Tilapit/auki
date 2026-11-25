import Foundation

/// A position in degrees.
struct LatLon: Equatable, Hashable, Sendable {
    var lat: Double
    var lon: Double
}

/// Distances and the web-map projection, the same arithmetic as the web's `lib/geo.ts`.
enum Geo {
    /// The sphere `docs/tiles.md` names.
    static let earthRadiusMeters = 6_371_008.8

    /// Great-circle distance in metres (haversine).
    static func distanceMeters(_ from: LatLon, _ to: LatLon) -> Double {
        let dLat = radians(to.lat - from.lat)
        let dLon = radians(to.lon - from.lon)
        let a = pow(sin(dLat / 2), 2) + cos(radians(from.lat)) * cos(radians(to.lat)) * pow(sin(dLon / 2), 2)
        return 2 * earthRadiusMeters * asin(min(1, a.squareRoot()))
    }

    /// Web Mercator: a position as fractional tile numbers at a zoom, before `floor`.
    static func tileCoordinates(_ position: LatLon, zoom: Int) -> (x: Double, y: Double) {
        let squares = pow(2, Double(zoom))
        let rad = radians(position.lat)
        let x = (position.lon + 180) / 360 * squares
        let y = (1 - log(tan(rad) + 1 / cos(rad)) / .pi) / 2 * squares
        return (x, y)
    }

    private static func radians(_ degrees: Double) -> Double { degrees * .pi / 180 }
}
