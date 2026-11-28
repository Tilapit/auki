# The duty pharmacy: who is open when the others are closed, country by country

Read on 28 November 2026, for the duty-pharmacy lookup of M6 (PLAN.md sections 5 and 8.1). In many countries pharmacies take turns at night, on Sundays and on holidays, and OpenStreetMap's opening hours don't show whose turn it is. Where an official page says so, the app points to the country's own lookup instead of saying that nothing is open.

This file is the evidence. What the app does with it is in `data/countries/duty.ts`, and PLAN.md section 5 says where a card shows it.

## The rule

A claim is what an official page said on the day it was read, and nothing else. Official means the pharmacists' chamber or association, a ministry, a medicines agency, the state's health or citizen portal, or the law as one of them publishes it. Never a list from an app, a chain or a news site.

- **Entered as `rotating`:** an official page says in words that pharmacies take turns, or publishes a list that names other pharmacies for one date than for the next.
- **Entered as `fixed`:** an official page says that named pharmacies have set, long hours. The app then shows nothing more: their hours are hours like any other.
- **Not entered:** everything else. Where a page only makes it likely, or where no page could be opened, the app says nothing. "Not found" below means not found in this round, not that nothing exists.
- No country is filled from another.

## How it was checked

- Three research runs read the pages of ten or eleven countries each, through a fetch tool that hands a page to a small model and returns its answer. Their quotes can come back shortened.
- So for every country that is entered, I fetched the page again with `curl` and searched the page's own text for the sentence. Two documents are PDFs (Portugal's regulation and one Austrian district's): their text was read out of the files. Every quote under "Entered" below was found in the page's text that way.
- The countries under "Read, and not entered" rest on the research runs alone, except where a line says I checked it.
- No form was sent, nothing was logged in to, and no lookup was searched. Whether a lookup gives the right pharmacy for a place was not tried: the app only links to it.
- A site that refused the fetch was not tried again and not worked around.

## The answer in one table

| Country | What an official page says | In the app |
|---|---|---|
| Germany (DE) | Turns, by a duty calendar | **Lookup** aponet.de, **number** 0800 00 22 8 33 |
| Austria (AT) | About 265 pharmacies on duty each night; one district's regulation names the order | **Lookup** apothekerkammer.at. No number (see below) |
| Spain (ES) | Duty by province, "at each moment" | **Lookup** farmaceuticos.com |
| Greece (GR) | Turns by law; the tables hang on closed pharmacies | **One line**: a closed pharmacy posts the one on duty. No lookup covers the country |
| France (FR) | Turns ("par roulement") | **Lookup** 3237.fr, **number** 3237 at 0,35 € a minute |
| Belgium (BE) | Every pharmacy takes part in the rota | **Lookup** pharmacie.be |
| Luxembourg (LU) | A list of nine pharmacies per date, other ones the next day | **Lookup** pharmacie.lu |
| Slovakia (SK) | Rotas by region and district | **Lookup** e-vuc.sk, which leads to each region's list |
| Hungary (HU) | A duty order; every pharmacy shows the nearest one on duty | **One line**: a closed pharmacy posts the one on duty. The finder could not be opened |
| Cyprus (CY) | A dated list of day-duty pharmacies by district | **One line** that pharmacies take turns. The list is files, not a search |
| Malta (MT) | A roster for Sundays, public holidays and Saturdays | **Lookup** medicinesauthority.gov.mt |
| Portugal (PT) | Rosters of turns by law, posted in every pharmacy | **One line**: a closed pharmacy posts the one on duty. No lookup found |
| Denmark (DK) | The state assigns duty to named pharmacies with set hours | **Nothing**, on purpose: `fixed` |
| Switzerland, Liechtenstein, Italy, the Netherlands, Ireland, Sweden, Norway, Finland, Iceland, Poland, Czechia, Slovenia, Croatia, Romania, Bulgaria, Estonia, Latvia, Lithuania | Not found in words, or not readable | **Nothing.** See "Read, and not entered" |

