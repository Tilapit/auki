import Testing
@testable import Auki

/// `tests/vectors/ehditko.json`: ehditkö from a status, a walking time and an instant.
/// Nothing on screen uses it in I1; the logic is checked here so I2 can build on it.
struct EhditkoVectorTests {
    struct File: Decodable {
        var cases: [Case]
        var tight: [Tight]
    }

    struct Case: Decodable {
        var status: StatusJSON
        var walkMin: Int
        var now: Int
        var answer: Answer
        var inTime: Bool
    }

    struct Answer: Decodable {
        var kind: String
        var arrives: Int?
        var closes: Int?
        var slackMin: Int?

        var value: Ehditko.Answer? {
            switch kind {
            case "timeline":
                guard let arrives, let closes, let slackMin else { return nil }
                return .timeline(arrives: arrives, closes: closes, slackMin: slackMin)
            case "tooLate":
                guard let arrives, let closes else { return nil }
                return .tooLate(arrives: arrives, closes: closes)
            case "none":
                return Ehditko.Answer.none
            default:
                return nil
            }
        }
    }

    struct Tight: Decodable {
        var slackMin: Int
        var walkMin: Int
        var tight: Bool
    }

    let file: File

    init() throws {
        file = try Vectors.load(File.self, from: "ehditko")
    }

    @Test func theTimelineTooLateOrNothing() throws {
        #expect(file.cases.count >= 181)
        for entry in file.cases {
            let status = try entry.status.value()
            let label = "\(status), a walk of \(entry.walkMin) min at \(entry.now)"
            let expected = try #require(entry.answer.value, "an answer this test can't read: \(entry.answer.kind)")
            #expect(Ehditko.answer(status: status, walkMin: entry.walkMin, now: entry.now) == expected, "\(label)")
            #expect(Ehditko.arrivesInTime(status: status, walkMin: entry.walkMin, now: entry.now) == entry.inTime, "in time, \(label)")
        }
    }

    @Test func whenTheSlackIsTight() {
        #expect(file.tight.count == 13)
        for entry in file.tight {
            #expect(Ehditko.isTightSlack(slackMin: entry.slackMin, walkMin: entry.walkMin) == entry.tight, "\(entry.slackMin) min of slack on a walk of \(entry.walkMin) min")
        }
    }
}
