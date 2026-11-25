import SwiftUI

/// The plus with equal arms: the web's `CROSS_PATH`, drawn in a 20 × 20 box.
struct CrossShape: Shape {
    private static let points: [CGPoint] = [
        CGPoint(x: 7.1, y: 1.8), CGPoint(x: 12.9, y: 1.8), CGPoint(x: 12.9, y: 7.1), CGPoint(x: 18.2, y: 7.1),
        CGPoint(x: 18.2, y: 12.9), CGPoint(x: 12.9, y: 12.9), CGPoint(x: 12.9, y: 18.2), CGPoint(x: 7.1, y: 18.2),
        CGPoint(x: 7.1, y: 12.9), CGPoint(x: 1.8, y: 12.9), CGPoint(x: 1.8, y: 7.1), CGPoint(x: 7.1, y: 7.1),
    ]

    func path(in rect: CGRect) -> Path {
        let scale = min(rect.width, rect.height) / 20
        var path = Path()
        path.addLines(Self.points.map { CGPoint(x: rect.minX + $0.x * scale, y: rect.minY + $0.y * scale) })
        path.closeSubpath()
        return path
    }
}

/// The status glyph, the lit cross (PLAN.md section 6). One shape per state, so colour is
/// never the only signal: filled and lit, amber with an outline, an unlit outline, a dashed
/// outline. Always decorative: the status text stands next to it.
struct CrossGlyph: View {
    enum Kind: Equatable, Sendable {
        case open, soon, closed, unknown
    }

    let kind: Kind
    var size: CGFloat = 20

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let scale = size / 20
        Group {
            switch kind {
            case .open:
                CrossShape()
                    .fill(Palette.openGlyph)
                    .overlay(CrossShape().stroke(Palette.openGlyph, style: StrokeStyle(lineWidth: 1.2 * scale, lineJoin: .round)))
                    // In the dark the glow is the lit sign.
                    .shadow(color: colorScheme == .dark ? Palette.openGlow : .clear, radius: 5 * scale)
            case .soon:
                CrossShape()
                    .fill(Palette.soonFill)
                    .overlay(CrossShape().stroke(Palette.soon, style: StrokeStyle(lineWidth: 1.3 * scale, lineJoin: .round)))
            case .closed:
                CrossShape().stroke(Palette.closedGlyph, style: StrokeStyle(lineWidth: 1.75 * scale, lineJoin: .round))
            case .unknown:
                CrossShape().stroke(Palette.closedGlyph, style: StrokeStyle(lineWidth: 1.75 * scale, lineJoin: .round, dash: [2.5 * scale, 2.05 * scale]))
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// The app's mark: the lit cross on navy, as the web's `app/icon.svg`.
struct AppMark: View {
    var size: CGFloat = 64

    var body: some View {
        RoundedRectangle(cornerRadius: size * 9 / 32, style: .continuous)
            .fill(Palette.navy)
            .overlay {
                CrossShape()
                    .fill(Palette.litCore)
                    .overlay(CrossShape().stroke(Palette.lit, style: StrokeStyle(lineWidth: 1.2 * size / 32, lineJoin: .round)))
                    .frame(width: size * 20 / 32, height: size * 20 / 32)
                    .shadow(color: Palette.lit.opacity(0.7), radius: size / 8)
            }
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

/// A status line in its colour: green when open, amber when it closes soon or the hours are uncertain, quiet otherwise.
struct StatusLine: View {
    let row: Row
    let now: Int

    @Environment(\.texts) private var texts

    var body: some View {
        Text(texts.status(row.status, zone: row.pharmacy.zone, now: now))
            .foregroundStyle(color)
    }

    private var color: Color {
        switch row.status {
        case .open, .open24: Palette.open
        case .soon, .uncertain: Palette.soon
        default: Palette.meta
        }
    }
}
