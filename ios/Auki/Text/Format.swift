import Foundation

/// The two languages of the app: Finnish first, then English (CLAUDE.md, "Content rules").
enum Language: String, Sendable {
    case fi, en

    /// The one iOS picked for the app from the two it offers. Anything else reads Finnish.
    static var current: Language {
        Bundle.main.preferredLocalizations.first.flatMap(Language.init(rawValue:)) ?? .fi
    }
}

/// Numbers, times and distances as the copy rules write them: the web's `lib/format.ts`.
/// Finnish: "klo 20.45", "klo 21", "1,1 km", a non-breaking space between a number and its
/// unit. English: en-GB, 24-hour times, "1.1 km".
struct Format: Sendable {
    let language: Language

    static let nbsp = "\u{00A0}"

    /// A full clock time, from "HH:mm": "20.44" / "20:44". A closing at midnight is "24.00" / "24:00".
    func clock(_ wall: String) -> String {
        let (hour, minute) = Self.parts(wall)
        switch language {
        case .fi: return "\(hour).\(Self.two(minute))"
        case .en: return "\(Self.two(hour)):\(Self.two(minute))"
        }
    }

    /// A time for status lines: "klo 21", "klo 20.45" / "21:00", "midnight".
    func clockShort(_ wall: String) -> String {
        let (hour, minute) = Self.parts(wall)
        switch language {
        case .fi: return minute == 0 ? "klo\(Self.nbsp)\(hour)" : "klo\(Self.nbsp)\(clock(wall))"
        case .en: return wall == "24:00" ? "midnight" : clock(wall)
        }
    }

    /// 0 to 994 m to the nearest 10 m, from there on kilometres with one decimal: "220 m", "1,1 km" / "1.1 km".
    func distance(_ meters: Double) -> String {
        guard meters.isFinite, meters >= 0, meters < 1e9 else { return "" }
        let rounded = Int((meters / 10).rounded()) * 10
        if rounded < 1000 { return "\(rounded)\(Self.nbsp)m" }
        let tenths = Int((Double(rounded) / 100).rounded())
        let separator = language == .fi ? "," : "."
        return "\(tenths / 10)\(separator)\(tenths % 10)\(Self.nbsp)km"
    }

    /// The day an instant falls on, on the device's clock: "22.11." / "22 Nov".
    func day(of instant: Int, zone: String = TimeZone.current.identifier) -> String {
        let wall = Zone.wall(at: instant, zone: zone)
        switch language {
        case .fi: return "\(wall.day).\(wall.month)."
        case .en: return "\(wall.day)\(Self.nbsp)\(Self.months[wall.month - 1])"
        }
    }

    /// A calendar date, from "YYYY-MM-DD": "13.9.2023" / "13 Sept 2023". Anything else is given back as it came.
    func date(_ iso: String) -> String {
        let pieces = iso.split(separator: "-").compactMap { Int($0) }
        guard pieces.count == 3, (1...12).contains(pieces[1]), (1...31).contains(pieces[2]) else { return iso }
        switch language {
        case .fi: return "\(pieces[2]).\(pieces[1]).\(pieces[0])"
        case .en: return "\(pieces[2]) \(Self.months[pieces[1] - 1]) \(pieces[0])"
        }
    }

    /// The time of an instant on the device's clock, as a status line says it: "klo 20.41" / "20:41".
    func time(of instant: Int, zone: String = TimeZone.current.identifier) -> String {
        clockShort(Zone.clock(instant, zone: zone))
    }

    // en-GB's short month names.
    private static let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]

    private static func parts(_ wall: String) -> (hour: Int, minute: Int) {
        let pieces = wall.split(separator: ":").map { Int($0) ?? 0 }
        return (pieces.first ?? 0, pieces.count > 1 ? pieces[1] : 0)
    }

    private static func two(_ value: Int) -> String { value < 10 ? "0\(value)" : "\(value)" }
}
