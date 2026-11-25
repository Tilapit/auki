import SwiftUI

/// The sheet over the map: what is open right now, the pharmacy that leads, the others, the footer.
struct ResultsSheet: View {
    let listing: Listing
    let now: Int
    /// Set when a pharmacy is picked on the map: the list scrolls to its row, once.
    @Binding var scrollTarget: String?
    let onSelect: (Row) -> Void

    @Environment(SearchModel.self) private var model
    @Environment(\.texts) private var texts
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header
                        .padding(.horizontal, 20)
                        .padding(.top, 22)
                        .padding(.bottom, 14)

                    if listing.isStale {
                        StaleNotice(fetched: listing.fetched)
                            .padding(.horizontal, 20)
                            .padding(.bottom, 8)
                    } else {
                        card
                            .padding(.horizontal, 20)
                            .padding(.bottom, 8)
                    }

                    if !listing.others.isEmpty || listing.isStale {
                        HStack(alignment: .firstTextBaseline) {
                            Text(listing.isStale || listing.lead == nil || listing.leadIsFar ? texts.nearest : texts.others)
                                .font(.headline)
                                .foregroundStyle(Palette.ink)
                                .accessibilityAddTraits(.isHeader)
                            Spacer(minLength: 12)
                            Text(texts.byStraight)
                                .font(.footnote)
                                .foregroundStyle(Palette.meta)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 14)
                        .padding(.bottom, 6)

                        ForEach(listing.isStale ? listing.rows : listing.others) { row in
                            PharmacyRow(row: row, now: now, selected: row.id == model.selectedID) { onSelect(row) }
                                .id(row.id)
                        }
                    }

                    SheetFooter(fetched: listing.fetched)
                        .padding(.horizontal, 20)
                        .padding(.top, 18)
                        .padding(.bottom, 28)
                }
            }
            .onChange(of: scrollTarget) { _, target in
                guard let target else { return }
                if reduceMotion {
                    proxy.scrollTo(target, anchor: .center)
                } else {
                    withAnimation { proxy.scrollTo(target, anchor: .center) }
                }
                scrollTarget = nil
            }
        }
        .tint(Palette.action)
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(listing.isStale ? texts.resultsTitle : texts.openNow(listing.openCount))
                    .font(.title3.weight(.bold))
                    .foregroundStyle(Palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
                if let searchedAt = model.searchedAt {
                    Text(texts.updated(searchedAt))
                        .font(.footnote)
                        .foregroundStyle(Palette.meta)
                }
            }
            Spacer(minLength: 8)
            Button {
                Task { await model.search() }
            } label: {
                Group {
                    if model.isRefreshing {
                        ProgressView()
                    } else {
                        Image(systemName: "arrow.clockwise").font(.body.weight(.semibold))
                    }
                }
                .frame(width: 44, height: 44)
                .overlay(Circle().strokeBorder(Palette.outline, lineWidth: 1.5))
            }
            .accessibilityLabel(texts.refresh)
            .disabled(model.isRefreshing)
        }
    }

    /// The card: the nearest open pharmacy. When nothing nearby is open, the one that opens first, and 112.
    @ViewBuilder
    private var card: some View {
        if let lead = listing.lead {
            VStack(alignment: .leading, spacing: 14) {
                LeadCard(label: texts.nearestOpen, row: lead, now: now, selected: lead.id == model.selectedID) { onSelect(lead) }
                if listing.leadIsFar, let first = listing.firstToOpen {
                    Rectangle().fill(Palette.hair).frame(height: 1)
                    LeadCard(label: texts.opensFirst, row: first, now: now, compact: true, selected: first.id == model.selectedID) { onSelect(first) }
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 10) {
                if let first = listing.firstToOpen {
                    LeadCard(label: texts.opensFirst, row: first, now: now, selected: first.id == model.selectedID) { onSelect(first) }
                }
                EmergencyLink()
            }
        }
    }
}

/// The pharmacy the results lead with: its name, how far it is, and its status in words.
private struct LeadCard: View {
    let label: String
    let row: Row
    let now: Int
    var compact = false
    let selected: Bool
    let action: () -> Void

