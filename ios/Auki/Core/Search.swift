import Foundation

/// A pharmacy and its straight-line distance from the position searched from.
struct Found: Equatable, Sendable {
    var pharmacy: TilePharmacy
    var meters: Double
}

/// Finding the nearest pharmacies through tiles (`docs/tiles.md`, "Finding the nearest"):
/// `searchStep` of the web's `lib/tiles.ts`, checked by `tests/vectors/search.json`.
enum Search {
    struct Step: Equatable, Sendable {
        /// The nearest matches among the tiles loaded so far, nearest first.
        var nearest: [Found]
        /// Tiles to load before asking again. Empty when the answer is final.
        var need: [TileRef]
        var done: Bool { need.isEmpty }
    }

    /// One step of the search. Call it, load the tiles it needs, and call it again until it is
    /// done. It asks for a tile only while that tile could still hold something nearer than
    /// what is already found, so the answer equals a search through every pharmacy there is.
    ///
    /// - Parameters:
    ///   - count: how many to find.
    ///   - radius: how far to look, in metres.
    ///   - loaded: the tiles loaded so far.
    ///   - failed: tiles that were asked for and can't be had: they are not asked for again.
    ///   - batch: at most this many tiles are asked for at once.
    ///   - accept: only pharmacies that pass count.
    static func step(
        from position: LatLon,
        count: Int,
        radius: Double,
        grid: Grid,
        loaded: [TileRef: [TilePharmacy]],
        failed: Set<TileRef> = [],
        batch: Int = 4,
        accept: ((TilePharmacy) -> Bool)? = nil
    ) -> Step {
        var matches: [Found] = []
        for pharmacies in loaded.values {
            for pharmacy in pharmacies {
                if let accept, !accept(pharmacy) { continue }
                let meters = Geo.distanceMeters(position, pharmacy.position)
                if meters <= radius { matches.append(Found(pharmacy: pharmacy, meters: meters)) }
            }
        }
        matches.sort { a, b in a.meters != b.meters ? a.meters < b.meters : a.pharmacy.id < b.pharmacy.id }
        let nearest = Array(matches.prefix(count))

        // Nothing farther than the last of a full list can change it.
        let reach = count > 0 && nearest.count == count ? nearest[count - 1].meters : radius
        let need = Tiles.tiles(within: reach, of: position)
            .map(\.tile)
            .filter { grid.hasTile($0) && loaded[$0] == nil && !failed.contains($0) }
            .prefix(batch)

        return Step(nearest: nearest, need: Array(need))
    }
}
