import SwiftUI

/// One pharmacy: its status, the week's opening hours, and the ways on from here. The web's
/// `components/PharmacySheet.tsx` in the system's own parts.
///
/// It is a sheet of its own over the results, as a place card is in Apple's Maps: it opens
/// at half the screen with the map and the picked marker above it, a pull down closes it,
/// and what it holds scrolls only once it is fully up (`ResultsView` sets that up).
///
/// The route and the call are hand-offs. The route link carries only the pharmacy's
/// position: the map app uses its own location for the start (PLAN.md 7.6).
struct PharmacySheet: View {
    let row: Row
    let now: Int
    /// Brings the sheet down to half the screen and the pharmacy into view above it.
    let onShowOnMap: () -> Void
    let onClose: () -> Void

    @Environment(\.texts) private var texts
    @Environment(\.openURL) private var openURL
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .title2) private var glyphSize: CGFloat = 24
    @ScaledMetric(relativeTo: .subheadline) private var labelWidth: CGFloat = 104

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                head
                    .padding(.top, 26)
                summary
                    .padding(.top, 16)
                actions
                    .padding(.top, 18)
                if !facts.isEmpty {
                    Rectangle().fill(Palette.hair).frame(height: 1)
                        .padding(.top, 20)
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(facts) { FactRow(fact: $0, labelWidth: labelWidth, stacked: typeSize.isAccessibilitySize) }
                    }
                    .padding(.vertical, 16)
                    Rectangle().fill(Palette.hair).frame(height: 1)
                }
                footnote
                    .padding(.top, facts.isEmpty ? 20 : 16)
                    .padding(.bottom, 28)
            }
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .tint(Palette.action)
    }

    private var pharmacy: TilePharmacy { row.pharmacy }
    private var name: String { pharmacy.name ?? texts.fallbackName }
    private var walking: Bool { Handoff.withinWalk(row.meters) }

    // MARK: The name, and the way out

    @ViewBuilder
    private var head: some View {
        if typeSize.isAccessibilitySize {
            // With the largest text sizes the close button has a row of its own: the name gets the whole width.
            VStack(alignment: .leading, spacing: 0) {
                closeButton
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(.top, -14)
                title
            }
        } else {
            HStack(alignment: .top, spacing: 8) {
                title
                Spacer(minLength: 0)
                closeButton
                    .padding(.top, -6)
            }
        }
    }

    private var title: some View {
        HStack(alignment: .top, spacing: 12) {
            CrossGlyph(kind: row.glyph, size: glyphSize)
                .padding(.top, 4)
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(Palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("pharmacy-name")
                if let address {
                    Text(address)
                        .font(.subheadline)
                        .foregroundStyle(Palette.meta)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private var closeButton: some View {
        Button(action: onClose) {
            Image(systemName: "xmark")
                .font(.footnote.weight(.bold))
                // The mark stops growing where it would outgrow its disc.
                .dynamicTypeSize(...DynamicTypeSize.accessibility1)
                .foregroundStyle(Palette.ink)
                .frame(width: typeSize.isAccessibilitySize ? 44 : 32, height: typeSize.isAccessibilitySize ? 44 : 32)
                .background(Palette.selected, in: Circle())
                // A finger needs more than thirty-two points.
                .frame(minWidth: 44, minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(texts.close)
        .accessibilityIdentifier("close")
        .padding(.trailing, -6)
    }

    /// The street, and the town when the tile names one.
    private var address: String? {
        let parts = [pharmacy.street, pharmacy.city].compactMap { $0 }
        return parts.isEmpty ? nil : parts.joined(separator: ", ")
    }

    // MARK: Open or closed, and how far

    private var summary: some View {
        HStack(alignment: .bottom, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                StatusLine(row: row, now: now)
                    .font(.body.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true)
                // Hours that are missing or can't be read are the first thing worth correcting.
                if hoursUnknown, let note = URL(string: Handoff.osmNote(at: pharmacy.position)) {
                    Link(texts.fix, destination: note)
                        .font(.subheadline)
                        .accessibilityLabel(texts.fixLabel(name))
                }
                if pharmacy.dispensing == false {
                    Text(texts.noPrescriptions)
                        .font(.footnote)
                        .foregroundStyle(Palette.meta)
                }
                // With the largest text sizes the distance goes under the status, so neither is squeezed.
                if typeSize.isAccessibilitySize {
                    Text(texts.straight(row.meters))
                        .font(.headline)
                        .foregroundStyle(Palette.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            if !typeSize.isAccessibilitySize {
                Spacer(minLength: 12)
                VStack(alignment: .trailing, spacing: 0) {
                    Text(texts.format.distance(row.meters))
                        .font(.title.weight(.bold))
                        .monospacedDigit()
                        .foregroundStyle(Palette.ink)
                    Text(texts.straightLabel)
                        .font(.footnote)
                        .foregroundStyle(Palette.meta)
                }
                .fixedSize()
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(texts.straight(row.meters))
            }
        }
    }

    private var hoursUnknown: Bool {
        switch row.status {
        case .missing, .unparseable, .uncertain: true
        default: false
        }
    }

    // MARK: The route, the call, the map

    private var actions: some View {
        VStack(spacing: 10) {
            if let route = URL(string: Handoff.appleDirections(to: pharmacy.position, walking: walking)) {
                Button {
                    openURL(route)
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: walking ? "figure.walk" : "arrow.triangle.turn.up.right.diamond")
                        Text(texts.appleRoute)
                            .multilineTextAlignment(.leading)
                        Spacer(minLength: 8)
                        // Leaves the app.
                        Image(systemName: "arrow.up.forward.square")
                    }
                    .frame(maxWidth: .infinity, minHeight: 26, alignment: .leading)
                }
                .buttonStyle(PrimaryButtonStyle())
                .accessibilityIdentifier("route")
            }

            // Side by side, and one under the other with the largest text sizes.
            let lower = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(spacing: 10)) : AnyLayout(HStackLayout(spacing: 10))
            lower {
                if let phone = pharmacy.phone, let call = Handoff.call(phone).flatMap(URL.init(string:)) {
                    Button {
                        openURL(call)
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "phone")
                            Text(texts.call)
                        }
                        .frame(maxWidth: .infinity, minHeight: 26)
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    .accessibilityLabel(texts.callLabel(name))
                    .accessibilityIdentifier("call")
                }
                Button(action: onShowOnMap) {
                    Text(texts.showOnMap)
                        .frame(maxWidth: .infinity, minHeight: 26)
                }
                .buttonStyle(SecondaryButtonStyle())
                .accessibilityIdentifier("show-on-map")
            }
        }
    }

    // MARK: What OpenStreetMap knows of it

    private var facts: [Fact] {
        var facts: [Fact] = []

        // The week as a door sign. Hours that are not times are shown as OpenStreetMap writes them.
        var lines = Week.lines(of: pharmacy, now: now).map(texts.weekLine)
        if lines.isEmpty {
            switch row.status {
            case .unparseable(let raw), .uncertain(let raw): if !raw.isEmpty { lines = [raw] }
            default: break
            }
        }
        if !lines.isEmpty { facts.append(Fact(label: texts.hours, lines: lines, digits: true)) }

        if let wheelchair = pharmacy.wheelchair {
            let text = [texts.wheelchair(wheelchair), pharmacy.wheelchairNote].compactMap { $0 }.joined(separator: ". ")
            facts.append(Fact(label: texts.accessibility, lines: [text]))
        }
        if let phone = pharmacy.phone {
            facts.append(Fact(label: texts.phone, lines: [phone], digits: true))
        }
        if let address = pharmacy.email.flatMap(Handoff.emailAddress) {
            facts.append(Fact(label: texts.email, lines: [address], link: URL(string: "mailto:\(address)")))
        }
        if let website = pharmacy.website, let host = Handoff.websiteHost(website) {
            facts.append(Fact(label: texts.website, lines: [host], link: URL(string: website)))
        }
        return facts
    }

    // MARK: Where the route goes, whose data this is, and how to correct it

    private var footnote: some View {
        Text(footnoteText)
            .font(.footnote)
            .foregroundStyle(Palette.meta)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var footnoteText: AttributedString {
        let source = pharmacy.checkDate.map(texts.sourceChecked) ?? texts.source
        var text = AttributedString("\(texts.handOff) \(source) \(texts.wrong) ")
        var fix = AttributedString(texts.fix)
        fix.link = URL(string: Handoff.osmNote(at: pharmacy.position))
        fix.foregroundColor = Palette.action
        fix.underlineStyle = .single
        text.append(fix)
        text.append(AttributedString("."))
        return text
    }
}

/// One fact of a pharmacy: what it is, and its lines.
private struct Fact: Identifiable {
    var label: String
    var lines: [String]
    /// Times and numbers: digits of one width, so the lines stand in columns.
    var digits = false
    /// Where pressing the value leads: the pharmacy's own email or website.
    var link: URL?

    var id: String { label }
}

/// A label on the left and what it names on the right. With the largest text sizes the label stands above.
private struct FactRow: View {
    let fact: Fact
    let labelWidth: CGFloat
    let stacked: Bool

    var body: some View {
        let layout = stacked ? AnyLayout(VStackLayout(alignment: .leading, spacing: 2)) : AnyLayout(HStackLayout(alignment: .firstTextBaseline, spacing: 12))
        layout {
            Text(fact.label)
                .font(.subheadline)
                .foregroundStyle(Palette.meta)
                .frame(width: stacked ? nil : labelWidth, alignment: .leading)
            VStack(alignment: .leading, spacing: 3) {
                ForEach(fact.lines, id: \.self) { line in
                    if let link = fact.link {
                        Link(destination: link) {
                            Text(Self.breakable(line))
                                .multilineTextAlignment(.leading)
                        }
                        .accessibilityLabel(line)
                    } else {
                        Text(line)
                            .foregroundStyle(Palette.ink)
                    }
                }
            }
            .font(fact.digits ? .body.monospacedDigit() : .body)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        // Read as one: "Aukioloajat, Ma–pe 8.00–21.00, …". A fact that is a link stays a link of its own.
        .accessibilityElement(children: fact.link == nil ? .combine : .contain)
    }

    /// An address too long for its line breaks after its at sign or before a dot, and nowhere
    /// else: a hyphen the system put into an email address would read as part of it.
    private static func breakable(_ address: String) -> String {
        address.replacingOccurrences(of: "@", with: "@\u{200B}").replacingOccurrences(of: ".", with: "\u{200B}.")
    }
}
