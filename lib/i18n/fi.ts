import { BRAND } from '../brand';
import type { AppRequest } from '../requests';

/**
 * Finnish UI strings. Finnish is written first; en.ts follows this shape.
 * Sentence case, plain verbs, no exclamation marks, no em dashes.
 * "{name}" marks a slot filled with an element (see rich.tsx).
 * Copy rules (CLAUDE.md): "klo 20.45" with a non-breaking space (\u00A0) after "klo" and between
 * a number and its unit; ranges with an en dash and no spaces; decimal comma; quotation marks ”…”.
 * The product's name comes from lib/brand.ts and is never written out here.
 */
const fi = {
  meta: {
    title: `${BRAND}: lähin auki oleva apteekki`,
    description: 'Löydä lähin auki oleva apteekki kartalta ja listalta. Sijaintiasi ei tallenneta palvelimelle.',
  },
  app: {
    name: BRAND,
    otherLanguage: 'In English',
    otherLanguageShort: 'EN',
    /**
     * The name of the round language link, which shows only "EN". It starts with what is shown
     * (WCAG 2.5.3), and it is in the other language, like the link's own `lang`.
     */
    otherLanguageLabel: 'EN: In English',
    back: 'Takaisin',
    close: 'Sulje',
    /** Read out after the name of a link that leaves the app: it opens in a tab of its own. */
    newTab: '(avautuu uuteen välilehteen)',
    fallbackName: 'Apteekki',
  },
  notFound: {
    title: 'Sivua ei löytynyt',
    home: 'Etusivulle',
  },
  footer: {
    project: 'Janne Lapin työhakemusprojekti.',
    notTreat: 'Ei Treat Healthin palvelu.',
    // Not "ei tallenneta" alone: the tab itself keeps its last search until it is closed (lib/session.ts).
    privacy: 'Sijaintiasi ei tallenneta palvelimelle.',
    emergency: 'Hätätilanteessa soita {number}.',
    walking: 'Etäisyydet ovat kävelyreittejä.',
    straight: 'Etäisyydet ovat linnuntietä.',
    data: 'Tiedot: {osm}',
    osm: '© OpenStreetMapin tekijät',
    /** The results footer: when the data was fetched, and the way to the data page. */
    // A Finnish date ends in a full stop of its own ("22.11."): no second one after it.
    fetched: 'Tiedot: OpenStreetMap, haettu {date} {about}',
    aboutData: 'Tietoa aineistosta',
    /** After the privacy sentence in the results footer: the way to the page that lists every request. */
    aboutPrivacy: 'Mitä sovellus lähettää',
    /** At home the prescription banner is not shown: this brings it up, for a prescription from another country. */
    prescription: 'Resepti toisesta maasta?',
  },
  first: {
    headline: 'Löydä lähin auki oleva apteekki',
    locate: 'Näytä apteekit lähelläni',
    search: 'Hae paikan nimellä',
    locating: 'Haetaan sijaintiasi…',
    waiting: 'Odotetaan sijaintilupaa',
    waitingHint: 'Salli sijainti selaimen kysymyksessä.',
  },
  search: {
    title: 'Hae paikan nimellä',
    label: 'Paikka',
    placeholder: 'Esim. Kamppi tai Riika',
    submit: 'Hae',
    retry: 'Yritä uudelleen',
    finding: 'Haetaan paikkaa…',
    notFound: {
      title: (query: string) => `Paikkaa ”${query}” ei löytynyt`,
      body: 'Tarkista kirjoitusasu tai kokeile lähintä kaupunkia.',
    },
    failed: {
      title: 'Paikan haku ei onnistunut juuri nyt',
      body: 'Vika on palvelussa, ei laitteessasi. Yritä hetken päästä uudelleen.',
    },
    offline: {
      title: 'Ei verkkoyhteyttä',
      body: 'Paikan haku tarvitsee yhteyden. Yritä uudelleen, kun yhteys palaa.',
    },
    how: 'Näin sallit sijainnin',
    steps: [
      'iPhone ja iPad: avaa osoiterivin sivuvalikko, valitse Verkkosivuston asetukset ja salli Sijainti.',
      'Android: napauta osoiterivin alussa olevaa kuvaketta, valitse Käyttöoikeudet ja salli Sijainti.',
      'Tietokone: napsauta osoiterivin alussa olevaa kuvaketta ja salli Sijainti.',
      'Lataa sivu sen jälkeen uudelleen.',
    ],
    denied: {
      title: 'Sijainti on estetty tältä sivulta',
      body: 'Voit sallia sen selaimen asetuksista.',
    },
    unavailable: {
      title: 'Laitteesi ei löytänyt sijaintiasi',
      body: 'Tarkista, että laitteen sijaintipalvelut ovat päällä.',
    },
    timeout: {
      title: 'Sijainnin haku kestää liian kauan',
      body: 'Yritä uudelleen tai hae paikan nimellä.',
    },
    unsupported: {
      title: 'Tämä selain ei anna sijaintia tälle sivulle',
      body: 'Hae paikan nimellä.',
    },
  },
  results: {
    title: 'Apteekit lähelläsi',
    /** The heading says what is true at this moment, not what the page is. */
    openNow: (count: number, night: boolean) =>
      count === 0
        ? 'Lähistöllä ei ole yhtään apteekkia auki'
        : count === 1
          ? night
            ? 'Yksi apteekki auki tähän aikaan yöstä'
            : 'Yksi apteekki auki juuri nyt'
          : `${count} apteekkia auki juuri nyt`,
    openAt: (count: number) => (count === 0 ? 'Ei yhtään auki klo\u00A0{time}' : `${count} auki klo\u00A0{time}`),
    opensFirst: 'Avautuu ensimmäisenä',
    /** One line in the collapsed sheet, under a far open pharmacy. */
    opensFirstWhen: (when: string) => `Avautuu ensimmäisenä ${when}`,
    placeUpdated: '{place}. Päivitetty klo\u00A0{time}.',
    updated: 'Päivitetty klo\u00A0{time}',
    /** Shown instead of a place name when the results don't agree on a city. */
    nearYou: 'Lähelläsi',
    refresh: 'Päivitä sijainti ja tulokset',
    nearestOpen: 'Lähin auki nyt',
    others: 'Muut lähellä',
    /** The list's heading when no card stands above it. */
    nearest: 'Lähimmät apteekit',
    byWalking: 'Kävelymatkan mukaan',
    byStraight: 'Linnuntietä',
    allPharmacies: (count: number) => `Kaikki ${count} apteekkia`,
    /** The phone's sheet handle says what a press does: from the row to the card, from the card to the list, and back down. */
    showMore: 'Näytä lisää',
    showLess: 'Näytä vähemmän',
    expandSheet: 'Näytä lista',
    collapseSheet: 'Pienennä lista',
    closedNow: 'Kiinni nyt',
    closedCount: (count: number) => `${count} apteekkia lähistöllä`,
    closedFirstOpens: (count: number, when: string) => `${count} apteekkia, ensimmäinen avautuu ${when}`,
    /** When the one that opens first is already named in the card above. */
    closedOthers: (count: number) => `${count} muuta apteekkia`,
    show: 'Näytä',
    hide: 'Piilota',
    closerClosed: (count: number) => `Lähemmät ${count} apteekkia ovat kiinni.`,
    mostOpenTomorrow: (range: string) => `Useimmat avautuvat huomenna klo\u00A0${range}.`,
    /**
     * Hours coverage (provisional, DESIGN-LOG.md): most of the nearest pharmacies have hours we
     * can't read. The nearest of them leads the card, and nothing is said about what is open.
     */
    nearestUnlisted: 'Lähin apteekki',
    unlistedTitle: 'Lähimpien apteekkien aukioloaikoja ei tiedetä',
    unlistedShort: 'Aukioloaikoja ei tiedetä',
    /** How many nearby pharmacies it is true of, the one in the card included. */
    unlistedNearby: (count: number) =>
      count === 1 ? 'Apteekki voi silti olla auki.' : `Lähistöllä on ${count} apteekkia, joiden aukioloaikoja ei tiedetä. Osa niistä voi olla auki.`,
    unlistedCall: 'Soita ennen kuin lähdet.',
    unlistedNoPhone: 'Lähimmän puhelinnumeroa ei ole merkitty, joten sen aukiolo selviää vain paikan päällä.',
    /** The nearest pharmacy whose hours say it is open, as a line under the card. */
    knownOpen: 'Lähin, jonka tiedetään olevan auki: {name}, {details}.',
    /** The same as a row of the card: this as its title, the pharmacy and how far under it. */
    knownOpenTitle: 'Lähin, jonka tiedetään olevan auki',
    /** The same in the collapsed sheet. */
    knownOpenShort: (name: string) => `Tiedetään olevan auki: ${name}`,
    /** The country's share of pharmacies with opening hours in OpenStreetMap, before the link to the data page. */
    hoursListed: (country: string, share: string) => `${country}: aukioloajat on merkitty ${share}:lle apteekeista.`,
    /** Under an open pharmacy, when nearer ones have hours we can't read: it is the nearest we know of. */
    closerUnknown: (count: number) =>
      count === 1 ? 'Lähempänä on yksi apteekki, jonka aukioloaikoja ei tiedetä.' : `Lähempänä on ${count} apteekkia, joiden aukioloaikoja ei tiedetä.`,
    approximate: 'Sijaintisi on likimääräinen',
    approximateBody: 'Etäisyydet voivat heittää.',
    searching: 'Katsotaan, mitkä apteekit ovat auki juuri nyt…',
    searchingShort: 'Haetaan apteekkeja…',
    found: (count: number, name: string, distance: string, status: string) =>
      `Löytyi ${count} apteekkia. Lähin auki: ${name}, ${distance}, ${status}.`,
    foundNoneOpen: (count: number) => `Löytyi ${count} apteekkia. Yksikään ei ole auki juuri nyt.`,
    foundUnlisted: (count: number, unknown: number) =>
      unknown === 1 ? `Löytyi ${count} apteekkia. Lähimmän aukioloaikoja ei tiedetä.` : `Löytyi ${count} apteekkia. Lähistöllä on ${unknown} apteekkia, joiden aukioloaikoja ei tiedetä.`,
    /** Data older than seven days: nothing is shown as open (PLAN.md 7.4). */
    staleTitle: 'Aukiolotiedot ovat vanhentuneet',
    staleBody: (date: string) => `Tiedot haettiin ${date} eikä niistä voi enää päätellä, mikä on auki juuri nyt. Soita apteekkiin ennen kuin lähdet.`,
    staleShort: 'Aukiolotiedot vanhentuneet',
    foundStale: (count: number) => `Löytyi ${count} apteekkia. Aukiolotiedot ovat vanhentuneet.`,
    /** Near the edge of the coverage: what is missing from the results. */
    missingOne: (country: string) => `${country} ei ole vielä mukana: sen apteekkeja ei näy tässä.`,
    missingMany: (countries: string) => `${countries} eivät ole vielä mukana: niiden apteekkeja ei näy tässä.`,
    searchElsewhere: 'Hae toinen paikka',
  },
  status: {
    openUntil: (time: string) => `Auki ${time} asti`,
    closesSoon: (time: string) => `Sulkeutuu pian, ${time}`,
    open24: 'Auki ympäri vuorokauden',
    closed: 'Kiinni',
    closedOpens: (when: string) => `Kiinni, avautuu ${when}`,
    tomorrow: (time: string) => `huomenna ${time}`,
    onDay: (day: string, time: string) => `${day} ${time}`,
    weekdays: { mo: 'ma', tu: 'ti', we: 'ke', th: 'to', fr: 'pe', sa: 'la', su: 'su' },
    missing: 'Aukioloaikoja ei ole merkitty',
    unparseable: (raw: string) => `Aukioloajat epäselvät: ”${raw}”`,
    uncertain: (raw: string) => `Aukioloajat epävarmat (”${raw}”)`,
    stale: 'Aukioloajat voivat olla vanhentuneet',
    /** Added when the pharmacy keeps another clock than the device. */
    localTime: (line: string) => `${line} paikallista aikaa`,
    noPrescriptions: 'Ei reseptilääkkeitä',
    legend: { open: 'Auki', soon: 'Sulkeutuu pian', closed: 'Kiinni', unknown: 'Ajat ei tiedossa' },
  },
  card: {
    walking: (distance: string) => `${distance} kävellen`,
    straight: (distance: string) => `${distance} linnuntietä`,
    straightLabel: 'linnuntietä',
    arrive: 'Perillä',
    closes: 'Sulkeutuu',
    slack: (duration: string) => `${duration} pelivaraa`,
    arriveCloses: 'Perillä {arrive}, sulkeutuu {closes}',
    tooLate: 'Et ehdi ennen sulkemista',
    tooLateDetail: 'Sulkeutuu {closes}, olisit perillä {arrive}.',
    nextOpen: 'Seuraava auki',
    outOfStock: 'Ei varastossa? Seuraava auki: {name}, {details}.',
    /** The same as a row of the card and the sheet: this as its title, the pharmacy and how far under it. */
    outOfStockTitle: 'Ei varastossa? Seuraava auki',
    route: 'Reitti',
    /** The names of buttons that show "Reitti" begin with that word: a name contains what its control shows (WCAG 2.5.3). */
    routeLabel: (name: string) => `Reitti kävellen: ${name}`,
    /** Too far to walk: the route is handed to the map app without a way of travel. */
    directionsLabel: (name: string) => `Reitti: ${name}`,
    call: 'Soita',
    callLabel: (name: string) => `Soita: ${name}`,
    showAtCounter: 'Näytä apteekissa',
    showAtCounterLabel: (inLanguage: string) => `Näytä apteekissa: apteekkikortti ${inLanguage}`,
    /** Under "Näytä apteekissa" in its row: what is shown, and in which language. */
    counterCardIn: (inLanguage: string) => `Apteekkikortti ${inLanguage}`,
    showDetails: 'Näytä tiedot',
    details: (name: string) => `Näytä tiedot: ${name}`,
  },
  sheet: {
    hours: 'Aukioloajat',
    accessibility: 'Esteettömyys',
    phone: 'Puhelin',
    email: 'Sähköposti',
    website: 'Verkkosivu',
    wheelchair: { yes: 'Esteetön', limited: 'Osittain', no: 'Ei esteetön' },
    /** The week's hours, equal days grouped: "Joka päivä 8.00–24.00", "Ma–pe 8.00–21.00", "Su suljettu". */
    everyDay: 'Joka päivä',
    closedDay: 'suljettu',
    allDay: 'ympäri vuorokauden',
    unknownDay: 'ei tiedossa',
    google: 'Reitti Google Mapsissa',
    /** Under "Reitti" on the route button: where it opens. With the word above it, it reads as the line above. */
    googleIn: 'Google Mapsissa',
    apple: 'Reitti Apple Kartoissa',
    /** The same under "Reitti" where the button opens Apple's map app: on an iPhone, an iPad and a Mac. */
    appleIn: 'Apple Kartoissa',
    handOff: 'Reitti avautuu karttasovelluksessa, ja linkissä on vain apteekin sijainti.',
    source: 'Tiedot: OpenStreetMap.',
    sourceChecked: (date: string) => `Tiedot: OpenStreetMap, aukioloajat tarkistettu ${date}.`,
    /** The way to correct the data: OpenStreetMap's note form at the pharmacy. "{link}" is the link. */
    wrong: 'Väärät tiedot? {link}.',
    fix: 'Korjaa OpenStreetMapissa',
    fixLabel: (name: string) => `Korjaa OpenStreetMapissa: ${name}`,
    backToList: 'Takaisin listaan',
  },
  /**
   * The prescription banner (PLAN.md section 8). What it says of a pair of countries is in
   * data/countries/: here only its own words. It never names a medicine.
   */
  banner: {
    title: 'Resepti kotimaasta?',
    home: 'Reseptin maa',
    choose: 'Valitse maa',
    other: 'Muu maa',
    ask: 'Valitse maa, jossa reseptisi on kirjoitettu, niin näet, käykö se täällä.',
    electronic: 'Sähköinen resepti',
    paper: 'Paperinen resepti',
    /** The research trip was made with prescriptions from Finland: every line of it is shown under these words. */
    field: 'Suomalaisella reseptillä.',
    pharmacist: 'Jos ensimmäinen vastaus on ei, pyydä farmaseuttia.',
    more: 'Lisätiedot ja lähteet',
    required: 'Paperisessa reseptissä pitää olla vähintään:',
    sources: 'Lähteet',
    pageDated: 'Sivu päivitetty {updated}, luettu {checked}.',
    pageRead: 'Luettu {checked}.',
    read: 'Viralliset lähteet luettu {date}.',
  },
  counter: {
    title: 'Näytä tämä apteekissa',
    format: 'Reseptin muoto',
    ePrescription: 'E-resepti',
    paper: 'Paperiresepti',
    doctorSends: 'Lääkäri lähettää',
    ifNotFound: 'Jos myyjä ei löydä reseptiä',
    ifRefused: 'Jos myyjä ei hyväksy reseptiä',
    unreviewed: 'Käännös tarkistamatta',
    awake: 'Näyttö pysyy päällä.',
  },
  /**
   * Anonymous pharmacy reports (PLAN.md 7.10). Offered as a row in a pharmacy's details, never
   * asked. Every chip is a plain statement about the visit, and no medicine is named.
   */
  report: {
    /** The row: a question, and under it what pressing it does. */
    rowTitle: 'Kävitkö täällä?',
    rowAction: 'Kerro, miten meni',
    skip: 'Ohita',
    skipLabel: (name: string) => `Ohita kysymys käynnistä: ${name}`,
    title: 'Miten käynti meni?',
    intro: 'Valitse ne, jotka pitävät paikkansa. Jokainen on vapaaehtoinen.',
    /** Each topic: its name and the two chips. The first chip's words are also how the topic is told as a fact. */
    topics: {
      prescription: { label: 'Resepti', yes: 'Resepti kävi', no: 'Resepti ei käynyt' },
      english: { label: 'Englanti', yes: 'Englantia puhuttiin', no: 'Englantia ei puhuttu' },
      stock: { label: 'Lääke', yes: 'Lääke oli varastossa', no: 'Lääkettä ei ollut' },
      shortWait: { label: 'Jono', yes: 'Lyhyt jono', no: 'Pitkä jono' },
      stepFree: { label: 'Sisäänkäynti', yes: 'Esteetön sisäänkäynti', no: 'Portaita tai kynnys' },
    },
    /** Asked under the prescription's two chips, once one of them is pressed. Not which country. */
    foreign: { question: 'Oliko resepti toisesta maasta?', yes: 'Kyllä', no: 'Ei' },
    send: 'Lähetä',
    sending: 'Lähetetään',
    chooseOne: 'Valitse ainakin yksi.',
    /** Under the buttons: exactly what is stored, and what is not. */
    privacy: 'Ilmoitus on nimetön. Siitä tallennetaan apteekki, valintasi ja päivä. Sijaintia, lääkkeen nimeä tai laitteesi osoitetta ei tallenneta.',
    failed: 'Lähetys ei onnistunut. Yritä uudelleen.',
    limit: 'Tästä apteekista on tänään jo paljon ilmoituksia, joten tätä ei tallennettu.',
    thanks: 'Kiitos. Ilmoituksesi on tallennettu.',
    /** What others told: shown from three reports on, with the count and the days they came. */
    summaryTitle: 'Kävijöiden ilmoituksia',
    summaryMeta: (count: string, days: string) => `${count} ilmoitusta, ${days}. Nimettömiä, ei tarkistettuja.`,
    /** One fact of the summary: what was said, and by how many of those who answered it. "Englantia puhuttiin, 4/5 käyntiä". */
    fact: (said: string, yes: string, of: string) => `${said}, ${yes}/${of} käyntiä`,
    /** The same for prescriptions that visitors said were from another country. */
    foreignSaid: 'Toisen maan resepti kävi',
    /** Where the service answered and the pharmacy has fewer than three reports. True of none, one and two. */
    none: 'Ei vielä näytettäviä ilmoituksia. Ne näkyvät tässä, kun niitä on kolme.',
    /** /dev/states only: on a summary made of invented reports. */
    example: 'Esimerkkiaineistoa: nämä ilmoitukset on keksitty.',
    /** The list's two filters, each named as the fact it asks for, and what stands in the list's place when nothing passes. */
    filters: 'Näytä vain apteekit, joista kävijät kertovat',
    filterNone: 'Ei vielä ilmoituksia, joiden mukaan näistä apteekeista voisi valita.',
    filterFailed: 'Kävijöiden ilmoituksia ei saatu haettua.',
    filterOff: 'Näytä kaikki apteekit',
  },
  /**
   * Medicine availability (PLAN.md 7.9). The app never says a pharmacy has a medicine: it says
   * where to check. No medicine is named anywhere in these texts, not even as an example.
   */
  medicine: {
    /** The entry line, under the card and in a pharmacy's details: a question, then the button. */
    title: 'Tarkista lääkkeen saatavuus',
    /** The same action on a button of the main row, where the whole name has no room. */
    short: 'Lääkkeen saatavuus',
    label: 'Lääkkeen nimi',
    /** Under the link, when its address carries the name. "{site}" is the host, as the address bar will show it. */
    sent: 'Nimi siirtyy laitteeltasi suoraan sivustolle {site}, kun avaat linkin. Sitä ei lähetetä tämän sovelluksen palvelimelle eikä tallenneta.',
    /** The same place, for a service whose address takes no name: there is no field then. */
    nothingSent: 'Linkissä ei ole lääkkeen nimeä. Kirjoita se palvelun omaan hakuun: tämä sovellus ei kysy eikä näe sitä.',
    confirm: 'Varastotieto on palvelun oma, eikä tämä sovellus näe sitä. Varmista apteekista ennen kuin lähdet.',
    /** After a service's own sentence, when not every pharmacy of the country reports to it. */
    coverage: {
      most: 'Mukana ovat useimmat apteekit, eivät kaikki.',
      some: 'Mukana on vain osa apteekeista.',
      chain: 'Mukana ovat vain ketjun omat apteekit.',
    },
    /**
     * One entry per provider of lib/stock/providers.ts, by its id. Names of services are not
     * translated. `hint`: what the service's search goes by. `note`: what else the user should
     * know before leaving; "{date}" is the day the provider was checked.
     */
    services: {
      apteekkiFi: {
        site: 'apteekki.fi',
        intro: 'Suomessa lääkkeen saatavuuden apteekeittain näyttää Lääkehaku, jota ylläpitää Suomen Apteekkariliitto.',
        hint: 'Lääkehaku hakee valmisteen nimellä tai Vnr-numerolla. Kirjoita pelkkä nimi, ilman vahvuutta.',
        open: 'Avaa apteekki.fi',
      },
      ihreApotheken: {
        site: 'ihreapotheken.de',
        intro: 'Saksassa ei ole kaikkien apteekkien yhteistä varastohakua. IhreApotheken.de on palvelu, jossa lääkkeen voi varata valitsemastaan apteekista.',
        open: 'Avaa ihreapotheken.de',
      },
      apoApp: {
        site: 'apothekerkammer.at',
        intro: 'Itävallassa lääkkeen saatavuuden apteekeittain näyttää ApoApp, Itävallan apteekkarikamarin sovellus. Verkossa hakua ei ole.',
        note: 'Suomen App Storessa sovellusta ei ole (tarkistettu {date}).',
        open: 'Avaa apothekerkammer.at',
      },
      apotekNo: {
        site: 'apotek.no',
        intro: 'Norjassa ei ole kaikkien apteekkien yhteistä varastohakua. Norjan apteekkiyhdistyksen sivu neuvoo, miten reseptilääkkeen saatavuus tarkistetaan apteekkiketjujen omilta sivuilta.',
        open: 'Avaa apotek.no',
      },
      /** Iceland, in Norway's form: what the medicines agency says on Ísland.is, and its page for patients. */
      islandIs: {
        site: 'island.is',
        intro: 'Islannin lääkevirasto kertoo, ettei sillä ole ajantasaista tietoa apteekkien varastoista. Viraston englanninkielinen sivu neuvoo, mitä tehdä, kun lääkettä ei saa apteekista: henkilökunta voi tarkistaa, onko sitä toisessa apteekissa.',
        note: 'Sivulta pääsee viraston lääkeluetteloon, josta näkee, onko lääkkeestä ilmoitettu saatavuushäiriö.',
        open: 'Avaa island.is',
      },
      /** Not offered yet: waits for Lif's linking agreement (lib/stock/providers.ts). */
      fass: {
        site: 'fass.se',
        intro: 'Ruotsissa lääkkeen saatavuuden apteekeittain näyttää Fass, jota ylläpitää lääketeollisuuden järjestö Lif.',
        open: 'Avaa fass.se',
      },
    },
    /** Live stock through a provider: the seam of PLAN.md 7.9. Shown in /dev/states only, with invented figures. */
    stock: {
      example: 'Esimerkkiaineistoa',
      exampleNote: 'Tältä varastotieto näyttäisi, jos palvelu antaisi sen sovellukselle. Luvut on keksitty.',
      levels: { inStock: 'Varastossa', low: 'Vähän jäljellä', out: 'Ei varastossa', unknown: 'Ei tietoa' },
      /** Whose claim it is, and from when. */
      source: 'Tieto: {site}, klo\u00A0{time}',
    },
  },
  problem: {
    retry: 'Yritä uudelleen',
    mapApps: 'Apteekkeja voi hakea myös {google} tai {apple}.',
    googleSearch: 'Google Mapsista',
    appleSearch: 'Apple Kartoista',
    mapQuery: 'apteekki',
    none: {
      title: 'OpenStreetMapissa ei ole apteekkeja 50\u00A0kilometrin säteellä',
      body: 'Hae toista paikkaa. Jos tiedät apteekin, joka puuttuu kartalta, voit lisätä sen.',
      add: 'Lisää apteekki OpenStreetMapiin',
    },
    offline: {
      title: 'Ei verkkoyhteyttä',
      body: 'Haku jatkuu itsestään, kun yhteys palaa. Kadulla apteekin tunnistaa vihreästä valorististä.',
    },
    error: {
      title: 'Apteekkien haku ei onnistunut juuri nyt',
      body: 'Vika on palvelussa, ei laitteessasi. Yritä hetken päästä uudelleen.',
    },
    notCovered: {
      title: `${BRAND} ei vielä kata tätä maata`,
      /** When the country is known. */
      named: (country: string) => `${country} ei ole vielä mukana.`,
      covered: (countries: string) => `Mukana ovat ${countries}.`,
    },
  },
  data: {
    title: 'Mistä apteekkitiedot tulevat',
    intro: 'Apteekit ja niiden aukioloajat tulevat OpenStreetMapista. Tiedot haetaan joka yö, ja aukioloajat lasketaan valmiiksi kahdeksalle päivälle. Alla on viimeisimmän haun tulos maittain.',
    caption: 'Apteekkitiedot maittain',
    // \u00AD is a soft hyphen: the headings break there on a narrow screen, with or without a hyphenation dictionary in the browser.
    columns: { country: 'Maa', pharmacies: 'Apteek\u00ADkeja', withHours: 'Aukiolo\u00ADajat merkitty', parsed: 'Ajat luettu', fetched: 'Haettu viimeksi' },
    /** Under the country heading on a narrow screen, where the time sits under each country's name. */
    fetchedShort: 'haettu viimeksi',
    all: 'Kaikki',
    kept: 'aiempi haku',
    /** When the pipeline last ran. A Finnish date and time need no full stop after them here. */
    lastRun: 'Viimeisin haku: {time}',
    keptNote: (countries: string) => `Ei päivittynyt viimeisimmässä haussa: ${countries}. Tiedot ovat silloin edelliseltä onnistuneelta haulta, ja rivillä näkyy sen aika.`,
    explain: [
      'Aukioloajat merkitty: kuinka monella apteekilla on aukioloajat OpenStreetMapissa.',
      'Missä osuus on pieni, useimmat apteekit näkyvät tuloksissa merkinnällä ”Aukioloaikoja ei ole merkitty”. Aukioloaikoja ei arvata: soita silloin apteekkiin ennen kuin lähdet.',
      'Ajat luettu: kuinka moni merkityistä aukioloajoista on kirjoitettu niin, että ohjelma osaa lukea ne. Loput näytetään sellaisinaan.',
      'Yli seitsemän päivää vanhojen tietojen perusteella yhtään apteekkia ei näytetä avoimena.',
    ],
    fix: 'Väärät tai puuttuvat tiedot korjataan OpenStreetMapissa. Korjaus näkyy täällä seuraavan yön jälkeen.',
    loading: 'Haetaan lukuja…',
    failed: 'Lukujen haku ei onnistunut juuri nyt.',
    licence: 'Aineisto: {osm}, lisenssi ODbL.',
    back: 'Takaisin apteekkihakuun',
    /** The name of the wordmark as a link: the name it shows, then where it leads. */
    home: `${BRAND}: takaisin apteekkihakuun`,
  },
  /**
   * The "what the app sends" page (PLAN.md 7.6). A text per request of lib/requests.ts, by its id:
   * the page shows the requests the list has, so a text here is on the page only once its request is.
   * Each sentence is a claim that PLAN.md 7.6 makes and a test holds: say nothing here that is not there.
   */
  privacy: {
    title: 'Mitä sovellus lähettää',
    intro: [
      'Sijaintisi lähtee laitteeltasi yhdessä pyynnössä: siinä, jolla sovellus kysyy kävelyajat ja reitin. Sijaintia ei tallenneta palvelimelle.',
      'Selaimesi on yhteydessä kahteen osoitteeseen: tähän sivustoon ja karttapohjan palvelimeen. Sovelluksessa ei ole tiliä, evästeitä eikä kävijäseurantaa.',
    ],
    requestsTitle: 'Jokainen pyyntö',
    requestsIntro:
      'Sovellus tekee nämä pyynnöt eikä muita. Nimen alla on osoite, jolla pyyntö näkyy selaimen kehittäjätyökaluissa. Sovelluksen palvelin tarkoittaa tämän sivuston omaa palvelinta, joka on vuokrattu Vercel-yhtiöltä.',
    labels: { when: 'Milloin', carries: 'Mitä siinä kulkee', receiver: 'Kuka sen saa' },
    /** Under the one request whose `carries` in the list is the exact position. */
    onlyPosition: 'Ainoa pyyntö, jossa sijaintisi on.',
    requests: {
      page: {
        name: 'Sivu itse',
        when: 'Kun avaat sovelluksen.',
        carries: 'IP-osoitteesi ja selaimen tavalliset otsaketiedot, kuten jokaisessa verkkopyynnössä. Ei evästeitä. Kirjasimia ei haeta mistään: teksti piirretään laitteesi omalla kirjasimella.',
        receiver: 'Sovelluksen palvelin.',
      },
      tiles: {
        name: 'Apteekkitiedot',
        when: 'Jokaisella haulla, ja kun siirrät kartan alueelle, jonka tietoja laitteellasi ei vielä ole.',
        carries: 'Mitkä kartan ruudut tarvitaan: haun ympäriltä tai siltä alueelta, jolle siirsit kartan. Ruutu on 20–30 km leveä. Pyynnössä on ruutujen numerot, ei koordinaatteja.',
        receiver: 'Sovelluksen palvelin.',
      },
      geocode: {
        name: 'Paikan haku nimellä',
        when: 'Kun lähetät paikkahaun.',
        carries: 'Kirjoittamasi teksti ja sivun kieli.',
        receiver: 'Sovelluksen palvelin, joka kysyy paikan Nominatim-palvelulta. Nominatim näkee palvelimemme, ei sinua. Sama nimi antaa saman paikan, joten vastaus pidetään välimuistissa.',
      },
      // The wake-up of the walking function (PLAN.md 7.1, step 4): on the page once lib/requests.ts lists the request, and not before.
      wake: {
        name: 'Kävelyaikapalvelun herätys',
        when: 'Kun sovellus alkaa hakea sijaintia: kun painat ”Näytä apteekit lähelläni”, kun sijainti kysytään heti sivun avautuessa ja kun lähetät paikkahaun. Enintään kerran minuutissa.',
        carries: 'Ei mitään: ei sijaintia, ei mitään osoitteessa eikä rungossa. IP-osoite ja selaimen otsaketiedot kuten muissakin pyynnöissä. Pyyntö kertoo palvelimelle, että haku on alkanut, silloinkin kun sijaintia ei koskaan tule.',
        receiver: 'Sovelluksen palvelin, joka vastaa tyhjällä eikä kysy keneltäkään. Palvelu käynnistyy valmiiksi, jotta ensimmäiset kävelyajat eivät viivästy.',
      },
      walking: {
        name: 'Kävelyajat ja reitti',
        when: 'Kun lähimmät apteekit on löydetty. Uudelleen, kun olet kävellyt noin 300 m, enintään kerran kahdessa minuutissa, ja kun valitun apteekin reitti piirretään kartalle.',
        carries: 'Sijainti noin metrin tarkkuudella (laitteesi sijainti tai hakemasi paikka) ja enintään 20 apteekin sijainnit. Ne ovat pyynnön rungossa, eivät sen osoitteessa.',
        receiver: 'Sovelluksen palvelin, joka välittää sijainnit openrouteservice-palvelulle ja saa siltä kävelyajat. Se näkee palvelimemme, ei sinua: IP-osoitettasi ei välitetä. Palvelimemme ei tallenna sijaintia eikä kirjaa sitä lokiin.',
      },
      mapTiles: {
        name: 'Karttapohja',
        when: 'Kun kartta on näkyvissä.',
        carries: 'Mitkä kartan ruudut ovat näytöllä (lähimmillään 1–2 km leveitä) ja IP-osoitteesi.',
        receiver: 'Karttapohjan palvelin {host}. Se on ainoa ulkopuolinen palvelu, johon selaimesi on yhteydessä.',
      },
      reports: {
        name: 'Muiden kävijöiden ilmoitukset',
        when: 'Kun avaat ensimmäisen kerran jonkin maan apteekin tiedot tai otat listan suodattimen käyttöön. Kerran maata kohti niin kauan kuin sivu on auki.',
        carries: 'Apteekin maa kahden kirjaimen tunnuksena. Ei apteekkia, ei sijaintia.',
        receiver: 'Sovelluksen palvelin, joka lukee ilmoitukset tietokannastamme. Vastaus on kaikille sama.',
      },
      report: {
        name: 'Oma ilmoituksesi',
        when: 'Vain kun painat ilmoituksessa ”Lähetä”.',
        carries: 'Apteekin OpenStreetMap-tunnus, sen maa ja valintasi: enintään viisi vastausta, kukin kyllä tai ei. Reseptiä koskevan vastauksen mukana kulkee se, oliko resepti toisesta maasta, ei koskaan mistä maasta. Ei sijaintia, ei tekstiä, ei lääkettä.',
        receiver: 'Sovelluksen palvelin, joka tallentaa ilmoituksen tietokantaamme (Supabase) päivän tarkkuudella. IP-osoitetta tai muuta jälkeä laitteestasi ei tallenneta.',
      },
    } satisfies Record<AppRequest['id'] | 'wake', { name: string; when: string; carries: string; receiver: string }>,
    linksTitle: 'Linkit, jotka avaat itse',
    linksIntro: 'Nämä eivät ole sovelluksen pyyntöjä: mitään ei lähde ennen kuin napautat linkkiä. Sivut avautuvat omaan välilehteensä, eikä vastaanottaja saa tietää, miltä sivulta tulit.',
    opened: {
      links: {
        name: 'Reitti, puhelu ja muut sivustot',
        when: 'Kun napautat linkkiä: reitti Apple Kartoissa tai Google Mapsissa, puhelinnumero, apteekin sähköposti tai verkkosivu, OpenStreetMapin korjauslomake, viralliset sivut, joihin sovellus viittaa, ja kartan tekijätiedot.',
        carries: 'Apteekin sijainti tai ei mitään. Ei koskaan sinun sijaintiasi: karttasovellus käyttää omaa paikannustaan.',
        receiver: 'Se, jonka linkki nimeää.',
      },
      medicine: {
        name: 'Lääkkeen saatavuushaku',
        when: 'Kun avaat linkin ikkunasta ”Tarkista lääkkeen saatavuus”.',
        carries: 'Lääkkeen nimi sellaisena kuin kirjoitit sen, linkin osoitteessa, jos palvelu ottaa nimen vastaan. Muuten ei mitään. Ei sijaintia, ei apteekkia.',
        receiver: 'Maan oma palvelu, jonka linkki nimeää. Nimi ei kulje sovelluksen palvelimen kautta, eikä sovellus tallenna sitä.',
      },
    },
    keptTitle: 'Mitä laitteesi säilyttää',
    keptIntro: 'Evästeitä ei ole. Selaimesi säilyttää sovellusta varten alla olevat tiedot. Niitä ei lähetetä minnekään, eivätkä muut sivustot voi lukea niitä. Ne poistuvat, kun tyhjennät sivuston tiedot selaimesta.',
    stores: { session: 'Tässä välilehdessä, kunnes suljet sen', local: 'Tässä selaimessa, kunnes tyhjennät sivuston tiedot' },
    kept: {
      lastSearch: {
        name: 'Viimeisin haku',
        text: 'Sijainti, jolle haku tehtiin (laitteesi sijainti tai hakemasi paikka nimineen), hakuaika ja saadut kävelyajat. Niiden avulla tulokset palaavat, kun välilehti ladataan uudelleen, esimerkiksi kun palaat karttasovelluksesta. Tieto poistuu, kun palaat tuloksista alkuun tai teet uuden haun, eikä sitä käytetä puolen tunnin jälkeen.',
      },
      lastDetail: {
        // Not "auki ollut": in this app "auki" is what a pharmacy is.
        name: 'Katsottu apteekki',
        text: 'Sen apteekin OpenStreetMap-tunnus, jonka tiedot olivat esillä.',
      },
      locatedBefore: {
        name: 'Merkki aiemmasta käynnistä',
        text: '”Näytä apteekit lähelläni” on toiminut tässä selaimessa, joten seuraava käynti alkaa suoraan hausta. Yksi merkki: ei sijaintia, ei aikaa.',
      },
      reportsDone: {
        name: 'Tämän päivän ilmoitukset',
        text: 'Päivämäärä ja niiden apteekkien tunnukset, joiden kohdalla vastasit ilmoitukseen tai ohitit sen, jotta samasta käynnistä ei kysytä kahdesti. Vastauksia ei säilytetä. Lista tyhjenee, kun päivä vaihtuu.',
      },
      homeCountry: {
        name: 'Reseptisi maa',
        text: 'Kahden kirjaimen maatunnus, jos valitsit maan itse. Selaimen oma ehdotus lasketaan joka käynnillä uudelleen, eikä sitä säilytetä.',
      },
    },
    keptNote: 'Se, jolla on lukitsematon laitteesi käsissään, voi lukea nämä tiedot, kuten hän voi lukea kartankin näytöltä.',
    checkTitle: 'Miten tämä tarkistetaan',
    /** Followed by the policy's own line, from lib/requests.ts. */
    checkPolicy: 'Selain valvoo listaa. Sivun Content-Security-Policy sallii yhteydet vain tähän sivustoon ja karttapohjan palvelimeen, mitä tahansa sovelluksen koodi yrittääkin:',
    checkTest: 'Automaattinen testi käy koko haun läpi keksityllä sijainnilla ja lukee jokaisen pyynnön. Se epäonnistuu, jos sijainti on missään muualla kuin kävelyaikapyynnön rungossa tai jos jokin pyyntö menee muualle kuin näihin kahteen osoitteeseen. Testi ajetaan jokaisen muutoksen jälkeen.',
    checkList: 'Tämä sivu, selaimen sääntö ja testi rakennetaan samasta listasta, joten ne eivät voi erota toisistaan.',
  },
  map: {
    label: 'Kartta: sijaintisi ja lähimmät apteekit',
    legend: 'Karttamerkit',
    zoomIn: 'Lähennä',
    zoomOut: 'Loitonna',
    locate: 'Näytä sijaintini',
    backToPlace: 'Palaa haettuun paikkaan',
    /** The map's canvas, for a screen reader: it can be moved with the arrow keys. */
    canvas: 'Kartta',
    failed: 'Karttapohja ei latautunut. Lista ja merkit toimivat ilman sitä.',
    attribution: '© OpenStreetMapin tekijät',
    edge: (name: string, time: string, direction: string) =>
      `Seuraava auki: ${name}, ${time}, kartan ulkopuolella ${direction}`,
    edgeNearest: (name: string, distance: string, direction: string) =>
      `Lähin auki: ${name}, ${distance}, kartan ulkopuolella ${direction}`,
    directions: {
      n: 'pohjoisessa',
      ne: 'koillisessa',
      e: 'idässä',
      se: 'kaakossa',
      s: 'etelässä',
      sw: 'lounaassa',
      w: 'lännessä',
      nw: 'luoteessa',
    },
  },
};

export default fi;
