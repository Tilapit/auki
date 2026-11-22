/**
 * Finnish UI strings. Finnish is written first; en.ts follows this shape.
 * Sentence case, plain verbs, no exclamation marks, no em dashes.
 * "{name}" marks a slot filled with an element (see rich.tsx).
 * Copy rules (CLAUDE.md): "klo 20.45" with a non-breaking space (\u00A0) after "klo" and between
 * a number and its unit; ranges with an en dash and no spaces; decimal comma; quotation marks ”…”.
 */
const fi = {
  meta: {
    title: 'Auki: lähin auki oleva apteekki',
    description: 'Löydä lähin auki oleva apteekki kartalta ja listalta. Sijaintiasi ei tallenneta.',
  },
  app: {
    name: 'Auki',
    otherLanguage: 'In English',
    otherLanguageShort: 'EN',
    otherLanguageLabel: 'Vaihda kieli: English',
    back: 'Takaisin',
    close: 'Sulje',
    fallbackName: 'Apteekki',
  },
  notFound: {
    title: 'Sivua ei löytynyt',
    home: 'Etusivulle',
  },
  footer: {
    project: 'Janne Lapin työhakemusprojekti.',
    notTreat: 'Ei Treat Healthin palvelu.',
    privacy: 'Sijaintiasi ei tallenneta.',
    emergency: 'Hätätilanteessa soita {number}.',
    walking: 'Etäisyydet ovat kävelyreittejä.',
    straight: 'Etäisyydet ovat linnuntietä.',
    data: 'Tiedot: {osm}',
    osm: '© OpenStreetMapin tekijät',
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
    byWalking: 'Kävelymatkan mukaan',
    byStraight: 'Linnuntietä',
    allPharmacies: (count: number) => `Kaikki ${count} apteekkia`,
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
    approximate: 'Sijaintisi on likimääräinen',
    approximateBody: 'Etäisyydet voivat heittää. Tarkemman tuloksen saat hakemalla paikan nimellä.',
    searching: 'Katsotaan, mitkä apteekit ovat auki juuri nyt…',
    searchingShort: 'Haetaan apteekkeja…',
    found: (count: number, name: string, distance: string, status: string) =>
      `Löytyi ${count} apteekkia. Lähin auki: ${name}, ${distance}, ${status}.`,
    foundNoneOpen: (count: number) => `Löytyi ${count} apteekkia. Yksikään ei ole auki juuri nyt.`,
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
    routeLabel: (name: string) => `Kävelyreitti: ${name}`,
    /** Too far to walk: the route is handed to the map app without a way of travel. */
    directionsLabel: (name: string) => `Reitti: ${name}`,
    call: 'Soita',
    callLabel: (name: string) => `Soita: ${name}`,
    showAtCounter: 'Näytä apteekissa',
    showAtCounterLabel: (inLanguage: string) => `Näytä apteekkikortti ${inLanguage}`,
    showDetails: 'Näytä tiedot',
    details: (name: string) => `Näytä tiedot: ${name}`,
  },
  sheet: {
    hours: 'Aukioloajat',
    accessibility: 'Esteettömyys',
    phone: 'Puhelin',
    wheelchair: { yes: 'Esteetön', limited: 'Osittain', no: 'Ei esteetön' },
    days: { daily: 'Joka päivä', 'mo-fr': 'Ma–pe', sa: 'La', su: 'Su', 'sa-su': 'La–su' },
    google: 'Reitti Google Mapsissa',
    apple: 'Reitti Apple Kartoissa',
    handOff: 'Reitti avautuu karttasovelluksessa, ja linkissä on vain apteekin sijainti.',
    source: 'Tiedot: OpenStreetMap.',
    sourceChecked: (date: string) => `Tiedot: OpenStreetMap, aukioloajat tarkistettu ${date}.`,
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
  },
  map: {
    label: 'Kartta: sijaintisi ja lähimmät apteekit',
    legend: 'Karttamerkit',
    zoomIn: 'Lähennä',
    zoomOut: 'Loitonna',
    locate: 'Näytä sijaintini',
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
