import Foundation

/// The links a pharmacy's sheet hands off to: the route, the call, the pharmacy's own email
/// and website, and OpenStreetMap's note form. The web's `lib/maps.ts`, with the same answers.
///
/// Each carries what it has to and nothing about the user: the route link has only the
/// pharmacy's position, and the map app uses its own location for the start (PLAN.md 7.6).
enum Handoff {
    /// Beyond this in a straight line a route is not offered as a walk: the map app picks how to get there.
    static let walkLimitMeters = 3000.0

    static func withinWalk(_ meters: Double) -> Bool { meters <= walkLimitMeters }

    /// Directions in Apple Maps to a position. Without `walking` the link names no way of
    /// travel and the map app picks one.
    static func appleDirections(to position: LatLon, walking: Bool = true) -> String {
        "https://maps.apple.com/?daddr=\(degrees(position.lat)),\(degrees(position.lon))\(walking ? "&dirflg=w" : "")"
    }

    /// OpenStreetMap's note form with its marker on a place: anyone can say there what is
    /// wrong, without an account, and a mapper fixes it.
    static func osmNote(at position: LatLon) -> String {
        let lat = degrees(position.lat)
        let lon = degrees(position.lon)
        return "https://www.openstreetmap.org/note/new?lat=\(lat)&lon=\(lon)#map=19/\(lat)/\(lon)"
    }

    /// What a call link dials: the phone number as OpenStreetMap writes it, without its
    /// spaces. Nil when there is no digit in it.
    static func call(_ phone: String) -> String? {
        let number = phone.filter { !$0.isWhitespace }
        return number.contains(where: \.isNumber) ? "tel:\(number)" : nil
    }

    /// A website as the sheet names it: its host, without "www.". Nil for anything that is not a web address.
    static func websiteHost(_ address: String) -> String? {
        guard let components = URLComponents(string: address.trimmingCharacters(in: .whitespacesAndNewlines)),
              let scheme = components.scheme?.lowercased(), scheme == "https" || scheme == "http",
              let host = components.host?.lowercased(), host.contains(".")
        else { return nil }
        return host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
    }

    /// The address a mailto: link may carry: the first one of the tag, when it is an address
    /// and nothing more. OpenStreetMap's value is free text, and a link must not pick up a
    /// subject or a second recipient from it.
    static func emailAddress(_ raw: String) -> String? {
        guard let first = raw.split(whereSeparator: { $0 == ";" || $0 == "," || $0.isWhitespace }).first else { return nil }
        // The web's rule, character for character: a name, an at sign, a domain with a dot in it.
        guard first.wholeMatch(of: /[^\s@?&#%<>"']+@[^\s@?&#%<>"']+\.[^\s@?&#%<>"'.]+/) != nil else { return nil }
        return String(first)
    }

    /// A coordinate in plain decimals, to about a centimetre, without trailing zeros: never
    /// "60.0", and never the "5e-05" a small number would otherwise print as.
    static func degrees(_ value: Double) -> String {
        guard value.isFinite else { return "0" }
        var text = String(format: "%.7f", locale: Locale(identifier: "en_US_POSIX"), value)
        while text.hasSuffix("0") { text.removeLast() }
        if text.hasSuffix(".") { text.removeLast() }
        return text == "-0" ? "0" : text
    }
}
