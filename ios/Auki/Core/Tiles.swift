import Foundation

/// The tile contract, read side: `docs/tiles.md` in Swift. The web reads the same files with
/// `lib/tiles.ts`, and `tests/vectors/` holds the cases both must agree on.
///
/// Instants are epoch seconds. Distances are metres.
enum Tiles {
    static let version = 1
    /// Standard web-map tile numbering at this zoom: squares of 20 to 30 km in the covered countries.
    static let zoom = 10
    static let squares = 1 << zoom

    static let indexPath = "/tiles/v\(version)/index.json"
    static func path(_ tile: TileRef) -> String { "/tiles/v\(version)/\(zoom)/\(tile.x)/\(tile.y).json" }

    /// The square a position is in.
    static func tile(of position: LatLon) -> TileRef {
        let (x, y) = Geo.tileCoordinates(position, zoom: zoom)
        // Clamped while still a floating-point number, so the poles' infinities stay inside the grid.
        // A position that is no position (not a number) gets the first square, not a crash.
        func clamp(_ value: Double) -> Int { value.isNaN ? 0 : Int(min(Double(squares - 1), max(0, value.rounded(.down)))) }
        return TileRef(x: clamp(x), y: clamp(y))
    }

    static func bounds(of tile: TileRef) -> Bounds {
        Bounds(north: latitude(ofRow: Double(tile.y)), south: latitude(ofRow: Double(tile.y + 1)), west: longitude(ofColumn: Double(tile.x)), east: longitude(ofColumn: Double(tile.x + 1)))
    }

    /// A distance that no point of the square is nearer than: zero inside it, otherwise the
    /// distance to the nearest point of its outline, less a thousandth. The margin covers the
    /// small error of measuring to a point on the same latitude instead of along the meridian.
    static func distance(from position: LatLon, to tile: TileRef) -> Double {
        let bounds = bounds(of: tile)
        let lat = min(bounds.north, max(bounds.south, position.lat))
        let lon = min(bounds.east, max(bounds.west, position.lon))
        if lat == position.lat && lon == position.lon { return 0 }
        return Geo.distanceMeters(position, LatLon(lat: lat, lon: lon)) * 0.999
    }

    /// The squares that can hold something within a radius, nearest first.
    static func tiles(within radius: Double, of position: LatLon) -> [TileDistance] {
        let home = tile(of: position)
        var found: [TileDistance] = []
        // Walk outwards ring by ring until a whole ring is out of reach.
        for ring in 0..<squares {
            var any = false
            for dy in -ring...ring {
                for dx in -ring...ring where max(abs(dx), abs(dy)) == ring {
                    let y = home.y + dy
                    if y < 0 || y >= squares { continue }
                    let x = ((home.x + dx) % squares + squares) % squares
                    let tile = TileRef(x: x, y: y)
                    let nearest = distance(from: position, to: tile)
                    if nearest <= radius {
                        found.append(TileDistance(tile: tile, min: nearest))
                        any = true
                    }
                }
            }
            if !any { break }
        }
        return found.sorted { a, b in
            if a.min != b.min { return a.min < b.min }
            if a.tile.y != b.tile.y { return a.tile.y < b.tile.y }
            return a.tile.x < b.tile.x
        }
    }

    private static func latitude(ofRow y: Double) -> Double {
        atan(sinh(.pi * (1 - 2 * y / Double(squares)))) * 180 / .pi
    }

    private static func longitude(ofColumn x: Double) -> Double {
        x / Double(squares) * 360 - 180
    }
}

/// A square of the grid, by its tile numbers.
struct TileRef: Hashable, Sendable {
    var x: Int
    var y: Int

    /// "x/y", as `index.json` and the vectors name a tile.
    var key: String { "\(x)/\(y)" }
}

struct Bounds: Equatable, Sendable {
    var north: Double
    var south: Double
    var west: Double
    var east: Double
}

struct TileDistance: Equatable, Sendable {
    var tile: TileRef
    /// No pharmacy in the square is nearer than this.
    var min: Double
}

