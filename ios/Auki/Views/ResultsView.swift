import MapKit
import SwiftUI

/// The results: the map, and over its lower part a sheet with the nearest open pharmacy
/// and the list. The sheet has three places, as on the web: a row, the card, the list.
struct ResultsView: View {
    @Environment(SearchModel.self) private var model
    @Environment(\.texts) private var texts
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase

    @State private var now = AppClock.now()
    @State private var camera: MapCameraPosition = .automatic
    @State private var detent: PresentationDetent = ResultsView.startDetent
    @State private var sheetShown = true
    /// A pharmacy picked on the map: the list scrolls to its row. One picked in the list is already in view.
    @State private var pickedOnMap: String?

    static let peek = PresentationDetent.height(168)

    var body: some View {
        let listing = model.listing(at: now)
        GeometryReader { geometry in
            PharmacyMap(listing: listing, now: now, camera: $camera) { row in
                select(row)
                pickedOnMap = row.id
            }
                // What the sheet covers is not map to look at: framing and the map's own buttons stay above it.
                .safeAreaPadding(.bottom, detent == Self.peek ? 168 : geometry.size.height * 0.5)
        }
        .ignoresSafeArea(.keyboard)
        .sheet(isPresented: $sheetShown) {
            ResultsSheet(listing: listing, now: now, scrollTarget: $pickedOnMap, onSelect: select)
                .presentationDetents([Self.peek, .medium, .large], selection: $detent)
                .presentationBackgroundInteraction(.enabled(upThrough: .medium))
                .presentationDragIndicator(.visible)
                .presentationBackground(Palette.sheet)
                .interactiveDismissDisabled()
        }
        .onAppear { frame(listing) }
        .onChange(of: model.searchedAt) { frame(model.listing(at: now)) }
        .onChange(of: model.selectedID) { show(model.selectedID) }
        // Back from the background: what was on screen may be hours old. Read the clock at once.
        .onChange(of: scenePhase) { if scenePhase == .active { now = AppClock.now() } }
        .task {
            // The statuses turn with the clock: once at every full minute, without a new search.
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(60 - AppClock.now() % 60))
                now = AppClock.now()
            }
        }
    }

    /// A pharmacy picked from the list or the map. The sheet steps aside so the map can show it.
    private func select(_ row: Row) {
        if detent == .large { detent = .medium }
        if model.selectedID == row.id { show(row.id) } else { model.selectedID = row.id }
    }

    /// The map moves to hold the picked pharmacy and the position.
    private func show(_ id: String?) {
        guard let id, let picked = model.listing(at: now).all.first(where: { $0.id == id }) else { return }
        move(to: [model.position, picked.pharmacy.position].compactMap { $0 })
    }

    /// The first view of new results: the position and the pharmacy that leads.
    private func frame(_ listing: Listing) {
        let target = listing.lead ?? listing.firstToOpen ?? listing.rows.first
        move(to: [model.position, target?.pharmacy.position].compactMap { $0 })
    }

    private func move(to points: [LatLon]) {
        guard let position = MapFraming.position(around: points) else { return }
        if reduceMotion {
            camera = position
        } else {
            withAnimation(.easeInOut(duration: 0.35)) { camera = position }
        }
    }

    private static var startDetent: PresentationDetent {
        #if DEBUG
        switch DebugOptions.value("detent") {
        case "peek": return peek
        case "large": return .large
        default: break
        }
        #endif
        return .medium
    }
}

/// The map: Apple's, with the pharmacies as the app's own markers and the device's position as the system draws it.
private struct PharmacyMap: View {
    let listing: Listing
    let now: Int
    @Binding var camera: MapCameraPosition
    let onSelect: (Row) -> Void

    @Environment(SearchModel.self) private var model
    @Environment(\.texts) private var texts

