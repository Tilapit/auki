import SwiftUI
import UIKit

/// The colours of the web's `app/globals.css`, light and dark. One name per role, as there.
enum Palette {
    static let ink = dynamic(0x0B1B31, 0xEAF1F8)
    static let meta = dynamic(0x56657D, 0x8FA2BC)
    static let paper = dynamic(0xF4F8FC, 0x071427)
    static let sheet = dynamic(0xFFFFFF, 0x0B1D38)
    static let selected = dynamic(0xE3EEF6, 0x14315C)
    static let hair = dynamic(0xD5DFEA, 0x1D3A63)
    static let outline = dynamic(0xC5D1DF, 0x2E4C78)

    static let action = dynamic(0x2F5CA6, 0x8BBAEC)
    static let onAction = dynamic(0xFFFFFF, 0x071427)

    /// Open: the text, the glyph, and the glow the glyph has in the dark.
    static let open = dynamic(0x0D6E4F, 0x6EE7B7)
    static let openGlyph = dynamic(0x0F8F63, 0x3DDBA0)
    static let openGlow = Color(red: 61 / 255, green: 219 / 255, blue: 160 / 255, opacity: 0.8)
    /// Closes soon: the text and the outline; the fill is the same amber in both themes.
    static let soon = dynamic(0x8A5A06, 0xF2B544)
    static let soonFill = Color(hex: 0xF2B544)
    static let soonTint = Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: 0xF2B544, alpha: 0.16) : UIColor(hex: 0xFCEFD6) })
    static let closedGlyph = dynamic(0x6B7990, 0x7487A5)

    /// The map's markers.
    static let markerOpen = dynamic(0x0D6E4F, 0x3DDBA0)
    static let markerOpenInk = dynamic(0xFFFFFF, 0x03241A)
    static let markerRing = dynamic(0xFFFFFF, 0x071427)
    static let disc = dynamic(0xFFFFFF, 0x132C52)
    static let discRing = dynamic(0x93A1B5, 0x5A7096)

    /// The app's mark: the lit cross on navy, the same in both themes.
    static let navy = Color(hex: 0x0B1B31)
    static let lit = Color(hex: 0x3DDBA0)
    static let litCore = Color(hex: 0x7FF5C9)

    private static func dynamic(_ light: UInt32, _ dark: UInt32) -> Color {
        Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
    }
}

private extension UIColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
    }
}

private extension Color {
    init(hex: UInt32) {
        self.init(UIColor(hex: hex))
    }
}
