import Foundation

/// Open or closed, from the intervals a tile carries and the current instant
/// (`docs/tiles.md`, "Status"): the web's `lib/hoursStatus.ts`, checked by
/// `tests/vectors/status.json`.
///
/// No time-zone arithmetic decides the status: the pipeline has already turned the hours
/// into instants. Zones are used only to say a time or a day on the pharmacy's clock.
enum HoursStatus: Equatable, Sendable {
    case open(closes: Int)
    /// Open, and closing in under half an hour.
    case soon(closes: Int)
    /// Open, and no closing is in sight: the interval runs to the end of the window.
    case open24
    /// `opens` is nil when the next opening isn't known.
    case closed(opens: Int?)
    case missing
    case unparseable(raw: String)
    case uncertain(raw: String)
    /// The data is too old, or the clock is outside the window the hours were worked out for.
    case stale

    /// "Closes soon" starts under this long before closing, not at exactly this long.
    static let soonSeconds = 30 * 60
    /// Data older than this is never shown as open.
    static let staleSeconds = 7 * 24 * 60 * 60

    var isOpen: Bool {
        switch self {
        case .open, .soon, .open24: true
        default: false
        }
    }

    /// True when nothing may be read from the data any more: older than seven days, or outside its window.
    static func isStale(generated: Int, windowFrom: Int, windowUntil: Int, now: Int) -> Bool {
        now - generated > staleSeconds || now >= windowUntil || now < windowFrom
    }

    static func of(_ pharmacy: TilePharmacy, now: Int) -> HoursStatus {
        of(hours: pharmacy.hours, generated: pharmacy.generated, windowFrom: pharmacy.windowFrom, windowUntil: pharmacy.windowUntil, now: now)
    }

    static func of(hours: Hours, generated: Int, windowFrom: Int, windowUntil: Int, now: Int) -> HoursStatus {
        if isStale(generated: generated, windowFrom: windowFrom, windowUntil: windowUntil, now: now) { return .stale }

        switch hours {
        case .missing:
            return .missing
        case .unparseable(let raw):
            return .unparseable(raw: raw)
        case .uncertain(let raw):
            return .uncertain(raw: raw)
        case .parsed(let open, let unknown, let raw):
            if unknown.contains(where: { $0.holds(now) }) { return .uncertain(raw: raw ?? "") }

            if let current = open.first(where: { $0.holds(now) }) {
                // The pipeline joins intervals that touch; follow a chain anyway, so a tile that doesn't still reads right.
                var closes = current.to
                while let next = open.first(where: { $0.from == closes }) { closes = next.to }
                if closes >= windowUntil { return .open24 }
                return closes - now < soonSeconds ? .soon(closes: closes) : .open(closes: closes)
            }

            let nextOpen = earliest(after: now, in: open)
            let nextUnknown = earliest(after: now, in: unknown)
            // An opening is only promised when nothing unknown comes before it.
            if let nextOpen, nextUnknown.map({ nextOpen < $0 }) ?? true { return .closed(opens: nextOpen) }
            return .closed(opens: nil)
        }
    }

    private static func earliest(after now: Int, in intervals: [Interval]) -> Int? {
        intervals.lazy.map(\.from).filter { $0 > now }.min()
    }
}

/// The day of a moment as the status line names it.
enum DayLabel: String, Equatable, Sendable {
    case today, tomorrow, mo, tu, we, th, fr, sa, su

    static let weekdays: [DayLabel] = [.mo, .tu, .we, .th, .fr, .sa, .su]
}

/// An instant as the status line says it: the day relative to now, and the time as "HH:mm",
/// both on the pharmacy's own clock.
struct LocalMoment: Equatable, Sendable {
    var day: DayLabel
    var time: String

    /// "Today" turns into "tomorrow" at local midnight in the pharmacy's zone, not on the device.
    /// A closing at midnight reads "24:00" of the day that ends.
    init(now: Int, instant: Int, zone: String, closing: Bool = false) {
        var days = Zone.dayNumber(instant, zone: zone) - Zone.dayNumber(now, zone: zone)
        var time = Zone.clock(instant, zone: zone)
        var weekday = Zone.weekday(instant, zone: zone)
        if closing && time == "00:00" && days > 0 {
            days -= 1
            time = "24:00"
            weekday = (weekday + 6) % 7
        }
        self.day = days <= 0 ? .today : days == 1 ? .tomorrow : DayLabel.weekdays[weekday]
        self.time = time
    }

    init(day: DayLabel, time: String) {
        self.day = day
        self.time = time
    }
}