    var body: some View {
        Map(position: $camera) {
            UserAnnotation()
            ForEach(markers) { row in
                Annotation(row.pharmacy.name ?? texts.fallbackName, coordinate: CLLocationCoordinate2D(latitude: row.pharmacy.lat, longitude: row.pharmacy.lon), anchor: .center) {
                    Button {
                        onSelect(row)
                    } label: {
                        MapMarker(kind: row.glyph, selected: row.id == model.selectedID)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(row.pharmacy.name ?? texts.fallbackName), \(texts.status(row.status, zone: row.pharmacy.zone, now: now)), \(texts.straight(row.meters))")
                    .accessibilityAddTraits(row.id == model.selectedID ? .isSelected : [])
                }
                .annotationTitles(row.id == model.selectedID ? .automatic : .hidden)
            }
        }
        // Apple's own points of interest would put a second, unexplained set of pharmacy signs on the map.
        .mapStyle(.standard(pointsOfInterest: .excludingAll))
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
        .overlay(alignment: .topLeading) {
            // The pharmacies are OpenStreetMap's, whatever the map under them is.
            Text(texts.osm)
                .font(.caption2)
                .foregroundStyle(Palette.ink)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                .padding(.leading, 12)
                .padding(.top, 4)
        }
        .accessibilityLabel(texts.map)
    }

    /// Every pharmacy on screen. The open ones last, so they lie on top.
    private var markers: [Row] {
        listing.all.sorted { !$0.status.isOpen && $1.status.isOpen }
    }
}

/// A pharmacy on the map: a disc with the status glyph. Open is the lit one.
private struct MapMarker: View {
    let kind: CrossGlyph.Kind
    let selected: Bool

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let size: CGFloat = selected ? 40 : 30
        ZStack {
            Circle().fill(fill)
            Circle().strokeBorder(ring, lineWidth: kind == .open || kind == .soon ? 2 : 1.5)
            glyph(size * 0.5)
        }
        .frame(width: size, height: size)
        .shadow(color: kind == .open && colorScheme == .dark ? Palette.openGlow.opacity(0.55) : .black.opacity(colorScheme == .dark ? 0 : 0.18), radius: kind == .open && colorScheme == .dark ? 8 : 3, y: kind == .open && colorScheme == .dark ? 0 : 1)
        .overlay {
            if selected { Circle().strokeBorder(Palette.action, lineWidth: 2.5).padding(-4) }
        }
        // A finger needs more than thirty points.
        .frame(width: 44, height: 44)
        .contentShape(Circle())
    }

    private var fill: Color {
        switch kind {
        case .open: Palette.markerOpen
        case .soon: Palette.soonFill
        default: Palette.disc
        }
    }

    private var ring: Color {
        switch kind {
        case .open, .soon: Palette.markerRing
        default: Palette.discRing
        }
    }

    @ViewBuilder
    private func glyph(_ size: CGFloat) -> some View {
        switch kind {
        case .open:
            CrossShape().fill(Palette.markerOpenInk).frame(width: size, height: size)
        case .soon:
            CrossShape().fill(Color(red: 0x3D / 255, green: 0x2A / 255, blue: 0)).frame(width: size, height: size)
        case .closed, .unknown:
            CrossGlyph(kind: kind, size: size)
        }
    }
}

/// Where the map looks: a view that holds the given points with room around them.
enum MapFraming {
    static func position(around points: [LatLon]) -> MapCameraPosition? {
        guard let first = points.first else { return nil }
        var rect = MKMapRect.null
        for point in points {
            let origin = MKMapPoint(CLLocationCoordinate2D(latitude: point.lat, longitude: point.lon))
            rect = rect.union(MKMapRect(origin: origin, size: MKMapSize(width: 0, height: 0)))
        }
        // Never closer than a few blocks, and a quarter of the span as room on every side.
        let least = MKMapPointsPerMeterAtLatitude(first.lat) * 500
        let side = max(rect.size.width, rect.size.height, least)
        let grown = rect.insetBy(dx: -((side - rect.size.width) / 2 + side * 0.25), dy: -((side - rect.size.height) / 2 + side * 0.25))
        return .rect(grown)
    }
}
