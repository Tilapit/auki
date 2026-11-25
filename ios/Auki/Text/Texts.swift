import SwiftUI

/// Every string of the app, Finnish first, then English, side by side: the web's
/// `lib/i18n/fi.ts` and `en.ts` for the views this app has. The wording is the web's where
/// the web has the same line. Sentence case, plain verbs, no exclamation marks.
struct Texts: Sendable {
    let language: Language
    let format: Format

    init(_ language: Language) {
        self.language = language
        self.format = Format(language: language)
    }

    private func pick(_ fi: String, _ en: String) -> String { language == .fi ? fi : en }

    // MARK: The first window

    var headline: String { pick("Löydä lähin auki oleva apteekki", "Find the nearest open pharmacy") }
    var locate: String { pick("Näytä apteekit lähelläni", "Show pharmacies near me") }
    var locating: String { pick("Haetaan sijaintiasi…", "Finding your location…") }
    var searching: String { pick("Haetaan apteekkeja…", "Finding pharmacies…") }

    // MARK: Results

    func openNow(_ count: Int) -> String {
        switch count {
        case 0: pick("Lähistöllä ei ole yhtään apteekkia auki", "No pharmacy nearby is open")
        case 1: pick("Yksi apteekki auki juuri nyt", "One pharmacy open right now")
        default: pick("\(count) apteekkia auki juuri nyt", "\(count) pharmacies open right now")
        }
    }

    var resultsTitle: String { pick("Apteekit lähelläsi", "Pharmacies near you") }
    func updated(_ instant: Int) -> String {
        pick("Päivitetty \(format.time(of: instant))", "Updated at \(format.time(of: instant))")
    }
    var refresh: String { pick("Päivitä sijainti ja tulokset", "Update location and results") }
    var nearestOpen: String { pick("Lähin auki nyt", "Nearest open now") }
    var opensFirst: String { pick("Avautuu ensimmäisenä", "Opens first") }
    var others: String { pick("Muut lähellä", "Others nearby") }
    var nearest: String { pick("Lähimmät apteekit", "Nearest pharmacies") }
    var byStraight: String { pick("Linnuntietä", "In a straight line") }
    var straightLabel: String { pick("linnuntietä", "in a straight line") }
    func straight(_ meters: Double) -> String { "\(format.distance(meters)) \(straightLabel)" }
    var fallbackName: String { pick("Apteekki", "Pharmacy") }
    var noPrescriptions: String { pick("Ei reseptilääkkeitä", "No prescriptions") }
    var map: String { pick("Kartta", "Map") }
    var showOnMap: String { pick("Näytä kartalla", "Show on the map") }

    var approximateTitle: String { pick("Sijaintisi on likimääräinen", "Your location is approximate") }
    var approximateBody: String { pick("Etäisyydet voivat heittää.", "Distances may be off.") }

    var staleTitle: String { pick("Aukiolotiedot ovat vanhentuneet", "The opening hours are out of date") }
    func staleBody(fetched instant: Int) -> String {
        pick(
            "Tiedot haettiin \(format.day(of: instant)) eikä niistä voi enää päätellä, mikä on auki juuri nyt. Soita apteekkiin ennen kuin lähdet.",
            "The data was fetched on \(format.day(of: instant)). It is too old to tell what is open right now. Call the pharmacy before you go."
        )
    }

    // MARK: A pharmacy's status

    func status(_ status: HoursStatus, zone: String, now: Int, deviceZone: String = TimeZone.current.identifier) -> String {
        // Across a border the times are the pharmacy's own, and the line says so.
        let local = Zone.offset(at: now, zone: zone) != Zone.offset(at: now, zone: deviceZone)
        func onItsClock(_ line: String) -> String { local ? pick("\(line) paikallista aikaa", "\(line) local time") : line }

        switch status {
        case .open(let closes) where closes - now >= Config.noClosingInSightSeconds:
            return open24
        case .open(let closes):
            let time = format.clockShort(LocalMoment(now: now, instant: closes, zone: zone, closing: true).time)
            return onItsClock(pick("Auki \(time) asti", "Open until \(time)"))
        case .soon(let closes):
            let time = format.clockShort(LocalMoment(now: now, instant: closes, zone: zone, closing: true).time)
            return onItsClock(pick("Sulkeutuu pian, \(time)", "Closes soon, \(time)"))
        case .open24:
            return open24
        case .closed(let opens?):
            let when = opensWhen(LocalMoment(now: now, instant: opens, zone: zone))
            return onItsClock(pick("Kiinni, avautuu \(when)", "Closed, opens \(when)"))
        case .closed(nil):
            return pick("Kiinni", "Closed")
        case .missing:
            return pick("Aukioloaikoja ei ole merkitty", "Hours not listed")
        case .unparseable(let raw):
            return pick("Aukioloajat epäselvät: ”\(raw)”", "Hours unclear: “\(raw)”")
        case .uncertain(let raw):
            return raw.isEmpty ? pick("Aukioloajat epävarmat", "Hours uncertain") : pick("Aukioloajat epävarmat (”\(raw)”)", "Hours uncertain (“\(raw)”)")
        case .stale:
            return pick("Aukioloajat voivat olla vanhentuneet", "Hours may be out of date")
        }
    }

