import Testing
@testable import Auki

/// `tests/vectors/zone.json`: an instant on a zone's wall clock, and a wall-clock time as an
/// instant, with the times the clocks skip and the times that come twice.
struct ZoneVectorTests {
    struct File: Decodable {
        var atInstant: [AtInstant]
        var wallToInstant: [WallToInstant]
    }

    struct AtInstant: Decodable {
        var zone: String
        var instant: Int
        var wall: WallJSON
        var clock: String
        var date: String
        var weekday: Int
        var dayNumber: Int
        var startOfDay: Int
    }

    struct WallToInstant: Decodable {
        var zone: String
        var wall: WallJSON
        var note: String?
        var instant: Int
    }

    let file: File

    init() throws {
        file = try Vectors.load(File.self, from: "zone")
    }

    @Test func anInstantOnTheWallClockOfEveryCoveredZone() {
        #expect(file.atInstant.count > 400)
        for entry in file.atInstant {
            let at = "\(entry.zone) at \(entry.instant)"
            #expect(Zone.wall(at: entry.instant, zone: entry.zone) == entry.wall.value, "wall, \(at)")
            #expect(Zone.clock(entry.instant, zone: entry.zone) == entry.clock, "clock, \(at)")
            #expect(Zone.date(entry.instant, zone: entry.zone) == entry.date, "date, \(at)")
            #expect(Zone.weekday(entry.instant, zone: entry.zone) == entry.weekday, "weekday, \(at)")
            #expect(Zone.dayNumber(entry.instant, zone: entry.zone) == entry.dayNumber, "day number, \(at)")
            #expect(Zone.startOfDay(entry.instant, zone: entry.zone) == entry.startOfDay, "start of day, \(at)")
        }
    }

    @Test func aWallClockTimeAsAnInstantAlsoWhenSkippedOrDoubled() {
        #expect(file.wallToInstant.count > 50)
        for entry in file.wallToInstant {
            #expect(Zone.instant(of: entry.wall.value, zone: entry.zone) == entry.instant, "\(entry.zone) \(entry.wall.value) \(entry.note ?? "")")
        }
    }
}