// MARK: What a tile holds, once read

/// A stretch of time that holds its start and not its end.
struct Interval: Equatable, Sendable {
    var from: Int
    var to: Int

    func holds(_ instant: Int) -> Bool { from <= instant && instant < to }
}

enum Hours: Equatable, Sendable {
    /// OpenStreetMap has no opening hours for it.
    case missing
    /// The value could not be read: free text like "call for hours".
    case unparseable(raw: String)
    /// The value was read but can't be trusted.
    case uncertain(raw: String)
    /// Open intervals inside the window, sorted, not touching each other. `unknown` are stretches
    /// where the data itself says the state is unknown; `raw` is kept when there are any.
    case parsed(open: [Interval], unknown: [Interval], raw: String?)
}

enum Wheelchair: String, Sendable {
    case yes, limited, no
}

struct TilePharmacy: Identifiable, Equatable, Sendable {
    /// OpenStreetMap type and id: "n123", "w456", "r789".
    var id: String
    var lat: Double
    var lon: Double
    /// nil when OpenStreetMap has no name, brand or operator.
    var name: String?
    var street: String?
    /// addr:city as OpenStreetMap writes it.
    var city: String?
    /// ISO 3166-1 alpha-2.
    var country: String
    /// IANA time zone the pharmacy keeps.
    var zone: String
    /// When its country's data was fetched from OpenStreetMap.
    var generated: Int
    /// The hours window: from the start of the local day of the fetch, eight local days on.
    var windowFrom: Int
    var windowUntil: Int
    var hours: Hours
    var phone: String?
    var email: String?
    var website: String?
    var wheelchair: Wheelchair?
    var wheelchairNote: String?
    /// false when OpenStreetMap says dispensing=no; otherwise nil.
    var dispensing: Bool?
    /// check_date of the opening hours, "YYYY-MM-DD".
    var checkDate: String?

    var position: LatLon { LatLon(lat: lat, lon: lon) }
}

/// For a square that touches a country outside the coverage: which country each cell is in.
struct BorderGrid: Equatable, Sendable, Decodable {
    /// Cells per side.
    var n: Int
    /// ISO codes, covered or not.
    var codes: [String]
    /// n × n characters, north to south and west to east: "." for no country, else a base-36 index into codes.
    var cells: String
}

struct Tile: Equatable, Sendable {
    var x: Int
    var y: Int
    var pharmacies: [TilePharmacy]
    var border: BorderGrid?
}

// MARK: The index

/// Which squares exist. One string per row of squares, north to south; one character per
/// square, west to east: "." outside the coverage, "c" covered but without a pharmacy (no
/// file), "d" a tile file exists, "b" a tile file exists and carries a border grid.
struct Grid: Equatable, Sendable, Decodable {
    var z: Int
    var x0: Int
    var y0: Int
    var width: Int
    var rows: [String]

    enum Square: Character {
        case outside = "."
        case covered = "c"
        case data = "d"
        case border = "b"
    }

    /// What the index says about a square. A square outside the grid is outside the coverage.
    func square(at tile: TileRef) -> Square {
        let row = tile.y - y0
        let column = tile.x - x0
        guard rows.indices.contains(row), column >= 0 else { return .outside }
        let cells = rows[row].utf8
        guard column < cells.count else { return .outside }
        let cell = Character(UnicodeScalar(cells[cells.index(cells.startIndex, offsetBy: column)]))
        return Square(rawValue: cell) ?? .outside
    }

    func hasTile(_ tile: TileRef) -> Bool {
        let square = square(at: tile)
        return square == .data || square == .border
    }
}

struct CountryStats: Equatable, Sendable, Decodable {
    /// When this country's data was fetched from OpenStreetMap.
    var generated: Int
    var pharmacies: Int
    /// Set when the last run could not refresh the country and the data of an earlier run was kept.
    var kept: String?
}

struct TileIndex: Equatable, Sendable, Decodable {
    var v: Int
    /// When this index was written.
    var generated: Int
    var attribution: String
    var countries: [String: CountryStats]
    var grid: Grid
}
