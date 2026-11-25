import Foundation

/// Ehditkö: will you make it before the pharmacy closes. The web's `lib/ehditko.ts`, checked
/// by `tests/vectors/ehditko.json`.
///
/// I1 has no walking times, so nothing on screen uses this yet: it is here so that all of
/// the shared time logic passes its vectors, and for the Live Activity of I2 (PLAN.md
/// section 11). All of it is in instants, so a change of the clocks on the way costs nothing.
enum Ehditko {
    enum Answer: Equatable, Sendable {
        /// Closing is within the hour and the walk ends before it. `slackMin`: whole minutes between arriving and closing.
        case timeline(arrives: Int, closes: Int, slackMin: Int)
        /// The walk would end at closing time or after it.
        case tooLate(arrives: Int, closes: Int)
        /// Nothing worth saying: it closes later than that, never closes, or isn't open.
        case none
    }

    /// The timeline is shown from this long before closing, and at exactly this long too.
    static let timelineWithinSeconds = 60 * 60

    /// When a walk that starts now ends. The clock in the user's hand shows minutes, so the
    /// walk is counted from the start of the current one, and the times on screen add up.
    static func arrival(now: Int, walkMin: Int) -> Int {
        now / 60 * 60 + walkMin * 60
    }

    static func answer(status: HoursStatus, walkMin: Int, now: Int) -> Answer {
        let closes: Int
        switch status {
        case .open(let value), .soon(let value): closes = value
        default: return .none
        }
        let arrives = arrival(now: now, walkMin: walkMin)
        // Arriving exactly at closing time is too late: the door is being locked.
        if arrives >= closes { return .tooLate(arrives: arrives, closes: closes) }
        if closes - now / 60 * 60 > timelineWithinSeconds { return .none }
        return .timeline(arrives: arrives, closes: closes, slackMin: (closes - arrives) / 60)
    }

    /// True for an open pharmacy that is still open when the walk there ends. Around the clock: always.
    static func arrivesInTime(status: HoursStatus, walkMin: Int, now: Int) -> Bool {
        switch status {
        case .open24: true
        case .open(let closes), .soon(let closes): arrival(now: now, walkMin: walkMin) < closes
        default: false
        }
    }

    /// Slack is tight when it is under five minutes or under a fifth of the walk, whichever is larger.
    static func isTightSlack(slackMin: Int, walkMin: Int) -> Bool {
        Double(slackMin) < max(5, Double(walkMin) * 0.2)
    }
}