    private var open24: String { pick("Auki ympäri vuorokauden", "Open 24 hours") }

    /// When a closed pharmacy opens: "klo 9", "huomenna klo 9", "ma klo 9".
    func opensWhen(_ moment: LocalMoment) -> String {
        let time = format.clockShort(moment.time)
        switch moment.day {
        case .today: return time
        case .tomorrow: return pick("huomenna \(time)", "tomorrow \(time)")
        default: return "\(weekday(moment.day)) \(time)"
        }
    }

    private func weekday(_ day: DayLabel) -> String {
        switch day {
        case .mo: pick("ma", "Mon")
        case .tu: pick("ti", "Tue")
        case .we: pick("ke", "Wed")
        case .th: pick("to", "Thu")
        case .fr: pick("pe", "Fri")
        case .sa: pick("la", "Sat")
        case .su: pick("su", "Sun")
        case .today, .tomorrow: ""
        }
    }

    // MARK: When something is in the way

    var retry: String { pick("Yritä uudelleen", "Try again") }
    var openSettings: String { pick("Avaa Asetukset", "Open Settings") }

    func title(of problem: Problem) -> String {
        switch problem {
        case .denied: pick("Sijainti on estetty tältä sovellukselta", "Location access is off for this app")
        case .unavailable: pick("Laitteesi ei löytänyt sijaintiasi", "Your device couldn't find your location")
        case .timeout: pick("Sijainnin haku kestää liian kauan", "Finding your location is taking too long")
        case .offline: pick("Ei verkkoyhteyttä", "You're offline")
        case .failed: pick("Apteekkien haku ei onnistunut juuri nyt", "Couldn't load pharmacies right now")
        case .none: pick("OpenStreetMapissa ei ole apteekkeja 50\(Format.nbsp)kilometrin säteellä", "No pharmacies within 50\(Format.nbsp)kilometres in OpenStreetMap")
        case .notCovered: pick("\(Brand.name) ei vielä kata tätä maata", "\(Brand.name) doesn't cover this country yet")
        }
    }

    func body(of problem: Problem) -> String? {
        switch problem {
        case .denied: pick("Voit sallia sen Asetuksista.", "You can allow it in Settings.")
        case .unavailable: pick("Tarkista, että laitteen sijaintipalvelut ovat päällä.", "Check that location services are on for your device.")
        case .timeout: nil
        case .offline: pick("Yritä uudelleen, kun yhteys palaa. Kadulla apteekin tunnistaa vihreästä valorististä.", "Try again when the connection returns. On the street, a pharmacy is the lit green cross.")
        case .failed: pick("Vika on palvelussa, ei laitteessasi. Yritä hetken päästä uudelleen.", "The fault is in the service, not your device. Try again in a moment.")
        case .none, .notCovered: nil
        }
    }

    // MARK: The footer

    var emergency: String { pick("Hätätilanteessa soita 112", "In an emergency, call 112") }
    var distancesStraight: String { pick("Etäisyydet ovat linnuntietä.", "Distances are straight lines.") }
    func fetched(_ instant: Int) -> String {
        // A Finnish date ends in a full stop of its own ("22.11."): no second one after it.
        pick("Tiedot: OpenStreetMap, haettu \(format.day(of: instant))", "Data: OpenStreetMap, fetched \(format.day(of: instant)).")
    }
    var osm: String { pick("© OpenStreetMapin tekijät", "© OpenStreetMap contributors") }
    var privacy: String { pick("Sijaintiasi ei tallenneta.", "Your location is not saved.") }
    var project: String { pick("Janne Lapin työhakemusprojekti. Ei Treat Healthin palvelu.", "A job application project by Janne Lappi. Not affiliated with Treat Health.") }
}

private struct TextsKey: EnvironmentKey {
    static let defaultValue = Texts(.current)
}

extension EnvironmentValues {
    var texts: Texts {
        get { self[TextsKey.self] }
        set { self[TextsKey.self] = newValue }
    }
}
