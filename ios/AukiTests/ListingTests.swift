import Testing
@testable import Auki

/// What the results lead with at a given moment.
struct ListingTests {
    // Monday 23 November 2026, 00:00 in Helsinki.
    let midnight = 1_795_384_800
    func at(_ day: Int, _ hour: Int, _ minute: Int = 0) -> Int { midnight + day * 86_400 + hour * 3600 + minute * 60 }

    func pharmacy(_ id: String, name: String? = "Apteekki", street: String? = nil, open: [(Int, Int)]?, generated: Int? = nil) -> TilePharmacy {
        TilePharmacy(
            id: id, lat: 60.17, lon: 24.94, name: name, street: street, country: "FI", zone: "Europe/Helsinki",
            generated: generated ?? midnight + 3600, windowFrom: midnight, windowUntil: midnight + 8 * 86_400,
            hours: open.map { .parsed(open: $0.map { Interval(from: $0.0, to: $0.1) }, unknown: [], raw: nil) } ?? .missing
        )
    }

    @Test func theNearestOpenOneLeadsEvenWhenACloserOneIsClosed() {
        let found = [
            Found(pharmacy: pharmacy("n1", name: "Lähin", open: [(at(1, 8), at(1, 18))]), meters: 100),
            Found(pharmacy: pharmacy("n2", name: "Auki", open: [(at(0, 8), at(0, 24))]), meters: 300),
            Found(pharmacy: pharmacy("n3", name: "Toinen auki", open: [(at(0, 8), at(0, 22))]), meters: 500),
        ]
        let listing = Listing(found: found, now: at(0, 20, 41))
        #expect(listing.lead?.id == "n2")
        #expect(!listing.leadIsFar)
        #expect(listing.openCount == 2)
        #expect(listing.firstToOpen == nil)
        #expect(listing.others.map(\.id) == ["n1", "n3"])
        #expect(listing.rows.map(\.glyph) == [.closed, .open, .open])
    }

    @Test func nothingOpenNearbyTheOneThatOpensFirstIsNamed() {
        let found = [
            Found(pharmacy: pharmacy("n1", open: [(at(1, 9), at(1, 18))]), meters: 100),
            Found(pharmacy: pharmacy("n2", open: [(at(1, 7, 30), at(1, 18))]), meters: 300),
            Found(pharmacy: pharmacy("n3", open: nil), meters: 400),
        ]
        let listing = Listing(found: found, now: at(0, 23))
        #expect(listing.lead == nil)
        #expect(listing.openCount == 0)
        #expect(listing.firstToOpen?.id == "n2")
        #expect(listing.others.map(\.id) == ["n1", "n2", "n3"])
    }

    @Test func theFartherOpenOneLeadsOnlyWhileItIsOpen() {
        let near = [Found(pharmacy: pharmacy("n1", open: [(at(1, 8), at(1, 18))]), meters: 100)]
        let far = Found(pharmacy: pharmacy("n9", name: "Yöapteekki", open: [(at(0, 20), at(1, 2))]), meters: 2300)

        let atNight = Listing(found: near, farOpen: far, now: at(0, 23))
        #expect(atNight.lead?.id == "n9")
        #expect(atNight.leadIsFar)
        #expect(atNight.openCount == 0)
        #expect(atNight.firstToOpen?.id == "n1")
        #expect(atNight.others.map(\.id) == ["n1"])
        #expect(atNight.all.map(\.id) == ["n1", "n9"])

        // The clock moves on with the results on screen: once the far one has closed, it no longer leads.
        let later = Listing(found: near, farOpen: far, now: at(1, 2))
        #expect(later.lead == nil)
        #expect(!later.leadIsFar)
    }

    @Test func aStatusTurnsWithTheClockWithoutANewSearch() {
        let found = [Found(pharmacy: pharmacy("n1", open: [(at(0, 8), at(0, 21))]), meters: 100)]
        #expect(Listing(found: found, now: at(0, 20, 29)).rows[0].status == .open(closes: at(0, 21)))
        #expect(Listing(found: found, now: at(0, 20, 31)).rows[0].status == .soon(closes: at(0, 21)))
        #expect(Listing(found: found, now: at(0, 21)).rows[0].status == .closed(opens: nil))
    }

    @Test func dataThatIsTooOldLeadsWithNothing() {
        let found = [
            Found(pharmacy: pharmacy("n1", open: [(midnight, midnight + 8 * 86_400)]), meters: 100),
            Found(pharmacy: pharmacy("n2", open: nil), meters: 200),
        ]
        // Eight days after the fetch.
        let listing = Listing(found: found, now: midnight + 3600 + 8 * 86_400)
        #expect(listing.isStale)
        #expect(listing.lead == nil)
        #expect(listing.openCount == 0)
        #expect(listing.rows.allSatisfy { $0.status == .stale })
        #expect(listing.fetched == midnight + 3600)
    }

    @Test func theStreetIsShownWhereTheNameDoesNotTellPharmaciesApart() {
        let found = [
            Found(pharmacy: pharmacy("n1", name: "Benu", street: "Katu 1", open: nil), meters: 100),
            Found(pharmacy: pharmacy("n2", name: "BENU", street: "Katu 2", open: nil), meters: 200),
            Found(pharmacy: pharmacy("n3", name: "Keskustan apteekki", street: "Katu 3", open: nil), meters: 300),
            Found(pharmacy: pharmacy("n4", name: nil, street: "Katu 4", open: nil), meters: 400),
        ]
        let listing = Listing(found: found, now: at(0, 12))
        #expect(listing.rows.map(\.showsStreet) == [true, true, false, true])
        #expect(listing.rows.map(\.glyph) == [.unknown, .unknown, .unknown, .unknown])
    }
}
