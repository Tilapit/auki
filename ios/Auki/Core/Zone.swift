import Foundation

/// What the clock on the wall says: a date and a time without a zone.
struct Wall: Equatable, Sendable {
    var year: Int
    /// 1 to 12.
    var month: Int
    var day: Int
    var hour: Int
    var minute: Int
}

/// Time-zone arithmetic, the same answers as the web's `lib/zone.ts` (checked by
/// `tests/vectors/zone.json`). Instants are epoch seconds.
///
/// It never decides open or closed: a tile's intervals are already instants. The zone is
/// only for printing a time or a day on the pharmacy's own clock (`docs/tiles.md`).
enum Zone {
    private static let day = 86_400

    /// Seconds the zone is ahead of UTC at an instant. A zone the device doesn't know reads as UTC.
    static func offset(at instant: Int, zone: String) -> Int {
        guard let timeZone = TimeZone(identifier: zone) else { return 0 }
        return timeZone.secondsFromGMT(for: Date(timeIntervalSince1970: TimeInterval(instant)))
    }

    /// What the wall clock says in a zone at an instant.
    static func wall(at instant: Int, zone: String) -> Wall {
        let local = instant + offset(at: instant, zone: zone)
        let days = floorDivide(local, day)
        let seconds = local - days * day
        let date = civil(fromDays: days)
        return Wall(year: date.year, month: date.month, day: date.day, hour: seconds / 3600, minute: seconds % 3600 / 60)
    }

    /// The instant at which a zone's wall clock shows the given time.
    /// - A time the clocks skip in spring maps to the moment they jump.
    /// - A time that comes twice in autumn maps to its first occurrence.
    static func instant(of wall: Wall, zone: String) -> Int {
        let local = days(year: wall.year, month: wall.month, day: wall.day) * day + wall.hour * 3600 + wall.minute * 60
        // Daylight-saving changes are months apart, so a day either side brackets at most one.
        let before = offset(at: local - day, zone: zone)
        let after = offset(at: local + day, zone: zone)
        if before == after { return local - before }

        let first = local - before
        let second = local - after
        let firstHolds = offset(at: first, zone: zone) == before
        let secondHolds = offset(at: second, zone: zone) == after
        if firstHolds && secondHolds { return min(first, second) }
        if firstHolds { return first }
        if secondHolds { return second }

        // Skipped: find the jump, the first second that has the new offset.
        var low = min(first, second)
        var high = max(first, second)
        while high - low > 1 {
            let middle = floorDivide(low + high, 2)
            if offset(at: middle, zone: zone) == after { high = middle } else { low = middle }
        }
        return high
    }

    /// The instant a local calendar day starts in a zone.
    static func startOfDay(_ instant: Int, zone: String) -> Int {
        var midnight = wall(at: instant, zone: zone)
        midnight.hour = 0
        midnight.minute = 0
        return self.instant(of: midnight, zone: zone)
    }

    /// Days since 1970 of the local calendar date: the difference of two tells today from tomorrow.
    static func dayNumber(_ instant: Int, zone: String) -> Int {
        floorDivide(instant + offset(at: instant, zone: zone), day)
    }

    /// Day of the week of the local date, 0 for Monday to 6 for Sunday.
    static func weekday(_ instant: Int, zone: String) -> Int {
        let number = (dayNumber(instant, zone: zone) + 3) % 7
        return number < 0 ? number + 7 : number
    }

    /// "HH:mm" on the zone's wall clock.
    static func clock(_ instant: Int, zone: String) -> String {
        let wall = wall(at: instant, zone: zone)
        return "\(two(wall.hour)):\(two(wall.minute))"
    }

    /// "YYYY-MM-DD" of the local date.
    static func date(_ instant: Int, zone: String) -> String {
        let wall = wall(at: instant, zone: zone)
        return "\(wall.year)-\(two(wall.month))-\(two(wall.day))"
    }

    // MARK: The calendar, as whole-number arithmetic

    /// Days since 1970-01-01 of a date in the Gregorian calendar. A day past the month's end rolls over.
    static func days(year: Int, month: Int, day: Int) -> Int {
        let y = month <= 2 ? year - 1 : year
        let era = floorDivide(y, 400)
        let yearOfEra = y - era * 400
        let dayOfYear = (153 * (month > 2 ? month - 3 : month + 9) + 2) / 5 + day - 1
        let dayOfEra = yearOfEra * 365 + yearOfEra / 4 - yearOfEra / 100 + dayOfYear
        return era * 146_097 + dayOfEra - 719_468
    }

    private static func civil(fromDays days: Int) -> (year: Int, month: Int, day: Int) {
        let shifted = days + 719_468
        let era = floorDivide(shifted, 146_097)
        let dayOfEra = shifted - era * 146_097
        let yearOfEra = (dayOfEra - dayOfEra / 1460 + dayOfEra / 36_524 - dayOfEra / 146_096) / 365
        let dayOfYear = dayOfEra - (365 * yearOfEra + yearOfEra / 4 - yearOfEra / 100)
        let shiftedMonth = (5 * dayOfYear + 2) / 153
        let day = dayOfYear - (153 * shiftedMonth + 2) / 5 + 1
        let month = shiftedMonth < 10 ? shiftedMonth + 3 : shiftedMonth - 9
        return (yearOfEra + era * 400 + (month <= 2 ? 1 : 0), month, day)
    }

    private static func floorDivide(_ value: Int, _ divisor: Int) -> Int {
        let quotient = value / divisor
        return value % divisor != 0 && (value < 0) != (divisor < 0) ? quotient - 1 : quotient
    }

    private static func two(_ value: Int) -> String { value < 10 ? "0\(value)" : "\(value)" }
}
