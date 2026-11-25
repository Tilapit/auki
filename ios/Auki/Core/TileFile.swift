import Foundation

/// Reading a tile file (`docs/tiles.md`, "A tile"): the same reading as `decodeTile` in the
/// web's `lib/tiles.ts`, checked by `tests/vectors/tile-file.json`.
enum TileFile {
    enum Failure: Error, Equatable {
        /// Not a tile of the version this app reads.
        case version
        case rowWithoutSource
        case rowWithoutHours
    }

    /// Reads a tile file. Throws on a file it doesn't understand: the caller treats that as a failed load.
    static func decode(_ data: Data) throws -> Tile {
        try read(JSONDecoder().decode(File.self, from: data))
    }

    static func read(_ file: File) throws -> Tile {
        guard file.v == Tiles.version else { throw Failure.version }

        let pharmacies = try file.rows.map { row -> TilePharmacy in
            func cell(_ column: Column) -> Cell { column.rawValue < row.count ? row[column.rawValue] : .null }
            func text(_ column: Column) -> String? {
                if case .text(let value) = cell(column), !value.isEmpty { return value }
                return nil
            }
            func index(_ column: Column) -> Int? {
                if case .number(let value) = cell(column) { return Int(value) }
                return nil
            }
            func number(_ column: Column) -> Double {
                if case .number(let value) = cell(column) { return value }
                return .nan
            }

            guard let sourceIndex = index(.source), file.sources.indices.contains(sourceIndex) else { throw Failure.rowWithoutSource }
            let source = file.sources[sourceIndex]
            let raw = text(.raw)

            let hours: Hours
            switch cell(.hours) {
            case .null:
                hours = .missing
            case .text("x"):
                hours = .unparseable(raw: raw ?? "")
            case .text("u"):
                hours = .uncertain(raw: raw ?? "")
            case .number(let value):
                guard file.hours.indices.contains(Int(value)), let open = file.hours[Int(value)].first else { throw Failure.rowWithoutHours }
                let set = file.hours[Int(value)]
                hours = .parsed(open: intervals(open, from: source.from), unknown: intervals(set.count > 1 ? set[1] : [], from: source.from), raw: raw)
            default:
                throw Failure.rowWithoutHours
            }

            var dispensing: Bool?
            if case .flag(false) = cell(.dispensing) { dispensing = false }

            return TilePharmacy(
                id: text(.id) ?? "",
                lat: number(.lat),
                lon: number(.lon),
                name: text(.name),
                street: text(.street),
                city: index(.city).flatMap { file.cities.indices.contains($0) ? file.cities[$0] : nil },
                country: source.country,
                zone: source.zone,
                generated: source.generated,
                windowFrom: source.from,
                windowUntil: source.until,
                hours: hours,
                phone: text(.phone),
                email: text(.email),
                website: text(.website),
                wheelchair: text(.wheelchair).flatMap(Wheelchair.init(rawValue:)),
                wheelchairNote: text(.wheelchairNote),
                dispensing: dispensing,
                checkDate: text(.checkDate)
            )
        }

        return Tile(x: file.x, y: file.y, pharmacies: pharmacies, border: file.border)
    }

    /// A flat list of start and end pairs, in minutes from the start of the source's window.
    private static func intervals(_ pairs: [Int], from: Int) -> [Interval] {
        stride(from: 0, to: pairs.count - 1, by: 2).map { Interval(from: from + pairs[$0] * 60, to: from + pairs[$0 + 1] * 60) }
    }

    // MARK: The file as stored

    struct File: Decodable {
        var v: Int
        var x: Int
        var y: Int
        var sources: [Source]
        var cities: [String]
        /// One interval set per entry: [open] or [open, unknown].
        var hours: [[[Int]]]
        var rows: [[Cell]]
        var border: BorderGrid?
    }

    struct Source: Decodable {
        var country: String
        var zone: String
        var generated: Int
        var from: Int
        var until: Int
    }

    /// Columns of a pharmacy row, in order. Trailing nulls are left off, and a reader ignores columns beyond these.
    enum Column: Int {
        case id, lat, lon, name, street, city, source, hours, raw, phone, email, website, wheelchair, wheelchairNote, dispensing, checkDate
    }

    /// One value of a row.
    enum Cell: Decodable, Equatable {
        case null
        case text(String)
        case number(Double)
        case flag(Bool)

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if container.decodeNil() {
                self = .null
            } else if let value = try? container.decode(Bool.self) {
                self = .flag(value)
            } else if let value = try? container.decode(Double.self) {
                self = .number(value)
            } else {
                self = .text(try container.decode(String.self))
            }
        }
    }
}
