import Foundation

/// One pharmacy as a row shows it at one moment.
struct Row: Identifiable, Equatable, Sendable {
    var pharmacy: TilePharmacy
    /// Straight-line distance from the position searched from. I1 has no walking times.
    var meters: Double
    var status: HoursStatus
    /// True when the street tells it apart from another pharmacy of the same name, or it has no name.
    var showsStreet = false

    var id: String { pharmacy.id }

    /// Which of the four glyph shapes the status gets. Shape, not colour, carries the state.
    var glyph: CrossGlyph.Kind {
        switch status {
        case .open, .open24: .open
        case .soon: .soon
        case .closed: .closed
        default: .unknown
        }
    }
}

/// What the results show at one moment: the pharmacies found, each with its status at
/// `now`, and which of them leads. Pure: the views build one every minute from what the
/// search found, so a status changes on screen without a new search.
struct Listing: Equatable, Sendable {
    /// Every pharmacy found nearby, nearest first.
    var rows: [Row]
    /// The nearest one that is open now: among the rows, or else the farther one the wider search found.
    var lead: Row?
    /// True when the lead is not one of the rows: nothing nearby is open and it is farther away.
    var leadIsFar = false
    /// When nothing nearby is open: the row that opens first.
    var firstToOpen: Row?
    /// How many of the rows are open now.
    var openCount: Int
    /// True when none of the data may be read any more (older than seven days, or outside its
    /// window). Then nothing reads open, and the view says how old the data is.
    var isStale: Bool
    /// When the oldest data on screen was fetched from OpenStreetMap.
    var fetched: Int?

    init(found: [Found], farOpen: Found? = nil, now: Int) {
        var names: [String: Int] = [:]
        for entry in found { names[entry.pharmacy.name?.lowercased() ?? "", default: 0] += 1 }

        rows = found.map { entry in
            let key = entry.pharmacy.name?.lowercased() ?? ""
            return Row(
                pharmacy: entry.pharmacy,
                meters: entry.meters,
                status: HoursStatus.of(entry.pharmacy, now: now),
                showsStreet: entry.pharmacy.name == nil || (names[key] ?? 0) > 1
            )
        }
        openCount = rows.filter(\.status.isOpen).count
        isStale = !rows.isEmpty && rows.allSatisfy { $0.status == .stale }
        fetched = found.map(\.pharmacy.generated).min()

        if let nearestOpen = rows.first(where: \.status.isOpen) {
            lead = nearestOpen
        } else if let farOpen, case let status = HoursStatus.of(farOpen.pharmacy, now: now), status.isOpen {
            // The far one was open when it was found. It leads only for as long as it still is.
            lead = Row(pharmacy: farOpen.pharmacy, meters: farOpen.meters, status: status, showsStreet: true)
            leadIsFar = true
        }

        if openCount == 0 {
            firstToOpen = rows
                .compactMap { row -> (Row, Int)? in
                    if case .closed(let opens?) = row.status { return (row, opens) }
                    return nil
                }
                .min { $0.1 != $1.1 ? $0.1 < $1.1 : $0.0.meters < $1.0.meters }?
                .0
        }
    }

    /// Every pharmacy on screen: the rows, and the farther open one when it leads.
    var all: [Row] {
        guard leadIsFar, let lead else { return rows }
        return rows + [lead]
    }

    /// The rows under the card: everything but the pharmacy the card already shows.
    var others: [Row] {
        guard let lead, !leadIsFar else { return rows }
        return rows.filter { $0.id != lead.id }
    }
}
