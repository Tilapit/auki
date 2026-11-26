import Foundation

/// What a pharmacy does on one local day, or on a group of days with the same hours.
enum DayHours: Equatable, Sendable {
    /// Wall-clock times, "HH:mm", on the pharmacy's own clock. A closing at midnight is
    /// "24:00"; a closing in the small hours is that hour of the next day.
    case open(ranges: [ClockRange])
    case closed
    case allDay
    /// The data itself says it doesn't know.
    case unknown
}

struct ClockRange: Equatable, Sendable {
    var from: String
    var to: String
}

/// One line of the week: the weekdays these hours hold on, 0 for Monday to 6 for Sunday, in
/// that order. All seven: every day.
struct WeekLine: Equatable, Sendable {
    var days: [Int]
    var hours: DayHours
}

/// The coming seven days of a pharmacy's opening hours, as the sheet lists them: the web's
/// `lib/week.ts`, checked by `tests/vectors/week.json`. Equal days are grouped, so a week
/// reads like a door sign ("ma–pe 8.00–21.00", "la–su 10.00–18.00") and a public holiday
/// shows as the exception it is.
///
/// Pure, from the intervals a tile carries. Nothing is guessed: a day the data doesn't cover
/// is left out, and a day with a stretch the data itself calls unknown is said to be unknown.
enum Week {
    private static let days = 7
    private static let hour = 3600
    /// An opening that runs past midnight and ends by this hour belongs to the day it began
    /// on: "18.00–2.00" on Friday, and nothing extra on Saturday. A longer one is cut at midnight.
    private static let overnightUntilHours = 12

    /// The week the sheet shows. Out-of-date data says nothing about the coming days either.
    static func lines(of pharmacy: TilePharmacy, now: Int) -> [WeekLine] {
        if HoursStatus.isStale(generated: pharmacy.generated, windowFrom: pharmacy.windowFrom, windowUntil: pharmacy.windowUntil, now: now) { return [] }
        return lines(hours: pharmacy.hours, windowFrom: pharmacy.windowFrom, windowUntil: pharmacy.windowUntil, zone: pharmacy.zone, now: now)
    }

    /// The coming seven local days, today first, grouped by equal hours. Groups are in the
    /// order of their first weekday, Monday first. Empty when the hours aren't parsed
    /// intervals; shorter than a week when the data's window ends before the week does.
    static func lines(hours: Hours, windowFrom: Int, windowUntil: Int, zone: String, now: Int) -> [WeekLine] {
        guard case .parsed(let given, let unknown, _) = hours else { return [] }
        let open = joined(given)
        var groups: [WeekLine] = []
        var start = Zone.startOfDay(now, zone: zone)
        // Noon of yesterday is in yesterday whatever the clocks did last night.
        var before = Zone.startOfDay(start - 12 * hour, zone: zone)
        for _ in 0..<days {
            // Noon of the next day is in the next day whatever the clocks do tonight: its midnight is where this day ends.
            let end = Zone.startOfDay(start + 36 * hour, zone: zone)
            // Only days the data covers whole.
            if start < windowFrom || end > windowUntil { break }
            let day = dayHours(open: open, unknown: unknown, before: before, start: start, end: end, zone: zone)
            let weekday = Zone.weekday(start, zone: zone)
            if let index = groups.firstIndex(where: { $0.hours == day }) {
                groups[index].days.append(weekday)
            } else {
                groups.append(WeekLine(days: [weekday], hours: day))
            }
            before = start
            start = end
        }
        return groups
            .map { WeekLine(days: $0.days.sorted(), hours: $0.hours) }
            .sorted { ($0.days.first ?? 0) < ($1.days.first ?? 0) }
    }

    /// Weekdays as runs: [0, 1, 2, 4] is Monday to Wednesday, and Friday. A run of two is a
    /// run too, as on a door sign: "la–su".
    static func runs(_ days: [Int]) -> [ClosedRange<Int>] {
        var runs: [ClosedRange<Int>] = []
        for day in days {
            if let last = runs.last, last.upperBound == day - 1 {
                runs[runs.count - 1] = last.lowerBound...day
            } else {
                runs.append(day...day)
            }
        }
        return runs
    }

    /// Openings that touch are one opening. The pipeline joins them; a tile that doesn't still reads right.
    private static func joined(_ open: [Interval]) -> [Interval] {
        var result: [Interval] = []
        for interval in open.sorted(by: { $0.from < $1.from }) {
            if let last = result.last, interval.from <= last.to {
                result[result.count - 1].to = max(last.to, interval.to)
            } else {
                result.append(interval)
            }
        }
        return result
    }

    private static func overlaps(_ interval: Interval, _ from: Int, _ to: Int) -> Bool {
        interval.from < to && interval.to > from
    }

    /// What the pharmacy does on the local day that runs from `start` to `end`. `before`:
    /// when the day before it began.
    private static func dayHours(open: [Interval], unknown: [Interval], before: Int, start: Int, end: Int, zone: String) -> DayHours {
        if unknown.contains(where: { overlaps($0, start, end) }) { return .unknown }
        var ranges: [ClockRange] = []
        for interval in open where overlaps(interval, start, end) {
            let carried = interval.from < start
            // The tail of an opening that began yesterday was said there, as "18.00–2.00".
            if carried && interval.from > before && interval.to - start <= overnightUntilHours * hour && interval.to < end { continue }
            if interval.from <= start && interval.to >= end { return .allDay }
            let from = carried ? "00:00" : Zone.clock(interval.from, zone: zone)
            let overnight = interval.to > end && interval.to - end <= overnightUntilHours * hour
            let to = interval.to == end ? "24:00" : (interval.to < end || overnight ? Zone.clock(interval.to, zone: zone) : "24:00")
            ranges.append(ClockRange(from: from, to: to))
        }
        return ranges.isEmpty ? .closed : .open(ranges: ranges)
    }
}
