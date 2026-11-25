import Testing
@testable import Auki

/// The copy rules of CLAUDE.md, as the web's `lib/format.ts` applies them: Finnish first, then English.
struct FormatTests {
    let fi = Format(language: .fi)
    let en = Format(language: .en)
    let nbsp = "\u{00A0}"

    @Test func finnishTimesHaveAFullStopAndWholeHoursStandAlone() {
        #expect(fi.clock("20:44") == "20.44")
        #expect(fi.clock("08:00") == "8.00")
        #expect(fi.clock("24:00") == "24.00")
        #expect(fi.clockShort("21:00") == "klo\(nbsp)21")
        #expect(fi.clockShort("20:45") == "klo\(nbsp)20.45")
        #expect(fi.clockShort("08:30") == "klo\(nbsp)8.30")
        #expect(fi.clockShort("24:00") == "klo\(nbsp)24")
    }

    @Test func englishTimesAreTwentyFourHourAndMidnightIsAWord() {
        #expect(en.clock("20:44") == "20:44")
        #expect(en.clock("08:00") == "08:00")
        #expect(en.clockShort("21:00") == "21:00")
        #expect(en.clockShort("24:00") == "midnight")
    }

    @Test func distancesRoundToTenMetresThenToATenthOfAKilometre() {
        // Each expected text is what the web's `distance` in lib/format.ts prints for the same metres.
        #expect(fi.distance(0) == "0\(nbsp)m")
        #expect(fi.distance(84) == "80\(nbsp)m")
        #expect(fi.distance(85) == "90\(nbsp)m")
        #expect(fi.distance(994) == "990\(nbsp)m")
        #expect(fi.distance(995) == "1,0\(nbsp)km")
        #expect(fi.distance(1049) == "1,1\(nbsp)km")
        #expect(fi.distance(1149) == "1,2\(nbsp)km")
        #expect(fi.distance(2349) == "2,4\(nbsp)km")
        #expect(fi.distance(9949) == "10,0\(nbsp)km")
        #expect(fi.distance(12_340) == "12,3\(nbsp)km")
        #expect(en.distance(220) == "220\(nbsp)m")
        #expect(en.distance(1149) == "1.2\(nbsp)km")
        #expect(en.distance(99_950) == "100.0\(nbsp)km")
    }

    @Test func aDayOnTheDevicesClock() {
        // 24 November 2026 at 10:55 UTC.
        let instant = 1_795_517_738
        #expect(fi.day(of: instant, zone: "Europe/Helsinki") == "24.11.")
        #expect(en.day(of: instant, zone: "Europe/Helsinki") == "24\(nbsp)Nov")
        // Half past eleven in the evening in the Azores is already the next day in Helsinki.
        let late = 1_795_566_600
        #expect(fi.day(of: late, zone: "Atlantic/Azores") == "24.11.")
        #expect(fi.day(of: late, zone: "Europe/Helsinki") == "25.11.")
    }
}

/// A status in words, as the web's `statusText` words it.
struct StatusTextTests {
    let fi = Texts(.fi)
    let en = Texts(.en)
    let nbsp = "\u{00A0}"
    let helsinki = "Europe/Helsinki"

    // Monday 23 November 2026, 00:00 in Helsinki: the start of the vectors' window.
    let midnight = 1_795_384_800
    func at(_ day: Int, _ hour: Int, _ minute: Int = 0) -> Int { midnight + day * 86_400 + hour * 3600 + minute * 60 }

    @Test func openAndClosingSoon() {
        let now = at(0, 20, 41)
        #expect(fi.status(.open(closes: at(0, 24)), zone: helsinki, now: now, deviceZone: helsinki) == "Auki klo\(nbsp)24 asti")
        #expect(en.status(.open(closes: at(0, 24)), zone: helsinki, now: now, deviceZone: helsinki) == "Open until midnight")
        #expect(fi.status(.soon(closes: at(0, 21)), zone: helsinki, now: now, deviceZone: helsinki) == "Sulkeutuu pian, klo\(nbsp)21")
        #expect(en.status(.soon(closes: at(0, 21)), zone: helsinki, now: now, deviceZone: helsinki) == "Closes soon, 21:00")
        #expect(fi.status(.open24, zone: helsinki, now: now, deviceZone: helsinki) == "Auki ympäri vuorokauden")
        #expect(en.status(.open24, zone: helsinki, now: now, deviceZone: helsinki) == "Open 24 hours")
    }

    @Test func aClosingMoreThanADayAwayReadsAsAroundTheClock() {
        let now = at(0, 12)
        #expect(fi.status(.open(closes: at(1, 12)), zone: helsinki, now: now, deviceZone: helsinki) == "Auki ympäri vuorokauden")
        #expect(fi.status(.open(closes: at(1, 11, 59)), zone: helsinki, now: now, deviceZone: helsinki) == "Auki klo\(nbsp)11.59 asti")
    }

