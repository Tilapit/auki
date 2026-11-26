import { BRAND } from '../brand';

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
    route: 'Reitti',
    /** The names of buttons that show "Reitti" begin with that word: a name contains what its control shows (WCAG 2.5.3). */
    routeLabel: (name: string) => `Reitti kävellen: ${name}`,
    /** Too far to walk: the route is handed to the map app without a way of travel. */
    directionsLabel: (name: string) => `Reitti: ${name}`,
    call: 'Soita',
    callLabel: (name: string) => `Soita: ${name}`,
    showAtCounter: 'Näytä apteekissa',
    showAtCounterLabel: (inLanguage: string) => `Näytä apteekissa: apteekkikortti ${inLanguage}`,
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
    apple: 'Reitti Apple Kartoissa',
    handOff: 'Reitti avautuu karttasovelluksessa, ja linkissä on vain apteekin sijainti.',
    source: 'Tiedot: OpenStreetMap.',
    sourceChecked: (date: string) => `Tiedot: OpenStreetMap, aukioloajat tarkistettu ${date}.`,
    /** The way to correct the data: OpenStreetMap's note form at the pharmacy. "{link}" is the link. */
    wrong: 'Väärät tiedot? {link}.',
    fix: 'Korjaa OpenStreetMapissa',
    fixLabel: (name: string) => `Korjaa OpenStreetMapissa: ${name}`,
    backToList: 'Takaisin listaan',
  },
  banner: {
    title: 'Resepti Suomesta?',
    source: 'Lähde: {source}, tarkistettu {date}.',
  },
  counter: {
    title: 'Näytä tämä apteekissa',
    format: 'Reseptin muoto',
    ePrescription: 'E-resepti',
    paper: 'Paperiresepti',
    ifNotFound: 'Jos myyjä ei löydä reseptiä',
    ifRefused: 'Jos myyjä ei hyväksy reseptiä',
    unreviewed: 'Käännös tarkistamatta',
    awake: 'Näyttö pysyy päällä.',
  },
  /**
   * Medicine availability (PLAN.md 7.9). The app never says a pharmacy has a medicine: it says
   * where to check. No medicine is named anywhere in these texts, not even as an example.
   */
  medicine: {
    /** The entry line, under the card and in a pharmacy's details: a question, then the button. */
    ask: 'Etsitkö tiettyä lääkettä?',
    check: 'Tarkista saatavuus',
    title: 'Tarkista lääkkeen saatavuus',
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