## Entered

### Germany (DE)

- **Turns.** aponet.de, whose imprint names ABDA (Bundesvereinigung Deutscher Apothekerverbände e.V.) as publisher and whose header reads "Das offizielle Gesundheitsportal der deutschen ApothekerInnen": "Ein Notdienstkalender regelt die Reihenfolge, wann welche Apotheke Dienst hat." https://www.aponet.de/notdienstsuche (the address `/apotheke/notdienstsuche` leads there). The page shows no date.
- **Lookup.** The same page: "Offizielle Liste aller Apotheken, die jetzt in Ihrer Nähe Notdienst haben." and "Diese Suche [...] basiert auf den offiziellen Daten der Bundesapothekerkammer." It has an English text at its foot. Results need the page's own search.
- **Number.** The federal health portal, https://gesund.bund.de/apotheken ("Geprüft durch die Bundesvereinigung Deutscher Apothekerverbände e. V. (ABDA). Stand: 13.01.2025"): "Kostenlos über das Festnetz unter der 0800 00 22 8 33", "Kostenpflichtig über das Mobiltelefon unter der 22 8 33". ABDA's own page gives the mobile price: "(69 Cent pro Minute/SMS)", https://www.abda.de/apotheke-in-deutschland/was-apotheken-leisten/immer-erreichbar-sein/apotheken-finden/. The app offers the first number and says what the portal says of it: free from a landline.
- **Door.** The federal health portal: "An den Apotheken gibt es Aushänge mit Informationen zu den nächstgelegenen Notdienst-Apotheken." The research run also read the rule itself, Apothekenbetriebsordnung § 23, on gesetze-im-internet.de.

### Austria (AT)

