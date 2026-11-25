import Testing
@testable import Auki

/// `tests/vectors/status.json`: the status rules of `docs/tiles.md`, with the day and the
/// time as the status line prints them on the pharmacy's own clock.
struct StatusVectorTests {
    struct File: Decodable {
        var cases: [Case]
    }

    struct Case: Decodable {
        var name: String
        var zone: String
        var generated: Int
        var windowFrom: Int
        var windowUntil: Int
        var hours: HoursJSON
        var now: Int
        var status: StatusJSON
        var closes: MomentJSON?
        var opens: MomentJSON?
    }

    let file: File

    init() throws {
        file = try Vectors.load(File.self, from: "status")
    }

    @Test func openOrClosedFromTheIntervals() throws {
        #expect(file.cases.count >= 62)
        for entry in file.cases {
            let status = HoursStatus.of(hours: try entry.hours.value(), generated: entry.generated, windowFrom: entry.windowFrom, windowUntil: entry.windowUntil, now: entry.now)
            #expect(status == (try entry.status.value()), "\(entry.name)")
        }
    }

    @Test func theClosingAndOpeningMomentsOnThePharmacysClock() throws {
        var closings = 0
        var openings = 0
        for entry in file.cases {
            switch try entry.status.value() {
            case .open(let closes), .soon(let closes):
                closings += 1
                #expect(LocalMoment(now: entry.now, instant: closes, zone: entry.zone, closing: true) == (try entry.closes?.value()), "closes, \(entry.name)")
            case .closed(let opens?):
                openings += 1
                #expect(LocalMoment(now: entry.now, instant: opens, zone: entry.zone) == (try entry.opens?.value()), "opens, \(entry.name)")
            default:
                #expect(entry.closes == nil && entry.opens == nil, "\(entry.name)")
            }
        }
        // The file has to exercise both, or this test checks nothing.
        #expect(closings > 10)
        #expect(openings > 10)
    }

    @Test func nothingReadsOpenFromDataThatIsTooOld() throws {
        // PLAN.md 7.4: with the clock moved eight days ahead, no pharmacy is shown as open.
        for entry in file.cases {
            let later = HoursStatus.of(hours: try entry.hours.value(), generated: entry.generated, windowFrom: entry.windowFrom, windowUntil: entry.windowUntil, now: entry.now + 8 * 86_400)
            #expect(later == .stale, "\(entry.name)")
        }
    }
}
