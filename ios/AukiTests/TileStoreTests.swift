import Foundation
import Testing
@testable import Auki

/// The store against a data host answered by the test: no test reaches the real one.
struct TileStoreTests {
    /// Records every address the store asks for, and answers from memory.
    final class Host: @unchecked Sendable {
        private let lock = NSLock()
        private var asked: [URL] = []
        private let answers: [String: Data]

        init(_ answers: [String: Data]) {
            self.answers = answers
        }

        var requests: [URL] {
            lock.withLock { asked }
        }

        var fetch: TileStore.Fetch {
            { [self] url in
                lock.withLock { asked.append(url) }
                guard let data = answers[url.path] else { throw TileStore.Failure.unavailable }
                return data
            }
        }
    }

    let origin = URL(string: "https://data.example")!
    // A position in Kamppi, to seven decimals: nothing like it may appear in a request.
    let position = LatLon(lat: 60.1689234, lon: 24.9316789)
    // Monday 23 November 2026, 00:00 in Helsinki.
    let midnight = 1_795_384_800

    func index(grid rows: [String], x0: Int, y0: Int) -> Data {
        let rowsJSON = rows.map { "\"\($0)\"" }.joined(separator: ",")
        return Data(#"{"v":1,"generated":\#(midnight + 3600),"attribution":"© OpenStreetMap contributors","countries":{"FI":{"generated":\#(midnight + 3600),"pharmacies":2}},"grid":{"z":10,"x0":\#(x0),"y0":\#(y0),"width":\#(rows[0].count),"rows":[\#(rowsJSON)]}}"#.utf8)
    }

    func tile(_ ref: TileRef, rows: [String]) -> Data {
        let source = #"{"country":"FI","zone":"Europe/Helsinki","generated":\#(midnight + 3600),"from":\#(midnight),"until":\#(midnight + 8 * 86_400)}"#
        return Data(#"{"v":1,"z":10,"x":\#(ref.x),"y":\#(ref.y),"sources":[\#(source)],"cities":["Helsinki"],"hours":[[[480,1260]]],"rows":[\#(rows.joined(separator: ","))]}"#.utf8)
    }

    @Test func aSearchAsksForSquaresAndNothingElse() async throws {
        let home = Tiles.tile(of: position)
        let host = Host([
            Tiles.indexPath: index(grid: ["ccc", "cdc", "ccc"], x0: home.x - 1, y0: home.y - 1),
            Tiles.path(home): tile(home, rows: [
                #"["n1",60.1692,24.9320,"Töölön apteekki","Kampinkuja 2",0,0,0]"#,
                #"["n2",60.1700,24.9400,"Yliopiston apteekki","Mannerheimintie 5",0,0,null]"#,
            ]),
        ])
        let store = TileStore(origin: origin, fetch: host.fetch)

        let found = try await store.nearest(to: position, count: 20, radius: 10_000)
        #expect(found.map(\.pharmacy.id) == ["n1", "n2"])
        #expect(found[0].meters < found[1].meters)
        #expect(found[0].pharmacy.city == "Helsinki")

        // The privacy property: the index and one square. The position is in none of it.
        #expect(host.requests.map(\.path).sorted() == [Tiles.path(home), Tiles.indexPath].sorted())
        for url in host.requests {
            #expect(url.host == "data.example")
            #expect(url.query == nil && url.fragment == nil)
            #expect(url.path == Tiles.indexPath || url.path.wholeMatch(of: /\/tiles\/v1\/10\/\d+\/\d+\.json/) != nil, "\(url)")
            for digits in ["60.16", "24.93", "6016", "2493"] {
                #expect(!url.absoluteString.contains(digits), "\(url)")
            }
        }

        // A second search from the same place asks for nothing again.
        _ = try await store.nearest(to: position, count: 20, radius: 10_000)
        #expect(host.requests.count == 2)
    }

    @Test func aSquareThatCanNotBeHadFailsTheSearchInsteadOfHidingAPharmacy() async throws {
        let home = Tiles.tile(of: position)
        // The grid lists the square, and the host does not have it.
        let host = Host([Tiles.indexPath: index(grid: ["ccc", "cdc", "ccc"], x0: home.x - 1, y0: home.y - 1)])
        let store = TileStore(origin: origin, fetch: host.fetch)
        await #expect(throws: TileStore.Failure.unavailable) {
            _ = try await store.nearest(to: position, count: 20, radius: 10_000)
        }
    }

    @Test func noConnectionIsToldApartFromAHostThatFails() async throws {
        let store = TileStore(origin: origin) { _ in throw URLError(.notConnectedToInternet) }
        await #expect(throws: TileStore.Failure.offline) {
            _ = try await store.nearest(to: position, count: 20, radius: 10_000)
        }
    }

    @Test func outsideTheGridIsNotCoveredAndAnEmptySquareIs() async throws {
        let home = Tiles.tile(of: position)
        let host = Host([Tiles.indexPath: index(grid: ["c"], x0: home.x, y0: home.y)])
        let store = TileStore(origin: origin, fetch: host.fetch)

        #expect(try await store.covers(position))
        #expect(try await store.nearest(to: position, count: 5, radius: 50_000).isEmpty)
        // The Atlantic, far from every covered country.
        #expect(try await !store.covers(LatLon(lat: 45.0, lon: -30.0)))
        // Only the index was read: a square without a file is never asked for.
        #expect(host.requests.map(\.path) == [Tiles.indexPath])
    }

    @Test func anIndexOfAnotherVersionIsRefused() async throws {
        let other = Data(#"{"v":2,"generated":1,"attribution":"","countries":{},"grid":{"z":10,"x0":0,"y0":0,"width":1,"rows":["c"]}}"#.utf8)
        let store = TileStore(origin: origin, fetch: Host([Tiles.indexPath: other]).fetch)
        await #expect(throws: TileStore.Failure.unavailable) {
            _ = try await store.currentIndex()
        }
    }
}

/// The name, in one place (PLAN.md, decision D4).
struct BrandTests {
    @Test func theNameIsTheWebsNameAndNothingInTheCodeSpellsItOut() throws {
        // lib/brand.ts, copied into the test bundle as it is.
        let source = String(decoding: try Vectors.data("brand", "ts"), as: UTF8.self)
        let web = try #require(source.firstMatch(of: /BRAND = '([^']+)'/)?.1)
        #expect(Brand.name == String(web), "ios/Brand.xcconfig and lib/brand.ts name the product differently")
        #expect(!Brand.name.isEmpty)
        // The one text that carries the name takes it from there.
        #expect(Texts(.fi).title(of: .notCovered) == "\(web) ei vielä kata tätä maata")
        #expect(Texts(.en).title(of: .notCovered) == "\(web) doesn't cover this country yet")
    }
}