    @Environment(\.texts) private var texts
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .title2) private var glyphSize: CGFloat = 24
    @ScaledMetric(relativeTo: .headline) private var compactGlyphSize: CGFloat = 20

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Palette.meta)
                .accessibilityAddTraits(.isHeader)

            HStack(alignment: .top, spacing: 12) {
                CrossGlyph(kind: row.glyph, size: compact ? compactGlyphSize : glyphSize)
                    .padding(.top, compact ? 3 : 4)
                VStack(alignment: .leading, spacing: 2) {
                    Text(row.pharmacy.name ?? texts.fallbackName)
                        .font(compact ? .headline : .title2.weight(.semibold))
                        .foregroundStyle(Palette.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    if let address {
                        Text(address)
                            .font(.subheadline)
                            .foregroundStyle(Palette.meta)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    // With the largest text sizes the distance goes under the name, so neither is squeezed.
                    if typeSize.isAccessibilitySize {
                        Text(texts.straight(row.meters))
                            .font(.headline)
                            .foregroundStyle(Palette.ink)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 2)
                    }
                }
                if !typeSize.isAccessibilitySize {
                    Spacer(minLength: 12)
                    VStack(alignment: .trailing, spacing: 0) {
                        Text(texts.format.distance(row.meters))
                            .font(compact ? .headline : .title.weight(.bold))
                            .monospacedDigit()
                            .foregroundStyle(Palette.ink)
                        Text(texts.straightLabel)
                            .font(.footnote)
                            .foregroundStyle(Palette.meta)
                    }
                    .fixedSize()
                }
            }
            .accessibilityElement(children: .combine)

            StatusLine(row: row, now: now)
                .font(.body.weight(.semibold))
                .fixedSize(horizontal: false, vertical: true)

            if row.pharmacy.dispensing == false {
                Text(texts.noPrescriptions)
                    .font(.footnote)
                    .foregroundStyle(Palette.meta)
            }

            if !compact {
                Button(action: action) {
                    Text(texts.showOnMap).frame(minHeight: 22)
                }
                .buttonStyle(SecondaryButtonStyle())
                .accessibilityAddTraits(selected ? .isSelected : [])
                // Room above it, so the sheet's lowest place ends under the status line and not on the button's edge.
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
        .onTapGesture(perform: compact ? action : {})
    }

    /// The street, and the town when the tile names one.
    private var address: String? {
        let parts = [row.pharmacy.street, row.pharmacy.city].compactMap { $0 }
        return parts.isEmpty ? nil : parts.joined(separator: ", ")
    }
}

/// One pharmacy of the list: glyph, name, status, distance. Pressing it shows it on the map.
private struct PharmacyRow: View {
    let row: Row
    let now: Int
    let selected: Bool
    let action: () -> Void

    @Environment(\.texts) private var texts
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .body) private var glyphSize: CGFloat = 20

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                CrossGlyph(kind: row.glyph, size: glyphSize)
                    .padding(.top, 2)
                VStack(alignment: .leading, spacing: 2) {
                    name
                        .font(.body)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    StatusLine(row: row, now: now)
                        .font(.subheadline)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    if row.pharmacy.dispensing == false {
                        Text(texts.noPrescriptions)
                            .font(.footnote)
                            .foregroundStyle(Palette.meta)
                    }
                    // With the largest text sizes the distance goes under the status, so neither is squeezed.
                    if typeSize.isAccessibilitySize { distance }
                }
                if !typeSize.isAccessibilitySize {
                    Spacer(minLength: 12)
                    distance.fixedSize()
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .background(selected ? Palette.selected : Color.clear)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Palette.hair).frame(height: 1).padding(.leading, 20 + glyphSize + 12)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityHint(texts.showOnMap)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private var distance: some View {
        Text(texts.format.distance(row.meters))
            .font(.body.weight(.semibold))
            .monospacedDigit()
            .foregroundStyle(Palette.ink)
    }

    /// The name, with the street after it where the name alone doesn't tell pharmacies apart.
    private var name: Text {
        let title = Text(row.pharmacy.name ?? texts.fallbackName).fontWeight(.semibold).foregroundStyle(Palette.ink)
        guard row.showsStreet, let street = row.pharmacy.street else { return title }
        return Text("\(title) \(Text(street).foregroundStyle(Palette.meta))")
    }
}

/// Data older than seven days: nothing is shown as open, and the view says why (PLAN.md 7.4).
private struct StaleNotice: View {
    let fetched: Int?

    @Environment(\.texts) private var texts

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(texts.staleTitle)
                .font(.headline)
            if let fetched {
                Text(texts.staleBody(fetched: fetched))
                    .font(.subheadline)
            }
        }
        .foregroundStyle(Palette.ink)
        .fixedSize(horizontal: false, vertical: true)
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.soonTint, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

/// Under the list: how the distances are measured, whose data it is and from when, 112, and whose project this is.
private struct SheetFooter: View {
    let fetched: Int?

    @Environment(\.texts) private var texts

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(texts.distancesStraight)
            if let fetched {
                Text(texts.fetched(fetched))
            }
            if let licence = URL(string: "https://www.openstreetmap.org/copyright") {
                Link(texts.osm, destination: licence)
            }
            if let emergency = URL(string: "tel:112") {
                Link(texts.emergency, destination: emergency)
            }
            Text(texts.privacy)
            Text(texts.project)
        }
        .font(.footnote)
        .foregroundStyle(Palette.meta)
        .fixedSize(horizontal: false, vertical: true)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
