import Foundation
import Testing
@testable import Auki

/// The links of a pharmacy's sheet. Each expected value is what the web's `lib/maps.ts`
/// gives for the same input (`tests/unit/lib.test.ts`): one rule for both apps.
struct HandoffTests {
    @Test func theRouteLinkCarriesOnlyThePharmacysPosition() throws {
        let link = Handoff.appleDirections(to: LatLon(lat: 60.1706, lon: 24.93653))
        #expect(link == "https://maps.apple.com/?daddr=60.1706,24.93653&dirflg=w")
        // Nothing but the destination and the way of travel: no start, no name, no position of the user.
        let items = try #require(URLComponents(string: link)?.queryItems)
        #expect(items.map(\.name) == ["daddr", "dirflg"])
    }

    @Test func tooFarToWalkTheLinkNamesNoWayOfTravel() {
        #expect(Handoff.appleDirections(to: LatLon(lat: 1.5, lon: 2.5)).contains("dirflg=w"))
        #expect(Handoff.appleDirections(to: LatLon(lat: 1.5, lon: 2.5), walking: false) == "https://maps.apple.com/?daddr=1.5,2.5")
        #expect(Handoff.withinWalk(3000))
        #expect(!Handoff.withinWalk(3001))
    }

    @Test func aCoordinateIsPlainDecimals() {
        #expect(Handoff.degrees(60.1706) == "60.1706")
        #expect(Handoff.degrees(24.93653) == "24.93653")
        #expect(Handoff.degrees(60) == "60")
        #expect(Handoff.degrees(-8.6291) == "-8.6291")
        // On the prime meridian, which crosses Spain, a longitude is a few hundred-thousandths of a degree: never "5e-05".
        #expect(Handoff.degrees(0.00005) == "0.00005")
        #expect(Handoff.degrees(-0.00001) == "-0.00001")
        #expect(Handoff.degrees(0) == "0")
        #expect(Handoff.degrees(-0.0) == "0")
        #expect(Handoff.degrees(.nan) == "0")
    }

    @Test func theNoteFormOpensAtThePharmacy() {
        #expect(Handoff.osmNote(at: LatLon(lat: 60.1706, lon: 24.93653)) == "https://www.openstreetmap.org/note/new?lat=60.1706&lon=24.93653#map=19/60.1706/24.93653")
    }

    @Test func aCallDialsTheNumberWithoutItsSpaces() {
        #expect(Handoff.call("+358 300 20200") == "tel:+35830020200")
        #expect(Handoff.call("09 1234\u{00A0}567") == "tel:091234567")
        #expect(Handoff.call("") == nil)
        #expect(Handoff.call("   ") == nil)
        #expect(Handoff.call("soita ensin") == nil)
        // Every link the sheet makes of a number is one the system can open.
        #expect(Handoff.call("+358 300 20200").flatMap(URL.init(string:)) != nil)
    }

    @Test func aWebsiteIsNamedByItsHostWithoutWww() {
        #expect(Handoff.websiteHost("https://www.yliopistonapteekki.fi/apteekit/keskusta?utm=1") == "yliopistonapteekki.fi")
        #expect(Handoff.websiteHost("http://apteekki.example") == "apteekki.example")
    }

    @Test func whatIsNotAWebAddressIsNotShownAsOne() {
        for value in ["", "apteekki.example", "javascript:alert(1)", "mailto:a@b.example", "ftp://apteekki.example/", "https://localhost/", "not a url"] {
            #expect(Handoff.websiteHost(value) == nil, "\(value)")
        }
    }

    @Test func anEmailLinkCarriesOneAddressAndNothingMore() {
        #expect(Handoff.emailAddress("info@apteekki.example") == "info@apteekki.example")
        // OpenStreetMap's value is free text: several addresses, or a stray space.
        #expect(Handoff.emailAddress("info@apteekki.example; toinen@apteekki.example") == "info@apteekki.example")
        #expect(Handoff.emailAddress(" info@apteekki.example ") == "info@apteekki.example")
        for value in ["", "info", "info@apteekki", "info@apteekki.example?subject=x", "info@apteekki.example&cc=y@z.example", "a b@c.example", "<info@apteekki.example>", "info@apteekki.example."] {
            #expect(Handoff.emailAddress(value) == nil, "\(value)")
        }
    }
}

/// The texts of a pharmacy's sheet, in the web's wording (`lib/i18n/`, "sheet" and "card").
struct SheetTextTests {
    let fi = Texts(.fi)
    let en = Texts(.en)

    @Test func theButtonsSayWhereTheyLead() {
        #expect(fi.appleRoute == "Reitti Apple Kartoissa")
        #expect(en.appleRoute == "Route in Apple Maps")
        #expect(fi.call == "Soita")
        #expect(fi.callLabel("Kampin apteekki") == "Soita: Kampin apteekki")
        #expect(en.callLabel("Kampin apteekki") == "Call Kampin apteekki")
        #expect(fi.routeLabel("Kampin apteekki", walking: true) == "Kävelyreitti: Kampin apteekki")
        #expect(fi.routeLabel("Kampin apteekki", walking: false) == "Reitti: Kampin apteekki")
        #expect(en.routeLabel("Kampin apteekki", walking: true) == "Walking directions to Kampin apteekki")
        #expect(en.routeLabel("Kampin apteekki", walking: false) == "Directions to Kampin apteekki")
    }

    @Test func theSourceLineSaysWhenTheHoursWereChecked() {
        #expect(fi.sourceChecked("2023-09-13") == "Tiedot: OpenStreetMap, aukioloajat tarkistettu 13.9.2023.")
        #expect(en.sourceChecked("2023-09-13") == "Data: OpenStreetMap, opening hours checked 13 Sept 2023.")
        #expect(fi.format.date("2026-11-05") == "5.11.2026")
        #expect(en.format.date("2026-11-05") == "5 Nov 2026")
        // A value that is not a date is not made to look like one.
        #expect(fi.format.date("syksy 2023") == "syksy 2023")
        #expect(fi.format.date("2023-13-40") == "2023-13-40")
    }

    @Test func accessibilityInTheWebsWords() {
        #expect(fi.wheelchair(.yes) == "Esteetön")
        #expect(fi.wheelchair(.limited) == "Osittain")
        #expect(fi.wheelchair(.no) == "Ei esteetön")
        #expect(en.wheelchair(.limited) == "Partly")
    }

    @Test func noLineOfTheSheetBreaksTheCopyRules() {
        // No exclamation marks and no em dashes, in either language.
        for texts in [fi, en] {
            let lines = [
                texts.close, texts.route, texts.routeLabel("x", walking: true), texts.routeLabel("x", walking: false), texts.call, texts.callLabel("x"), texts.showDetails,
                texts.hours, texts.accessibility, texts.phone, texts.email, texts.website, texts.wheelchair(.yes), texts.wheelchair(.limited), texts.wheelchair(.no),
                texts.appleRoute, texts.handOff, texts.source, texts.sourceChecked("2023-09-13"), texts.wrong, texts.fix, texts.fixLabel("x"),
                texts.daysLabel([0, 1, 2, 3, 4, 5, 6]), texts.dayHours(.closed), texts.dayHours(.allDay), texts.dayHours(.unknown),
            ]
            for line in lines {
                #expect(!line.isEmpty)
                #expect(!line.contains("!") && !line.contains("—"), "\(line)")
            }
        }
    }
}