    @Test func closedWithTheDayItOpens() {
        let now = at(0, 21, 30)
        #expect(fi.status(.closed(opens: at(0, 23)), zone: helsinki, now: now, deviceZone: helsinki) == "Kiinni, avautuu klo\(nbsp)23")
        #expect(fi.status(.closed(opens: at(1, 8)), zone: helsinki, now: now, deviceZone: helsinki) == "Kiinni, avautuu huomenna klo\(nbsp)8")
        #expect(en.status(.closed(opens: at(1, 8)), zone: helsinki, now: now, deviceZone: helsinki) == "Closed, opens tomorrow 08:00")
        #expect(fi.status(.closed(opens: at(3, 9, 30)), zone: helsinki, now: now, deviceZone: helsinki) == "Kiinni, avautuu to klo\(nbsp)9.30")
        #expect(en.status(.closed(opens: at(3, 9, 30)), zone: helsinki, now: now, deviceZone: helsinki) == "Closed, opens Thu 09:30")
        #expect(fi.status(.closed(opens: nil), zone: helsinki, now: now, deviceZone: helsinki) == "Kiinni")
    }

    @Test func hoursThatAreNotKnownSayWhy() {
        let now = at(0, 12)
        #expect(fi.status(.missing, zone: helsinki, now: now, deviceZone: helsinki) == "Aukioloaikoja ei ole merkitty")
        #expect(fi.status(.unparseable(raw: "soita ensin"), zone: helsinki, now: now, deviceZone: helsinki) == "Aukioloajat epäselvät: ”soita ensin”")
        #expect(en.status(.unparseable(raw: "call first"), zone: helsinki, now: now, deviceZone: helsinki) == "Hours unclear: “call first”")
        #expect(fi.status(.uncertain(raw: ""), zone: helsinki, now: now, deviceZone: helsinki) == "Aukioloajat epävarmat")
        #expect(fi.status(.stale, zone: helsinki, now: now, deviceZone: helsinki) == "Aukioloajat voivat olla vanhentuneet")
    }

    @Test func aPharmacyOnAnotherClockSaysSo() {
        // Seen from Helsinki, a pharmacy in Stockholm closes at 21 on its own clock, an hour later on the device's.
        let now = at(0, 20)
        let closes = at(0, 22)
        #expect(fi.status(.open(closes: closes), zone: "Europe/Stockholm", now: now, deviceZone: helsinki) == "Auki klo\(nbsp)21 asti paikallista aikaa")
        #expect(en.status(.open(closes: closes), zone: "Europe/Stockholm", now: now, deviceZone: helsinki) == "Open until 21:00 local time")
        #expect(fi.status(.open(closes: closes), zone: helsinki, now: now, deviceZone: helsinki) == "Auki klo\(nbsp)22 asti")
    }

    @Test func theHeadingCountsWhatIsOpen() {
        #expect(fi.openNow(0) == "Lähistöllä ei ole yhtään apteekkia auki")
        #expect(fi.openNow(1) == "Yksi apteekki auki juuri nyt")
        #expect(fi.openNow(17) == "17 apteekkia auki juuri nyt")
        #expect(en.openNow(1) == "One pharmacy open right now")
        #expect(en.openNow(3) == "3 pharmacies open right now")
    }

    @Test func noLineBreaksTheCopyRules() {
        // No exclamation marks and no em dashes, in either language, in any text a view can show.
        for texts in [fi, en] {
            var lines = [texts.headline, texts.locate, texts.locating, texts.searching, texts.resultsTitle, texts.refresh, texts.nearestOpen, texts.opensFirst, texts.others, texts.nearest, texts.byStraight, texts.noPrescriptions, texts.showOnMap, texts.staleTitle, texts.staleBody(fetched: midnight), texts.retry, texts.openSettings, texts.emergency, texts.distancesStraight, texts.fetched(midnight), texts.osm, texts.privacy, texts.project]
            for problem in [Problem.denied, .unavailable, .timeout, .offline, .failed, .none, .notCovered] {
                lines.append(texts.title(of: problem))
                if let body = texts.body(of: problem) { lines.append(body) }
            }
            for line in lines {
                #expect(!line.isEmpty)
                #expect(!line.contains("!") && !line.contains("—"), "\(line)")
            }
        }
    }

    @Test func theFooterIsTheOneTheContentRulesGive() {
        #expect(fi.project == "Janne Lapin työhakemusprojekti. Ei Treat Healthin palvelu.")
        #expect(en.project == "A job application project by Janne Lappi. Not affiliated with Treat Health.")
    }
}
