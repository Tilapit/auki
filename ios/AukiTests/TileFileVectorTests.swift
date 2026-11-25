import Foundation
import Testing
@testable import Auki

/// `tests/vectors/tile-file.json`: one tile as it is stored, and what reading it must give.
struct TileFileVectorTests {
    struct Expected: Decodable {
        var decoded: TileJSON
    }

    @Test func aTileAsStoredReadsAsTheWebReadsIt() throws {
        let data = try Vectors.data("tile-file")
        let expected = try JSONDecoder().decode(Expected.self, from: data).decoded.value()

        // The stored tile is the value of "file": hand it to the reader as the bytes a server would send.
        let whole = try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let stored = try JSONSerialization.data(withJSONObject: try #require(whole["file"]))
        let tile = try TileFile.decode(stored)

        #expect(tile.x == expected.x && tile.y == expected.y)
        #expect(tile.border == expected.border)
        #expect(tile.pharmacies.count == expected.pharmacies.count)
        #expect(tile.pharmacies.count == 7)
        for (read, wanted) in zip(tile.pharmacies, expected.pharmacies) {
            #expect(read == wanted, "\(wanted.id)")
        }
    }

    @Test func aFileOfAnotherVersionIsRefused() throws {
        let other = Data(#"{"v":2,"z":10,"x":1,"y":1,"sources":[],"cities":[],"hours":[],"rows":[]}"#.utf8)
        #expect(throws: TileFile.Failure.version) { try TileFile.decode(other) }
    }

    @Test func aRowThatPointsNowhereIsRefused() throws {
        let noSource = Data(#"{"v":1,"z":10,"x":1,"y":1,"sources":[],"cities":[],"hours":[],"rows":[["n1",60.1,24.9,null,null,null,0]]}"#.utf8)
        #expect(throws: TileFile.Failure.rowWithoutSource) { try TileFile.decode(noSource) }

        let source = #"{"country":"FI","zone":"Europe/Helsinki","generated":10,"from":0,"until":691200}"#
        let noHours = Data(#"{"v":1,"z":10,"x":1,"y":1,"sources":[\#(source)],"cities":[],"hours":[],"rows":[["n1",60.1,24.9,null,null,null,0,3]]}"#.utf8)
        #expect(throws: TileFile.Failure.rowWithoutHours) { try TileFile.decode(noHours) }
    }

    @Test func columnsBeyondTheKnownOnesAreIgnored() throws {
        let source = #"{"country":"FI","zone":"Europe/Helsinki","generated":10,"from":0,"until":691200}"#
        let row = #"["n1",60.1,24.9,"Apteekki",null,null,0,null,null,null,null,null,null,null,null,null,"a column of a later version",7]"#
        let tile = try TileFile.decode(Data(#"{"v":1,"z":10,"x":1,"y":1,"sources":[\#(source)],"cities":[],"hours":[],"rows":[\#(row)]}"#.utf8))
        #expect(tile.pharmacies.map(\.name) == ["Apteekki"])
        #expect(tile.pharmacies.first?.hours == .missing)
    }
}
