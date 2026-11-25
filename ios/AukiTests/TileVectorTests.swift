import Foundation
import Testing
@testable import Auki

/// `tests/vectors/tiles.json`: tile numbers, square outlines and distances.
/// Distances are compared to within 0.5 %, as `docs/tiles.md` asks; tile numbers exactly.
struct TileVectorTests {
    struct File: Decodable {
        var tileOf: [TileOf]
        var bounds: [Outline]
        var distanceToTile: [ToTile]
        var distance: [Distance]
    }

    struct TileOf: Decodable {
        var lat: Double
        var lon: Double
        var x: Int
        var y: Int
    }

    struct Outline: Decodable {
        var x: Int
        var y: Int
        var north: Double
        var south: Double
        var west: Double
        var east: Double
    }

    struct ToTile: Decodable {
        var lat: Double
        var lon: Double
        var x: Int
        var y: Int
        var meters: Double
    }

    struct Distance: Decodable {
        var from: PositionJSON
        var to: PositionJSON
        var meters: Double
    }

    let file: File

    init() throws {
        file = try Vectors.load(File.self, from: "tiles")
    }

    @Test func theSquareOfAPosition() {
        #expect(file.tileOf.count >= 49)
        for entry in file.tileOf {
            #expect(Tiles.tile(of: LatLon(lat: entry.lat, lon: entry.lon)) == TileRef(x: entry.x, y: entry.y), "\(entry.lat), \(entry.lon)")
        }
    }

    @Test func theOutlineOfASquare() {
        #expect(file.bounds.count == 12)
        for entry in file.bounds {
            let bounds = Tiles.bounds(of: TileRef(x: entry.x, y: entry.y))
            // The vectors round to eight decimals.
            #expect(abs(bounds.north - entry.north) < 1e-8, "north of \(entry.x)/\(entry.y)")
            #expect(abs(bounds.south - entry.south) < 1e-8, "south of \(entry.x)/\(entry.y)")
            #expect(abs(bounds.west - entry.west) < 1e-8, "west of \(entry.x)/\(entry.y)")
            #expect(abs(bounds.east - entry.east) < 1e-8, "east of \(entry.x)/\(entry.y)")
        }
    }

    @Test func theDistanceToASquare() {
        #expect(file.distanceToTile.count == 100)
        for entry in file.distanceToTile {
            let meters = Tiles.distance(from: LatLon(lat: entry.lat, lon: entry.lon), to: TileRef(x: entry.x, y: entry.y))
            #expect(isClose(meters, entry.meters), "\(entry.lat), \(entry.lon) to \(entry.x)/\(entry.y): \(meters) and \(entry.meters)")
        }
    }

    @Test func theDistanceBetweenTwoPositions() {
        #expect(file.distance.count == 20)
        for entry in file.distance {
            let meters = Geo.distanceMeters(entry.from.value, entry.to.value)
            #expect(isClose(meters, entry.meters), "\(entry.from.value) to \(entry.to.value): \(meters) and \(entry.meters)")
        }
    }
}

/// Within 0.5 %, or within a centimetre where the vector rounds a very short distance.
func isClose(_ value: Double, _ expected: Double) -> Bool {
    abs(value - expected) <= max(0.005 * expected, 0.01)
}
