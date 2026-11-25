import Foundation
@testable import Auki

/// The shared test vectors of `tests/vectors/` (written by `npm run vectors` from the web's
/// own code). The Xcode project copies the files into the test bundle as they are, so the
/// web and the iOS app are checked against the same bytes.
enum Vectors {
    private final class Marker {}

    static func data(_ name: String, _ ext: String = "json") throws -> Data {
        guard let url = Bundle(for: Marker.self).url(forResource: name, withExtension: ext) else {
            throw CocoaError(.fileNoSuchFile, userInfo: [NSFilePathErrorKey: "\(name).\(ext)"])
        }
        return try Data(contentsOf: url)
    }

    static func load<T: Decodable>(_ type: T.Type, from name: String) throws -> T {
        try JSONDecoder().decode(type, from: data(name))
    }

    struct UnknownKind: Error {
        var kind: String
    }
}

// MARK: The web's shapes, as the vectors write them. Each gives the app's own value.

struct PositionJSON: Decodable {
    var lat: Double
    var lon: Double

    var value: LatLon { LatLon(lat: lat, lon: lon) }
}

struct WallJSON: Decodable {
    var year: Int
    var month: Int
    var day: Int
    var hour: Int
    var minute: Int

    var value: Wall { Wall(year: year, month: month, day: day, hour: hour, minute: minute) }
}

struct IntervalJSON: Decodable {
    var from: Int
    var to: Int

    var value: Interval { Interval(from: from, to: to) }
}

struct HoursJSON: Decodable {
    var kind: String
    var raw: String?
    var open: [IntervalJSON]?
    var unknown: [IntervalJSON]?

    func value() throws -> Hours {
        switch kind {
        case "missing": .missing
        case "unparseable": .unparseable(raw: raw ?? "")
        case "uncertain": .uncertain(raw: raw ?? "")
        case "parsed": .parsed(open: (open ?? []).map(\.value), unknown: (unknown ?? []).map(\.value), raw: raw)
        default: throw Vectors.UnknownKind(kind: kind)
        }
    }
}

struct StatusJSON: Decodable {
    var kind: String
    var closes: Int?
    var opens: Int?
    var raw: String?

    func value() throws -> HoursStatus {
        switch kind {
        case "open": .open(closes: closes ?? 0)
        case "soon": .soon(closes: closes ?? 0)
        case "open24": .open24
        case "closed": .closed(opens: opens)
        case "missing": .missing
        case "unparseable": .unparseable(raw: raw ?? "")
        case "uncertain": .uncertain(raw: raw ?? "")
        case "stale": .stale
        default: throw Vectors.UnknownKind(kind: kind)
        }
    }
}

struct MomentJSON: Decodable {
    var day: String
    var time: String

    func value() throws -> LocalMoment {
        guard let label = DayLabel(rawValue: day) else { throw Vectors.UnknownKind(kind: day) }
        return LocalMoment(day: label, time: time)
    }
}

struct PharmacyJSON: Decodable {
    var id: String
    var lat: Double
    var lon: Double
    var name: String?
    var street: String?
    var city: String?
    var country: String
    var zone: String
    var generated: Int
    var windowFrom: Int
    var windowUntil: Int
    var hours: HoursJSON
    var phone: String?
    var email: String?
    var website: String?
    var wheelchair: String?
    var wheelchairNote: String?
    var dispensing: Bool?
    var checkDate: String?

    func value() throws -> TilePharmacy {
        TilePharmacy(
            id: id, lat: lat, lon: lon, name: name, street: street, city: city, country: country, zone: zone,
            generated: generated, windowFrom: windowFrom, windowUntil: windowUntil, hours: try hours.value(),
            phone: phone, email: email, website: website, wheelchair: wheelchair.flatMap(Wheelchair.init(rawValue:)),
            wheelchairNote: wheelchairNote, dispensing: dispensing, checkDate: checkDate
        )
    }
}

struct TileJSON: Decodable {
    var x: Int
    var y: Int
    var pharmacies: [PharmacyJSON]
    var border: BorderGrid?

    func value() throws -> Tile {
        Tile(x: x, y: y, pharmacies: try pharmacies.map { try $0.value() }, border: border)
    }
}
