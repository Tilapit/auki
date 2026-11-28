import type { AppRequest } from '../requests';
import type { Locale } from './index';

/**
 * The texts of the "what the app sends" page (PLAN.md 7.6), Finnish first. In a file of their
 * own: fi.ts and en.ts are part of the first window's JavaScript, and these are read on one page.
 *
 * A text per request of lib/requests.ts, by its id: the page shows the requests the list has,
 * so a text here is on the page only once its request is. Each sentence is a claim that
 * PLAN.md 7.6 makes and a test holds: say nothing here that is not there.
 *
 * The copy rules of fi.ts hold here too. "{host}" is filled with the third party's host, from the list.
 */
const fi = {
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
};

export type PrivacyTexts = typeof fi;

const en: PrivacyTexts = {
  title: 'What the app sends',
  intro: [
    'Your location leaves your device in one request: the one that asks for the walking times and the route. It is not saved on a server.',
    'Your browser talks to two addresses: this site and the server of the map. The app has no accounts, no cookies and no visitor tracking.',
  ],
  requestsTitle: 'Every request',
  requestsIntro:
    'The app makes these requests and no others. Under each name is the address the request has in the browser’s developer tools. The app’s server means this site’s own server, which is rented from the company Vercel.',
  labels: { when: 'When', carries: 'What it carries', receiver: 'Who receives it' },
  onlyPosition: 'The only request that carries your location.',
  requests: {
    page: {
      name: 'The page itself',
      when: 'When you open the app.',
      carries: 'Your IP address and the browser’s usual headers, as in every request on the web. No cookies. No font is fetched from anywhere: the text is drawn in your device’s own typeface.',
      receiver: 'The app’s server.',
    },
    tiles: {
      name: 'The pharmacy data',
      when: 'At every search, and when you move the map to an area whose data is not on your device yet.',
      carries: 'Which squares of the map are needed: around the search, or under the part of the map you moved to. A square is 20 to 30\u00A0km across. The request has the squares’ numbers, never coordinates.',
      receiver: 'The app’s server.',
    },
    geocode: {
      name: 'Place search',
      when: 'When you submit a place search.',
      carries: 'The text you typed and the language of the page.',
      receiver: 'The app’s server, which asks the Nominatim service for the place. Nominatim sees our server, not you. The same name gives the same place, so the answer is cached.',
    },
    wake: {
      name: 'Waking the walking-time service',
      when: 'When the app starts looking for a location: when you press “Show pharmacies near me”, when the location is asked for as the page opens, and when you submit a place search. At most once a minute.',
      carries: 'Nothing: no location, nothing in the address and no body. An IP address and the browser’s headers, as in every other request. By being sent it tells the server that a search has begun, also when no location ever comes.',
      receiver: 'The app’s server, which answers with nothing and asks nobody. The service starts up ahead of time, so that the first walking times are not held up.',
    },
    walking: {
      name: 'Walking times and the route',
      when: 'Once the nearest pharmacies are known. Again when you have walked about 300\u00A0m, at most once in two minutes, and when the route to a selected pharmacy is drawn on the map.',
      carries: 'The location to about a metre (your device’s, or the place you searched for) and the locations of up to 20 pharmacies. They are in the body of the request, not in its address.',
      receiver: 'The app’s server, which passes the locations on to openrouteservice, a routing service, and gets the walking times back. That service sees our server, not you: your IP address is not passed on. Our server neither saves the location nor logs it.',
    },
    mapTiles: {
      name: 'The map',
      when: 'While the map is on screen.',
      carries: 'Which squares of the map are on screen (1 to 2\u00A0km across at the closest) and your IP address.',
      receiver: 'The map’s server, {host}. It is the only outside service your browser talks to.',
    },
    reports: {
      name: 'Other visitors’ reports',
      when: 'The first time you open the details of a pharmacy in a country, or turn on one of the list’s filters. Once per country for as long as the page is open.',
      carries: 'The pharmacy’s country, as its two-letter code. Not the pharmacy, not your location.',
      receiver: 'The app’s server, which reads the reports from our database. The answer is the same for everyone.',
    },
    report: {
      name: 'Your own report',
      when: 'Only when you press “Send” in the report.',
      carries: 'The pharmacy’s OpenStreetMap id, its country and your choices: up to five answers, each a yes or a no. An answer about a prescription also says whether the prescription was from another country, never which one. No location, no text, no medicine.',
      receiver: 'The app’s server, which stores the report in our database (Supabase) with the day. Neither your IP address nor any other trace of your device is stored.',
    },
  },
  linksTitle: 'Links you open yourself',
  linksIntro: 'These are not requests of the app’s: nothing leaves until you press a link. The pages open in a tab of their own, and whoever receives you is not told which page you came from.',
  opened: {
    links: {
      name: 'The route, a call and other sites',
      when: 'When you press a link: the route in Apple Maps or Google Maps, a phone number, a pharmacy’s email or website, OpenStreetMap’s form for corrections, the official pages the app points to, and the map’s credits.',
      carries: 'The pharmacy’s location, or nothing. Never your own location: the map app uses its own.',
      receiver: 'Whoever the link names.',
    },
    medicine: {
      name: 'A medicine’s stock search',
      when: "When you open the link in the “Check a medicine's availability” window.",
      carries: 'The medicine’s name as you typed it, in the link’s address, where the service takes one. Otherwise nothing. No location, no pharmacy.',
      receiver: 'The country’s own service, which the link names. The name does not pass through the app’s server, and the app does not save it.',
    },
  },
  keptTitle: 'What your device keeps',
  keptIntro: 'There are no cookies. Your browser keeps the things below for the app. They are never sent anywhere, and other sites can’t read them. Clearing the site’s data in the browser removes them.',
  stores: { session: 'In this tab, until you close it', local: 'In this browser, until you clear the site’s data' },
  kept: {
    lastSearch: {
      name: 'The last search',
      text: 'The location the search was made for (your device’s, or the place you searched for, with its name), the time, and the walking times that came. With them the results come back when the tab is loaded again, for instance when you return from a map app. It is removed when you go back from the results to the start or search again, and it is not used once it is half an hour old.',
    },
    lastDetail: {
      name: 'The pharmacy you were looking at',
      text: 'The OpenStreetMap id of the pharmacy whose details were on screen.',
    },
    locatedBefore: {
      name: 'A mark of an earlier visit',
      text: '“Show pharmacies near me” has worked in this browser, so the next visit starts with the search. One character: no location, no time.',
    },
    reportsDone: {
      name: 'Today’s reports',
      text: 'The date, and the ids of the pharmacies where you answered the report or passed it over, so that the same visit is not asked about twice. The answers are not kept. The list empties when the day changes.',
    },
    homeCountry: {
      name: 'The country of your prescription',
      text: 'A two-letter country code, if you picked the country yourself. The browser’s own suggestion is worked out again at every visit and is not kept.',
    },
  },
  keptNote: 'Someone holding your unlocked device can read these, as they can read the map on the screen.',
  checkTitle: 'How this is checked',
  checkPolicy: 'The browser enforces the list. The page’s Content-Security-Policy allows connections to this site and the map’s server only, whatever the app’s code tries:',
  checkTest: 'An automated test runs the whole search with an invented location and reads every request. It fails if the location is anywhere but in the body of the walking request, or if any request goes anywhere but to these two addresses. The test runs after every change.',
  checkList: 'This page, the browser’s rule and the test are built from the same list, so they can’t drift apart.',
};

export const privacyTexts: Record<Locale, PrivacyTexts> = { fi, en };
