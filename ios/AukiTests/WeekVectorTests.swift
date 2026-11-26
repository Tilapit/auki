import Testing
@testable import Auki

/// `tests/vectors/week.json`: the week in the pharmacy sheet, as the web's `lib/week.ts`
/// answers it. The coming seven local days from a tile's intervals, equal days grouped.
struct WeekVectorTests {
    struct File: Decodable {
        var cases: [Case]
    }

    struct Case: Decodable {
        var name: String
        var zone: String
        var windowFrom: Int
        var windowUntil: Int
        var hours: HoursJSON
        var now: Int
        var lines: [LineJSON]
    }

    struct LineJSON: Decodable {
        var days: [Int]
        var hours: DayJSON

        func value() throws -> WeekLine { WeekLine(days: days, hours: try hours.value()) }
    }

    struct DayJSON: Decodable {
        var kind: String
        var ranges: [RangeJSON]?

        func value() throws -> DayHours {
            switch kind {
            case "open": .open(ranges: (ranges ?? []).map { ClockRange(from: $0.from, to: $0.to) })
            case "closed": .closed
            case "allDay": .allDay
            case "unknown": .unknown
            default: throw Vectors.UnknownKind(kind: kind)
            }
        }
    }

    struct RangeJSON: Decodable {
        var from: String
        var to: String
    }

    let file: File

    init() throws {
        file = try Vectors.load(File.self, from: "week")
    }

    @Test func theWeekFromTheIntervals() throws {
        #expect(file.cases.count >= 44)
        for entry in file.cases {
            let lines = Week.lines(hours: try entry.hours.value(), windowFrom: entry.windowFrom, windowUntil: entry.windowUntil, zone: entry.zone, now: entry.now)
            #expect(lines == (try entry.lines.map { try $0.value() }), "\(entry.name)")
        }
    }

    @Test func theFileExercisesEveryKindOfDay() throws {
        // Or the test above checks less than it seems to.
        var open = 0, closed = 0, allDay = 0, unknown = 0, empty = 0, split = 0
        for entry in file.cases {
            if entry.lines.isEmpty { empty += 1 }
            for line in entry.lines {
                switch try line.hours.value() {
                case .open(let ranges):
                    open += 1
                    if ranges.count > 1 { split += 1 }
                case .closed: closed += 1
                case .allDay: allDay += 1
                case .unknown: unknown += 1
                }
            }
        }
        #expect(open > 20 && closed >= 3 && allDay >= 9 && unknown >= 1 && empty >= 5 && split >= 1)
    }

    @Test func everyDayOfTheWeekAppearsAtMostOnce() throws {
        for entry in file.cases {
            let lines = Week.lines(hours: try entry.hours.value(), windowFrom: entry.windowFrom, windowUntil: entry.windowUntil, zone: entry.zone, now: entry.now)
            let days = lines.flatMap(\.days)
            #expect(Set(days).count == days.count, "\(entry.name)")
            #expect(days.allSatisfy { (0...6).contains($0) }, "\(entry.name)")
            // The lines stand in the order of their first weekday, Monday first.
            #expect(lines.map { $0.days.first ?? 0 } == lines.map { $0.days.first ?? 0 }.sorted(), "\(entry.name)")
        }
    }
}

/// The week as the sheet prints it. Each expected line is what the web prints for the same
/// hours (`tests/unit/week.test.ts`).
struct WeekTextTests {
    let fi = Texts(.fi)
    let en = Texts(.en)
    let zone = "Europe/Helsinki"

    // Monday 23 November 2026, 00:00 in Helsinki: the start of an eight-day window.
    let from = 1_795_384_800
    var until: Int { from + 8 * 86_400 }
    func at(_ day: Int, _ hour: Int, _ minute: Int = 0) -> Int { from + day * 86_400 + hour * 3600 + minute * 60 }
    func span(_ day: Int, _ open: Int, _ close: Int) -> Interval { Interval(from: at(day, open), to: at(day, close)) }

    func week(_ open: [Interval], unknown: [Interval] = [], now: Int, _ texts: Texts) -> [String] {
        Week.lines(hours: .parsed(open: open, unknown: unknown, raw: nil), windowFrom: from, windowUntil: until, zone: zone, now: now).map(texts.weekLine)
    }

    @Test func theSameHoursEveryDayAreOneLine() {
        let open = (0...7).map { span($0, 8, 24) }
        #expect(week(open, now: at(0, 20, 41), fi) == ["Joka päivä 8.00–24.00"])
        #expect(week(open, now: at(0, 20, 41), en) == ["Every day 08:00–24:00"])
    }