- **Turns.** No national page uses a word for "in turn". What the Chamber of Pharmacists says: "Mit der neuen Apothekensuche finden Sie ganz einfach die nächste dienstbereite Apotheke in Ihrer Nähe" (https://www.apothekerkammer.at/apothekensuche), and in a release of 22 December 2020: "Jede Nacht haben in Österreich rund 265 Apotheken Bereitschaftsdienst." and "Welche Apotheke aktuell Dienst versieht, erfährt man telefonisch unter 1455" (https://www.apothekerkammer.at/presse/apotheken-auch-zu-den-feiertagen-geoeffnet).
- The order of turns is set district by district under § 8 Abs. 5 Apothekengesetz. One such regulation, in force since 1 January 2026, was read from its PDF: the pharmacies "haben außerhalb ihrer Kernöffnungszeiten [...] täglich um 8:00 Uhr wechselnd in nachfolgend beschriebener Reihenfolge Notfallbereitschaft zu versehen" (Verordnungsblatt der Bezirkshauptmannschaft Amstetten, 19.11.2025, § 2), https://ris.bka.gv.at/Dokumente/Bvb/BVB_NI_AM_20251119_8/BVB_NI_AM_20251119_8.pdf
- This is the weakest of the entered countries: a national statement of how many are on duty and that one asks which, and one district's regulation that names the order.
- **Lookup.** https://www.apothekerkammer.at/apothekensuche, the Chamber's own. The national health portal sends people there: "Zur Apothekensuche (Apothekerkammer)", https://www.gesundheit.gv.at/service/gesundheitssuche/apothekensuche.html
- **Number: not entered.** 1455 is printed on the 2020 release ("jeden Tag, 24 Stunden lang, aus ganz Österreich zum Ortstarif") and on no current page that was found: not on the Chamber's search page and not on the health portal's. A number from a six-year-old page is not offered to someone at night.
- **Door.** Not national. The Amstetten regulation has it for its district (§ 4).

### Spain (ES)

- **Turns.** The General Council of the Colleges of Pharmacists: "Con solo seleccionar tu provincia, podrás conocer qué farmacias están de servicio en cada momento", https://www.farmaceuticos.com/farmacias-de-guardia/ (footer: "© 2026 Consejo General de Colegios Oficiales de Farmacéuticos"). The law leaves the rules to the regions: pharmacies serve "sin perjuicio del cumplimiento de los horarios oficiales y normas sobre guardias, vacaciones, urgencias [...] fijadas por las Comunidades Autónomas" (Ley 16/1997, artículo 6.1, https://www.boe.es/buscar/act.php?id=BOE-A-1997-9022).
- The research run read one province's list, which speaks of a "cambio de turno en el servicio de guardia" (A Coruña, https://www.cofc.es/farmacia/index).
- **Lookup.** The Council's page above. One chooses a province and is handed over to that province's own list, which differs from province to province. No English.
- **Number, door.** None found.

### Greece (GR)

- **Turns.** Law 1963/1991, article 9, as the Panhellenic Pharmaceutical Association quotes it in a letter of 4 November 2024: "καθορίζεται ανά περιφερειακή ενότητα ή ανά δήμο, ο αριθμός των φαρμακείων που διημερεύουν και διανυκτερεύουν κάθε έτος και η σειρά διημέρευσης και διανυκτέρευσης αυτών" (the number of pharmacies on day and night duty each year, and their order, are set by regional unit or municipality). https://pfs.gr/%CF%80%CE%B1%CF%81%CE%AC%CE%BD%CE%BF%CE%BC%CE%B7-%CE%BB%CE%B5%CE%B9%CF%84%CE%BF%CF%85%CF%81%CE%B3%CE%AF%CE%B1-%CF%86%CE%B1%CF%81%CE%BC%CE%B1%CE%BA%CE%B5%CE%AF%CF%89%CE%BD-%CE%BA%CE%B1%CF%84%CE%AC/
- The law's text was read as the association reproduces it, not from the gazette.
- **Door.** The same page: the tables "αναρτώνται επί των προσόψεων των φαρμακείων κατά τις ημέρες και ώρες που αυτά παραμένουν κλειστά" (are posted on the fronts of the pharmacies on the days and hours when they stay closed).
- **Lookup: none entered.** Each local association has its own. Attica's is at http://fsa-efimeries.gr/ (linked from https://fsa.gr/, without https). No page that lists the associations' lookups was found, and the app doesn't know which association a position belongs to.
- **Number.** None on a page that was read.

### France (FR)

- **Turns.** ARS Occitanie, a regional health agency of the state, 1 April 2026: "Ce service est assuré par roulement entre pharmacies pour assurer une continuité de service en dehors des horaires et jours d’ouverture habituels." https://www.occitanie.ars.sante.fr/trouver-une-pharmacie-de-garde-pres-de-chez-moi-0
- **Lookup and number.** The same page: "consultez le site RésoGardes mis en place par les syndicats représentatifs de la profession dans le département : www.3237.fr ou appelez le 3237* *appel surtaxé 0,35 € / min". https://www.3237.fr/
- The page speaks for its region. The research run found the agency of Grand Est pointing to the same service, and one for Île-de-France pointing to another tool. 3237.fr's own map marks départements as covered, partly covered or to come: the app can't tell which one a position is in.
- **Door.** Not found in the law as it stands. A 2019 page on sante.fr says pharmacists show their colleagues on duty in the window: too old, and not the law.

### Belgium (BE)

- **Turns.** The Order of Pharmacists, 21 December 2016, on Royal Decree no. 78: "moet elke apotheek aan de wachtrol deelnemen." https://ordederapothekers.be/deontologie/adviezen/regeling-van-de-wachtdienst-en-vervanging
- **Lookup.** https://www.pharmacie.be/ (the same in Dutch: https://www.apotheek.be/), "Trouver une pharmacie de garde". Its terms name the publisher: "Le site pharmacie.be est édité par l’Association Pharmaceutique Belge (en abrégé l’APB) et Highway APB ASBL." French and Dutch only. The app links to the French one in both of its languages.
- The same terms count the duty data as protected content, for personal information only. A link is not reuse; copying the data would be.
- **Number: none entered.** No national one. The association's page of 11 September 2025 lists five regional numbers for after 22.00 ("dans certaines régions ou communes, après 22h, vous devrez appeler un numéro (gratuit)"), https://www.pharmacie.be/Pharmacy/Article/ce-quil-faut-savoir-sur-la-pharmacie-de-garde~1235. The app doesn't know regions.
- **Door.** The same page: "Chaque pharmacie affiche une liste des services de garde [...] Vous pouvez consulter cette liste de l’extérieur de la pharmacie."

### Luxembourg (LU)

- **Turns.** The Ministry of Health and Social Security, last updated 14 October 2025: "Out-of-hours pharmacies provide a 24-hour service, from 08:00 to 08:00 the next day." and "The list of pharmacies on duty is available on the website of the Luxembourg Pharmacists' Association (Syndicat des Pharmaciens Luxembourgeois asbl.)". https://santesecu.public.lu/en/urgences-gardes/services-garde/pharmacie.html
- No page uses a word for turns. The list itself does the saying: as fetched on 28 November it has nine pharmacies under each of five dates, and the ones under 28.11.2026 are not the ones under 27.11.2026.
- **Lookup.** https://pharmacie.lu/pharmacies/garde: one list for the whole country, by date, in French. No search by place.
- **Number.** None for asking. The association's page names 112 for emergencies, which the app shows anyway.

### Slovakia (SK)

- **Turns.** e-VÚC, the portal of the eight self-governing regions: "Tu sú zverejnené rozpisy lekárenskej pohotovostnej služby rozdelené podľa krajov a okresov" (the rotas of the pharmacy emergency service, by region and district), and that the region organises the service with the Slovak Chamber of Pharmacists under Act 362/2011. https://www.e-vuc.sk/e-vuc/pre-prevadzkovatelov-lekarni/rozpisy-lekarenskej-pohotovostnej-sluzby.html?page_id=81502
- The Chamber says the same of the law: "Samosprávny kraj zverejňuje rozpis zabezpečenia poskytovania lekárenskej pohotovostnej služby na svojom webovom sídle", https://www.slek.sk/aktuality/stanovisko-k-lekarenskej-pohotovostnej-sluzbe-v-zmysle-novely-zakona-o-liekoch
- **Lookup.** https://www.e-vuc.sk/, whose front page leads to each region's list for today ("lekárenská pohotovosť"). The app says "by region", because one has to pick one. No English.
- **Number, door.** None found.

### Hungary (HU)

- **Turns.** NNGYK, the National Centre for Public Health and Pharmacy, 1 April 2026: "a gyógyszertárak az ügyeleti rendnek megfelelően látnak el szolgálatot" (the pharmacies serve according to the duty order), and after the shortened holiday hours "az ügyeleti vagy készenléti szolgálat érhető el" (the duty or standby service is available). https://nngyk.gov.hu/hu/tovabbi-hirek/unnepi-nyitvatartas-es-ugyeleti-rend-a-gyogyszertarakban.html
- **Door.** The same page: "Minden gyógyszertárnak jól látható helyen és olvasható módon fel kell tüntetnie a hozzá legközelebb eső, folyamatosan nyitva tartó vagy ügyeleti szolgálatot teljesítő közforgalmú gyógyszertár nevét, címét" (every pharmacy must show, clearly visible and legible, the name and address of the nearest pharmacy that is open round the clock or on duty).
- **Lookup: none entered.** The page links to a finder at ogyei.gov.hu/gyogyszertarkereso. It refused the connection to the research run and to `curl` on this Mac, and the browser here could not open it either. An address nobody here could open is not offered.

### Cyprus (CY)

- **Turns.** The Pharmaceutical Services of the Ministry of Health publish "Κατάλογος διημερευόντων φαρμακείων ανά επαρχία" (the pharmacies on day duty, by district) on the state's open data portal, last modified 3 October 2026: one file per district, a row for each date with the pharmacy on duty. https://www.data.gov.cy/el/dataset/katalogos-diimereyonton-farmakeion
- The page explains nothing in sentences. The list says it: other pharmacies for other dates.
- Nights: the ministry has a page titled for overnight pharmacies, which could not be opened. Nothing is claimed about nights.
- **Lookup: none entered.** The list is files with a preview of fifty rows, not a search, and the rows hold pharmacists' names and phone numbers. It is open data (CC BY 4.0), so the pipeline could read it: a change of scope, and Janne's to decide.

### Malta (MT)

- **Turns.** The Malta Medicines Authority: "Last version of the roster including any changes between pharmacies will be uploded on this page from time to time" and "For the full roster for Sundays, Public Holidays and Saturdays for 2026 please click here." https://medicinesauthority.gov.mt/pharmacyroster?l=1
- The research run read the rule from its PDF (S.L. 458.28, rule 3): on Sundays and public holidays a pharmacy is open "strictly in accordance with the roster issued for this purpose by the Licensing Authority".
- **Lookup.** The page above, in English: files by year and locality, not a search.
- **Nights.** Nothing found. The roster is for Sundays, public holidays and Saturdays, and the app's link will also be shown at night, when the roster answers nothing.

### Portugal (PT)

- **Turns.** Portaria n.º 277/2012, read from the PDF in INFARMED's compiled legislation, article 3: "As associações representativas das farmácias propõem à administração regional de saúde territorialmente competente (ARS), até ao dia 30 de setembro, as escalas de turnos de serviço permanente e de regime de disponibilidade"; article 5: "As farmácias devem cumprir as escalas de turnos aprovadas pela ARS." https://www.infarmed.pt/documents/15786/1067254/029-D_Port%20277_2012.pdf
- **Door.** Article 6: "As escalas de turnos das farmácias do município aprovadas pela respetiva ARS são afixadas, em cada farmácia, de forma visível."
- **How old.** The compiled copy carries the change of 11 January 2013 and nothing later. The consolidated text on diariodarepublica.pt came back empty to the fetch. If the regulation has changed since, this copy doesn't show it: the date is in the data, and the app shows the day it was read.
- **Lookup: none entered.** The same article says INFARMED and each ARS publish the rosters on their sites. Those pages were not found.

### Denmark (DK)

- **Fixed.** The Danish Medicines Agency, updated 2 January 2026: "Lægemiddelstyrelsen har tildelt vagttjeneste til de apoteker, der fremgår af listerne nederst på siden." and "Apoteker der er tildelt A-vagttjeneste har åbent kl. 06.00-24.00 alle årets dage." https://laegemiddelstyrelsen.dk/da/apoteker/apoteker/vagttjeneste/
- The pharmacists' association lists them: "Der er 48 vagtapoteker med udvidede åbningstider fordelt over hele landet." https://www.apoteket.dk/vagtapoteker
- Named pharmacies with set hours are opening hours like any other. The app shows nothing more. Whether OpenStreetMap carries the short Saturday windows of the smaller duty classes is another question, and not this file's.

## Read, and not entered

From the research runs. I checked none of these again unless the line says so.

- **Switzerland (CH).** Canton by canton. pharmaSuisse lists the cantonal associations (https://pharmasuisse.org/de/der-verband/organisation/kantonalverbaende) and its own finder has "open now" only. Two cantons were read: Zürich prints a number, St. Gallen says that every pharmacy's window has a list of the local emergency pharmacies. No national page says how it is.
- **Liechtenstein (LI).** Nothing found. The office of public health refused the fetch.
- **Italy (IT).** One regional owners' association (Federfarma Lombardia) says its service shows "i turni delle farmacie". federfarma.it refused the connection, to the research run and to me, and three regional laws would not load. PLAN.md names Italy among the countries where duty rotates: that is likely, and not entered until a page says it.
- **The Netherlands (NL).** KNMP: "dienstapotheken" are "apotheken die open zijn als uw eigen apotheek gesloten is", some always open. That reads as fixed, but the same page says some pharmacies give out a leaflet with the duty roster. Not clear enough either way.
- **Ireland (IE).** Nothing found. The health service's and the citizen portal's pages refused the fetch.
- **Sweden (SE).** The 2009 government bill leaves opening hours to whoever runs the pharmacy. No current page of an authority was found.
- **Norway (NO).** The pharmacy act lets a licence carry "funksjon som vaktapotek". That reads as fixed. No page for the public says so.
- **Finland (FI).** Fimea: opening hours can be a condition of a pharmacy's licence. No page that loaded says how duty works, and the Medicines Act did not load. Nothing is shown, which is also what PLAN.md expects of Finland.
- **Iceland (IS).** The Medicines Agency's report for 2025: four pharmacies in the capital area open over a hundred hours a week, one of them round the clock. That reads as fixed.
- **Poland (PL).** A county's board names the pharmacies on duty, and a duty is two hours at night or four on a day off (the Ministry of Health's questions and answers, https://www.gov.pl/web/zdrowie/dyzury-apteczne, which I read too: a board may name one pharmacy or several). No page says they take turns, so the app's sentence would say more than the pages do. The health fund's free line tells the pharmacy on duty, also in English: 800 190 590, "Uzyskasz informację o [...] dyżurującej aptece" (https://www.nfz.gov.pl/kontakt/telefoniczna-informacja-pacjenta/, checked by me). Worth offering, with a sentence of its own: see the open questions.
- **Czechia (CZ).** One page of the Chamber, from 2020, counts the pharmacies with a round-the-clock emergency service. Nothing else could be read.
- **Slovenia (SI).** Nothing readable. A 2017 decision's title speaks of a list of duty pharmacies with a 24-hour service; the gazette's certificate had expired.
- **Croatia (HR).** Zagreb's own page lists five duty pharmacies with a night service, and the health insurance fund has a national file last updated in 2023. That reads as fixed.
- **Romania (RO).** One county's college publishes a list of night-duty pharmacies. The law portal and the insurance funds' pages failed to load.
- **Bulgaria (BG).** Ordinance No. 28 of 2008, article 31: a pharmacy announces the hours and address of the nearest round-the-clock pharmacy. That reads as fixed. The text read is the one first published.
- **Estonia (EE).** The ministry and the health insurance fund both use "valveapteek" for a pharmacy that is open round the clock. That reads as fixed.
- **Latvia (LV).** Regulation No. 288, point 4: a pharmacy shows the address of the nearest one open round the clock, and the regulation has nothing on duty. That reads as fixed. The State Agency of Medicines' pharmacy map, which is said to filter them, refused the fetch.
- **Lithuania (LT).** Nothing confirmed: every official site refused the fetch.

Eight of these read as fixed (NL, SE, NO, IS, HR, BG, EE, LV). Entering them would change nothing in the app, which shows nothing for `fixed` and nothing for a country without an entry. They are left out so that the data holds only what a page says in words.

## Open questions

1. **Austria's 1455.** Is it printed on a current official page? Then it can be entered.
2. **Poland.** The free line that tells the pharmacy on duty is the best thing found for the country, and the app has no sentence for "a county names the pharmacies on duty". A third kind next to `rotating` and `fixed` would carry it.
3. **Italy.** The pages have to be read from a network they answer to.
4. **Cyprus.** The duty list is open data. Reading it in the pipeline would put the pharmacy on duty on the map: a change of scope.
5. **A second pass in a browser** for the sites that refused the fetch: ogyei.gov.hu (Hungary's finder), the Irish health service and citizen portal, zva.gov.lv, tallinn.ee, every lrv.lt site, island.is.