    @Test func weekdaysAndTheWeekendReadLikeADoorSign() {
        let open = (0...7).map { $0 % 7 >= 5 ? span($0, 10, 18) : span($0, 8, 21) }
        for today in [0, 1] {
            #expect(week(open, now: at(today, 12), fi) == ["Ma–pe 8.00–21.00", "La–su 10.00–18.00"])
            #expect(week(open, now: at(today, 12), en) == ["Mon–Fri 08:00–21:00", "Sat–Sun 10:00–18:00"])
        }
    }

    @Test func aDayThatDiffersStandsOut() {
        // Closed on Thursday, as on a public holiday; shorter on Saturday; closed on Sunday.
        let open = (0...7).compactMap { day -> Interval? in
            if day % 7 == 3 || day % 7 == 6 { return nil }
            return day % 7 == 5 ? span(day, 9, 15) : span(day, 8, 21)
        }
        #expect(week(open, now: at(0, 12), fi) == ["Ma–ke, pe 8.00–21.00", "To, su suljettu", "La 9.00–15.00"])
        #expect(week(open, now: at(0, 12), en) == ["Mon–Wed, Fri 08:00–21:00", "Thu, Sun closed", "Sat 09:00–15:00"])
    }

    @Test func aLunchBreakAndANightAndAroundTheClock() {
        #expect(week((0...7).flatMap { [span($0, 8, 12), span($0, 13, 17)] }, now: at(0, 9), fi) == ["Joka päivä 8.00–12.00, 13.00–17.00"])
        #expect(week((0...7).map { Interval(from: at($0, 18), to: at($0 + 1, 2)) }, now: at(0, 19), fi) == ["Joka päivä 18.00–2.00"])
        #expect(week([Interval(from: from, to: until)], now: at(1, 3), fi) == ["Joka päivä ympäri vuorokauden"])
        #expect(week([Interval(from: from, to: until)], now: at(1, 3), en) == ["Every day open 24 hours"])
    }

    @Test func aDayTheDataCallsUnknownIsSaidToBeUnknown() {
        let open = (0...7).filter { $0 != 3 }.map { span($0, 8, 21) }
        #expect(week(open, unknown: [span(3, 0, 24)], now: at(0, 12), fi) == ["Ma–ke, pe–su 8.00–21.00", "To ei tiedossa"])
        #expect(week(open, unknown: [span(3, 0, 24)], now: at(0, 12), en) == ["Mon–Wed, Fri–Sun 08:00–21:00", "Thu not known"])
    }

    @Test func onlyTheDaysTheDataCovers() {
        // Thursday: the window ends with next Monday.
        #expect(week((0...7).map { span($0, 8, 21) }, now: at(3, 12), fi) == ["Ma, to–su 8.00–21.00"])
    }

    @Test func runsOfDaysAndTheirNames() {
        #expect(Week.runs([0, 1, 2, 4]) == [0...2, 4...4])
        #expect(Week.runs([5, 6]) == [5...6])
        #expect(Week.runs([0, 6]) == [0...0, 6...6])
        #expect(Week.runs([]) == [])
        #expect(fi.daysLabel([0, 6]) == "Ma, su")
        #expect(en.daysLabel([2]) == "Wed")
        #expect(fi.daysLabel([0, 1, 2, 3, 4, 5, 6]) == "Joka päivä")
    }

    @Test func outOfDateDataSaysNothingAboutTheComingDays() {
        func pharmacy(generated: Int) -> TilePharmacy {
            TilePharmacy(
                id: "n1", lat: 60.17, lon: 24.94, name: "Apteekki", street: nil, city: nil, country: "FI", zone: zone,
                generated: generated, windowFrom: from, windowUntil: until,
                hours: .parsed(open: (0...7).map { span($0, 8, 21) }, unknown: [], raw: nil),
                phone: nil, email: nil, website: nil, wheelchair: nil, wheelchairNote: nil, dispensing: nil, checkDate: nil
            )
        }
        #expect(Week.lines(of: pharmacy(generated: from + 3600), now: at(0, 12)).count == 1)
        // Eight days on, the window is over: nothing is read from it.
        #expect(Week.lines(of: pharmacy(generated: from + 3600), now: at(8, 12)).isEmpty)
        // Fetched more than seven days before the moment asked about.
        #expect(Week.lines(of: pharmacy(generated: from - 5 * 86_400), now: at(3, 12)).isEmpty)
    }
}
