# Prescriptions across borders: what the official sources say

The evidence behind PLAN.md section 8 and `data/countries/`: for a prescription written in one country and a pharmacy in another, what works. Everything here was read on **26 Nov 2026**, by four research passes of the day run of that date, each told to quote and not to fill gaps from memory. The app shows only what a page read that day says, with the page named and dated (`data/countries/sources.ts`), and says plainly where nothing was found.

Read this file as the record of what the pages said on that day. It has had a second reading the same day (below), by readers of the same kind as the first. Before the pull request that brought it is merged, a person should read the claims against the pages themselves.

## What the app takes from it

1. **Paper prescriptions.** A prescription written in one EU or EEA country can be dispensed in the others, under the dispensing country's own rules: Directive 2011/24/EU, Article 11, taken into the EEA Agreement by Joint Committee Decision No 153/2014, and in plain words on Your Europe (last checked there 26.8.2026), which also lists what the prescription has to show. Switzerland is outside the rule in both directions (Your Europe's FAQ).
2. **Electronic prescriptions.** There is no European list. The Commission's page on the service names no country, and Your Europe gives one example (Finland to Croatia, Estonia and Portugal) that is older than Finland's own list. So the pairs come from each country's own page: Finland (Kanta), Estonia, Poland, Spain, Portugal, Croatia, Czechia, Latvia, Lithuania and Greece. Among the nine with a current page no pair is told two ways.
3. **Croatia's list is from October 2022.** It is not read for what it leaves out: where another country's current page names Croatia, the pair is shown as working on that page's word.
4. **Countries that take no e-prescription from abroad**, by their own authorities: Sweden, Denmark, Norway, Germany. Switzerland's guidance for pharmacies recognises only the Swiss e-prescription.
5. **Finland as the country one is in**: Kanta's eight countries for electronic prescriptions, at any pharmacy; paper prescriptions from the EU, the EEA and Switzerland; none from anywhere else (EU-healthcare.fi).
6. **Nothing found**, and shown as that: the electronic prescription wherever neither country publishes a list (Italy, Hungary, Malta, Slovenia, Slovakia and Austria as the country one is in, for most home countries); paper prescriptions from outside the EU, the EEA and Switzerland everywhere but Finland.

## What is weaker than it looks

- **Spain's list does not split the two directions.** The ministry says every region works "as issuer and receiver" and lists eleven countries; the app takes each as both ways. An unread page of the same site (its map) may split them.
- **Greece's table is icons without a legend.** "In Greece" was read as inbound and "abroad" as outbound; Portugal's page agrees with that reading.
- **Austria and Cyprus** appear in other countries' lists; their own pages were not read. A pair with Austria as the country one is in rests on the home country's page alone.
- **Switzerland** rests on a position paper for pharmacies, read from the pharmacists' association's site. It is not a federal statement; no page of the Federal Office of Public Health or Swissmedic was found.
- **Germany**: the e-prescription statement is gematik's FAQ for pharmacies; the paper statement is from the national contact point's page for people insured in Germany. Neither is the health ministry.
- **The United Kingdom**: no general official statement was found. GOV.UK's guide for Spain (last updated 2.9.2021) says a UK prescription can be used there; the app does not use it, because it is one country and five years old.
- **Info Norden** could not be read (403 to automated requests), so nothing about a Nordic arrangement is shown. The Finnish, Swedish, Danish and Norwegian national pages read that day mention none.
- **EUR-Lex** answered automated requests with an empty page. The directive and the EEA decision were read from the Publications Office's copies of the same documents.
- **The Finnish and English versions of two Finnish pages differ**: the Finnish says "certain" medicines that affect the central nervous system, the English drops the word. The app follows the Finnish.

## The second reading, 26 Nov 2026

The same afternoon two more readers, who had not seen the first reading's notes, were given the data files and the page addresses and told to check every list and every sentence against the pages as they read that day. Fourteen plus ten pages, all read.

- **The lists of `eprescription.ts` all matched their pages exactly**: both directions, for all ten countries. Latvia's two images had been replaced on 24 Nov 2026 and say the same.
- **Seven sentences said less than their page, and were corrected:**
  - Finland, to its own people (Kanta): the note now says that not every medicine can be bought abroad, with narcotics and most medicines that mainly affect the central nervous system as examples, and points to Kanta's list.
  - Finland, to visitors (Kanta): the four groups that can't be bought are named.
  - Finland, paper prescriptions (EU-healthcare.fi): the third excluded group, medicines whose prescription the pharmacy has to keep.
  - Sweden: "narcotics or banned substances", where the note said narcotics.
  - Germany: the contact point goes on to say that for the time being it advises against it.
  - Lithuania: until 3 January 2027 it sends no prescriptions abroad for inhaled medicines, powders, or liquid and semi-solid forms.
  - Greece: the person is also asked for their AMKA number.
- **Two said slightly more, and were corrected:** Portugal's pharmacies "will be marked" with a sticker, not "carry" one; Switzerland's own e-prescription is "at present" the only recognised one.
- **The directive's own exception was missing** and is now said for every pair the rule covers: Article 11(6), medicines that need a special medical prescription. Which medicines that is in each country was not read.
- **A source was missing**: that the rule holds in Iceland, Liechtenstein and Norway is said in words on Your Europe's page of questions, which those pairs now name.
- **Left as it is, and worth knowing:** Your Europe's sentence on Switzerland speaks of "EU countries". The app applies it to Iceland, Liechtenstein and Norway too, which are not obliged either by anything that was read, and to the United Kingdom's and other countries' prescriptions in Switzerland.
- Every date in `sources.ts` matched its page.

## Every pair: the electronic prescription

Rows: the country the prescription is from. Columns: the country of the pharmacy. Generated from `data/countries/` (`guideFor`).

- **yes**: a page that was read names the pair.
- **no (list)**: a page that lists its partners was read and the pair is not on it.
- **no (here)**: the country one is in takes none from abroad.
- **no (home)**: the home country says its e-prescription can't be used abroad.
- **?**: nothing official found.

| from \ in | FI | EE | LV | LT | PL | CZ | HR | PT | ES | DE | AT | CH | DK | NO | SE | GR | HU | IT | MT | SI | SK |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AT** | no (list) | no (list) | yes | no (list) | no (list) | yes | ? | no (list) | yes | no (here) | · | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **BE** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **BG** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **CH** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | · | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **CY** | no (list) | yes | yes | yes | yes | yes | ? | no (list) | yes | no (here) | ? | no (here) | no (here) | no (here) | no (here) | yes | ? | ? | ? | ? | ? |
| **CZ** | yes | yes | yes | yes | yes | · | yes | no (list) | yes | no (here) | yes | no (here) | no (here) | no (here) | no (here) | yes | no (list) | no (list) | no (list) | no (list) | no (list) |
| **DE** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | · | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **DK** | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (here) | no (home) | no (here) | · | no (here) | no (here) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) |
| **EE** | yes | · | yes | yes | yes | yes | yes | yes | yes | no (here) | no (list) | no (here) | no (here) | no (here) | no (here) | yes | no (list) | no (list) | no (list) | no (list) | no (list) |
| **ES** | yes | yes | yes | yes | yes | yes | yes | yes | · | no (here) | yes | no (here) | no (here) | no (here) | no (here) | yes | no (list) | no (list) | no (list) | no (list) | no (list) |
| **FI** | · | yes | yes | yes | yes | yes | yes | yes | yes | no (here) | no (list) | no (here) | no (here) | no (here) | no (here) | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) |
| **FR** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **GB** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **GR** | no (list) | yes | yes | yes | yes | yes | no (list) | no (list) | yes | no (here) | no (list) | no (here) | no (here) | no (here) | no (here) | · | no (list) | no (list) | no (list) | no (list) | no (list) |
| **HR** | yes | yes | yes | yes | yes | no (list) | · | yes | yes | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **HU** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | · | ? | ? | ? | ? |
| **IE** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **IS** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **IT** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | · | ? | ? | ? |
| **LI** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **LT** | yes | yes | yes | · | yes | yes | yes | yes | yes | no (here) | no (list) | no (here) | no (here) | no (here) | no (here) | yes | no (list) | no (list) | no (list) | no (list) | no (list) |
| **LU** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **LV** | yes | yes | · | yes | yes | yes | yes | no (list) | yes | no (here) | yes | no (here) | no (here) | no (here) | no (here) | yes | no (list) | no (list) | no (list) | no (list) | no (list) |
| **MT** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | · | ? | ? |
| **NL** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **NO** | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) | no (here) | no (home) | no (here) | no (here) | · | no (here) | no (home) | no (home) | no (home) | no (home) | no (home) | no (home) |
| **PL** | yes | yes | yes | yes | · | yes | yes | yes | yes | no (here) | no (list) | no (here) | no (here) | no (here) | no (here) | yes | no (list) | no (list) | no (list) | no (list) | no (list) |
| **PT** | yes | yes | yes | yes | yes | yes | yes | · | yes | no (here) | no (list) | no (here) | no (here) | no (here) | no (here) | yes | no (list) | no (list) | no (list) | no (list) | no (list) |
| **RO** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |
| **SE** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | · | no (list) | ? | ? | ? | ? | ? |
| **SI** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | · | ? |
| **SK** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | · |
| **other** | no (list) | no (list) | no (list) | no (list) | no (list) | no (list) | ? | no (list) | no (list) | no (here) | ? | no (here) | no (here) | no (here) | no (here) | no (list) | ? | ? | ? | ? | ? |


## Every pair: the paper prescription

- **EU rule**: both countries are in the EU or the EEA.
- **yes**: outside the rule, and the country one is in says it takes it.
- **not obliged**: Switzerland on either side.
- **no**: Finland, of a prescription from outside the EU, the EEA and Switzerland.
- **?**: nothing official found.

| from \ in | FI | EE | LV | LT | PL | CZ | HR | PT | ES | DE | AT | CH | DK | NO | SE | GR | HU | IT | MT | SI | SK |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AT** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **BE** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **BG** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **CH** | yes | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | · | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged | not obliged |
| **CY** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **CZ** | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **DE** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **DK** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **EE** | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **ES** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **FI** | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **FR** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **GB** | no | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | not obliged | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| **GR** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule |
| **HR** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **HU** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule |
| **IE** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **IS** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **IT** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule |
| **LI** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **LT** | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **LU** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **LV** | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **MT** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule |
| **NL** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **NO** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **PL** | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **PT** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **RO** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **SE** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | · | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule |
| **SI** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · | EU rule |
| **SK** | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | not obliged | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | EU rule | · |
| **other** | no | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | not obliged | ? | ? | ? | ? | ? | ? | ? | ? | ? |

## Not done, for whoever continues

1. A person's reading of the claims, against the pages.
2. Croatia: the later HZZO notice about services added since 2022 (https://hzzo.hr/novosti/prekogranicne-usluge-e-recepta-obavijest-o-novim-uslugama-hr-ep-pl-ep-b-i-cz-ep-hr-ep-b), and a current list if one exists.
3. Spain: the map page, for the two directions (https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/mapaRecetaUE.htm).
4. Austria's and Cyprus's own pages.
5. Germany and Sweden as home countries: an official statement on using their e-prescription abroad. Germany's visitor-facing page on eu-patienten.de.
6. Switzerland: the position paper from kantonsapotheker.ch itself; a federal page.
7. Iceland and Liechtenstein as home countries: not started.
8. Info Norden, by a person with a browser.
9. The countries with nothing found, as the country one is in: Italy, Hungary, Malta, Slovenia, Slovakia.

---

# The notes of the four research passes

Kept as they were written, with the quotes. "Inference" marks a researcher's own reading, which the app does not show as a sourced claim.

## Cross-border e-prescription pairs: what each country's own official page says

Read on 26 Nov 2026. Every quote below was taken from a plain HTTP GET of the page (saved HTML, PDF or PNG), not from a summarising tool. Web-search summaries were used only to find URLs; nothing in this file rests on them unless it is marked "lead, not read".

Budget used: 10 searches + 21 fetches = 31 (three of the fetches failed at first and were repeated with another client). Reached: Estonia, Poland, Spain, Portugal, Croatia, Czechia, Latvia, Lithuania, Greece. **Not reached: Germany, Sweden.** Austria and Cyprus appear in other countries' lists, but their own pages were not in scope and were not read.

Country codes: AT Austria, CY Cyprus, CZ Czechia, EE Estonia, ES Spain, FI Finland, GR Greece, HR Croatia, LT Lithuania, LV Latvia, PL Poland, PT Portugal.

### 1. Summary table (what the page says)

| Country | OUTBOUND: its e-prescriptions can be dispensed in | INBOUND: its pharmacies dispense e-prescriptions from | Page's own date | URL |
|---|---|---|---|---|
| Estonia | ES (not La Rioja), HR, GR, CY, LT, LV, PL, PT, FI, CZ (10) | ES, HR, GR, CY, LT, LV, PL, PT, FI, CZ (10) | no date shown | https://www.tehik.ee/piiriulene-andmevahetus |
| Poland | HR, CY, CZ, EE, FI, GR, LT, LV, PT, ES (all pharmacies except La Rioja) (10) | PT, GR, EE, LT, LV, FI, CZ, HR, CY, ES (10) | published 3.08.2026, modified 3.08.2026 | https://pacjent.gov.pl/poznaj-e-recepte-transgraniczna |
| Spain | "Interoperable countries", direction not split per country: AT, CZ, CY, HR, EE, FI, GR, LV, LT, PL, PT (11). 17 regions + INGESA active; La Rioja "in development" | same list (page says Spain works in both roles, "emisor y receptor"; patient sheets for visitors from the same 11) | PDFs: "Actualizado agosto 2026"; page HTTP Last-Modified 3 Nov 2026 | https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/home.htm |
| Portugal | HR, EE, FI, ES, PL, CZ, GR, LV, LT, CY (10) | FI, EE, HR, ES, PL, LT (6) | no date shown | https://www.sns24.gov.pt/pt/servico/receitas-e-medicamentos-na-europa/ |
| Croatia | **Only a 2022 notice found**: FI, EE, PT, ES (4) | **2022 notice**: FI, EE, PT, PL, ES (5) | 20.10.2022 | https://hzzo.hr/novosti/ostalo/elektronicke-prekogranicne-zdravstvene-usluge-u-eu |
| Czechia | EE, FI, HR, CY, LT, LV, PL, AT, GR, ES (10); PT explicitly "NE" | EE, FI, CY, LT, LV, PL, PT, AT, GR, ES (10); HR explicitly "NE" | meta modified 2026-08-05 (no date visible on the page) | https://epreskripce.gov.cz/o-ereceptu/preshranicni-erecept/ |
| Latvia | AT, CZ, EE, GR, HR, CY, LT, PL, FI, ES (only some regions) (10); PT cell empty | AT, CZ, EE, GR, HR, CY, LT, PL, PT, FI, ES (11) | no date shown (site footer build stamp 17.11.2026) | https://eveseliba.gov.lv/sakums/pārrobežu-e-veselības-pakalpojumi |
| Lithuania | LV, PL, ES, GR, PT, EE, CZ, FI, HR, CY (10) | same 10 | no date shown | https://www.esveikata.lt/tarpvalstybinis-e-receptas |
| Greece | ES, PL, EE, LT, CZ, CY, LV (7); PT explicitly crossed | ES, PL, EE, LT, CZ, CY, PT, LV (8) | no date visible; HTTP Last-Modified 26 Aug 2026 | https://www.ncpehealth.gr/myhealthateu.html |
| Germany | not reached | not reached | | |
| Sweden | not reached | not reached | | |

Current official list for Croatia: **no current official list found** (only the 2022 HZZO notice; see section 3.5).

### 2. Pairs: where two pages disagree

Derived by me from the lists above (inference, not a quote). Cell = issuer's outbound / dispenser's inbound. Y = listed, n = not listed or explicitly no, ? = that country's own page not read. Bold = the two pages disagree.

Finland's row and column use the eight Kanta partner countries given in the brief, taken as both directions (I did not read Kanta and do not know whether it splits directions). Spain is taken as both directions because its page does not split them.

| home (issuer) \ dispensed in | EE | PL | ES | PT | HR | CZ | LV | LT | GR | FI | AT | CY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **EE** | · | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | n/? | Y/? |
| **PL** | Y/Y | · | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | n/? | Y/? |
| **ES** | Y/Y | Y/Y | · | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/? | Y/? |
| **PT** | Y/Y | Y/Y | Y/Y | · | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | n/? | Y/? |
| **HR** (2022 page) | Y/Y | **n/Y** | Y/Y | Y/Y | · | n/n | **n/Y** | **n/Y** | n/n | Y/Y | n/? | n/? |
| **CZ** | Y/Y | Y/Y | Y/Y | n/n | **Y/n** | · | Y/Y | Y/Y | Y/Y | Y/Y | Y/? | Y/? |
| **LV** | Y/Y | Y/Y | Y/Y | n/n | **Y/n** | Y/Y | · | Y/Y | Y/Y | Y/Y | Y/? | Y/? |
| **LT** | Y/Y | Y/Y | Y/Y | Y/Y | **Y/n** | Y/Y | Y/Y | · | Y/Y | Y/Y | n/? | Y/? |
| **GR** | Y/Y | Y/Y | Y/Y | n/n | n/n | Y/Y | Y/Y | Y/Y | · | n/n | n/? | Y/? |
| **FI** (from brief) | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | Y/Y | n/n | · | n/? | n/? |
| **AT** | ?/n | ?/n | ?/Y | ?/n | ?/n | ?/Y | ?/Y | ?/n | ?/n | ?/n | · | ?/? |
| **CY** | ?/Y | ?/Y | ?/Y | ?/n | ?/n | ?/Y | ?/Y | ?/Y | ?/Y | ?/n | ?/? | · |

#### Flags

1. **Every disagreement involves Croatia, and the cause is the age of Croatia's page (20.10.2022).**
   - HR → PL, HR → LV, HR → LT: Croatia's 2022 notice does not list them as outbound; Poland, Latvia and Lithuania each list Croatia as inbound.
   - CZ → HR, LV → HR, LT → HR: Czechia, Latvia and Lithuania list Croatia as outbound; Croatia's 2022 notice does not list them as inbound.
   - Lead, not read: a later HZZO notice whose title names two added services ("HR eP A – PL eP B" and "CZ eP A – HR eP B"), https://hzzo.hr/novosti/prekogranicne-usluge-e-recepta-obavijest-o-novim-uslugama-hr-ep-pl-ep-b-i-cz-ep-hr-ep-b. It would settle HR → PL and CZ → HR.
2. **Among the eight countries with a current page (EE, PL, ES, PT, CZ, LV, LT, GR) there is no disagreement on any pair.** The one-way pairs agree on both sides:
   - PT → CZ yes, CZ → PT no (Czechia: "Portugalsko NE / ANO"; Portugal's inbound list has no Czechia).
   - PT → LV yes, LV → PT no (Latvia's table leaves the outbound cell for Portugal empty; Portugal's inbound list has no Latvia).
   - PT → GR yes, GR → PT no (Greece's table crosses "abroad" for Portugal; Portugal's inbound list has no Greece).
   - CZ → HR yes, HR → CZ no, as Czechia states it ("Chorvatsko ANO / NE"); Croatia's side is the 2022 page.
3. **Spanish regions: Lithuania's page disagrees with Spain's own.** Lithuania says La Rioja, the Balearic Islands and Asturias are not connected. Spain's own PDF (updated August 2026) lists Asturias and Baleares as active and only La Rioja as "en proceso de desarrollo". Poland and Estonia also name only La Rioja. Latvia says only "some regions" without naming them.
4. **Portugal's page also states other countries' pairs, and those rows lag behind those countries' own pages.** Use only the rows where Portugal is issuer or dispenser. Examples of what the SNS 24 rows omit compared with the country's own list: Estonia's inbound lacks Cyprus; Czechia's inbound lacks Cyprus and Austria; Greece's inbound lacks Latvia; Latvia's inbound lacks Austria, Greece and Cyprus; Lithuania's inbound lacks Croatia and Cyprus; Spain's inbound lacks Austria. Its Poland row matches Poland's own list exactly.
5. **Latvia's prose and its table differ on Portugal.** The prose says Portugal "has started" e-prescription exchange with Latvia; the table shows it in one direction only (Portuguese prescriptions in Latvia). The table agrees with Portugal's page.
6. **Austria** is listed by Czechia (both ways), Latvia (both ways) and Spain; not by Estonia, Poland, Portugal, Lithuania or Greece. **Cyprus** is listed by all nine except Croatia's 2022 notice (Portugal: outbound only). Neither country's own page was read.
7. Finland is not in Greece's table, which fits the Kanta list in the brief (no Greece).

### 3. Per country: verbatim quotes

#### 3.1 Estonia

Source: TEHIK (Tervise ja Heaolu Infosüsteemide Keskus, the state health information systems centre). https://www.tehik.ee/piiriulene-andmevahetus (requested as https://tehik.ee/piiriulene-andmevahetus). Date: no date shown.

TEHIK's own documentation page names this page as the current list: "Ajakohane info riikidest, kellega Eestil on piiriülese digiretsepti ja patsiendi terviseandmete kokkuvõtte andmevahetus: https://tehik.ee/piiriulene-andmevahetus" (Up-to-date information on the countries with which Estonia exchanges cross-border e-prescription and patient summary data). https://teabekeskus.tehik.ee/et/teenused/tis-teenused/piiriulene-terviseandmete-andmevahetus ("Viimati uuendatud 23.02.2024").

The page says, under "Mis riikidega hetkel andmevahetus toimib?" (With which countries does the exchange currently work?), a table. Columns 1 and 2 are the e-prescription columns:
- "Digiretsepti teenus Eesti kodanikule välisriigis" (e-prescription service for an Estonian citizen abroad) = OUTBOUND
- "Digiretsepti teenus välisriigi kodanikule Eestis" (e-prescription service for a foreign citizen in Estonia) = INBOUND

| Riik (as written) | Outbound | Inbound |
|---|---|---|
| Hispaania (teenust pakkuvate apteekide otsing; otsingu kasutamise ingliskeelne juhend). NB! Teenusega pole veel liitunud La Rioja | ✔️ | ✔️ |
| Holland | ❌ | ❌ |
| Horvaatia | ✔️ | ✔️ |
| Kreeka | ✔️ | ✔️ |
| Küpros | ✔️ | ✔️ |
| Leedu | ✔️ | ✔️ |
| Luksemburg | ❌ | ❌ |
| Läti | ✔️ | ✔️ |
| Malta | ❌ | ❌ |
| Poola | ✔️ | ✔️ |
| Portugal (teenust pakkuvate apteekide loetelu) | ✔️ | ✔️ |
| Prantsusmaa | ❌ | ❌ |
| Soome | ✔️ | ✔️ |
| Tšehhi (teenust pakkuvate apteekide loetelu) | ✔️ | ✔️ |

Translation of the notes in the rows: Spain "(search for pharmacies offering the service; English guide to the search). NB! La Rioja has not yet joined the service". Portugal and Czechia "(list of pharmacies offering the service)".

Other quotes:
- "Piiriülene digiretsept võimaldab patsiendil osta talle välja kirjutatud ravimeid teises, teenusega kaetud riigi apteegis ning edastada väljamüügi info patsiendi koduriigi retseptikeskusesse." (The cross-border e-prescription lets a patient buy the medicines prescribed to them in a pharmacy of another country covered by the service, and sends the dispensing information to the prescription centre of the patient's home country.)
- "Eesti poolt on tagatud meie kodanikele nii digiretseptide kui ka patsiendi terviseandmete kokkuvõtte edastamine teistesse, teenusega liitunud riikidesse. Samuti on võimalik Eesti apteekritel pärida ja välja müüa teiste riikide kodanike digiretsepte" (Estonia ensures the transmission of both e-prescriptions and patient summaries to the other countries that have joined the service. Estonian pharmacists can likewise retrieve and dispense e-prescriptions of other countries' citizens.)

Inference: the pharmacy-list links for Spain, Portugal and Czechia suggest that not every pharmacy there offers the service; the page does not say so in words. Which ID to show, consent and excluded medicines are not on this page (they are behind a "Loe lähemalt" link that was not read).

#### 3.2 Poland

Source: pacjent.gov.pl ("Serwis Ministerstwa Zdrowia i Narodowego Funduszu Zdrowia"; editor Centrum e-Zdrowia). https://pacjent.gov.pl/poznaj-e-recepte-transgraniczna. Date: "Opublikowano: 3.08.2026", "Zmodyfikowano: 3.08.2026".

OUTBOUND, verbatim: "Obywatele Polski mogą wykupić leki na e-receptę transgraniczną w Chorwacji, Cyprze, Czechach, Estonii, Finlandii, Grecji, Litwie, Łotwie, Portugalii i Hiszpanii (dotyczy wszystkich aptek poza tymi z La Rioja – jak na mapie poniżej)."
(Polish citizens can buy medicines on a cross-border e-prescription in Croatia, Cyprus, Czechia, Estonia, Finland, Greece, Lithuania, Latvia, Portugal and Spain (all pharmacies except those in La Rioja, as on the map below).)

INBOUND, verbatim: "Obywatele Portugalii, Grecji, Estonii, Litwy, Łotwy, Finlandii, Czech, Chorwacji, Cypru i Hiszpanii mogą wykupić swoją e-receptę transgraniczną w Polsce. Stopniowo będą ją wprowadzać pozostałe kraje."
(Citizens of Portugal, Greece, Estonia, Lithuania, Latvia, Finland, Czechia, Croatia, Cyprus and Spain can have their cross-border e-prescription dispensed in Poland. Other countries will introduce it gradually.)

Conditions, verbatim:
- Consent first: "Żeby wykupić e-receptę w innym kraju, wyraź zgodę na e-receptę transgraniczną na Internetowym Koncie Pacjenta." (To have an e-prescription dispensed in another country, give your consent to the cross-border e-prescription in the Internet Patient Account.) The steps: "Upoważnienia" then "Wyraź zgodę na obsługę Twoich e-recept za granicą", choosing the country or countries.
- Adults only: "Uwaga, e-recepta transgraniczna jest rozwiązaniem dla osób pełnoletnich. Dzieciom lekarz może wystawić receptę transgraniczną wyłącznie w formie papierowej." (The cross-border e-prescription is for adults. For children a doctor can issue a cross-border prescription only on paper.)
- At the pharmacy: "Znajdź w danym kraju aptekę, która realizuje e-recepty transgraniczne." / "Pokaż swój dowód osobisty lub inny dokument tożsamości ze zdjęciem." (Find a pharmacy in that country that dispenses cross-border e-prescriptions. / Show your identity card or another identity document with a photo.)
- Exclusions: "Nie jest możliwa realizacja za granicą e-recepty wystawionej na leki psychotropowe, odurzające, recepturowe, produkty lecznicze o kategorii dostępności „Rpz" (wydawane z przepisu lekarza do zastrzeżonego stosowania), środki spożywcze specjalnego przeznaczenia żywieniowego oraz wyroby medyczne." (An e-prescription for psychotropic or narcotic medicines, compounded medicines, "Rpz" restricted-use products, foods for special medical purposes or medical devices cannot be dispensed abroad.)
- "Nie zrealizujesz też za granicą recepty rocznej tzw. 365" (Nor an annual, so-called 365, prescription.)
- No partial dispensing: "należy wykupić je wszystkie na raz, ponieważ nie ma możliwości częściowej realizacji recepty" (you must buy them all at once, because partial dispensing is not possible).
- Full price, refund from NFZ afterwards: "Recepta transgraniczna, zarówno papierowa, jak i e-recepta jest pełnopłatna."

#### 3.3 Spain

Source: Ministerio de Sanidad. https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/home.htm (HTTP Last-Modified 3 Nov 2026). The country and region lists are in two one-page PDFs linked from it, both marked "ACTUALIZADO AGOSTO 2026":
- "Países Europeos y Comunidades Autónomas con servicio disponible": https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/docs/Servicio_activo_REeuropa.pdf
- "Condiciones de dispensación y servicios disponibles por país": https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/docs/condiciones_servicio.pdf

The technical note: macOS curl could not complete the TLS handshake with this host; Node's fetch could.

Lists, verbatim from the first PDF ("Servicio activo de receta electrónica interoperable"):
- "17* CCAA + INGESA", "2 roles operativos emisor y receptor", "11 países conectados"
- "CCAA e INGESA con servicio activo. Todos los ámbitos territoriales funcionan como emisor y receptor." Andalucía, Aragón, Asturias, Baleares, Canarias, Cantabria, Castilla y León, Castilla-La Mancha, Cataluña, C. Valenciana, Extremadura, Galicia, C. Madrid, Murcia, Navarra, País Vasco, Ceuta y Melilla (INGESA). "*La Rioja en proceso de desarrollo"
- "Países interoperables. Servicio activo de intercambio de receta electrónica." Austria, Chequia, Chipre, Croacia, Estonia, Finlandia, Grecia, Letonia, Lituania, Polonia, Portugal.

(Translation: 17 regions + INGESA; 2 operating roles, issuer and receiver; 11 connected countries. All territories work as issuer and receiver. La Rioja under development. Interoperable countries, active exchange of e-prescriptions: Austria, Czechia, Cyprus, Croatia, Estonia, Finland, Greece, Latvia, Lithuania, Poland, Portugal.)

**The page does not split the country list into outbound and inbound.** What supports "both ways" for all 11 is (a) "2 roles operativos emisor y receptor" and (b) the page's table "Hoja de Información al paciente para ciudadanos que visitan España" with a sheet for each of the same 11 countries (Austria, Croacia, Chipre, Estonia, Finlandia, Grecia, Letonia, Lituania, Polonia, Portugal, República Checa). That reading is my inference. A further page, "Mapa de situación actual del servicio" (https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/mapaRecetaUE.htm), was not read and may split directions.

From the second PDF, verbatim: "Consentimiento previo. El paciente debe consentir antes de la dispensación. 4 países: Austria, Croacia, Polonia, Portugal" (Prior consent: the patient must consent before dispensing. 4 countries.) and "Dispensación no disponible en nombre de otra persona. 11 países: Austria, Chequia, Chipre, Croacia, Estonia, Finlandia, Grecia, Letonia, Lituania, Polonia, Portugal" (Dispensing on behalf of another person not available.) The PDF does not say whether the consent row is about those countries' patients in Spain or Spanish patients there.

Conditions on the page, verbatim:
- OUTBOUND: "Importante: a diferencia del resto de países con el servicio activo, en Portugal y República Checa el servicio no está disponible en todas las farmacias." (Unlike the other countries with the service active, in Portugal and the Czech Republic the service is not available in every pharmacy.)
- "Debe llevar su tarjeta sanitaria individual. Si no tiene fotografía, deberá presentar también un documento oficial con foto, como el DNI o el pasaporte. La Tarjeta Sanitaria Europea no es válida para recoger medicamentos mediante receta electrónica." (Bring your individual health card. If it has no photo, also an official photo document such as the DNI or passport. The European Health Insurance Card is not valid for collecting medicines by e-prescription.)
- "Para poder recoger su medicación fuera de España, las recetas deben haber sido prescritas en la comunidad autónoma a la que usted pertenece." (To collect medication outside Spain, the prescriptions must have been issued in the autonomous community you belong to.)
- "La medicación debe ser recogida por la persona a la que se le ha prescrito." (The medication must be collected by the person it was prescribed to.)
- Exclusions: "están excluidos los medicamentos estupefacientes y psicótropos, los medicamentos con más de cuatro principios activos, los efectos y accesorios, las vacunas individualizadas, las fórmulas magistrales y los productos dietoterápicos."
- INBOUND: "Si visita España y necesita recoger medicamentos prescritos electrónicamente en su país de origen, consulte antes si el servicio está disponible para su país y en la comunidad autónoma en la que se encuentra." (Check first whether the service is available for your country and in the autonomous community you are in.)
- "Para recoger su medicación deberá presentar un documento que permita identificarle y que incluya una fotografía." (You must show a document that identifies you and has a photo.)
- "Algunos países pueden requerir además un consentimiento específico para acceder a la medicación disponible." (Some countries may also require a specific consent.)

#### 3.4 Portugal

Source: SNS 24 (the national health service portal). https://www.sns24.gov.pt/pt/servico/receitas-e-medicamentos-na-europa/ (reached by redirect from https://www.sns24.gov.pt/guia/a-minha-saude-na-europa/prescricao-eletronica-e-dispensa-de-medicamentos-na-europa/). Date: no date shown.

Under "Que países aderiram à dispensa eletrónica de medicamentos?" the page gives one line per dispensing country ("como país de tratamento/prestador de cuidados"), verbatim:
- "na Croácia [...] para prescrições eletrónicas emitidas na Finlândia, Estónia, Espanha, Polónia, Letónia, República Checa, Chipre e em Portugal"
- "na Estónia [...] para prescrições eletrónicas emitidas na Finlândia, Croácia, Polónia, Espanha, Grécia, Letónia, República Checa, Lituânia e em Portugal"
- "na Finlândia [...] para prescrições eletrónicas emitidas na Estónia, Croácia, Polónia, Espanha, República Checa, Letónia, Lituânia e em Portugal"
- "em Espanha [...] para prescrições eletrónicas emitidas na Croácia, Polónia, Finlândia, Estónia, República Checa, Letónia, Grécia, Lituânia, Chipre e em Portugal"
- "na Polónia [...] para prescrições eletrónicas emitidas na Estónia, Espanha, Finlândia, República Checa, Croácia, Grécia, Letónia, Lituânia, Chipre e Portugal"
- "na República Checa [...] para prescrições eletrónicas emitidas na Polónia, Estónia, Espanha, Letónia, Lituânia, Finlândia, Grécia e Portugal"
- "na Grécia [...] para prescrições eletrónicas emitidas na Polónia, Estónia, Espanha, República Checa, Lituânia, Chipre e Portugal"
- "na Letónia [...] para prescrições eletrónicas emitidas na Croácia, Polónia, Espanha, República Checa, Estónia, Lituânia, Finlândia e Portugal"
- "na Lituânia [...] para prescrições eletrónicas emitidas na Letónia, Polónia, Espanha, República Checa, Estónia, Finlândia, Grécia e Portugal"
- "em Chipre [...] para prescrições eletrónicas emitidas na Croácia, Grécia, Polónia, Espanha e Portugal"
- "em Portugal (como país de tratamento/prestador de cuidados) para prescrições eletrónicas emitidas na Finlândia, Estónia, Croácia, Espanha, Polónia e Lituânia"

("[...]" stands for the repeated words "(como país de tratamento/prestador de cuidados)", "as the country of treatment".)

OUTBOUND (my reading of the lines above: Portugal is named as issuer in every one of the ten foreign lines): Croatia, Estonia, Finland, Spain, Poland, Czechia, Greece, Latvia, Lithuania, Cyprus.
INBOUND (last line, verbatim): Finland, Estonia, Croatia, Spain, Poland, Lithuania.

Conditions, verbatim:
- Consent first: "Sim. Para autorizar a partilha dos seus dados de saúde de forma a garantir que as suas prescrições irão estar disponíveis para dispensa nos Estados-Membros aderentes, deve aceder ao serviço de Autorizações do Portal SNS 24." (Yes. To authorise the sharing of your health data so that your prescriptions are available for dispensing in the participating Member States, use the Authorisations service of the SNS 24 portal.)
- At the pharmacy: "é necessário fornecer o número de utente, o ID da prescrição e o respetivo PIN. Para tal, deve apresentar o Cartão de Cidadão e a prescrição médica (em formato eletrónico ou em papel)." (You must give the user number, the prescription ID and its PIN: show the Citizen Card and the prescription, electronic or on paper.)
- Which pharmacies: "Apenas nas farmácias comunitárias dos países aderentes ao projeto" (only in community pharmacies of the participating countries) and, for inbound, "As farmácias portuguesas aderentes estarão assinaladas com selos específicos, identificando os Estados-Membros compatíveis com o serviço." (Participating Portuguese pharmacies are marked with stamps that identify the compatible Member States.)
- Only prescription medicines: "Aplica-se apenas a medicamentos sujeitos a receita médica, incluídos nas prescrições eletrónicas."
- Nobody else can collect: "A possibilidade de dispensa de receitas de outra pessoa que não o próprio encontra-se fora do âmbito dos serviços transfronteiriços. Aplicando-se também a situações de pais e filhos." (Also applies to parents and children.)
- No reimbursement at the counter: "Neste âmbito não há lugar à comparticipação de medicamentos."

#### 3.5 Croatia

Sources read: HZZO (Hrvatski zavod za zdravstveno osiguranje, the health insurance fund).
- https://hzzo.hr/eu-recepti: about paper prescriptions under Directive 2011/24/EU only; no e-prescription country list.
- https://hzzo.hr/novosti/ostalo/elektronicke-prekogranicne-zdravstvene-usluge-u-eu: a notice dated **20.10.2022**.

**No current official list found.** What the 2022 notice says:

OUTBOUND, verbatim: "Građani Hrvatske koji putuju u Finsku, Estoniju, Portugal i Španjolsku, temeljem neponovljivog e-recepta koji je propisan u Hrvatskoj mogu podići svoje lijekove u zemlji putovanja, pouzdajući se u prekograničnu razmjenu podataka između dvije zemlje. Usluge su dostupne u inozemstvu ako je pacijent putem Portala zdravlja dao privolu za preuzimanje recepta u drugim državama EU-a odnosno dao privolu za dohvat sažetka o pacijentu iz drugih država EU."
(Croatian citizens travelling to Finland, Estonia, Portugal and Spain can collect their medicines in the country of travel on the basis of a non-repeat e-prescription issued in Croatia. The services are available abroad if the patient has given consent through Portal zdravlja for the prescription to be retrieved in other EU states.)

INBOUND, verbatim: "Ljekarnici u Hrvatskoj mogu putem NCPeH portala dohvatiti podatke o pacijentu i elektronički recept propisan u Finskoj, Estoniji, Portugalu, Poljskoj i Španjolskoj."
(Pharmacists in Croatia can retrieve, through the NCPeH portal, patient data and an electronic prescription issued in Finland, Estonia, Portugal, Poland and Spain.)

Conditions in the notice: non-repeat prescriptions only ("neponovljivog e-recepta"); consent through Portal zdravlja; the patient pays in full and may claim from the insurer at home.

Lead, not read: a later HZZO notice about two added services (Croatian prescription in Poland; Czech prescription in Croatia), https://hzzo.hr/novosti/prekogranicne-usluge-e-recepta-obavijest-o-novim-uslugama-hr-ep-pl-ep-b-i-cz-ep-hr-ep-b. The other eight countries' pages list Croatia far more widely than the 2022 notice (see section 2).

#### 3.6 Czechia

Source: epreskripce.gov.cz, "Oficiální web elektronické preskripce", run by SÚKL (the State Institute for Drug Control). https://epreskripce.gov.cz/o-ereceptu/preshranicni-erecept/. Date: none visible; the page's meta tag says article:modified_time 2026-08-05T09:46:23+00:00.

Heading: "Seznam zemí, kde lze vyzvednout léky na eRecept vystavený v ČR" (List of countries where medicines can be collected on an eRecept issued in the Czech Republic). Table, verbatim. Column 1: "Možnost vyzvednout léky na eRecept vystavený v ČR" (possible to collect medicines on an eRecept issued in the Czech Republic) = OUTBOUND. Column 2: "Možnost vyzvednout léky v ČR na eRecept vystavený v uvedeném státě" (possible to collect medicines in the Czech Republic on an e-prescription issued in that state) = INBOUND.

| Stát | Outbound | Inbound |
|---|---|---|
| Estonsko | ANO | ANO |
| Finsko | ANO | ANO |
| Chorvatsko | ANO | NE |
| Kypr | ANO | ANO |
| Litva | ANO | ANO |
| Lotyšsko | ANO | ANO |
| Polsko | ANO | ANO |
| Portugalsko | NE | ANO |
| Rakousko | ANO | ANO |
| Řecko | ANO | ANO |
| Španělsko | ANO | ANO |

(ANO = yes, NE = no. Rakousko = Austria, Řecko = Greece, Lotyšsko = Latvia, Litva = Lithuania, Kypr = Cyprus.)

Conditions: none on this page. The site has sub-pages "Důležité informace", "Aktivní zahraniční lékárny" (active foreign pharmacies) and "Aktivní české lékárny" (active Czech pharmacies), not read. Inference from the sub-page titles: the service runs in listed pharmacies only, both abroad and in Czechia; Spain's and Estonia's pages say the same about Czech pharmacies.

#### 3.7 Latvia

Source: Latvijas Digitālās veselības centrs, the national e-health portal. https://eveseliba.gov.lv/sakums/pārrobežu-e-veselības-pakalpojumi (percent-encoded: https://eveseliba.gov.lv/sakums/p%C4%81rrobe%C5%BEu-e-vesel%C4%ABbas-pakalpojumi). Date: no date shown; the site footer carries a build stamp "v3.0.0.0 - 17.11.2026 22:20", which is not a page date.

Prose, verbatim: "No 2024. gada 4. marta Latvijā izrakstītas e-receptes zāles var iegādāties, atrodoties citā Eiropas Savienības (ES) dalībvalstī. [...] Pārrobežu e-receptes datu apmaiņu ar Latviju ir uzsākusi Austrija, Čehija, Grieķija, Igaunija, Horvātija, Kipra, Lietuva, Polija, Portugāle, Somija, Spānija, savukārt citas valstis pievienosies pakāpeniski. Valstu saraksts tiks atjaunots šajā sadaļā."
(Since 4 March 2024 medicines on an e-prescription issued in Latvia can be bought in another EU Member State. Cross-border e-prescription data exchange with Latvia has been started by Austria, Czechia, Greece, Estonia, Croatia, Cyprus, Lithuania, Poland, Portugal, Finland and Spain; other countries will join gradually. The list of countries will be updated in this section.)

The directions are in two images linked from that paragraph (read as images):
- Latvian: https://eveseliba.gov.lv/docs/default-source/default-document-library/35a0000ffe8d660a8a6b5c5af7ecc9a47.png?sfvrsn=77d66010_0, titled "Valstu saraksts, ar kurām Latvijai notiek e-receptes pārrobežu datu apmaiņa"
- English: https://eveseliba.gov.lv/docs/default-source/default-document-library/45a0000ffe8d660a8a6b5c5af7ecc9a56.png?sfvrsn=77d66001_0, titled "Countries participating in cross-border e-prescription data exchange with Latvia"

Column heads, verbatim: "Latvija nodod e-recepšu datus. Latvijas iedzīvotāji var atprečot e-receptes citu ES valstu aptiekās" / "Latvia transfers e-prescription data. Citizens of Latvia can obtain medication prescribed via ePrescriptions in pharmacies in country B" = OUTBOUND. "Latvija saņem e-recepšu datus. ES valstu iedzīvotāji var atprečot e-receptes Latvijas aptiekās" / "Latvia receives e-prescription data. Citizens of country A can obtain medication prescribed via ePrescriptions in pharmacies in Latvia" = INBOUND.

| Country (as in the English image) | Outbound | Inbound |
|---|---|---|
| Austria | ✔ | ✔ |
| Czechia | ✔ | ✔ |
| Estonia | ✔ | ✔ |
| Greece | ✔ | ✔ |
| Croatia | ✔ | ✔ |
| Cyprus | ✔ | ✔ |
| Lithuania | ✔ | ✔ |
| Poland | ✔ | ✔ |
| Portugal | (empty) | ✔ |
| Finland | ✔ | ✔ |
| Spain* | ✔ | ✔ |

Footnote, verbatim: "*Šobrīd e-receptes atprečošana ir iespējama tikai daļā valsts reģionu" / "*The dispensation of ePrescriptions is currently available in select regions of Spain".

Conditions, verbatim:
- "Aptiekā jāuzrāda savs personu apliecinošs dokuments (pase vai eID karte) farmaceitam vai farmaceita asistentam." (Show your identity document, passport or eID card, at the pharmacy.)
- "Citā dalībvalstī nevarēs iegādāties Latvijā izrakstītās e-receptes zāles, ja tās satur psihotropās vai narkotiskās vielas. Nevarēs iegādāties arī tās zāles, kas e-receptē norādītas brīvā teksta formā (piemēram, zāles, kuras aptiekas izgatavo pēc pasūtījuma u.c.)." (Medicines containing psychotropic or narcotic substances cannot be bought in another Member State on a Latvian e-prescription, nor medicines written as free text, such as pharmacy-made ones.)
- "Citā dalībvalstī nevarēs iegādāties Latvijā izrakstītās e-receptes ar aktīvo vielu." (E-prescriptions written by active substance cannot be bought in another Member State.)
- Partial purchase only where the other country supports it: "Dalītās e-receptes zāļu iegādes iespējas nenodrošina visas valstis."
- A parent, guardian or delegated person may act for the patient "Dalībvalstīs, kurās tas tiek atļauts" (in Member States that allow it).
- Full price abroad, refund claim to the Nacionālais veselības dienests afterwards.

Not read: the two PDFs linked as "Informatīvie materiāli" (for Latvian residents; for foreign tourists using an EU e-prescription in Latvia).

#### 3.8 Lithuania

Source: esveikata.lt, the national e-health portal (operator Registrų centras, under the Ministry of Health). https://www.esveikata.lt/tarpvalstybinis-e-receptas. Date: no date shown.

Under "Kuriose šalyse galima pasinaudoti tarpvalstybinio elektroninio recepto paslauga?" (In which countries can the cross-border e-prescription service be used?) a table. Columns, verbatim: "Lietuva perduoda e. recepto duomenis" (Lithuania transmits e-prescription data) = OUTBOUND; "Lietuva gauna e.recepto duomenis" (Lithuania receives e-prescription data) = INBOUND.

| Šalis | Outbound | Inbound |
|---|---|---|
| Latvija | ✔ | ✔ |
| Lenkija (Poland) | ✔ | ✔ |
| Ispanija | ✔ | ✔ |
| Graikija (Greece) | ✔ | ✔ |
| Portugalija | ✔ | ✔ |
| Estija | ✔ | ✔ |
| Čekija | ✔ | ✔ |
| Suomija (Finland) | ✔ | ✔ |
| Kroatija | ✔ | ✔ |
| Kipras (Cyprus) | ✔ | ✔ |

"Pastaba. Sąrašas bus atnaujinamas pradedant vykdyti duomenų mainus su kitomis prie paslaugų prisijungusiomis ES ir EEE šalimis." (Note: the list will be updated as exchange starts with other EU and EEA countries.)

Conditions, verbatim:
- ID: "pacientas vaistinėje privalo pateikti galiojantį asmens dokumentą" and "Atvykę į vaistinę farmacijos specialistui turite pateikti asmens dokumentą (pasą arba ID kortelę)." (The patient must show a valid identity document: passport or ID card.)
- Spain: "Atkreipiame dėmesį, kad šie regionai dar neprisijungia prie šios paslaugos: La Rioja, Balearų salos, Astūrija." (These regions have not yet joined the service: La Rioja, the Balearic Islands, Asturias.) **Conflicts with Spain's own August 2026 list, see section 2, flag 3.** The page also links lists of the Spanish and Czech pharmacies that serve the service.
- Whole quantity: "Svarbu! Lietuvos pacientai kitoje ES/EEE valstybėje turi įsigyti visą Lietuvoje išrašyto vaisto kiekį." (Lithuanian patients must buy the whole prescribed quantity in the other state.)
- Exclusions: "Su tarpvalstybiniu e. receptu negalima įsigyti: Narkotinių vaistų; Kai kuriose valstybėse gali būti taikomi ribojimai įsigyti psichotropinius vaistus; Ekstemporalųjų vaistų; Vardinių vaistų; Medicinos pagalbos priemonių" (Not available: narcotic medicines; some states may restrict psychotropic medicines; compounded medicines; named-patient medicines; medical aids.)
- Time-limited exclusion: "Svarbu! Lietuvos valstybė iki 2027 m. sausio 3 d. kitoms ES ar EEE valstybėms neperduos receptų, kuriuose išrašyti įkvepiamieji vaistai, milteliai, milteliai, skirti injekciniam ar infuziniam tirpalui ruošti, ar skystos ir minkštos farmacinės formos vaistai, duomenų." (Until 3 January 2027 Lithuania will not transmit prescriptions for inhaled medicines, powders, powders for injection or infusion solutions, or liquid and semi-solid forms.)
- Full price abroad; refund claim to the territorial health insurance fund (TLK).

#### 3.9 Greece

Source: ncpehealth.gr, the site of the Greek National Contact Point for eHealth (run by ΗΔΙΚΑ / ΗΔΥΚΑ, designated by law 4715/2020 art. 23 as amended by law 4931/2022 art. 28, as the page itself says). https://www.ncpehealth.gr/myhealthateu.html. Date: none visible; HTTP Last-Modified Wed, 26 Aug 2026.

Section "Διαθεσιμότητα υπηρεσιών στην ΕΕ", table "Συνεργασία Ελλάδας με Ευρωπαϊκές Χώρες" (Greece's cooperation with European countries). Columns: "Προβολή Συνοπτικού Ιστορικού Υγείας από Ιατρό" (patient summary) and "Εκτέλεση Συνταγών από Φαρμακοποιό" (dispensing of prescriptions by a pharmacist), each split into "Στην Ελλάδα" (in Greece) and "Στo εξωτερικό" (abroad).

**The cells are icons, not text.** I read them from the page's markup: a coloured circle with a tick versus a grey circle with a cross. I take "in Greece" as INBOUND and "abroad" as OUTBOUND; the page has no legend, so that mapping is my reading. Prescription columns:

| Χώρα | In Greece (inbound) | Abroad (outbound) |
|---|---|---|
| Ισπανία (Spain) | ✔ | ✔ |
| Πολωνία (Poland) | ✔ | ✔ |
| Εσθονία (Estonia) | ✔ | ✔ |
| Λιθουανία (Lithuania) | ✔ | ✔ |
| Τσεχία (Czechia) | ✔ | ✔ |
| Κύπρος (Cyprus) | ✔ | ✔ |
| Πορτογαλία (Portugal) | ✔ | ✗ |
| Λουξεμβούργο (Luxembourg) | ✗ | ✗ |
| Ιρλανδία (Ireland) | ✗ | ✗ |
| Γαλλία (France) | ✗ | ✗ |
| Λετονία (Latvia) | ✔ | ✔ |
| Ολλανδία (Netherlands) | ✗ | ✗ |

The Portugal row supports the mapping: Portugal's own page lists Greece as a place where Portuguese prescriptions are dispensed and does not list Greece among the issuers dispensed in Portugal.

Conditions, verbatim:
- ID: "Το αναγνωριστικό ασθενή του πολίτη που διαβιεί στην Ελλάδα είναι ο ΑΜΚΑ, ενώ τα ταυτοποιητικά έγγραφα που δύναται να επιδεικνύει είναι η αστυνομική ταυτότητα ή το διαβατήριο." (The patient identifier of a person living in Greece is the AMKA; the identity documents that may be shown are the police identity card or the passport.)
- Inbound, all pharmacies: "Στην Ελλάδα ο επισκέπτης Ευρωπαίος πολίτης δύναται να εξυπηρετηθεί από το σύνολο των φαρμακείων της χώρας" (In Greece the visiting European citizen can be served by all of the country's pharmacies.)
- Outbound: "Οι ηλεκτρονικές συνταγές φαρμάκων που είναι έγκυρες στην Ελλάδα, είναι έγκυρες και στα συνεργαζόμενα Κράτη Μέλη της ΕΕ. [...] Τα σημεία εξυπηρέτησης ορίζονται από τη χώρα προορισμού." (E-prescriptions valid in Greece are also valid in the cooperating Member States. The service points are defined by the destination country.)
- Exclusions: "Οι εξαιρέσεις αυτές αφορούν σε συνταγές όπου η συνταγογράφηση έχει γίνει με εμπορική ονομασία, συνταγές με εμβόλια, με φάρμακα εξωτερικού μέσω ΙΦΕΤ, με γαληνικά σκευάσματα, με εμβόλια απευαισθητοποίησης, με σκιαγραφικά, με φάρμακα παρεντερικής διατροφής [...], καθώς και συνταγές με φάρμακα χορηγούμενα σε νοσοκομεία." (Excluded: prescriptions written by brand name, vaccines, medicines imported through IFET, galenic preparations, desensitisation vaccines, contrast media, parenteral nutrition, and hospital-administered medicines.)
- Full price abroad; refund depends on the insurer at home.

Also read, for history only: ΗΔΙΚΑ press release of 12 Sep 2024 (meta published 2024-09-12), https://www.idika.gr/idika-epekteinetai-to-systima-periagogis-ton-ypiresion-ygeias-stin-e-e/: Lithuania and Czechia added on 2 September 2024; Poland in November 2023; Estonia in February 2024; "δίνοντας μόνο τον ΑΜΚΑ και την αστυνομική ταυτότητα ή το διαβατήριό του" (giving only the AMKA and the police ID or passport). It is the page that points to ncpehealth.gr for availability.

Read, no list: https://www.ehealthrecord.gov.gr/e-u-health-care (general text on Directive 2011/24/EU, the EHIC and the contact point at EOPYY).

### 4. Not reached or not read

- **Germany, Sweden: not reached** (budget).
- Austria, Cyprus: own pages not read (out of scope).
- Croatia: no current list; the later HZZO notice named in 3.5 not read; zdravlje.gov.hr and Portal zdravlja not searched.
- Spain: "Mapa de situación actual del servicio" (mapaRecetaUE.htm) not read; the "Situación y evolución del proyecto" PDF not read.
- Czechia: sub-pages "Důležité informace", "Aktivní zahraniční lékárny", "Aktivní české lékárny", FAQ not read (ID to show, consent, exclusions).
- Estonia: the "Loe lähemalt" page on the cross-border e-prescription and the pharmacist FAQ (https://www.tehik.ee/kkk-eesti-apteekrile-seoses-piiriulese-digiretseptiga) not read.
- Latvia: the two information PDFs not read.
- Lithuania: the per-country notes behind "(spauskite toliau)" not read.
- Greece: the linked page on which services are available in which countries, and the page on valid identity documents and service points, not read.

### 5. URLs fetched (in order), with result

1. https://pacjent.gov.pl/poznaj-e-recepte-transgraniczna : 200
2. https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/home.htm : TLS handshake failure with curl; 200 with Node on the second try
3. https://www.sns24.gov.pt/guia/a-minha-saude-na-europa/prescricao-eletronica-e-dispensa-de-medicamentos-na-europa/ : 200 after redirect to https://www.sns24.gov.pt/pt/servico/receitas-e-medicamentos-na-europa/
4. https://hzzo.hr/eu-recepti : 200 (paper prescriptions only)
5. https://eveseliba.gov.lv/sakums/p%C4%81rrobe%C5%BEu-e-vesel%C4%ABbas-pakalpojumi : 200
6. https://www.esveikata.lt/tarpvalstybinis-e-receptas : 200
7. https://www.ehealthrecord.gov.gr/e-u-health-care : 200 (no list)
8. https://hzzo.hr/novosti/ostalo/elektronicke-prekogranicne-zdravstvene-usluge-u-eu : 200
9. https://epreskripce.gov.cz/ : 200 (to find the page)
10. the two Latvian PNGs : failed with Node (malformed response header), 200 with curl
11. https://www.idika.gr/idika-epekteinetai-to-systima-periagogis-ton-ypiresion-ygeias-stin-e-e/ : 200
12. https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/docs/Servicio_activo_REeuropa.pdf : 200
13. https://epreskripce.gov.cz/o-ereceptu/preshranicni-erecept/ : 200
14. https://www.ncpehealth.gr/myhealthateu.html : 200
15. https://teabekeskus.tehik.ee/et/teenused/tis-teenused/piiriulene-terviseandmete-andmevahetus : 200
16. https://tehik.ee/piiriulene-andmevahetus : 200 (as https://www.tehik.ee/piiriulene-andmevahetus)
17. https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/docs/condiciones_servicio.pdf : 200

---

## EU sources on using a prescription in another country: notes

Read on 26 Nov 2026 (fetches made between about 09:00 and 09:30 UTC). 26 requests in all.

How to read these notes:
- "The page says" is followed by a verbatim quote. Line breaks inside the source's sentences have been removed; nothing else is changed.
- "Inference" marks anything that is my reading and not the page's own words.
- "Not stated" means the pages I fetched do not say it. Nothing here is filled in from memory.

### Headline findings

1. The Commission's page no longer carries a services-by-country table. Under "Which services are available in which countries?" it has one sentence that links to a KPI dashboard (a JavaScript app on ArcGIS). No list of countries that send or receive ePrescriptions, no dates, no country pairs.
2. The only country pair any fetched EU page states is on Your Europe: ePrescriptions issued in Finland can be used in Croatia, Estonia and Portugal. It is given as an example, not as a complete list.
3. Your Europe sends readers to the Commission page for "the list of available electronic cross-border health services". That page has no such list. The reference leads nowhere.
4. The only per-country material on the Commission's site is the set of 19 "Patient Information Notices" pages. I fetched one (Finland). They show which notices exist per country (ePrescription A = home country, ePrescription B = country of travel), which is indirect evidence, not a statement that a service is live.
5. Paper prescriptions: the rule, the list of required contents, and the position of Iceland, Liechtenstein, Norway and Switzerland are all stated plainly on Your Europe, in English and Finnish, last checked 26/08/2026.
6. EUR-Lex itself could not be fetched (bot check). The legal texts were read from the Publications Office's repository, which holds the same CELEX documents.

---

### A. MyHealth@EU, ePrescription and eDispensation

#### A.1 The Commission page

URL asked for: https://health.ec.europa.eu/ehealth-digital-health-and-care/electronic-cross-border-health-services_en
Redirects to: https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services_en (HTTP 200)
Title: "Electronic cross-border health services"
Date shown on the page: none. In the page's embedded metadata (JSON-LD, not visible to a reader): `"datePublished": "2025-04-23T16:25:16+02:00"`, `"dateModified": "2026-03-02T09:20:48+01:00"`.

The page says (whole of the relevant text):

> "The eHealth Digital Service Infrastructure (eHDSI) is an infrastructure ensuring the continuity of care for European citizens while they are travelling abroad in the EU. This gives EU countries the possibility to exchange health data in a secure, efficient and interoperable way. Citizens can easily recognise the availability of the services under the brand “MyHealth @ EU”."

> "The following 2 electronic cross-border health services are currently being introduced in all EU countries:"

> "ePrescription and eDispensation (eHealth Network guidelines on ePrescription, Release notes) allows EU citizens to obtain their medication in a pharmacy located in another EU country, thanks to the online transfer of their electronic prescription from their country of residence where they are affiliated, to their country of travel."

> "In the long term, medical images, lab results and hospital discharge reports will also be available across the EU, with the full health record to follow later on. The exchange of ePrescriptions and Patient Summaries is open to all the EU countries."

> "Many EU/EEA countries are implementing these services."

Under the heading "Which services are available in which countries?" the page says only:

> "The eHDSI Monitoring Framework (KPIs) offers a variety of maps featuring key performance indicators related to the MyHealth@EU monitoring framework. These maps provide detailed insights into the performance and effectiveness of health services across the European Union."

The link goes to https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/1_1/

What the page does not have: a table or map of services by country, any country named as offering ePrescription, any date a country joined, any pairs, any sentence telling readers to check with a national contact point, any link to Your Europe's ePrescription text other than the two "Related information" links ("Presenting a prescription abroad (Your Europe)" and "FAQ on presenting a prescription abroad (Your Europe)").

The one per-country element is a table headed "Patient Information Notices (PINs) translations per country", sub-headed "List of EU countries". It lists 29 countries. Some names are links to a notice page, some are plain text:

- Linked (19): Austria, Latvia, Lithuania, Croatia, Luxembourg, Cyprus, Malta, Czechia, Netherlands, Norway, Estonia, Poland, Finland, Portugal, France, Greece, Slovenia, Spain, Iceland.
- Listed without a link (10): Italy, Belgium, Bulgaria, Denmark, Romania, Germany, Slovakia, Hungary, Sweden, Ireland.
- Not listed: Liechtenstein, Switzerland.

Note that the table sits under "List of EU countries" but includes Norway and Iceland.

#### A.2 The second URL

https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services/myhealtheu_en returned HTTP 404. The first page links to no "MyHealth@EU" page as a current home, only to two publications (A.5).

#### A.3 The KPI dashboard the Commission links to

It is a JavaScript application, so a plain fetch of the page returns no content. I read its public description and configuration (what the app itself loads), not its data:
- https://www.arcgis.com/sharing/rest/content/items/77f459be23e545b48f46a79cfaf19423?f=json : title "eHDSI Monitoring Framework (KPIs)", owner "sante_gis", access "public", last modified 25 March 2025 (timestamp 1742919403000).
- Its configuration (`/data?f=json`, published 25 March 2025) has 25 pages labelled by KPI number (1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8.x, 1.9.1 to 1.9.4, 1.10.1, 1.10.2, 1.11, 1.12, 3.3, 3.4, 7.1 to 7.4; pages 1.8.1 to 1.8.4 are hidden), each embedding another dashboard.
- The only text in it besides the title "MyHealth@EU Monitoring Framework (KPIs)" is this notice:

> "Please note that the MyHealth@EU Monitoring Framework KPIs are currently undergoing revision for the purpose of increasing the accuracy of the data on cross-border transactions published on this website."

- Page 1.1's embedded dashboard is headed "KPI-1.1 - " with the subtitle "Number of Countries with Operational NCPeH"; its quarter selector, as configured, runs from "2019 Q4" to "2025 Q2". Its data layer has the fields Member_State, Year, Quarter and Is_Live: one flag per country and quarter, with no split by service (ePrescription or Patient Summary) and no split by direction.
- Page 1.2's embedded dashboard is headed "KPI-1.2" with the subtitle "Number of transactions between Countries", with selectors "MS:", "FROM:", "TO:", "Test?:", "Result:" and "Transaction Type:" (the transaction types are technical: PATIENT_IDENTIFICATION_QUERY, DOCUMENT_LIST_QUERY, DOCUMENT_EXCHANGED_QUERY and their responses).
- Page "1.8.x" embeds https://webgate.ec.europa.eu/santegis/eHDSI/1.8/build/ which returned HTTP 404.

I did not read the dashboard's data. A direct query of the data service behind it was refused by this session's permission system (it is not a plain page fetch), and I did not try another route. So: which countries the dashboard shows as operational, and in which quarter, is not recorded here.

Inference: even if read, this dashboard is monitoring data by quarter (operational contact points, transaction counts), under revision by its own notice, with its newest configured quarter at 2025 Q2. It is not a statement of what a traveller can do today, and KPI-1.1 does not separate ePrescription from Patient Summary.

#### A.4 Your Europe on ePrescriptions

URL: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_en.htm (HTTP 200). "Last checked: 26/08/2026".

The page says, under "E-prescriptions":

> "If your doctor has given you an e-prescription you will usually need to make sure you ask for a paper copy if you plan to use the prescription in another EU country, as the e-prescription may not be available outside your home country."

> "However, some EU countries have implemented interoperable systems for e-prescriptions. For example, e-prescriptions issued in Finland can be used in Croatia, Estonia and Portugal without the need for a paper copy. You can find the list of available electronic cross-border health services here."

("here" links to the Commission page of A.1.)

FAQ, URL: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/faq/index_en.htm (HTTP 200). "Last checked: 26/08/2026".

> "My doctor in Finland always prescribes medicine using electronic prescriptions. Can I use my Finnish e-prescription when I travel to another EU country?"
> "Currently, e-prescriptions issued in Finland can be used cross-border in Croatia, Estonia and Portugal without the need for a paper copy. So, you can use your Finnish e-prescription if you travel to Croatia, Estonia or Portugal, but if you plan to travel to another EU country, you will need to ask your doctor for a paper copy. For e-prescriptions issued in other countries, please see the list of available electronic cross-border health services."

Neither page names MyHealth@EU.

#### A.5 The two publications the Commission page links to

- https://health.ec.europa.eu/publications/myhealtheu-flyer-addressed-patients-and-health-professionals_en : "Publication date 14 October 2020". Description: "This booklet provides information on what ePrescriptions and Patient Summaries services are – and on how to use, and benefit from them."
- https://health.ec.europa.eu/publications/myhealtheu-qa_en : "Publication date 14 October 2020"; file "myhealth_qa_en.pdf", "1 December 2021"; "Available in 8 EU languages" (a Finnish file, myhealth_qa_fi.pdf, is among them).

I did not open the files: they are five and six years old and cannot support a claim about today.

#### A.6 Patient Information Notices: Finland (the one notice page fetched)

URL: https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services/patient-information-notices-finland_en (HTTP 200).
Date shown: none. Embedded metadata: `"datePublished": "2023-07-18T15:45:10+02:00"`, `"dateModified": "2025-11-19T14:59:43+01:00"`.

The page says:

> "Patient Information Notices (PIN) outline how patients’ data and information are accessed, processed and stored by a participating European country for healthcare purposes."

> "ePrescription (eP) allows patients to obtain their medication in a pharmacy outside their EU home country, thanks to the transfer of an electronic prescription to the EU country where they are travelling. Data about the supplied medicinal product will be sent back to their home country."

> "PIN for ePrescription A contains information for patients provided by their home country in their official language(s)."

> "PIN for ePrescription B contains information for patients provided by the country of travel in several available EU languages."

> "Additional information can be found on national health websites." (linked to https://www.kanta.fi/en/citizens)

Then two tables:
- "Patient is a resident from Finland": "ePrescription A" and "Patient summary A" are links (PDF) in English, Finnish and Swedish.
- "Patients travelling to Finland": "ePrescription B" is a link in Croatian, Czech, English, Estonian, Finnish, Greek, Latvian, Lithuanian, Polish, Portuguese, Spanish and Swedish. It is plain text (no document) in Bulgarian, Danish, Dutch, French, Gaelic, German, Hungarian, Italian, Luxemburgish, Maltese, Romanian, Slovak and Slovene. "Patient summary B" is a link in English, Estonian and Swedish only.

Inference, not stated by the page: Finland has issued a notice as home country (A) and as country of travel (B) for ePrescriptions, which fits Finland both sending and receiving. The languages of the B notices (Croatian, Czech, Estonian, Greek, Latvian, Lithuanian, Polish, Portuguese, Spanish, Swedish) suggest which visitors Finland expects, but a language is not a country and the page states no pairs and no dates. Do not publish this as a list of accepted countries.

The other 18 notice pages were not fetched (budget). Each is one small page with the same two tables. URLs, all under https://health.ec.europa.eu :
- /ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services/patient-information-notices-austria_en
- the same path ending in -latvia_en, -croatia_en, -luxembourg_en, -cyprus_en, -malta_en, -czechia_en, -netherlands_en, -norway_en, -estonia_en, -poland_en, -portugal_en, -france_en, -greece_en, -slovenia_en, -spain_en, -iceland_en
- Lithuania's link is different: /patient-information-notices-lithuania_en

#### A.7 The table asked for

Sources for every row: the Commission page (A.1, metadata date 2 Mar 2026), Your Europe (A.4, last checked 26/08/2026) and, for Finland, the notice page (A.6). "Notice page" = how the country appears in the Commission's "Patient Information Notices" table. A linked notice page covers ePrescription and Patient Summary together, so a link alone does not say the country takes part in ePrescription.

| Country | 1. Its ePrescriptions can be dispensed abroad (sender) | 2. Its pharmacies dispense foreign ePrescriptions (receiver) | 3. Pairs given | 4. Limits, dates | Notice page |
|---|---|---|---|---|---|
| AT | not stated | not stated | none | not stated | linked, not fetched |
| BE | not stated | not stated | none | not stated | listed, no link |
| BG | not stated | not stated | none | not stated | listed, no link |
| HR | not stated | Yes for ePrescriptions issued in Finland (Your Europe). Other countries: not stated | receives from FI | "without the need for a paper copy"; since when: not stated | linked, not fetched |
| CY | not stated | not stated | none | not stated | linked, not fetched |
| CZ | not stated | not stated | none | not stated | linked, not fetched |
| DK | not stated | not stated | none | not stated | listed, no link |
| EE | not stated | Yes for ePrescriptions issued in Finland (Your Europe). Other countries: not stated | receives from FI | "without the need for a paper copy"; since when: not stated | linked, not fetched |
| FI | Yes (Your Europe); since when: not stated | not stated in words. Notice page has "Patients travelling to Finland" with "ePrescription B" documents (inference: yes) | sends to HR, EE, PT (Your Europe, given as an example) | Your Europe: for any other EU country "you will need to ask your doctor for a paper copy" | linked, fetched |
| FR | not stated | not stated | none | not stated | linked, not fetched |
| DE | not stated | not stated | none | not stated | listed, no link |
| GR | not stated | not stated | none | not stated | linked, not fetched |
| HU | not stated | not stated | none | not stated | listed, no link |
| IE | not stated | not stated | none | not stated | listed, no link |
| IT | not stated | not stated | none | not stated | listed, no link |
| LV | not stated | not stated | none | not stated | linked, not fetched |
| LT | not stated | not stated | none | not stated | linked, not fetched |
| LU | not stated | not stated | none | not stated | linked, not fetched |
| MT | not stated | not stated | none | not stated | linked, not fetched |
| NL | not stated | not stated | none | not stated | linked, not fetched |
| PL | not stated | not stated | none | not stated | linked, not fetched |
| PT | not stated | Yes for ePrescriptions issued in Finland (Your Europe). Other countries: not stated | receives from FI | "without the need for a paper copy"; since when: not stated | linked, not fetched |
| RO | not stated | not stated | none | not stated | listed, no link |
| SK | not stated | not stated | none | not stated | listed, no link |
| SI | not stated | not stated | none | not stated | linked, not fetched |
| ES | not stated | not stated | none | not stated | linked, not fetched |
| SE | not stated | not stated | none | not stated | listed, no link |
| IS | not stated | not stated | none | not stated | linked, not fetched |
| LI | not stated | not stated | none | not stated | not listed |
| NO | not stated | not stated | none | not stated | linked, not fetched |
| CH | not stated | not stated | none | not stated | not listed |

Verbatim basis for the HR, EE, FI and PT rows: "For example, e-prescriptions issued in Finland can be used in Croatia, Estonia and Portugal without the need for a paper copy." (https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_en.htm, last checked 26/08/2026) and "Currently, e-prescriptions issued in Finland can be used cross-border in Croatia, Estonia and Portugal without the need for a paper copy." (FAQ, same date).

Basis for every "not stated": the Commission page's only general statements are "The following 2 electronic cross-border health services are currently being introduced in all EU countries" and "Many EU/EEA countries are implementing these services." It names no country as live.

Answer to question 3 in one line: no page gives pairs except the Finland example; the Commission page neither lists the countries that offer the service nor tells readers to check with a national contact point; it points to the KPI dashboard.

---

### B. Paper prescriptions: the general rule (Your Europe)

#### B.1 English

URL: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_en.htm (no redirect, HTTP 200)
Title: "Presenting a prescription in another EU country"
"Last checked: 26/08/2026" (meta `last-modified` 26/08/2026; meta `date` 01/01/2022)

Validity:

> "A prescription delivered by a doctor in one EU country is valid in all other EU countries. However, a medicine prescribed in one country might not be available or it may have another name."

"EU countries" in that sentence carries a note (a tooltip in the page's HTML, `title` and `aria-label`):

> "In this case, the 27 EU member states + Iceland, Liechtenstein and Norway"

So Iceland, Liechtenstein and Norway are included. Switzerland is not named on this page. The FAQ names it (B.3).

> "You can ask your doctor to give you a prescription to use in another EU country, also known as a "cross-border prescription"."

Warning box:

> "Some medicines may not be authorised for sale or may not be available in another country, even within the EU."

What a prescription must contain ("A prescription with the right information"):

> "There is no specific form or format for a prescription you will use in another EU country. In most cases, the prescription you would use in the country where the prescription was issued should already contain enough information for you to use it in another EU country. It has to contain at least the following information:"
> - "Patient details: surname and first name (both written in full), and date of birth"
> - "Date of issue of the prescription"
> - "Details of the prescribing doctor: surname and first name (written in full), professional qualification, direct contact details, work address (including the country), and signature (written or digital)"
> - "Details of the prescribed product: its common name (rather than the brand name, which may be different in another country), format (tablet, solution, etc.), quantity, strength and dosage."

> "If you think you'll need to get your prescription dispensed abroad, or if you are given a prescription abroad that you will need to get dispensed in your home country, check that the doctor has included all this information. That way you can be sure that a pharmacist in another EU country can easily understand the prescription and correctly identify the medicine you are requesting and its dose."

National rules (warning box):

> "The dispensation of prescriptions is subject to the rules of the country where they are dispensed. This means that a pharmacist will apply national rules when dispensing your medicine – for example, time or dosage limitations to dispensation of prescriptions."

ePrescriptions: quoted in A.4.

Paying and reimbursement: not stated on this page. It is on a sibling page (B.4).

#### B.2 Finnish

URL: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_fi.htm (HTTP 200)
Title: "Reseptilääkkeen ostaminen toisesta EU-maasta"
"Tarkistettu viimeksi: 26/08/2026"

> "Lääkärin jossakin EU-maassa kirjoittama lääkeresepti kelpaa kaikissa EU-maissa. Yhdessä maassa saatavilla oleva lääke ei kuitenkaan välttämättä ole myynnissä jossain toisessa maassa, tai sillä voi olla eri nimi."

Note on "EU-maissa":

> "Tässä tapauksessa EU:n 27 jäsenmaata sekä Islanti, Liechtenstein ja Norja"

> "Voit pyytää lääkäriltäsi toisessa EU-maassa kelpaavan lääkemääräyksen eli nk. eurooppalaisen lääkemääräyksen."

Box headed "Tärkeää":

> "Joillakin lääkkeillä ei ole välttämättä myyntilupaa tai niitä ei ole saatavana toisessa maassa edes EU:n alueella."

"Oikeat tiedot lääkemääräykseen":

> "Toisessa EU-maassa käytettävälle lääkemääräykselle ei tarvita erityistä lomaketta, vaan useimmissa tapauksissa EU-maassa tavanomaisesti käytetyn lääkemääräyksen tiedot riittävät toisessakin EU-maassa. Lääkemääräyksen on sisällettävä vähintään seuraavat tiedot:"
> - "tiedot potilaasta: sukunimi ja etunimi (kumpikin kokonaisuudessaan) ja syntymäaika"
> - "lääkemääräyksen antamispäivä"
> - "lääkärin tiedot: sukunimi ja etunimi (kokonaisuudessaan), ammatillinen pätevyys, suorat yhteystiedot, työosoite (myös maa) ja allekirjoitus (kirjallinen tai digitaalinen)"
> - "määrätyn tuotteen nimi: yleisnimi (ei kauppanimeä, joka voi olla eri toisessa maassa), muoto (tabletti, liuos tmv.), määrä, vahvuus ja annostus."

> "Jos sinun on hankittava kotimaasi lääkemääräyksen lääkkeet ulkomailla, tai saat ulkomailla lääkemääräyksen, jonka lääkkeet sinun on saatava kotimaassasi, varmista että lääkäri kirjoittaa siihen vaadittavat tiedot. Tämä varmistaa, että resepti on ymmärrettävissä toisen EU-maan apteekissa, ja saat oikean lääkkeen ja annostuksen."

Box headed "Tärkeää":

> "Reseptilääkkeen myymiseen sovelletaan sen maan sääntöjä, jossa lääke ostetaan. Apteekissa siis sovelletaan lääkettä luovutettaessa maan omia kansallisia sääntöjä – esimerkiksi lääkemääräysten toimittamiselle asetettuja aika- tai annosrajoituksia."

"Sähköiset lääkemääräykset":

> "Jos saat sähköisen lääkemääräyksen, sinun on tavallisesti pyydettävä lääkäriltä myös paperikopio, jos aiot käyttää sitä toisessa EU-maassa. Pelkkä sähköinen lääkemääräys ei välttämättä ole käytössä muualla."

> "Jotkin EU-maat ovat kuitenkin ottaneet käyttöön yhteentoimivia järjestelmiä sähköisiä lääkemääräyksiä varten. Esimerkiksi Suomessa annetut sähköiset lääkemääräykset käyvät tällä hetkellä Kroatiassa, Portugalissa ja Virossa ilman paperikopion tarvetta. Luettelo valtioiden rajat ylittävistä sähköisistä terveyspalveluista"

#### B.3 The FAQ, English and Finnish

English: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/faq/index_en.htm , "Last checked: 26/08/2026"
Finnish: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/faq/index_fi.htm , "Tarkistettu viimeksi: 26/08/2026"

Iceland, Liechtenstein, Norway, Switzerland:

> "Can I use a prescription from an EU country in Iceland, Liechtenstein, Norway or Switzerland as well as within the EU?"
> "YES - The rules on cross-border prescriptions also apply in Iceland, Liechtenstein and Norway."
> "NO - Switzerland is not covered by the agreement on recognition of cross-border prescriptions, and is therefore not obliged to accept prescriptions from other EU countries. Neither are the EU countries obliged to recognise prescriptions from Switzerland."

> "Voinko käyttää EU-maassa saamaani reseptiä muiden EU-maiden lisäksi Islannissa, Liechtensteinissa, Norjassa tai Sveitsissä?"
> "KYLLÄ – Rajat ylittäviä lääkemääräyksiä koskevat säännöt pätevät myös Islantiin, Liechtensteiniin ja Norjaan."
> "ET – Sveitsi ei kuulu rajat ylittävien lääkemääräysten tunnustamisesta tehtyyn sopimukseen, eikä maan apteekkien siksi tarvitse hyväksyä EU-maiden lääkemääräyksiä. EU-maiden ei myöskään tarvitse tunnustaa Sveitsissä annettuja lääkemääräyksiä."

A medicine not sold, or sold under another name:

> "YES - A medicine available in one EU country might not be sold in another EU country, or it might be sold under a different brand name. When asking for a prescription from your doctor that you intend to dispense in another EU country, you should ensure they use the common name for the prescribed product wherever possible. This will enable a pharmacist in another EU country to dispense you the equivalent product in that country. To find out if your medicine is available in other EU countries, you can check with your country's National Contact Point."

> "KYLLÄ – Yhdessä EU-maassa saatavilla oleva lääke ei välttämättä ole myynnissä jossain toisessa EU-maassa, tai sillä voi olla eri nimi. Kun pyydät lääkäriltä reseptiä, jonka aiot käyttää toisessa EU-maassa, varmista, että siinä käytetään mahdollisuuksien mukaan tuotteen yleisnimeä. Tämä varmistaa, että saat toisen EU-maan apteekissa vastaavan tuotteen. Voit tarkistaa lääkkeesi saatavuuden toisessa EU-maassa oman maasi kansallisesta yhteyspisteestä."

("National Contact Point" links to https://europa.eu/youreurope/citizens/health/planned-healthcare/get-more-info/index_en.htm , not fetched.)

A pharmacy that refuses:

> "NO - If the prescription includes the required information, the pharmacy should dispense your prescription, provided the medicine is also available in Spain. In these circumstances, you can contact the country's National Contact Point."

> "EI – Jos reseptissä on vaaditut tiedot, apteekin on myytävä lääkettä, edellyttäen että se on kaupan myös Espanjassa. Voit tällaisessa tilanteessa ottaa yhteyttä kansalliseen yhteyspisteeseen."

National time limits (the FAQ's own example names Czechia):

> "YES - The EU patients' rights directive states that medicines have to be dispensed in line with national rules. In Czechia prescriptions have to be dispensed within 14 days. Therefore, under Czech law, your prescription is no longer valid and the pharmacist does not have to dispense the medicine."

> "KYLLÄ – EU:n potilasdirektiivissä säädetään, että lääkkeiden myynnissä noudatetaan kansallisia sääntöjä. Tšekissä lääkkeet on ostettava 14 päivän kuluessa reseptin saamisesta. Maan lainsäädännön mukaan reseptisi oli vanhentunut, joten apteekissa toimittiin määräysten mukaisesti."

No special form:

> "NO - Rules on cross-border prescriptions only state which information should be included on the prescription. There is no specific form or format for the prescription."

> "EI – Toisessa EU-maassa kelpaavia lääkemääräyksiä koskevissa säännöissä määrätään vain tiedoista, jotka lääkemääräyksen tulisi sisältää. Mitään erityistä lomaketta ei tarvita, vaan useimmissa tapauksissa EU-maassa tavanomaisesti käytetyn lääkemääräyksen tiedot riittävät toisessakin EU-maassa."

Finnish ePrescription question:

> "Suomessa annetut sähköiset lääkemääräykset käyvät tällä hetkellä Kroatiassa, Portugalissa ja Virossa ilman paperikopion tarvetta. Jos saat Suomessa sähköisen lääkemääräyksen ja haluat käyttää sitä muussa EU-maassa kuin Kroatiassa, Portugalissa tai Virossa, pyydä lääkäriltä myös paperikopio. Muissa maissa annettujen sähköisten lääkemääräysten osalta ks. luettelo saatavilla olevista valtioiden rajat ylittävistä sähköisistä terveyspalveluista."

#### B.4 Paying and reimbursement (sibling page)

English: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/expenses-reimbursements/index_en.htm , "Prescriptions abroad: expenses and reimbursements", "Last checked: 26/08/2026"
Finnish: https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/expenses-reimbursements/index_fi.htm , "Ulkomailta ostettujen reseptilääkkeiden kulut ja korvaukset", "Tarkistettu viimeksi: 26/08/2026"

> "When buying medicine on prescription abroad, you might have to pay the full cost up front, even if you don't at home. You can claim reimbursement from your health insurer when you get home, if the medicine is covered by your national health insurance."
> "Whether or not you have to pay for the prescription medicine abroad, depends on your healthcare cover and the rules of the EU country you're visiting."

> "Kun ostat reseptilääkkeitä ulkomailta, saatat joutua maksamaan lääkkeen koko hinnan heti, vaikkei sinun tarvitsisi tehdä näin kotimaassasi. Voit hakea korvausta sairausvakuutuslaitokselta palattuasi kotimaahan, jos lääke kuuluu oman maasi sairausvakuutuksen piiriin."
> "Se, onko reseptilääkkeestä maksettava ulkomailla vai ei, riippuu sairausvakuutusjärjestelmäsi kattavuudesta ja kohdemaan säännöistä."

> "You will most likely have to pay the full cost of a product dispensed on prescription at the pharmacy if:"
> - "you don't have an EHIC or have forgotten to take your EHIC abroad with you, or"
> - "you have a prescription from another EU country (cross-border prescription)"
> "Make sure you ask the pharmacy for a receipt. Depending on your health insurance cover, you should then request reimbursement from your insurer when you return to your home country."

> "Joudut todennäköisesti maksamaan reseptilääkkeistä apteekissa koko hinnan, jos"
> - "sinulla ei ole eurooppalaista sairaanhoitokorttia tai olet unohtanut ottaa sen mukaan matkalle"
> - "sinulla on toisesta EU-maasta saatu eurooppalainen lääkemääräys."
> "Pyydä apteekista aina maksukuitti. Sairausvakuutusturvasi kattavuudesta riippuen sinun kannattaa ottaa kotimaahan palattuasi yhteyttä kansalliseen sairausvakuutuslaitokseen, jonka kautta voit hakea korvausta."

About a prescription written in the country of travel:

> "The European Health Insurance Card (EHIC) entitles you to receive necessary treatment with the same rights to health care as people insured in the country you are staying in. If you have a prescription from the country you are in, you should present it together with the EHIC when you go to the pharmacy."
> "This means that you will pay the same rate at the pharmacy as someone who is insured in that country. In some EU countries this may mean that you won't pay anything, while in others you may be required to pay some or all of the cost of your prescription."

> "Eurooppalaisen sairaanhoitokortin (EHIC) avulla sinulla on oikeus saada kohdemaassasi välttämätöntä hoitoa samoin ehdoin kuin maan omilla kansalaisilla. Jos olet saanut kohdemaastasi lääkereseptin, esitä se apteekissa yhdessä eurooppalaisen sairaanhoitokorttisi kanssa."
> "Maksat apteekissa saman hinnan lääkkeistä kuin kyseisessä maassa sairausvakuutetut kansalaiset. Joissakin EU-maissa tämä voi tarkoittaa, että et maksa kuluja lainkaan, toisissa taas voit joutua maksamaan kustannukset osittain tai kokonaan."

#### B.5 The EU's own Finnish terms, as used on these pages

| English | Finnish on Your Europe |
|---|---|
| prescription | lääkemääräys; also lääkeresepti, resepti |
| cross-border prescription | eurooppalainen lääkemääräys (main page and reimbursement page); rajat ylittävä lääkemääräys (FAQ) |
| e-prescription | sähköinen lääkemääräys |
| paper copy | paperikopio |
| common name / brand name | yleisnimi / kauppanimi |
| authorised for sale | myyntilupa ("ei ole välttämättä myyntilupaa") |
| dispensing a prescription | lääkemääräyksen toimittaminen; lääkkeen luovuttaminen |
| national rules | kansalliset säännöt |
| National Contact Point | kansallinen yhteyspiste |
| EHIC | eurooppalainen sairaanhoitokortti |
| reimbursement / receipt | korvaus / maksukuitti |
| health insurer | sairausvakuutuslaitos |
| interoperable systems | yhteentoimivat järjestelmät |
| EU patients' rights directive | EU:n potilasdirektiivi |
| Last checked | Tarkistettu viimeksi |

The Finnish pages use two words for "cross-border prescription". The app should pick one and keep to it.

---

### C. The legal texts

#### C.0 Where the text was read

The EUR-Lex URLs given could not be read: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011L0024 and https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012L0052 both answered HTTP 202 with an empty body (an automated-client check), with a direct request and with the fetch tool alike.

The same documents were read from the Publications Office of the EU, which publishes EUR-Lex, by their CELEX numbers:
- http://publications.europa.eu/resource/celex/32011L0024 (Official Journal text, "4.4.2011", "L 88/45")
- http://publications.europa.eu/resource/celex/02011L0024-20250112 (consolidated text, "02011L0024 — EN — 12.01.2025 — 002.003")
- http://publications.europa.eu/resource/celex/32012L0052 (Official Journal text, "22.12.2012", "L 356/68")
- http://publications.europa.eu/resource/celex/22014D0153 (Official Journal text, "22.1.2015", "L 15/78")

If the app cites EUR-Lex URLs, say that the text was read from the Publications Office copy on 26 Nov 2026, or have someone open the EUR-Lex pages in a browser to confirm.

#### C.1 Directive 2011/24/EU, Article 11

"DIRECTIVE 2011/24/EU OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL of 9 March 2011 on the application of patients’ rights in cross-border healthcare"

"Article 11 Recognition of prescriptions issued in another Member State", paragraph 1, in full:

> "1. If a medicinal product is authorised to be marketed on their territory, in accordance with Directive 2001/83/EC or Regulation (EC) No 726/2004, Member States shall ensure that prescriptions issued for such a product in another Member State for a named patient can be dispensed on their territory in compliance with their national legislation in force, and that any restrictions on recognition of individual prescriptions are prohibited unless such restrictions are:
> (a) limited to what is necessary and proportionate to safeguard human health, and non-discriminatory; or
> (b) based on legitimate and justified doubts about the authenticity, content or comprehensibility of an individual prescription.
> The recognition of such prescriptions shall not affect national rules governing prescribing and dispensing, if those rules are compatible with Union law, including generic or other substitution. The recognition of prescriptions shall not affect the rules on reimbursement of medicinal products. Reimbursement of costs of medicinal products is covered by Chapter III of this Directive.
> In particular, the recognition of prescriptions shall not affect a pharmacist’s right, by virtue of national rules, to refuse, for ethical reasons, to dispense a product that was prescribed in another Member State, where the pharmacist would have the right to refuse to dispense, had the prescription been issued in the Member State of affiliation.
> The Member State of affiliation shall take all necessary measures, in addition to the recognition of the prescription, in order to ensure continuity of treatment in cases where a prescription is issued in the Member State of treatment for medicinal products or medical devices available in the Member State of affiliation and where dispensing is sought in the Member State of affiliation.
> This paragraph shall also apply to medical devices that are legally placed on the market in the respective Member State."

Paragraph 5:

> "5. For the purpose of paragraph 1, the Commission shall also adopt, by means of delegated acts in accordance with Article 17 and subject to the conditions of Articles 18 and 19 and no later than 25 October 2012 measures to exclude specific categories of medicinal products or medical devices from the recognition of prescriptions provided for under this Article, where necessary in order to safeguard public health."

Paragraph 6:

> "6. Paragraph 1 shall not apply to medicinal products subject to special medical prescription provided for in Article 71(2) of Directive 2001/83/EC."

Article 3(k):

> "‘prescription’ means a prescription for a medicinal product or for a medical device issued by a member of a regulated health profession within the meaning of Article 3(1)(a) of Directive 2005/36/EC who is legally entitled to do so in the Member State in which the prescription is issued;"

Article 11 reads the same, word for word, in the consolidated text of 12.01.2025 (compared paragraph by paragraph). That consolidated text lists three amending acts: Council Directive 2013/64/EU, Regulation (EU) 2021/2282 and Directive (EU) 2024/2839. Whether a newer consolidated version exists: not checked. Your Europe (last checked 26/08/2026) links to the 12.01.2025 version.

The exceptions the article allows, each from the quote above:
- the medicine must be authorised for marketing in the country of dispensing ("If a medicinal product is authorised to be marketed on their territory");
- dispensing follows the national law of that country ("in compliance with their national legislation in force"; "shall not affect national rules governing prescribing and dispensing ... including generic or other substitution");
- restrictions "necessary and proportionate to safeguard human health, and non-discriminatory" (a);
- "legitimate and justified doubts about the authenticity, content or comprehensibility of an individual prescription" (b);
- the pharmacist's right "to refuse, for ethical reasons", where national rules give it for a domestic prescription too;
- reimbursement rules are not affected;
- paragraph 6: "medicinal products subject to special medical prescription provided for in Article 71(2) of Directive 2001/83/EC" are outside paragraph 1. Which medicines that covers: not stated in the texts fetched (Directive 2001/83/EC was not fetched);
- paragraph 5 lets the Commission exclude categories by delegated act. Whether it has: not stated in the texts fetched.

#### C.2 Commission Implementing Directive 2012/52/EU

"COMMISSION IMPLEMENTING DIRECTIVE 2012/52/EU of 20 December 2012 laying down measures to facilitate the recognition of medical prescriptions issued in another Member State (Text with EEA relevance)"

> "Article 2 Scope This Directive shall apply to prescriptions, as defined in point (k) of Article 3 of Directive 2011/24/EU, which are issued further to a request of a patient who intends to use them in another Member State."

> "Article 3 Content of prescriptions Member States shall ensure that prescriptions contain at least the elements set out in the Annex."

> "Article 5 Transposition 1. Member States shall bring into force the laws, regulations and administrative provisions necessary to comply with this Directive by 25 October 2013 at the latest."

The Annex, in full:

> "ANNEX
> **Non-exhaustive list of elements to be included in medical prescriptions**
> Headings appearing in bold in this Annex are not required to feature in prescriptions
> **Identification of the patient**
> Surname(s)
> First name(s) (written out in full, i.e. no initials)
> Date of Birth
> **Authentication of the prescription**
> Issue date
> **Identification of the prescribing health professional**
> Surname(s)
> First name(s) (written out in full, i.e. no initials)
> Professional qualification
> Details for direct contact (email and telephone or fax, the latter both with international prefix)
> Work address (including the name of the relevant Member State)
> Signature (written or digital, depending on the medium chosen for issuing the prescription)
> **Identification of the prescribed product, where applicable**
> ‘Common name’ as defined by Article 1 of Directive 2001/83/EC of the European Parliament and of the Council of 6 November 2001 on the Community code relating to medicinal products for human use
> The brand name if:
> (a) the prescribed product is a biological medicinal product, as defined in point 3.2.1.1.(b) of Annex I (Part I) to Directive 2001/83; or
> (b) the prescribing health professional deems it medically necessary; in that case the prescription shall shortly state the reasons justifying the use of the brand name
> Pharmaceutical formulation (tablet, solution, etc.)
> Quantity
> Strength, as defined in Article 1 of Directive 2001/83/EC
> Dosage regimen"

(The four headings in bold are bold in the source, as is the Annex's title line; the sentence about headings is in italics there.)

Two recitals worth knowing:

> "(8) As the overall impact of cross-border healthcare is limited, the non-exhaustive list of elements should apply only to prescriptions intended to be used in another Member State."

> "(9) As the principle of mutual recognition of prescriptions derives from Article 56 of the Treaty on the Functioning of the European Union, this Directive does not preclude the Member States from applying the principle of mutual recognition to prescriptions that do not contain the elements set out in the non-exhaustive list. At the same time, nothing in this Directive prevents the Member States from providing that prescriptions drafted on their territory, with a view to be used in another Member State, contain additional elements that are provided for under the rules applicable on their territory, as long as these rules are compatible with Union law."

Whether this directive has been amended since 2012: not checked (only the Official Journal text was read).

#### C.3 The EEA: Norway, Iceland, Liechtenstein

"DECISION OF THE EEA JOINT COMMITTEE No 153/2014 of 9 July 2014 amending Annex X (Services in general) to the EEA Agreement [2015/88]", Official Journal "22.1.2015", "L 15/78". Read at http://publications.europa.eu/resource/celex/22014D0153

> "(1) Directive 2011/24/EU of the European Parliament and of the Council of 9 March 2011 on the application of patients' rights in cross-border healthcare is to be incorporated into the EEA Agreement."

> "(2) Commission Implementing Directive 2012/52/EU of 20 December 2012 laying down measures to facilitate the recognition of medical prescriptions issued in another Member State is to be incorporated into the EEA Agreement."

> "Article 1 The following is added after point 1c (Commission Decision 2011/130/EU) of Annex X to the EEA Agreement: ‘2. 32011 L 0024: Directive 2011/24/EU of the European Parliament and of the Council of 9 March 2011 on the application of patients' rights in cross-border healthcare (OJ L 88, 4.4.2011, p. 45). ... 2a. 32012 L 0052: Commission Implementing Directive 2012/52/EU of 20 December 2012 laying down measures to facilitate the recognition of medical prescriptions issued in another Member State (OJ L 356, 22.12.2012, p. 68).’"

> "Article 3 This Decision shall enter into force on 10 July 2014, provided that all the notifications under Article 103(1) of the EEA Agreement have been made (*1)."
> "(*1) Constitutional requirements indicated."

So the belief was right: it is Decision No 153/2014, and it incorporates both directives. The decision does not name Norway, Iceland or Liechtenstein; it speaks of "the EFTA States" and says the Icelandic and Norwegian language versions "shall be authentic". The date it actually entered into force is not stated in it: entry into force depended on notifications, and the footnote says constitutional requirements were indicated. efta.int was not fetched.

The plain-language official statement that the rule applies in the three countries today is Your Europe's (B.1 and B.3, last checked 26/08/2026): "the 27 EU member states + Iceland, Liechtenstein and Norway" and "The rules on cross-border prescriptions also apply in Iceland, Liechtenstein and Norway."

#### C.4 Switzerland

Official statement found, on Your Europe's FAQ (URL in B.3, last checked 26/08/2026):

> "NO - Switzerland is not covered by the agreement on recognition of cross-border prescriptions, and is therefore not obliged to accept prescriptions from other EU countries. Neither are the EU countries obliged to recognise prescriptions from Switzerland."

Finnish wording in B.3. The directive texts and the EEA decision do not mention Switzerland. The Swiss Federal Office of Public Health was not fetched. Note what the statement says and does not say: "not obliged". Whether Swiss pharmacies accept foreign prescriptions in practice is not stated.

---

### Flags: surprises and tensions between official pages

1. Your Europe's "list" link leads to a page without a list (A.1, A.4). The app cannot source per-country ePrescription claims from the Commission page as it stands today.
2. Your Europe names only Croatia, Estonia and Portugal for Finnish ePrescriptions, as an example ("For example") on the main page but as if complete in the FAQ ("if you plan to travel to another EU country, you will need to ask your doctor for a paper copy"). The Finland notice page carries country-of-travel notices in twelve languages, among them Czech, Greek, Latvian, Lithuanian, Polish, Spanish and Swedish, which hints at a wider network at least in the receiving direction. The two do not contradict each other (one is about Finnish prescriptions abroad, the other about visitors to Finland), but the three-country list should be checked against the Finnish national source (the notice page links to https://www.kanta.fi/en/citizens) before the app repeats it.
3. Your Europe's short list of required contents is narrower than the Annex. Your Europe says "common name (rather than the brand name...)"; the Annex allows the brand name for a biological medicine or where the prescriber "deems it medically necessary" and states the reasons. The Annex also spells out direct contact as "email and telephone or fax, the latter both with international prefix".
4. The Annex applies to prescriptions "issued further to a request of a patient who intends to use them in another Member State" (Article 2), and recital 9 leaves countries free to recognise prescriptions without all the elements. So "must contain" on Your Europe is the safe advice, not a rule that a prescription lacking an element is invalid everywhere.
5. Your Europe's FAQ says a pharmacy "should dispense" when the information is complete and the medicine is available; Article 11 allows more grounds than that (national dispensing rules, doubts about authenticity, content or comprehensibility, ethical refusal, special medical prescriptions). The FAQ's own Czechia answer shows a national time limit defeating a valid prescription.
6. The Commission's notice table is headed "List of EU countries" but includes Norway and Iceland; the page's text says "EU/EEA countries". Liechtenstein and Switzerland appear nowhere on it.
7. The KPI dashboard's own notice says its figures are "currently undergoing revision", its configuration was last published on 25 March 2025, and one of its pages points at an address that returns 404.
8. The 2014 EEA decision's actual entry-into-force date is not in the decision.

### Requests made

Fetched and read (HTTP 200):
1. https://health.ec.europa.eu/ehealth-digital-health-and-care/electronic-cross-border-health-services_en (redirects to .../digital-health-and-care/electronic-cross-border-health-services_en); fetched twice, once with the fetch tool (which only summarised) and once directly
2. https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_en.htm
3. https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_fi.htm
4. https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/faq/index_en.htm
5. https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/faq/index_fi.htm
6. https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/expenses-reimbursements/index_en.htm
7. https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/expenses-reimbursements/index_fi.htm
8. https://health.ec.europa.eu/publications/myhealtheu-flyer-addressed-patients-and-health-professionals_en
9. https://health.ec.europa.eu/publications/myhealtheu-qa_en
10. https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services/patient-information-notices-finland_en
11. https://www.arcgis.com/sharing/rest/content/items/77f459be23e545b48f46a79cfaf19423?f=json
12. https://www.arcgis.com/sharing/rest/content/items/77f459be23e545b48f46a79cfaf19423/data?f=json
13. https://www.arcgis.com/sharing/rest/content/items/5aaf548c08ce41ed895dd8ddcd4fca50/data?f=json
14. https://www.arcgis.com/sharing/rest/content/items/de225130ad5240c591d96dd101ae3202/data?f=json
15. https://www.arcgis.com/sharing/rest/content/items/deb95b1eec9c4ef1b3c7d777ffca6c54/data?f=json
16. http://publications.europa.eu/resource/celex/32011L0024
17. http://publications.europa.eu/resource/celex/32012L0052
18. http://publications.europa.eu/resource/celex/22014D0153
19. http://publications.europa.eu/resource/celex/02011L0024-20250112

Could not be read:
- https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services/myhealtheu_en : HTTP 404
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011L0024 : HTTP 202, empty body, tried twice (direct and fetch tool)
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012L0052 : the same, tried twice
- https://webgate.ec.europa.eu/santegis/eHDSI/1.8/build/ : HTTP 404
- https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/1_1/ : a JavaScript app; its data was not read (the data-service query was refused by the session's permission system and was not made)

Not tried: efta.int, the Swiss Federal Office of Public Health, the 18 other notice pages, the two 2020 and 2021 publication files, the National Contact Point page on Your Europe.

---

## Finland: prescriptions across borders. Notes from official pages read on 26 Nov 2026

### 0. How this was read

- Every page below was fetched on 26 Nov 2026 with a plain HTTP GET (no cookies, no personal or project data in any request), saved as HTML and converted to text by a script. The quotes in this file were then checked by a script against those saved texts (see the end of section 6). The full main text of every page is in the appendix (section 7), extracted by script, not retyped.
- Lines starting with `>` are verbatim. Link targets are given after the quote where they matter. "Not stated" means the page read today does not say it. "Inference" marks anything that is mine and not the page's.
- Sources are four official sites: kanta.fi (Kela's Kanta Services), eu-healthcare.fi / eu-terveydenhoito.fi (the Contact Point for Cross-Border Healthcare, which the site says operates within Kela, with STM and THL), fimea.fi (the Finnish Medicines Agency), 116117.fi (the Medical Helpline's own site).
- Two addresses in the brief were wrong; the right ones are in section 6.

Dates shown on the pages (day.month.year as the pages write them):

| Page | EN | FI |
|---|---|---|
| Kanta, citizens: buying abroad | Last updated 6.3.2026 | Sivua päivitetty 6.3.2026 |
| Kanta, citizens: foreign prescription in Finland | Last updated 3.2.2026 | Sivua päivitetty 3.2.2026 |
| Kanta, professionals: Prescription abroad | Last updated 31.3.2026 | Sivua päivitetty 31.3.2026 |
| Kanta, professionals: Dispensing of European e-prescriptions | Last updated 4.11.2026 | Sivua päivitetty 4.11.2026 |
| Kanta, citizens: Prescriptions and medicines (section page) | Last updated 6.2.2025 | not fetched |
| EU-healthcare: Using a foreign medical prescription in Finland | Last updated: 20.10.2026 | Viimeksi päivitetty: 20.10.2026 |
| EU-healthcare: Purchasing medication abroad | Last updated: 9.10.2026 | Viimeksi päivitetty: 9.10.2026 |
| EU-healthcare: Reimbursements for medicines purchased in Finland | Last updated: 12.1.2026 | Viimeksi päivitetty: 12.1.2026 |
| Fimea notice on regulation 1/2020 | no English version fetched | 21.2.2020 (publication date) |
| 116117.fi | no date shown (footer: Version 2.4.2, Year of manufacture 2026) | no date shown (Versio 2.4.2, Valmistusvuosi 2026) |

---

### A. A Finnish prescription abroad

Main source: Kanta, citizens.
- EN: https://www.kanta.fi/en/purchasing-prescription-medicines-abroad (the address in the brief, `/en/buying-prescription-medicines-abroad`, answers 301 to this one). Title "Purchasing prescription medicines abroad". Last updated 6.3.2026.
- FI: https://www.kanta.fi/reseptilaakkeen-ostaminen-ulkomailta (the page's own hreflang link is `https://www.kanta.fi/fi/reseptilaakkeen-ostaminen-ulkomailta`, which redirects here). Title "Reseptilääkkeen ostaminen ulkomailta". Sivua päivitetty 6.3.2026.

#### A1. Countries where a Finnish electronic prescription can be used today

RESULT: the earlier reading is CONFIRMED. Eight countries: Croatia, Czechia, Estonia, Latvia, Lithuania, Poland, Portugal, Spain. Four carry a qualification (Czechia, Poland, Portugal, Spain); four carry none (Croatia, Estonia, Latvia, Lithuania). No start dates are given for any country.

EN, verbatim:

> Medicines can currently be purchased with a Finnish e-prescription in
> - Croatia
> - Czechia. Pharmacies which accept Finnish e-prescriptions can be verified on the Czech authorities’ website (epreskripce.cz)
> - Estonia
> - Latvia
> - Lithuania
> - Poland. Approximately 90% of pharmacies in Poland accept Finnish e-prescriptions.
> - Portugal. Pharmacies which accept Finnish e-prescriptions can be verified on the Portuguese authorities’ website (spms.min-saude.pt, in English)
> - Spain. Regions which accept Finnish e-prescriptions can be verified on the Spanish Ministry of Health’s website (sanidad.gob.es, in Spanish).
>
> The use of Finnish e-prescriptions in Europe is being expanded in stages.

FI, verbatim (the Finnish list is in Finnish alphabetical order):

> Suomalaisella sähköisellä reseptillä voi ostaa lääkkeitä tällä hetkellä
> - Espanjasta. Espanjan alueet, joissa suomalainen sähköinen resepti käy, voit tarkistaa Espanjan terveysministeriön verkkosivuilta (sanidad.gob.es, espanjaksi)
> - Kroatiasta
> - Latviasta
> - Liettuasta
> - Portugalista. Apteekit, joissa suomalainen sähköinen resepti käy, voit tarkistaa Portugalin viranomaisen verkkosivuilta (spms.min-saude.pt, englanniksi)
> - Puolasta. Puolasta mukana on n. 90 % apteekeista.
> - Tšekistä. Apteekit, joissa suomalainen sähköinen resepti käy, voit tarkistaa Tsekin viranomaisten sivulta (epreskripce.cz, englanniksi)
> - Virosta.
>
> Suomalaisen sähköisen reseptin käyttö Euroopassa laajenee vaiheittain.

Link targets as they are on the page:
- Czechia: `http://epreskripce.gov.cz/o-ereceptu/preshranicni-erecept/aktivni-ceske-lekarny/?%3Ar1%3A-page=1&%3Ar1%3A-order=%7B%22column%22%3A%22iq_identificationNumber%22%2C%22direction%22%3A%22dsc%22%7D` (EN page: http; FI page: the same with https). The link text says "epreskripce.cz", the target is epreskripce.gov.cz.
- Portugal: `https://www.spms.min-saude.pt/a-minha-saude-na-europa/`
- Spain: `https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/mapaRecetaEspa.htm` (EN: https, FI: http)

The lead of the same page:

> You can buy prescription medicines abroad using either a paper prescription for that specific purpose or with a Finnish e-prescription. The Finnish e-prescription currently works in a few European countries.

> Voit ostaa reseptilääkkeitä ulkomailta joko sitä varten tarkoitetulla paperisella reseptillä tai suomalaisella sähköisellä reseptillä. Suomalainen sähköinen resepti toimii tällä hetkellä muutamassa Euroopan maassa.

Second official source for "all pharmacies or only some": EU-healthcare, "Purchasing medication abroad", https://www.eu-healthcare.fi/medicines/european-medical-prescription/ (Last updated: 9.10.2026) and FI https://www.eu-terveydenhoito.fi/laakkeet/eurooppalainen-laakemaarays/ (Viimeksi päivitetty: 9.10.2026):

> The Finnish electronic prescription will gradually become valid in other EU countries. For now prescription medicines can be purchased in Estonia, Croatia, Portugal, Poland, Czech Republic, Latvia, Lithuania and Spain. Finnish electronic prescription works in some Portuguese, Polish, Czech and Spanish pharmacies, whereas every Croatian, Latvian, Lithuanian and Estonian pharmacy offers the service.

> Suomalainen sähköinen resepti alkaa vaiheittain käydä EU-maissa. Lääkkeitä voi ostaa jo Viron, Kroatian, Puolan, Tšekin Espanjan, Latvian, Liettuan ja Portugalin apteekeista. Portugalissa, Puolassa, Tšekissä ja Espanjassa suomalainen resepti toimii tietyissä apteekeissa. Kroatiassa, Latviassa, Liettuassa ja Virossa palvelun piirissä ovat kaikki apteekit.

So "every pharmacy" for Croatia, Estonia, Latvia and Lithuania is stated by EU-healthcare, not by Kanta: Kanta simply gives those four no qualification. Kanta says Spain is by region; EU-healthcare says "some ... Spanish pharmacies". Not a contradiction, but the two pages word Spain differently.

Third confirmation, Kanta professionals, "Prescription abroad", https://www.kanta.fi/en/professionals/prescription-abroad (Last updated 31.3.2026), FI https://www.kanta.fi/ammattilaiset/resepti-ulkomailla (Sivua päivitetty 31.3.2026):

> While abroad, you can buy medicines with an e-prescription in Croatia, Czechia, Estonia, Latvia, Lithuania, Poland, Portugal and Spain.

> Ulkomailla lääkkeitä voi ostaa sähköisellä reseptillä Espanjasta, Kroatiasta, Latviasta, Liettuasta, Portugalista, Puolasta, Tšekistä ja Virosta.

#### A2. What the traveller needs

Identity document (Kanta citizens page):

> If you would like to purchase prescription medicines in Europe, please bring the following to a pharmacy
> - your passport or ID card
> - a paper or electronic prescription You can use the Finnish e-prescription in some European countries.

> Jos haluat ostaa reseptilääkkeitä Euroopasta, ota apteekkiin mukaan
> - passi tai henkilökortti
> - paperinen tai sähköinen resepti. Suomalaista sähköistä reseptiä voit käyttää osassa Euroopan maista.

Consent in MyKanta/OmaKanta: NOT needed any more (the page's FAQ):

> In Finland, you no longer need to give consent in order to purchase medicines abroad with an e-prescription. Issuing consent in MyKanta ended at the end of 2022.

> Suomessa ei tarvitse enää antaa suostumusta, jotta voisi ostaa lääkkeitä sähköisellä reseptillä ulkomailta. Suostumuksen antaminen OmaKannassa päättyi vuoden 2022 lopussa.

Disclosure ban ("denial of consent", luovutuskielto) blocks it:

> If you have set a denial of consent to the sharing of your prescription data, you will not be able to use the prescription to purchase medicines abroad. Remember to cancel your denial of consent to the sharing of prescription data for your prescription in MyKanta before purchasing the medicine.

> Jos olet tehnyt reseptillesi luovutuskiellon, et voi ostaa reseptillä lääkkeitä ulkomailla. Muista poistaa reseptin luovutuskielto OmaKannassa ennen lääkkeen ostamista.

A "for purchase abroad" marking on the ELECTRONIC prescription: not stated. The page knows no such marking for the electronic prescription. "Prescription for purchases abroad" is the name of the separate PAPER prescription (A4). What the electronic prescription does need is the quantity as a total amount or as packages (A3).

In person only, no acting for another adult:

> It is not possible to collect medicines with an e-prescription on behalf of someone else at an overseas pharmacy. The reason for this is technical as it is not possible to share the required information electronically between countries.

> Toisen puolesta lääkkeiden hakeminen sähköisellä reseptillä ulkomaisesta apteekista ei ole mahdollista. Syy on tekninen, sillä tietoja asiasta ei pystytä välittämään sähköisesti maiden välillä.

Children:

> Acting on behalf of someone else is not yet permitted. However, a minor can visit the pharmacy in person.

> Dispensing the medicine from a foreign pharmacy is also possible if the guardian accompanies the child to the pharmacy.

> Toisen puolesta asiointi ei ole vielä mahdollista. Alaikäinen voi kuitenkin asioida apteekissa itse.

> Lääkkeen toimittaminen ulkomaisesta apteekista on mahdollista myös, jos huoltaja on lapsen mukana apteekissa.

The local law decides, and the medicine may differ:

> Remember that pharmacies always sell medicines in accordance with their own national legislation. It is also possible that the medicine you receive is different from the medicine purchased in Finland.

> Muista, että apteekit myyvät lääkkeitä aina oman maan lainsäädäntönsä mukaisesti. Lisäksi on mahdollista, että saamasi lääke on erilaista kuin Suomesta ostettu lääke.

Reimbursement:

> If you purchase medicines to treat your illness abroad, you can apply for a reimbursement for medicine expenses from Kela afterwards. Please retain any medication-related documents, receipts and medicine packages. You may need them when Kela determines if you are eligible for reimbursement for the medicine purchase.

> Jos olet ostanut lääkkeitä sairauden hoitoon ulkomailta, voit hakea Kela-korvausta vasta jälkikäteen. Säilytä lääkkeisiin liittyvät dokumentit, kuitit ja lääkepakkaukset. Niitä voidaan tarvita, kun Kela selvittää, voitko saada korvausta lääkeostosta.

If it does not work and the medicine is needed at once:

> Please contact the health care services in the country where you are located.

> Ota yhteyttä sen maan terveydenhuoltoon, jossa oleskelet.

#### A3. What cannot be bought abroad with the electronic prescription

Kanta citizens page, section "When is it not possible to purchase prescription medicines abroad?" / "Missä tapauksissa reseptilääkkeitä ei voi ostaa ulkomailta?". Five groups of reasons.

(1) Prescribed for a period of time. The page calls this the most common reason:

> The most common reason for not being able to buy a medicine abroad is that the prescription was for a specific amount of medicine to be taken over a specific time period. In such cases, the prescription will say e.g., ‘2-year dose’. In order for you to be able to purchase a medicine abroad, the medicine must be prescribed either as a total amount or as packages.

> Yleisin syy siihen, että lääkettä ei voi ostaa ulkomailta, on lääkkeen määrän määrääminen ajalle. Tällöin reseptissä lukee esimerkiksi "2 vuoden annos". Jotta voisit ostaa lääkettä ulkomailta, täytyy lääke olla määrätty joko kokonaismääränä tai pakkauksina.

(2) Disclosure ban: quoted in A2.

(3) Shorter validity in the destination country:

> Although your Finnish prescription is valid, it may have a shorter validity period in your destination country. For example, this may apply to prescriptions for antibiotics.

> Vaikka suomalainen reseptisi on voimassa, sillä voi kohdemaassasi olla lyhyempi voimassaoloaika. Tämä voi koskea esimerkiksi antibioottireseptejä.

(4) Reasons related to the product, the verbatim list:

> You cannot buy the following products abroad with an ePrescription:
> - narcotics
> - central nervous system (CNS) agents
> - medicines prepared by the pharmacy
> - packages containing several different preparations
> - packages with a text-only packaging size
> - patient-specific special permit products
> - emollient creams
> - clinical nutritional preparations or dietary supplements
> - medical supplies or dressings.
>
> The range of available medicines varies from country to country. Products prescribed in Finland, or similar products, are not always available in another country.

> Seuraavia valmisteita et voi ostaa ulkomailla sähköisellä reseptillä:
> - huumausaineet
> - useimmat pääasiassa keskushermostoon vaikuttavat (PKV) lääkkeet
> - apteekissa valmistettavat lääkkeet
> - pakkaukset, jotka sisältävät useita eri valmisteita
> - pakkaukset, joilla on vain tekstimuotoinen pakkauskoko
> - potilaskohtaiset erityislupavalmisteet
> - perusvoiteet
> - kliiniset ravintovalmisteet tai ravintolisät
> - hoitotarvikkeet tai sidetarpeet
>
> Lääkevalikoimat vaihtelevat eri maissa. Suomessa määrättyä valmistetta tai sitä vastaavaa valmistetta ei aina ole saatavilla toisessa maassa.

FLAG (EN and FI differ): the Finnish says "useimmat" (most) CNS medicines; the English says "central nervous system (CNS) agents" with no "most". The professionals' page is the most exact: only those that need the original prescription, CNS class PA or ZA (below). For the app, the Finnish wording or the professionals' wording is the safer one.

(5) Other reasons:

> When abroad, you cannot use prescriptions that
> - can be redispensed at specific intervals. In these cases, the prescription will read “iter semel”, “iter bis” or “iter ter”
> - have been indicated as reserved by a Finnish pharmacy for product ordering, for example
> - are locked pending correction by a doctor.

> Et voi käyttää ulkomailla reseptejä, jotka
> - voidaan toimittaa määräajoin uudelleen. Reseptissä lukee tällöin ”iter semel”, ”iter bis” tai ”iter ter”.
> - on merkitty varatuksi suomalaiseen apteekkiin esimerkiksi valmisteen tilausta varten
> - on lukittu odottamaan lääkärin korjausta.

A trap the page describes (FAQ): after one purchase abroad the prescription can show as used up, when the foreign pharmacy records another unit (millilitres instead of vials):

> As a result, the prescription may have been used in full after one purchase. In such situations, please ask for the prescription to be renewed.

> Tästä johtuen resepti on saattanut mennä tyhjäksi yhden ostokerran jälkeen. Pyydä tällaisissa tilanteissa reseptin uusimista.

The professionals' page (https://www.kanta.fi/en/professionals/prescription-abroad, 31.3.2026) gives the same list in more exact terms, and one item the citizens' page does not have (the last one):

> The following are not available from foreign pharmacies on an electronic prescription:
> - narcotics
> - CNS drugs that require the original prescription (CNS class PA or ZA)
> - medications prepared in the pharmacy
> - combination packages containing several preparations
> - special license preparations for compassionate use that are patient specific
> - preparations prescribed for a specific period of time (such as when the prescribed amount of medicine is expressed verbally as for example “medication for 12 months’ use”)
> - preparations that can be dispensed at specific intervals of for example one month. Such prescriptions have the words ‘iter semel’, ‘iter bis’ or ‘iter ter’ on them
> - preparations associated with a doctor’s fee that have not yet been dispensed in Finland.

> Seuraavia lääkkeitä ei voi ostaa ulkomailla:
> - huumausaineita
> - PKV-lääkkeitä, jotka vaativat alkuperäisen lääkemääräyksen (PKV-luokka PA tai ZA)
> - apteekissa valmistettavia lääkkeitä
> - yhdistelmäpakkauksia eli pakkauksia, jotka sisältävät useita eri valmisteita
> - potilaskohtaisia erityislupavalmisteita
> - lääkkeitä, jotka on määrätty tietylle ajalle (esim. lääkkeen kokonaismäärä on määrätty sanallisesti ”1 vuoden annos”)
> - lääkkeitä, jotka voidaan toimittaa määräajoin uudelleen. Reseptissä lukee tällöin iter semel, iter bis tai iter ter
> - lääkkeitä, joihin liittyy lääkärinpalkkio ja jota ei ole vielä kertaakaan toimitettu Suomessa.

> Medicines do not include, e.g. base creams, clinical nutritional preparations, care supplies, dietary supplements, or dressings.

> Lääkkeitä eivät ole esim. perusvoiteet, kliiniset ravintovalmisteet, hoitotarvikkeet, ravintolisät ja sidetarpeet.

#### A4. A PAPER prescription abroad

Kanta citizens page, section "A paper prescription for purchases abroad" / "Resepti ulkomailla ostoa varten":

> If your destination country does not accept Finnish e-prescriptions, the person who issued the prescription can issue a paper prescription in English for purchases abroad. Please take it with you when you travel. It cannot be used to buy medicines in Finland and you cannot print it out yourself from MyKanta.
>
> A prescription for purchases abroad cannot be issued
> - for medicines containing narcotic substances or central nervous system agents, for which the original prescription is required.
> - medicines to be prepared by the pharmacy.

> Jos suomalainen sähköinen resepti ei ole käytössä kohdemaassasi, lääkkeen määrääjä voi kirjoittaa sinulle paperisen englanninkielisen reseptin ulkomailla ostoa varten. Ota se mukaan matkallesi. Sillä ei voi ostaa lääkkeitä Suomesta eikä sitä voi itse tulostaa OmaKannasta.
>
> Reseptiä ulkomailla ostoa varten ei voi kirjoittaa
> - huumausaineita sisältävistä tai alkuperäisen lääkemääräyksen vaativista pääasiassa keskushermostoon vaikuttavista lääkkeistä
> - apteekissa valmistettavista lääkkeistä.

In which countries does the paper prescription work?
- Kanta citizens page: NOT STATED. It names no countries or country groups for the paper prescription (no "EU", "EEA", "Switzerland" or "Nordic"). Its only geographic word is "in Europe" in the sentence about what to bring to a pharmacy. The term "European prescription" does not appear on this page.
- Kanta professionals' page ("Prescription abroad", 31.3.2026) speaks of EU countries only:

> The prescriber can write a prescription titled “Prescription for purchasing abroad” if the patient needs to buy medication while staying in a foreign country other than Croatia, Czechia, Estonia, Latvia, Lithuania, Poland, Portugal or Spain. In place of the patient instructions, the prescriber prints an English-language prescription in this case. The prescription cannot be used to purchase medicines in Finland.

> The EU countries must recognise prescriptions issued in other member states. A pharmacy may refuse to dispense a prescription issued in another member state if it has doubts regarding the authenticity or propriety of the prescription. The pharmacy dispenses the medicines in accordance with the legislation of its own country.

> Lääkkeen määrääjä voi kirjoittaa reseptin nimeltään ”Lääkemääräys ulkomailla ostoa varten”, jos lääkkeitä on tarve hankkia ulkomailla olon aikana muualta kuin Espanjasta, Kroatiasta, Latviasta, Liettuasta, Portugalista, Puolasta, Tšekistä ja Virosta. Potilasohjeen sijasta lääkkeen määrääjä tulostaa tällöin englanninkielisen lääkemääräyksen. Lääkemääräyksellä ei voi ostaa lääkkeitä Suomesta.

> EU-maiden on tunnustettava toisissa jäsenmaissa annetut reseptit. Apteekki voi kieltäytyä toimittamasta toisessa jäsenmaassa annettua reseptiä, jos se epäilee reseptin aitoutta tai asianmukaisuutta. Apteekki toimittaa lääkkeet oman maan lainsäädäntönsä mukaisesti.

- EU-healthcare ("Purchasing medication abroad", 9.10.2026) says EU and EEA countries, and says it is not accepted outside them. Switzerland is NOT named for this direction; Nordic countries are not mentioned:

> Ask your doctor to provide a medical prescription for purchasing medication abroad if you intend to purchase medication in another EU or EEA country. Electronic prescriptions are also valid in Estonia, Croatia, Portugal, Poland, Czech Republic, Latvia, Lithuania and Spain. If you wish to purchase prescription medication outside the EU and EEA countries, you normally need a prescription issued by a local health care professional.

> You can ask the prescribing professional for a prescription that is valid in EU and EEA countries. The prescription is called a ‘Medical prescription for purchasing medication abroad’. You will get a printout of the prescription in English. You cannot use the printout for purchasing medication in Finland, and you cannot print out the prescription yourself from the My Kanta service.

> A prescription issued in Finland will not be accepted outside the EU or EEA countries.

> Pyydä lääkäriltäsi lääkemääräys ulkomailla ostoa varten, jos aiot hankkia lääkkeitä toisessa EU- tai Eta-maassa. Virossa, Kroatiassa, Portugalissa, Puolassa, Tšekissä, Latviassa, Liettuassa ja Espanjassa voit myös käyttää sähköistä reseptiä. Jos haluat ostaa reseptilääkkeitä EU- ja Eta-maiden ulkopuolella, tarvitset yleensä paikallisen terveydenhuollon ammattilaisen antaman lääkemääräyksen.

> Voit pyytää lääkkeen määrääjältä reseptiä, joka käy EU- ja Eta-maissa. Reseptin nimi on ”lääkemääräys ulkomailla ostoa varten”. Saat reseptistä englanninkielisen tulosteen. Et voi ostaa tulosteella lääkkeitä Suomesta, etkä voi tulostaa reseptiä itse Omakannasta.

> Suomessa kirjoitettu resepti ei käy EU- ja Eta-maiden ulkopuolella.

EU-healthcare's general principles for a Finnish prescription abroad:

> - Medicines classified as narcotics or psychotropic medicines cannot be obtained abroad with a prescription issued in Finland.
> - The period of validity of the prescription is defined based on the legislation of the country where the medication is purchased. In Finland, a prescription is usually valid for two years.
> - A pharmacy may refuse to fill a prescription issued in another country if there is doubt of the authenticity or validity of the prescription.

> - Huumausaineiksi luokiteltuja tai psykotrooppisia lääkkeitä ei voi hankkia ulkomailla Suomessa annetulla lääkemääräyksellä.
> - Lääkemääräyksen voimassaoloaika määräytyy sen maan lainsäädännön mukaan, jossa lääke hankitaan. Suomessa lääkemääräys on yleensä voimassa kaksi vuotta.
> - Apteekki voi kieltäytyä toimittamasta toisessa jäsenmaassa annettua lääkemääräystä, jos se epäilee lääkemääräyksen aitoutta tai asianmukaisuutta.

Names for the paper prescription differ between pages (all official): Kanta citizens "a paper prescription ... for purchases abroad" / "resepti ulkomailla ostoa varten"; Kanta professionals “Prescription for purchasing abroad” / ”Lääkemääräys ulkomailla ostoa varten”; EU-healthcare ‘Medical prescription for purchasing medication abroad’ / ”lääkemääräys ulkomailla ostoa varten”. The Finnish name is the same everywhere; the English is not.

Kela reimbursement and the UK and Switzerland (EU-healthcare, same page, FAQ). This is about reimbursement, not about where the prescription is accepted:

> You can also apply for Kela reimbursement if you travel to another EU or EEA country, United Kingdom or Switzerland to buy prescription medicines.

> Voit hakea Kela-korvausta myös silloin, jos matkustat toiseen EU- tai Eta-maahan, Isoon-Britanniaan tai Sveitsiin ostaaksesi reseptilääkkeitä.

#### A5. "Updated" dates

Kanta citizens page: EN "Last updated 6.3.2026", FI "Sivua päivitetty 6.3.2026". The others are in the table in section 0.

---

### B. A prescription from another country in Finland

Sources:
- Kanta, citizens. EN https://www.kanta.fi/en/buying-medicines-with-an-overseas-prescription (title "Purchasing medication with a foreign prescription in Finland"; h1 "Purchasing medication with a foreign prescription"), Last updated 3.2.2026. FI https://www.kanta.fi/laakkeen-osto-ulkomaisella-reseptilla ("Lääkkeiden ostaminen ulkomaisella reseptillä"), Sivua päivitetty 3.2.2026. The address in the brief (`/en/buying-medicines-in-finland-with-a-european-prescription`) is a 404.
- Kanta, professionals (pharmacies). EN https://www.kanta.fi/en/professionals/dispensing-of-european-e-prescriptions, Last updated 4.11.2026. FI https://www.kanta.fi/ammattilaiset/sahkoisen-eurooppalaisen-reseptin-toimitus, Sivua päivitetty 4.11.2026. This is the freshest page of all and has the per-country rules.
- EU-healthcare, the paper side. EN https://www.eu-healthcare.fi/medicines/filling-foreign-medical-prescriptions-in-finland/ ("Using a foreign medical prescription in Finland"), Last updated: 20.10.2026. FI https://www.eu-terveydenhoito.fi/laakkeet/ulkomaisten-laakemaaraysten-toimittaminen-suomessa/ ("Ulkomaisen lääkemääräyksen käyttäminen Suomessa"), Viimeksi päivitetty: 20.10.2026. Kanta's citizens page itself sends the reader here for paper prescriptions.

#### B1. From which countries an ELECTRONIC prescription is dispensed in Finland, and where

RESULT: the same eight countries as in direction A: Croatia, Czechia, Estonia, Latvia, Lithuania, Poland, Portugal, Spain. At ANY pharmacy in Finland. Three official pages agree (Kanta citizens 3.2.2026, Kanta professionals 4.11.2026, EU-healthcare 20.10.2026).

Kanta citizens, EN:

> You can buy prescription medicines in Finland with either a paper prescription or European ePrescription. Finland currently accepts electronic prescriptions from a few countries.
>
> You can buy prescription medicines in Finland
> with a European ePrescription issued in
> - Croatia
> - Czechia
> - Estonia
> - Latvia
> - Lithuania
> - Poland
> - Portugal
> - Spain
> - with a paper prescription issued in an EU or EEA country or in Switzerland.
>
> You can buy medicines with a foreign prescription at any pharmacy in Finland.
>
> In the future, more countries will begin to use the European ePrescription.

Kanta citizens, FI:

> Voit ostaa reseptilääkkeitä Suomesta joko paperisella tai sähköisellä eurooppalaisella reseptillä. Tällä hetkellä Suomessa käy muutaman maan sähköinen resepti.
>
> Voit ostaa reseptilääkkeitä Suomesta
> - sähköisellä eurooppalaisella reseptillä, joka on määrätty
> - Espanjassa
> - Kroatiassa
> - Latviassa
> - Liettuassa
> - Portugalissa
> - Puolassa
> - Tšekissä
> - Virossa.
> - paperisella reseptillä, joka on määrätty EU- tai Eta-maassa tai Sveitsissä.
>
> Voit ostaa lääkkeitä ulkomaisella reseptillä mistä tahansa apteekista Suomessa.
>
> Sähköisen eurooppalaisen reseptin piiriin on tulossa lisää maita jatkossa.

Kanta professionals (4.11.2026):

> Finnish pharmacies can dispense European ePrescriptions. There are differences in how the prescriptions are dispensed from country to country.
>
> ePrescriptions from the following countries are accepted at Finnish pharmacies:
> - Spain
> - Croatia
> - Latvia
> - Lithuania
> - Portugal
> - Poland
> - Czechia
> - Estonia.
>
> More European countries will join the service at a later date. Information on new countries will be updated on this page as more countries are added to the service.

> Suomalaisissa apteekeissa voi toimittaa sähköisiä eurooppalaisia reseptejä. Reseptin toimittamisessa on maakohtaisia eroja.
>
> Suomalaisessa apteekissa voi ostaa lääkkeitä seuraavien maiden sähköisillä resepteillä:
> - Espanja
> - Kroatia
> - Latvia
> - Liettua
> - Portugali
> - Puola
> - Tšekki
> - Viro.
>
> Lisää Euroopan maita on tulossa palveluun mukaan myöhemmin. Tiedot uusista maista päivitetään tälle sivulle sitä mukaa kun niitä tulee lisää palvelun piiriin.

EU-healthcare (20.10.2026):

> A prescription issued in another EU or EEA country or Switzerland may also be electronic. At the moment, prescription medicines prescribed in Estonia, Croatia, Portugal, Poland, Czech Republic, Latvia, Lithuania and Spain with an electronic prescription can be purchased at Finnish pharmacies. Commissioning of the service is being prepared also in the other EU countries.

> Toisessa EU- tai Eta-maassa tai Sveitsissä kirjoitettu lääkemääräys voi olla myös sähköinen. Tällä hetkellä Suomen apteekeista voi ostaa reseptilääkkeitä Virossa, Kroatiassa, Portugalissa, Puolassa, Tšekissä, Latviassa, Liettuassa ja Espanjassa määrätyllä sähköisellä reseptillä. Palvelun käyttöönottoa valmistellaan myös muissa EU-maissa.

#### B2. What the customer has to show or do (electronic), and what goes wrong

In person, with a passport or photo ID; consent in the home country where that country asks for it (Kanta citizens):

> The consent policies for electronic prescriptions vary from country to country. If your country requires consent for your prescription data to be disclosed to pharmacies in another country, please give your consent before visiting a Finnish pharmacy.

> If you wish to purchase medication with a foreign electronic prescription, you must go to the pharmacy in person. Take your passport or photo ID card with you to the pharmacy. In addition, different countries may have other requirements for dispensing the medicine. Please check this information with the authorities of the country where your prescription was issued.

> Sähköisen reseptin suostumuskäytännöt vaihtelevat eri maissa. Jos maassasi vaaditaan suostumus siihen, että reseptitietojasi saa luovuttaa toisen maan apteekeille, anna suostumus ennen suomalaisessa apteekissa asioimista.

> Kun ostat lääkkeitä ulkomaisella sähköisellä reseptillä, sinun täytyy asioida apteekissa itse. Ota apteekkiin mukaasi passi tai kuvallinen henkilökortti. Eri mailla voi lisäksi olla muita vaatimuksia lääkkeen saamiseksi. Tarkista ne sen maan viranomaisilta, josta olet saanut reseptin.

Children and other adults (Kanta citizens):

> As a rule, you can act on behalf of a minor with a European ePrescription. In this case, the child must accompany you to the pharmacy. However, there are country-specific differences in the transfer of prescription data to Finland for a minor.
>
> It is not possible to act on behalf of an adult.

> Voit pääsääntöisesti asioida lapsen puolesta sähköisellä eurooppalaisella reseptillä. Lapsen täytyy olla tällöin mukana apteekissa. Alaikäisen reseptitietojen välittymisessä Suomeen on kuitenkin maakohtaisia eroja.
>
> Täysi-ikäisen puolesta asioiminen ei ole mahdollista.

Restrictions (Kanta citizens):

> You can use your foreign prescription to buy medicine in Finland if:
> - the prescription meets the requirements of Finnish legislation
> - the medicine has a marketing authorisation in Finland.
>
> You cannot buy the following medicines in Finland:
> - narcotics
> - certain medicines that are central nervous system agents
> - medicines prepared at the pharmacy
> - packages that contain several different preparations.
>
> Please note that
> - your country of origin may also have restricted the purchase of other medicines abroad

> Voit ostaa ulkomaisella reseptilläsi lääkettä Suomesta, jos
> - resepti täyttää suomalaisen lainsäädännön vaatimukset
> - lääkkeellä on Suomessa myyntilupa.
>
> Seuraavia lääkkeitä et voi ostaa Suomesta:
> - huumausaineet
> - tietyt, pääasiassa keskushermostoon vaikuttavat lääkkeet
> - apteekissa valmistettavat lääkkeet
> - pakkaukset, jotka sisältävät useita eri valmisteita.
>
> Huomaa, että
> - lähtömaasi on voinut rajata myös muiden lääkkeiden ostamista ulkomailla

The page also links Kela's Medicinal Products Database to check what is sold in Finland: `https://asiointi.kela.fi/laakekys_app/LaakekysApplication?kieli=en` (FI: `?kieli=fi`).

The pharmacy's side of the same rule (Kanta professionals, 4.11.2026):

> A foreign prescription cannot be dispensed in Finland if the prescription is for
> - narcotics
> - a CNS medicinal product requiring an original prescription to be stored, classified as PA or ZA in the Pharmaceutical Database
> - a medicine prepared by the pharmacy
> - a combination package containing several different preparations.

> Ulkomaista reseptiä ei voi toimittaa Suomessa, jos kyseessä on
> - huumausaineresepti
> - alkuperäistä säilytettävää reseptiä vaativa PKV-lääke, jonka luokitus Lääketietokannassa on PA tai ZA
> - apteekissa valmistettava lääke
> - yhdistelmäpakkaus, joka sisältää useita eri valmisteita.

What the pharmacy does, and the first thing that goes wrong, the prescription is not found because consent is missing (Kanta professionals):

> - Foreign customers are identified at the pharmacy with photo ID.
> - Select the country whose prescription you are dispensing. Enter the customer’s personal information. If you cannot find the prescription, make sure that the client has given their consent to sharing their prescription data abroad. Consent is not required in all countries.
> - Dispense the product and print a PDF version of the original prescription for the customer.

> - Tunnista ulkomaalainen asiakas kuvallisesta henkilötodistuksesta.
> - Valitse maa, jonka reseptiä toimitat. Anna asiakkaan henkilötiedot. Jos reseptiä ei löydy, varmista, että asiakas on antanut suostumuksen reseptitietojensa luovuttamiseen ulkomaille. Suostumusta ei vaadita kaikissa maissa.
> - Tee toimitus ja tulosta asiakkaalle pdf-versio alkuperäisestä lääkemääräyksestä.

> The national contact points are responsible for ensuring that only prescriptions that are acceptable for the country of origin to dispense are forwarded to other European countries.

> Kansalliset yhteyspisteet vastaavat siitä, että niiden kautta välitetään toiseen Euroopan maahan vain sellaisia reseptejä, jotka ovat toimituskelpoisia lähtömaan puolesta.

> It is not possible to act on behalf of another person, as the relevant information cannot be transmitted electronically between different countries. If a minor is with their guardians at the pharmacy, it is usually possible to manage their affairs.

> Toisen henkilön puolesta asiointi ei ole mahdollista, sillä tietoja asiasta ei pystytä välittämään sähköisesti eri maiden välillä. Jos alaikäinen asiakas on mukana apteekissa, asiointi on yleensä mahdollista.

If it fails (Kanta citizens):

> If you are unable to purchase a medicine at a pharmacy and you need the medicine urgently, please contact the Finnish health care services.

> Jos lääkkeen ostaminen apteekista ei onnistu ja tarvitset lääkettä kiireellisesti, ota yhteyttä suomalaiseen terveydenhuoltoon.

##### Per country: what the customer needs, from the pharmacies' page (Kanta professionals, 4.11.2026)

English quotes first, the Finnish ones after each country. The full text of both is in the appendix. The page says of this list: "There may also be other country-specific restrictions on dispensing prescriptions abroad." / "Reseptien toimittamisessa ulkomaille voi olla myös muita maakohtaisia rajoituksia."

CROATIA. Consent needed; photo ID AND health insurance card; MBO code; short validity.

> - The customer must consent to the release of prescription details abroad through the Croatian Health Portal. Persons over 16 years of age can give this consent.
> - When collecting prescriptions, the customer must provide a 9-character insurance code (MBO) from the health insurance card.
> - Prescriptions are valid for 15 days. Prescriptions containing psychotropic substances are valid for 5 days and prescriptions for antibiotics for 3 days.

The identification line has links in the middle, so here in two parts: "The customer is identified by a photo ID card" [link] ". In addition, they must show a health insurance card."

> - Asiakkaan tulee antaa suostumus reseptitietojen luovuttamiseen ulkomaille Kroatian terveysportaalin kautta. Yli 16-vuotiaat henkilöt voivat antaa ko. suostumuksen.
> - Reseptejä haettaessa annetaan asiakkaan 9 merkkinen vakuutustunnus (MBO) sairausvakuutuskortista.
> - Reseptit ovat voimassa 15 päivää. Poikkeuksena psykotrooppisia aineita sisältävät reseptit ovat voimassa 5 päivää ja antibioottireseptit 3 päivää.

Finnish, in parts: "Asiakas tunnistetaan kuvallisesta henkilötodistuksesta" [link] ". Lisäksi hänen on näytettävä sairausvakuutuskortti."

CZECHIA. No consent; passport or identity card and its number; 12-character prescription code; Czech citizen or permanent address; dispensed once; no opioids.

> - The passport or identity card number must be provided when collecting a prescription. A 12-character prescription code is also required. The code can also be read using a QR code.
> - No consent to prescribe medicines abroad is required.
> - As a rule, prescriptions are valid for 14 days, but a doctor can extend the period of validity up to a maximum of one year.
> - Prescriptions marked "urgent treatment" are only valid for one day from the date on which the prescription was issued.
> - Medicines are prescribed by trade name.
> - Opioid prescriptions cannot be issued to a foreign country.
> - A prescription can only be dispensed once. If the customer requires more medication after the prescription has been dispensed, they should request a new prescription.
> - The customer must be a Czech citizen or have a permanent address in the Czechia.
> - Cancellation of dispensing possible.

> - Reseptiä haettaessa annetaan passin tai henkilöllisyystodistuksen numero. Lisäksi tarvitaan reseptin 12-merkkinen tunnus. Tunnus voidaan lukea myös QR-koodista.
> - Suostumusta lääkkeiden toimittamiseen ulkomailla ei vaadita.
> - Reseptit ovat pääsääntöisesti voimassa 14 päivää, mutta lääkäri voi määrätä reseptin voimassaoloajaksi enintään yhden vuoden.
> - Reseptit, joissa on merkintä ”kiireellinen hoito”, ovat voimassa vain yhden päivän reseptin määräyspäivästä.
> - Lääkkeet määrätään kauppanimellä.
> - Opioidireseptejä ei voi toimittaa ulkomailla.
> - Reseptin voi toimittaa vain kerran. Toimituksen jälkeen asiakkaan tulee pyytää uusi resepti, mikäli hän haluaa lääkettä lisää.
> - Asiakkaalla on oltava Tšekin kansalaisuus tai pysyvä osoite Tšekissä.
> - Toimituksen mitätöinti mahdollista.

ESTONIA. No consent (but the citizen can refuse); Estonian personal identity code; citizenship or residence permit AND an address in Estonia; passport or ID card.

> - An Estonian personal identity code is provided when the prescription is requested to be dispensed. The person must have Estonian citizenship or residence permit in Estonia as well as an Estonian address. If the address of record is not in Estonia, the prescription cannot be dispensed.
> - No consent is required, but the citizen can refuse sending of prescription data overseas.
> - As a rule, prescriptions are issued with a generic name, and the reason for using the commercial name must be given on the prescription.
> - Unless the doctor has limited the duration of the prescription validity, prescriptions are valid for 60 days and after renewal for 180 days. The majority of prescriptions issued for continuous medication are valid for 180 days. Prescriptions for drug preparations are valid for 30 days.
> - Prescriptions for narcotics cannot be dispensed in Finland. In addition, due to country-specific restrictions with Estonia, it is not possible to dispense certain psychotropic preparations.
> - A saved dispensing event cannot be rectified or invalidated retrospectively. The patient can contact the doctor and request a new prescription.
> - There are not restrictions concerning the processing of prescription data of an underage person.

> - Reseptiä haettaessa toimitettavaksi annetaan virolainen henkilötunnus. Henkilöllä on oltava Viron kansalaisuus tai oleskelulupa ja osoite Virossa. Jos osoite on rekisteröity Viron ulkopuolelle, reseptin toimitus ei onnistu.
> - Suostumusta ei vaadita, mutta kansalainen voi kieltää reseptitietojen lähettämisen ulkomaille.
> - Määräykset ovat pääsääntöisesti geneerisellä nimellä, kauppanimen käyttö on perusteltava reseptissä.
> - Jos lääkäri ei ole rajoittanut reseptin voimassaoloaikaa, reseptit ovat voimassa 60 päivää, ja uusimisen jälkeen 180 päivää. Valtaosa jatkuvaan lääkitykseen tarkoitetuista resepteistä on voimassa 180 päivää.
> - Lisäksi Viron maakohtaisten rajoitusten vuoksi tiettyjen psykotrooppisten valmisteiden toimitus ei ole mahdollista.
> - Tallennettua toimitusta ei voi jälkikäteen korjata tai mitätöidä. Potilas voi ottaa yhteyttä lääkäriin ja pyytää uuden reseptin.
> - Alaikäisen reseptitietojen käsittelyssä ei ole rajoituksia.

(EN has two sentences the FI lacks: "Prescriptions for drug preparations are valid for 30 days." and "Prescriptions for narcotics cannot be dispensed in Finland.")

Estonia on the citizens' page (Kanta, 3.2.2026, FAQ):

> You can use your ePrescription to buy the medicine from a Finnish pharmacy if you have both of the following:
> - an Estonian personal identity code
> - a registered address in Estonia.
>
> In addition, you will need an Estonian passport or an Estonian photo ID card.

> Voit asioida sähköisellä reseptilläsi suomalaisessa apteekissa, jos sinulla on molemmat seuraavista:
> - virolainen henkilötunnus
> - rekisteröity osoite Virossa.
>
> Lisäksi tarvitset virolaisen passin tai kuvallisen henkilökortin.

Estonia on EU-healthcare (20.10.2026):

> When you buy medicines with an e-prescription, you must visit the pharmacy in person. Take a photo ID, i.e. your passport or ID card with you to the pharmacy. For example, you can buy medicines with an Estonian e-prescription if the prescription is issued with an Estonian personal identity code and you are an Estonian citizen or you have an Estonian residence permit.

> Kun ostat lääkkeitä sähköisellä reseptillä, sinun tulee asioida apteekissa itse. Ota apteekkiin mukaasi kuvallinen henkilöllisyystodistus, eli passi tai henkilökortti. Esimerkiksi virolaisella sähköisellä reseptillä voit ostaa lääkkeitä, jos resepti on määrätty virolaisella henkilötunnuksella ja sinulla on Viron kansalaisuus tai oleskelulupa.

FLAG (Estonia, three pages, three wordings): Kanta citizens asks for an identity code + a registered address in Estonia + an ESTONIAN passport or ID card; Kanta professionals asks for citizenship or residence permit + an Estonian address; EU-healthcare asks for citizenship or residence permit and does not mention the address. They can all be true at once, but the address rule (the one that stops a dispensing) is missing from EU-healthcare. Use the Kanta professionals' wording (the newest, 4.11.2026).

LATVIA. Passport or identity card; trade-name prescriptions only.

> - As a rule, prescriptions are valid for 90 days unless the doctor has limited the duration of the prescription validity.
> - Medicines are prescribed by trade name.
> - Due to country-specific restrictions in Latvia, Finnish pharmacies cannot dispense prescriptions issued with a generic name.
> - There are not restrictions concerning the processing of prescription data of an underage person.
> - Cancellation of dispensing possible.

> - Resepti on pääsääntöisesti voimassa 90 päivää, ellei lääkäri ole rajoittanut sen voimassaoloaikaa.
> - Lääkkeet määrätään kauppanimellä.
> - Latvian maakohtaisten rajoitusten vuoksi Suomessa ei voi toimittaa reseptejä, jotka on määrätty vaikuttavalla aineella.
> - Alaikäisen reseptitietojen käsittelyssä ei ole rajoituksia.
> - Toimituksen mitätöinti mahdollista.

Consent for Latvia: not stated on the page.

LITHUANIA. Passport or ID card; 11-character personal identity code; the citizen can refuse the sending.

> - The citizen can refuse sending of prescription data overseas through the Lithuanian Health Portal.
> - As a rule, prescriptions are valid for 30 days. Prescriptions for continuous medication are valid for 180 days and prescriptions for long-term medication are valid for 360 days.
> - Prescriptions are issued with a generic name.
> - There are not restrictions concerning the processing of prescription data of an underage person.
> - Cancellation of dispensing possible.

"When collecting prescriptions, the customer must provide a 11-character personal identity code." / "Reseptejä haettaessa annetaan asiakkaan 11 merkkinen henkilötunnus."

> - Asiakas voi kieltää reseptitietojen luovuttamisen ulkomaille Liettuan terveysportaalin kautta.
> - Reseptit ovat pääsääntöisesti voimassa 30 päivää. Jatkuvaan lääkitykseen määrätyt reseptit ovat voimassa 180 päivää ja pitkäaikaiseen lääkitykseen määrätyt reseptit ovat voimassa 360 päivää.
> - Määräykset ovat pääsääntöisesti geneerisellä nimellä.
> - Alaikäisen reseptitietojen käsittelyssä ei ole rajoituksia.
> - Toimituksen mitätöinti mahdollista.

POLAND. Consent needed (pacjent.gov.pl); passport or photo identity card; PESEL; adults only; dispensed once.

> - The customer must consent to the release of prescription details abroad through the Polish patient's online account (https://pacjent.gov.pl/).
> - When collecting an e-prescription, the customer's Personal ID Number is provided (PESEL).
> - Cross-border e-prescriptions can be dispensed only by adults (18+).
> - A standard prescription for normal medicines and OTC medicines: 30 days
> - A prescription for immunological medicines: 120 day
> - it is not permitted to dispense psychotropic medicines, central nervous system agents, and medicines which are prepared extemporaneously at the pharmacy; and
> - the prescribed and delivered products cannot have different ATC codes.
> - Cross-border e-prescriptions are normally provided with a brand name.
> - Cancellation of dispensing possible.
> - A prescription can only be dispensed once.

Also: "A prescription for antibiotics: 7 days".

> - Asiakkaan tulee antaa suostumus reseptitietojensa luovuttamiseen ulkomaille. Suostumus annetaan Puolan terveysministeriön verkkopalvelussa (pacjent.gov.pl).
> - Reseptiä haettaessa annetaan asiakkaan puolalainen henkilötunnus (PESEL).
> - Vain täysi-ikäisten reseptien toimittaminen on mahdollista.
> - Reseptit ovat voimassa tavanomaisille lääkkeille ja itsehoitolääkkeille 30 päivää, immunologisille lääkkeille 120 päivää ja antibiooteille 7 päivää.
> - psykotrooppisten, voimakkaasti keskushermostoon vaikuttavien ja apteekissa valmistettavien ex tempore-lääkkeiden toimittaminen ei ole mahdollista
> - määrätyn ja toimitettavan valmisteen ATC-koodit eivät voi poiketa toisistaan.
> - Määräykset ovat pääsääntöisesti kauppanimellä.
> - Toimituksen mitätöinti mahdollista.
> - Reseptin voi toimittaa vain kerran.

PORTUGAL. Consent needed (NHS Portal); passport or ID card; health insurance code + prescription code + dispensation PIN.

> - The customer must consent to the release of prescription details abroad through the Portuguese NHS Portal.
> - When collecting a prescription, the customer's health insurance code is provided. The code can be found on the back of the identity card (NHS patient ID). In addition, the prescription code and dispensation PIN code are provided. They are on the prescription printout or in the customer’s mobile app.
> - Prescriptions for acute ailments are valid for 30 days and for long-term ailments for six months.
> - Prescriptions are usually issued under a generic name, the use of a trade name must be justified in the prescription.
> - There are not restrictions concerning the processing of prescription data of an underage person.

> - Asiakkaan tulee antaa suostumus reseptitietojen luovuttamiseen ulkomaille Portugalin NHS-portaalin kautta.
> - Reseptiä haettaessa annetaan asiakkaan sairausvakuutustunnus. Tunnus löytyy henkilökortin taustapuolelta (NHS patient ID). Lisäksi annetaan reseptin tunnus ja toimituksen PIN-koodi. Ne ovat reseptin tulosteessa tai asiakkaan matkapuhelinsovelluksessa.
> - Lääkemääräykset akuuttiin vaivaan ovat voimassa 30 päivää ja pitkäaikaiseen vaivaan kuusi kuukautta.
> - Määräykset ovat pääsääntöisesti geneerisellä nimellä, kauppanimen käyttö on perusteltava reseptissä.
> - Alaikäisen reseptitietojen käsittelyssä ei ole rajoituksia.

SPAIN. No consent; identified by the HEALTH INSURANCE CARD (tarjeta sanitaria), with passport or photo ID as well if the card has no photo; public prescriptions of the card's own region only; not private doctors' prescriptions.

> - Clients are identified by means of a health insurance card with a photograph (‘tarjeta sanitaria’ in Spanish, abbreviated as TASA). If the client’s health insurance card does not have a photograph, they must additionally present a passport or photo ID in addition to the health insurance card.
> - The customer does not need to give consent to the disclosure of prescription data for dispensing abroad.
> - Spanish prescriptions will not be sent abroad if they are prescribed
> - during a private doctor’s appointment
> - in a region in Spain, which is not the ‘domicile’ region of the client. Only the prescriptions from the region that issued the client’s health insurance card will be sent abroad.
> - Prescriptions can either be generic or indicate trade names.
> - Due to country-specific restrictions in Spain, Finnish pharmacies cannot dispense prescriptions that prescribe
> - preparations containing more than four compounds (multivitamins)
> - medicines that are prepared at the pharmacy (ex tempore)
> - vaccines
> - non-medicinal products (such as wound care products).
> - Prescriptions for medicines for chronic diseases are valid for a year.
> - Doctors, nurses, and dentists can prescribe medication.
> - Cancellation of dispensing possible.

> Note! Not all regional health insurance cards have a regional identifier. In such cases, the client must be able to provide their regional identifier, otherwise they cannot be identified.

> - Asiakas tunnistetaan kuvallisesta sairausvakuutuskortista (esp. tarjeta sanitaria, lyh. TASA). Jos asiakkaan sairausvakuutuskortissa ei ole kuvaa, täytyy hänen esittää sairausvakuutuskortin lisäksi passi tai kuvallinen henkilökortti.
> - Asiakkaan ei tarvitse antaa suostumusta reseptitietojen luovuttamiseen ulkomaille toimitusta varten.
> - Espanjalainen resepti ei välity ulkomaille, jos se on määrätty
> - yksityislääkärin vastaanotolla
> - Espanjan alueella, joka ei ole asiakkaan ”kotialue”. Vain asiakkaan sairausvakuutuskortin myöntäneen alueen reseptejä välitetään ulkomaille.
> - Reseptit voivat olla joko geneerisellä nimellä tai kauppanimellä.
> - Espanjan maakohtaisten rajoitusten vuoksi Suomessa ei voi toimittaa reseptejä, joilla on määrätty
> - enemmän kuin neljää yhdistettä sisältävää valmistetta (monivitamiinit)
> - apteekissa valmistettavia lääkkeitä (ex tempore)
> - rokotteita
> - valmisteita, jotka eivät ole lääkkeitä (esim. haavanhoitovalmisteet).
> - Kroonisten sairauksien lääkkeiden reseptit ovat voimassa vuoden.
> - Lääkärit, sairaanhoitajat sekä hammaslääkärit voivat määrätä lääkkeitä.
> - Toimituksen mitätöinti mahdollista.

> Huom! Kaikissa alueellisissa sairausvakuutuskorteissa ei ole aluetunnistetta. Tällöin asiakkaan pitää osata kertoa aluetunnisteensa, muuten häntä ei voi tunnistaa.

The page has a table of 18 Spanish regions (Andalusia, Aragon, Asturias, the Balearic Islands, Basque Country, Cantabria, Ceuta, Extremadura, Galicia, the Canary Islands, Castile and León, Castilla-La Mancha, Catalonia, Community of Madrid, Melilla, Murcia, Navarra, Valencia), each with its card, the form of its personal code (CIPA) and a six-digit regional identifier. It is in the appendix. La Rioja is not in the table: whether that means it is not covered is NOT STATED (inference only, do not show it).

Spain on the citizens' page (Kanta, 3.2.2026, FAQ):

> You can purchase the medicine in Finland if you have a Spanish health insurance card with a photo. If your Spanish health insurance card does not have a photo, please also present your passport or photo ID at the pharmacy.

> If you do not have a Spanish health insurance card and need the medicine urgently, please contact the Finnish health care services to get a new prescription.

> Voit ostaa lääkettä Suomesta, jos sinulla on espanjalainen kuvallinen sairausvakuutuskortti. Jos espanjalaisessa sairausvakuutuskortissasi ei ole kuvaa, esitä apteekissa lisäksi passi tai kuvallinen henkilökortti.

> Jos sinulla ei ole espanjalaista sairausvakuutuskorttia ja tarvitset lääkettä kiireellisesti, ota yhteyttä suomalaiseen terveydenhuoltoon, jotta saat uuden reseptin.

Summary of consent, as the pharmacies' page states it: needed in Croatia, Poland, Portugal; not needed in Czechia, Estonia (can refuse), Spain; Lithuania "can refuse"; Latvia not stated.

#### B3. A PAPER prescription from another EU or EEA country or Switzerland

Kanta citizens says it is accepted and sends the reader to EU-healthcare:

> You can also buy prescription medicines with a paper prescription issued in another EU or EEA country or Switzerland.

> Voit ostaa reseptilääkkeitä myös toisessa EU- tai Eta-maassa tai Sveitsissä kirjoitetulla paperisella reseptillä.

EU-healthcare, "Using a foreign medical prescription in Finland" (Last updated: 20.10.2026). Is it dispensed, and from where:

> In Finland, you can purchase medication with a paper prescription issued in another EU or EEA country or Switzerland if the medication in question is licensed for sale in Finland. You can also purchase medicines with an electronic prescription prescribed in Estonia, Croatia, Portugal, Poland, Czech Republic, Latvia, Lithuania or Spain. Prescriptions issued in countries other than other EU or EEA countries or Switzerland cannot be used to purchase medicines in Finland.

> Voit ostaa lääkkeitä Suomessa toisessa EU- tai Eta-maassa tai Sveitsissä kirjoitetulla kirjallisella lääkemääräyksellä, jos lääkkeellä on Suomessa myyntilupa. Voit ostaa lääkkeitä myös Virossa, Kroatiassa, Portugalissa, Puolassa, Tšekissä, Latviassa, Liettuassa tai Espanjassa määrätyllä sähköisellä reseptillä. Muussa kuin EU- tai Eta-maassa tai Sveitsissä kirjoitetulla lääkemääräyksellä ei voi ostaa lääkkeitä Suomessa.

What it must contain:

> Prescriptions written in other EU or EEA countries or Switzerland must be filled in Finland if they carry the following information:
> - patient’s surname, first name and date of birth
> - prescription’s date of issue
> - information on the prescribing professional: surname, first name, professional qualification, direct contact information (e-mail address and phone number or fax with the international prefix), work address (including country) and signature
> - information on the medicine: name of the active substance, pharmaceutical form, quantity, strength and dosage regimen.
>
> A pharmacy may, however, fill a prescription upon its own discretion, even if some required piece of information of the prescription is missing.

> Toisessa EU- tai Eta-maassa tai Sveitsissä kirjoitettu lääkemääräys tulee toimittaa Suomessa, jos siinä on vähintään seuraavat tiedot:
> - potilaan sukunimi, etunimi ja syntymäaika
> - lääkemääräyksen antopäivä
> - lääkemääräyksen antaneen terveydenhuollon ammattihenkilön tiedot: sukunimi, etunimi, ammatillinen pätevyys, suorat yhteystiedot (sähköpostiosoite ja puhelinnumero tai faksi, kansainvälisellä suuntanumerolla varustettuna), työosoite (myös maa) ja allekirjoitus
> - lääkettä koskevat tiedot: lääke vaikuttavan aineen nimellä, lääkemuoto, määrä, vahvuus ja annosteluohjeet.
>
> Apteekki voi kuitenkin oman harkintansa mukaan toimittaa lääkemääräyksen, vaikka jokin reseptin vähimmäistieto puuttuisikin.

Active substance name, trade name only with a reason:

> If you intend to purchase medication in another member state, the prescription must be issued using the name of the active substance of the pharmaceutical. The prescription can be issued using the trade name if the use of the trade name is justified. The use of the trade name must be justified in the prescription.

> Jos aiot hankkia lääkkeen toisessa jäsenmaassa, lääkemääräyksen tulee olla kirjoitettu lääkkeen vaikuttavan aineen nimellä. Lääkemääräyksen voi kirjoittaa kauppanimellä, jos kauppanimen käyttöön on perusteltu syy. Kauppanimen käyttö pitää perustella lääkemääräyksessä.

No special form is needed:

> The EU countries use a variety of prescription forms. The layout of the prescriptions has not been harmonised. Some countries have adopted separate forms for medicines to be purchased abroad, but not all countries have done this. A pharmacy must fill a prescription issued in another EU country if it contains the above-mentioned information, irrespective of the layout.

> EU-mailla on käytössään erilaisia lääkemääräyslomakkeita. Lääkemääräysten ulkoasua ei ole yhdenmukaistettu. Jotkin maat ovat ottaneet käyttöön erillisen lomakkeen ulkomailla hankittavia lääkkeitä varten, mutta eivät kaikki. Toisessa EU-maassa annettu lääkemääräys tulee toimittaa apteekissa, jos siinä on vähintään yllä mainitut tiedot riippumatta lomakkeen ulkoasusta.

Excluded medicines:

> Medicines classified as narcotics, medicines that affect the central nervous system and medicine requiring prescription retention cannot be purchased with a prescription issued in another EU or EEA country or Switzerland. If you need such medicines during your stay in Finland, you need to obtain a prescription from a doctor who practises in Finland.

> Huumausaineiksi luokiteltavia, tiettyjä keskushermostoon vaikuttavia sekä säilytettävää lääkemääräystä vaativaa lääkkeitä ei voi ostaa toisessa EU- tai Eta-maassa tai Sveitsissä kirjoitetulla lääkemääräyksellä. Jos tarvitset kyseisiä lääkkeitä oleskellessasi Suomessa, sinun tulee pyytää resepti Suomessa toimivalta lääkäriltä.

FLAG (EN and FI differ again): Finnish "tiettyjä keskushermostoon vaikuttavia" = CERTAIN medicines that affect the central nervous system; the English drops "certain" and reads as all of them. Kanta's citizens page has "certain" in both languages (B2). Prefer "certain".

The pharmacy may refuse, and who may prescribe:

> A pharmacy may decline to fill a prescription issued in another EU or EEA country or Switzerland if there is reason to suspect its authenticity. If necessary, the pharmacy can request a contact point for cross-border health care to determine the right of the person who issued the prescription to practise their profession. This might take some time because the system is not real-time.

> In European countries, the various professional groups in the health care field have different rights with regard to prescribing medication. For example, in many countries nurses are allowed to prescribe certain medicines. A prescription must be filled in Finland if the person who issued the prescription was entitled to do so in the country where the prescription was issued.

> Apteekki voi kieltäytyä toimittamasta toisessa EU- tai Eta-maassa tai Sveitsissä annettua lääkemääräystä, jos on syytä epäillä lääkemääräyksen aitoutta. Tarvittaessa apteekki voi selvittää rajat ylittävän terveydenhuollon yhteyspisteen välityksellä lääkkeen määränneen henkilön ammatinharjoittamisoikeuden. Tarkastamiseen voi kulua jonkin aikaa, koska järjestelmä ei ole reaaliaikainen.

> Euroopan maissa eri terveydenhuollon ammattiryhmillä on erilaisia oikeuksia lääkkeiden määräämisessä. Useissa maissa esimerkiksi sairaanhoitajat voivat määrätä joitakin lääkkeitä. Lääkemääräys tulee toimittaa Suomessa, jos henkilöllä on ollut oikeus määrätä lääkettä siinä maassa, jossa lääkemääräys on annettu.

The page's own FAQ, a compact statement of all of it:

> You can purchase medication with a prescription issued in another EU or EEA country or Switzerland from a Finnish pharmacy if the medication in question is licensed for sale in Finland. The prescription must include the details of the patient, the prescription’s date of issue, the details and signature of the prescriber and information about the medication. That said, not all medication can be bought with a prescription issued abroad. For example, medicines classified as narcotics can only be bought with a prescription issued by a doctor operating in Finland.

> Voit ostaa lääkkeitä toisessa EU- tai Eta-maassa tai Sveitsissä kirjoitetulla reseptillä suomalaisesta apteekista, jos lääkkeellä on Suomessa myyntilupa. Reseptissä pitää olla potilaan tiedot, lääkemääräyksen antopäivä, reseptin kirjoittajan tiedot ja allekirjoitus sekä lääkettä koskevat tiedot. Kaikkia lääkkeitä ei kuitenkaan voi ostaa ulkomailla kirjoitetulla reseptillä. Esimerkiksi huumausaineiksi luokiteltavia lääkkeitä voi ostaa ainoastaan Suomessa toimivan lääkärin kirjoittamalla reseptillä.

> The use of prescriptions involves some restrictions. For example, you will need a prescription written by a local doctor for narcotic or psychotropic medicines. A pharmacy may also refuse to accept a prescription if there is doubt about its authenticity.

> Reseptin käyttöön liittyy rajoituksia. Esimerkiksi huumausaineita tai keskushermostoon vaikuttavia lääkkeitä varten tarvitset paikallisen lääkärin kirjoittaman reseptin. Apteekki voi myös kieltäytyä reseptin toimittamisesta, jos se epäilee reseptin aitoutta.

Identity document for a PAPER prescription: not stated. (Passport or ID is stated for the electronic prescription only.)
How long a foreign paper prescription is valid in Finland: not stated on this page. (The page on the other direction says validity follows the law of the country where the medicine is bought, and that in Finland a prescription is usually valid for two years; applying that to a foreign paper prescription in Finland is an inference, not a statement.)

Fimea (the regulator), notice of 21.2.2020, https://fimea.fi/-/fimean-maarays-laakkeiden-toimittamisesta-eurooppalaisella-laakemaarayksella-paivitetty (Finnish only fetched). Old, but it names the regulation in force: Fimea regulation 1/2020, in force from 24.2.2020 "until further notice". I did not open the regulation itself (a PDF):

> Lääkealan turvallisuus- ja kehittämiskeskus Fimea on päivittänyt lääkkeiden toimittamisesta eurooppalaisen lääkemääräyksen perusteella annettua määräystä. Uusi määräys 1/2020 tulee voimaan 24.2.2020. Määräys on voimassa toistaiseksi. Tämä määräys koskee vain ihmisille tarkoitettuja kaupan olevia lääkevalmisteita, eikä esimerkiksi erityisluvallisia lääkevalmisteita tai ex tempore -lääkevalmisteita.

> Pääsääntöisesti eurooppalaisen lääkemääräyksen toimittamisessa noudatetaan kansallisia säädöksiä.

> Luotettavina tunnistamisvälineinä voidaan pitää passia ja henkilökorttia tai kunkin jäsenmaan erikseen määrittelemää muuta luotettavaa tunnistamisvälinettä.

(My translation, not the page's: the regulation covers only medicinal products for humans that are on the market, not for example special-permit products or ex tempore products; a European prescription is dispensed under national rules as a main rule; a passport, an identity card, or another reliable means that each member state defines, count as reliable identification.) Whether regulation 1/2020 is still the one in force today was NOT checked: the notice is from 2020.

#### B4. Reimbursement (Kela)

Electronic foreign prescription: no direct reimbursement at the pharmacy (Kanta citizens, 3.2.2026):

> For the time being, you cannot receive direct reimbursement for medicines purchased from a Finnish pharmacy using a European ePrescription. Depending on your situation, you may seek reimbursement afterwards from your country of residence or from Kela in Finland. For this purpose, please keep the documents, receipts and protective packaging associated with your medicines.

> Toistaiseksi et voi saada sähköisellä eurooppalaisella reseptillä Suomesta ostetuista lääkkeistä korvausta suoraan apteekista. Tilanteestasi riippuen voit hakea korvausta jälkikäteen asuinmaastasi tai Suomesta Kelasta. Säilytä tätä varten lääkkeisiin liittyvät dokumentit, kuitit ja suojapakkaukset.

What the pharmacy gives for the claim (Kanta professionals, 4.11.2026):

> For the purpose of applying for reimbursement, give the client
> - a receipt for the purchase
> - a printout of the pdf version of the prescription
> - an invoice for the purchased medicines, if the client intends to claim reimbursement from Kela.

> Anna asiakkaalle korvauksen hakemista varten
> - kuitti ostoksesta
> - tuloste reseptin pdf-versiosta
> - laskelma lääkeostoista, jos asiakas aikoo hakea korvausta Kelasta.

Paper foreign prescription and reimbursement: NOT STATED as such on any page read. The general rule is on EU-healthcare, "Reimbursements for medicines purchased in Finland", https://www.eu-healthcare.fi/medicines/medicinal-treatment-in-finland/reimbursements-for-medicines-purchased-in-finland/ (Last updated: 12.1.2026), FI https://www.eu-terveydenhoito.fi/laakkeet/laakehoito-suomessa/korvaus-suomessa-ostetuista-laakkeista/ (Viimeksi päivitetty: 12.1.2026). It is about who is insured where, not about where the prescription was written:

> Generally speaking, persons coming from abroad must first pay for the medication themselves and apply for retroactive reimbursement from Kela.

> Ulkomailta tulevan henkilön tulee yleensä maksaa lääkkeet ensin itse ja hakea korvausta jälkikäteen Kelasta.

> You can be reimbursed for medicines purchased in Finland if one of the following conditions is met:
> - you are covered by health insurance in Finland
> - your municipality of residence is in Finland
> - you are covered by health insurance in another EU or EEA country, United Kingdom, Switzerland or Australia and you have received medically necessary treatment during you temporary stay in Finland

> You can apply for the reimbursement of medicine costs from your own health insurance institution in the following cases:
> - you are covered by health insurance in another EU or EEA country or Switzerland and you have received medically necessary treatment during your temporary stay in Finland
> - you have come to Finland for treatment from another EU or EEA country or Switzerland without prior authorisation.
> - you are covered by health insurance in country other than an EU or EEA country or Switzerland or Australia

> Voit saada Kelasta korvausta Suomesta ostamistasi lääkkeistä, jos jokin seuraavista ehdoista täyttyy
> - olet sairausvakuutettu Suomessa
> - sinulla on Suomessa kotikunta
> - olet sairausvakuutettu toisessa EU- tai Eta-maassa, Sveitsissä, Isossa-Britanniassa tai Australiassa ja olet saanut lääketieteellisesti välttämätöntä hoitoa tilapäisen Suomessa oleskelusi aikana

> Voit hakea korvausta lääkekustannuksiin omasta sairausvakuutuslaitoksestasi, jos
> - olet sairausvakuutettu toisessa EU- tai Eta-maassa tai Sveitsissä ja olet saanut lääketieteellisesti välttämätöntä hoitoa tilapäisen Suomessa oleskelusi aikana
> - olet hakeutunut Suomeen hoitoon toisesta EU- tai Eta-maasta tai Sveitsistä ilman ennakkolupaa
> - olet sairausvakuutettu jossain muussa kuin EU- tai Eta-maassa tai Sveitsissä tai Australiassa.

(The full lists of conditions, six and three items, are in the appendix.)

#### B5. Nordic countries, and countries outside the EU and EEA

Nordic countries specifically: NOT STATED. None of the Kanta or EU-healthcare pages read today contains the word "Nordic" or "pohjoismainen" (checked by search over the saved texts). Denmark, Sweden, Norway and Iceland are covered only as EU or EEA countries (paper prescription); none of them is in the electronic list. A site search of fimea.fi returned only an old Fimea regulation from 2006 (3/2006) as a hit for "pohjoismainen lääkemääräys"; I did not open it and it is not evidence of today's rule. Do not show anything Nordic-specific for Finland.

Outside the EU, the EEA and Switzerland: not accepted (EU-healthcare, 20.10.2026):

> Prescriptions written outside the EU or EEA countries or Switzerland are not accepted in Finland.

> EU- ja Eta-maiden sekä Sveitsin ulkopuolella kirjoitetut reseptit eivät käy Suomessa.

The United Kingdom: not named on the pages about prescriptions. It is not an EU or EEA country, so by the sentence above a UK prescription is not accepted in Finland, but that step is an INFERENCE: the page does not say "United Kingdom". (The UK is named only on the reimbursement page, about insurance.)

---

### C. Advice line: Medical Helpline / Päivystysapu 116117

Source: the service's own site, https://116117.fi/en and https://116117.fi/fi. No "updated" date shown (footer: Manufacturer DigiFinland, Version 2.4.2, Year of manufacture 2026). The site says who is behind it: the wellbeing services counties organise the service and DigiFinland Oy, "a publicly owned company", coordinates its national development.

RESULT: the number is 116117. It gives advice on acute (sudden) health problems, to be called before going to an emergency clinic. Free, 24/7, everywhere in Finland except Åland. In an emergency: 112.

> In an emergency, call 112

> The Medical Helpline 116117 is an advisory service organised by your wellbeing services county that provides advice on acute health problems.

> Call the Medical Helpline number 116117 before going to the clinic. The health care professionals of the Medical Helpline will tell you whether your situation requires a visit to the clinic or not. If self-care is sufficient for your situation, you will receive reliable self-care instructions conveniently while sitting on your own couch.

> The service is available everywhere in Finland, with the exception of Åland.

> Calling does not cost anything. When calling with an international cell phone plan, your operator may charge a fee for the call.

> The Medical Helpline is available 24/7 for urgent health problems. There are regional differences in the operation the Medical Helpline; check the instructions for your region by selecting the region.

> The Medical Helpline 116117 is an advisory service organised by wellbeing services counties that provides advice on acute health problems. The national development of the service is coordinated by DigiFinland Oy, a publicly owned company.

> Hätätilanteessa soita 112

> Päivystysapu 116117 on hyvinvointialueesi järjestämä neuvontapalvelu, joka neuvoo äkillisissä terveysongelmissa.

> Soita Päivystysavun numeroon 116117 ennen päivystykseen hakeutumista. Päivystysavussa terveydenhuollon ammattilaiset kertovat, vaatiiko tilanteesi käynnin päivystyksessä. Mikäli tilanteeseesi riittää itsehoito, saat luotettavat itsehoito-ohjeet kätevästi, vaikka kotisohvalle.

> Palvelu on käytössä kaikkialla Suomessa, lukuun ottamatta Ahvenanmaata.

> Puhelu on maksuton. Ulkomaisesta liittymästä soitettaessa operaattorisi saattaa periä puhelusta maksun.

> Päivystysapu palvelee kiireellisissä terveysongelmissa 24/7. Päivystysavun toiminnassa on alueellisia eroja, tarkista oman alueesi ohjeistus valitsemalla alue.

> Päivystysapu 116117 on hyvinvointialueiden järjestämä neuvontapalvelu, joka neuvoo äkillisissä terveysongelmissa. Palvelun kansallista kehittämistä koordinoi julkisomisteinen DigiFinland Oy.

Of use to a traveller: the call may cost with a foreign subscription; Åland is not covered. In which languages the line answers: not stated on the page. Whether it can be called from abroad: not stated.

---

### 4. Flags: contradictions and differences between official pages

1. Eight countries, CONFIRMED in both directions, by five pages (Kanta citizens A and B, Kanta professionals two pages, EU-healthcare two pages). No page disagrees on the list.
2. CNS medicines, the English is broader than the Finnish in two places:
   - Kanta citizens, buying abroad: EN "central nervous system (CNS) agents" vs FI "useimmat pääasiassa keskushermostoon vaikuttavat (PKV) lääkkeet" (most).
   - EU-healthcare, foreign prescription in Finland: EN "medicines that affect the central nervous system" vs FI "tiettyjä keskushermostoon vaikuttavia" (certain).
   - The exact rule is on the Kanta professionals' pages: those needing the original prescription, class PA or ZA.
3. Estonia's conditions in Finland are worded three ways (B2). The address in Estonia is on the two Kanta pages and missing from EU-healthcare.
4. Finnish paper prescription abroad: EU-healthcare says "EU and EEA countries" and does not name Switzerland; in the other direction (foreign paper prescription in Finland) the same site says "EU or EEA country or Switzerland". So Switzerland is stated one way only. Kanta's citizens page names no countries at all for the paper prescription; Kanta's professionals' page says "The EU countries must recognise prescriptions issued in other member states".
5. Spain: Kanta says "Regions which accept Finnish e-prescriptions" (by region); EU-healthcare says "some ... Spanish pharmacies". And for Spanish prescriptions in Finland, only public prescriptions from the region that issued the health card are sent.
6. "All pharmacies" in Croatia, Estonia, Latvia and Lithuania comes from EU-healthcare (9.10.2026), not from Kanta.
7. The link for Czechia is labelled "epreskripce.cz" but points to epreskripce.gov.cz.
8. Kanta's section page "Prescriptions and medicines" (Last updated 6.2.2025) still says "from a few countries" / "a few European countries" without lists: consistent, just less exact.
9. Addresses in the brief: `/en/buying-prescription-medicines-abroad` redirects (301) to `/en/purchasing-prescription-medicines-abroad`; `/laakkeen-ostaminen-ulkomailla` is a 404; `/en/buying-medicines-in-finland-with-a-european-prescription` is a 404.
10. Not about prescriptions, but on the same Kanta page (EN only; the Finnish paragraph has no country names): "At this time, data can be transferred to Estonia and Spain." This is patient data (Patient Summary), a different service from the e-prescription.

### 5. What is NOT stated anywhere I read

- Start dates per country (either direction).
- Any percentage other than Poland's ("Approximately 90% of pharmacies").
- A "for purchase abroad" marking on the electronic prescription.
- Countries where the paper "prescription for purchases abroad" works, on the Kanta citizens page.
- Anything specific to Nordic countries.
- The United Kingdom by name, for prescriptions.
- An identity document for a foreign PAPER prescription in Finland; its period of validity in Finland.
- Kela reimbursement for a purchase with a foreign PAPER prescription, as such.
- Consent for Latvia.
- The languages of the 116117 line.

### 6. URLs

Fetched and read (26 Nov 2026):
1. https://www.kanta.fi/en/buying-prescription-medicines-abroad → 301 → https://www.kanta.fi/en/purchasing-prescription-medicines-abroad
2. https://www.kanta.fi/fi/reseptilaakkeen-ostaminen-ulkomailta → https://www.kanta.fi/reseptilaakkeen-ostaminen-ulkomailta
3. https://www.kanta.fi/en/professionals/prescription-abroad
4. https://www.kanta.fi/fi/ammattilaiset/resepti-ulkomailla → https://www.kanta.fi/ammattilaiset/resepti-ulkomailla
5. https://www.kanta.fi/en/instructions-and-use (navigation only)
6. https://www.kanta.fi/en/prescriptions-and-medicines (navigation; led to the next page)
7. https://www.kanta.fi/en/laakkeen-osto-ulkomaisella-reseptilla → https://www.kanta.fi/en/buying-medicines-with-an-overseas-prescription
8. https://www.kanta.fi/fi/laakkeen-osto-ulkomaisella-reseptilla → https://www.kanta.fi/laakkeen-osto-ulkomaisella-reseptilla
9. https://www.kanta.fi/en/professionals/dispensing-of-european-e-prescriptions
10. https://www.kanta.fi/ammattilaiset/sahkoisen-eurooppalaisen-reseptin-toimitus
11. https://www.eu-healthcare.fi/medicines/filling-foreign-medical-prescriptions-in-finland/
12. https://www.eu-terveydenhoito.fi/laakkeet/ulkomaisten-laakemaaraysten-toimittaminen-suomessa/
13. https://www.eu-healthcare.fi/medicines/european-medical-prescription/
14. https://www.eu-terveydenhoito.fi/laakkeet/eurooppalainen-laakemaarays/
15. https://www.eu-healthcare.fi/medicines/medicinal-treatment-in-finland/reimbursements-for-medicines-purchased-in-finland/
16. https://www.eu-terveydenhoito.fi/laakkeet/laakehoito-suomessa/korvaus-suomessa-ostetuista-laakkeista/
17. https://116117.fi/en
18. https://116117.fi/fi
19. https://fimea.fi/-/fimean-maarays-laakkeiden-toimittamisesta-eurooppalaisella-laakemaarayksella-paivitetty

Could not be fetched:
- https://www.kanta.fi/laakkeen-ostaminen-ulkomailla : HTTP 404 (wrong address; replaced by no. 2).
- https://www.kanta.fi/en/buying-medicines-in-finland-with-a-european-prescription : HTTP 404 (wrong address; replaced by no. 7).

Searched, not read as a page: one web search limited to fimea.fi for a statement on Nordic prescriptions. Its hits are not used as evidence, except that it led to no. 19.

Not opened (named on the pages, for a later reading if needed): Fimea regulation 1/2020 (PDF); Kela's "Travelling with medication" https://www.kela.fi/foreign-travel-and-medicine-expenses ; EU-healthcare's "Reimbursement for medicines purchased abroad"; the European Commission's patient information notices for Finland https://health.ec.europa.eu/ehealth-digital-health-and-care/digital-health-and-care/electronic-cross-border-health-services/patient-information-notices-finland_en ; the Swedish versions of all pages.

---

---

## Cross-border prescriptions: the edges of the EU rule

Research notes. Every page below was fetched on **26 Nov 2026**. Budget used: 12 searches + 18 page fetches (5 of them failed or were redirected elsewhere).

How to read these notes:

- **"The page says"** = text copied from the page as fetched (curl, then HTML stripped to text locally; PDFs through PDFKit). Quotes are verbatim. In the two PDFs, end-of-line hyphens were joined ("ver-sicherten" to "versicherten"); nothing else was changed.
- **"Inference"** = my reading. Do not publish an inference as a sourced claim.
- **"Not verified"** = text that came from a search engine's summary of a page I could not open. Not read today, not verbatim. Do not publish.
- Translations are mine.

---

### Status per question

| # | Question | Status |
|---|---|---|
| 1 | Switzerland as the country one is in | One statement found (cantonal pharmacists' position paper, copy hosted by the pharmacists' association). No BAG, Swissmedic or ch.ch statement found. MyHealth@EU: no official Swiss statement found. |
| 2 | Switzerland as the home country | One Swiss federal statement found, but it is about medical aids, in a draft Federal Council dispatch. No statement about medicines found. |
| 3 | Norway (a), (b), (c) | All three answered from Helsedirektoratet and Helsenorge. |
| 4 | Iceland, Liechtenstein as home countries | **Not reached.** Two incidental lines noted. |
| 5 | United Kingdom as the home country | Only a Spain-specific GOV.UK statement found. The general GOV.UK page now redirects to a page that says nothing on prescriptions. |
| 6 | Info Norden | **Could not be read: norden.org answers 403 to automated fetches** (three attempts, two tools). Nothing verified. |
| 7 | Sweden, Denmark, Germany as the country one is in | All three answered. |

---

### 1. Switzerland as the country one is in

#### 1.1 Cantonal pharmacists' position paper 0025, "Ärztliche Verschreibungen"

- **URL fetched:** https://pharmasuisse.org/system/files/media/documents/2025-07/0025_Aerztliche_Verschreibungen_V02_d.pdf
- **Who publishes:** The copy I read is hosted by **pharmaSuisse (the Swiss pharmacists' association)**. The document itself is a "Positionspapier" numbered 0025. Its text refers to "cGAP Aktuelle Regeln der Guten Abgabepraxis für Heilmittel der Kantonsapothekervereinigung Schweiz", to "www.kantonsapotheker.ch", and its history names its predecessor as "Positionspapier H 010.02 V02 der KAV-NWCH vom 1.11.2018". **Inference:** it is a position paper of the Kantonsapothekervereinigung (the association of the cantonal pharmacists, who are cantonal officials). The PDF's text layer has no explicit "published by" line (probably a logo), and I did **not** fetch it from kantonsapotheker.ch. A search restricted to that name did not return a kantonsapotheker.ch URL for it. Label it accordingly, or fetch the original before publishing.
- **Date on the document:** page 1 header: "Nummer: 0025 / Version: V02 / Ersetzt Version: V01 / Gültig ab 22.05.2025". Note: the headers of pages 13 to 16 still read "Version: V01 / Ersetzt Version: KAV-NWCH" (the document's own inconsistency).
- **Scope (section 3), the page says:** "Dieses Dokument gilt für alle Personen die Heilmittel verschreiben und Verschreibungen ausführen oder einlösen."
  - EN: "This document applies to all persons who prescribe therapeutic products and who dispense or redeem prescriptions."

**The key passage (section 9.4, "Abgabe von Arzneimitteln ohne Rezept in Apotheken", page 15). The page says:**

> "Ausländische Rezepte sind grundsätzlich ungültig (vorbehalten sind spezielle Regelungen für Grenzpraxen). Eine allfällige Abgabe von Arzneimitteln ist wie eine Abgabe ohne Rezept zu handhaben."

EN: "Foreign prescriptions are in principle invalid (special rules for practices near the border are reserved). Any dispensing of medicines is to be handled like a dispensing without a prescription."

**What "like a dispensing without a prescription" means, same section. The page says:**

> "Sollte ein verschreibungspflichtiges Arzneimittel abgegeben werden, obwohl kein gültiges Rezept vorhanden ist, obliegt das der Verantwortung des Apothekers. Bei der Entscheidung muss die Sorgfaltspflicht gewahrt werden."

EN: "If a prescription-only medicine is dispensed although there is no valid prescription, this is the pharmacist's responsibility. The duty of care must be observed in the decision."

> "In jedem Fall muss die dokumentierte Freigabe durch einen Apotheker / eine Apothekerin erfolgen."

EN: "In every case the documented release must be made by a pharmacist."

**Who may prescribe (section 6). The page says:**

> "Folgende Personen sind berechtigt, Rezepte auszustellen bzw. Arzneimittel zu verschreiben: • Ärzte und Tierärzte mit einer Berufsausübungsbewilligung in der Schweiz, die zur selbstständigen Tätigkeit berechtigt (Praxisbewilligung) oder Spitalärzte, […]"

EN: "The following persons are entitled to issue prescriptions or prescribe medicines: doctors and veterinarians with a licence to practise in Switzerland that entitles them to independent practice, or hospital doctors […]"

**Reservation (section 10). The page says:** "Vorbehalten bleiben anderslautende kantonale Bestimmungen." EN: "Cantonal provisions to the contrary are reserved."

**Electronic prescriptions (section 6.3). The page says:**

> "Auf einem elektronisch übermittelten Rezept wird zwingend eine qualifizierte Unterschrift gemäss dem ZertES gefordert."

> "Das digitale Rezept „E-Rezept Schweiz“ ist derzeit die einzige Lösung, die den Anforderungen des HMG entspricht und von den Bundesbehörden anerkannt wird."

EN: "An electronically transmitted prescription must carry a qualified signature under ZertES [the Swiss electronic signature act]." / "The digital prescription 'E-Rezept Schweiz' is at present the only solution that meets the requirements of the Therapeutic Products Act and is recognised by the federal authorities."

**Inference:** a Swiss pharmacy is not obliged to honour an EU/EEA prescription. It may still hand over the medicine, on the pharmacist's own responsibility, as a dispensing without a valid prescription. A foreign e-prescription has no route in at all (the only recognised e-prescription is the Swiss one). The paper does not mention the EU, the EEA or the bilateral agreements; "ausländisch" is not narrowed.

#### 1.2 BAG / FOPH, Swissmedic, ch.ch

**No official statement found.** Two searches (one restricted to bag.admin.ch, admin.ch, ch.ch, e-health-suisse.ch, swissmedic.ch, kantonsapotheker.ch) returned no page from these bodies on dispensing foreign prescriptions in Switzerland.

#### 1.3 Is Switzerland part of the MyHealth@EU ePrescription exchange?

**No official Swiss statement found.** Not searched beyond the above. The EU's own list of participating countries is the other researcher's part.

---

### 2. Switzerland as the home country

#### 2.1 Federal Council, draft dispatch on the Health Insurance Act (hosted by BAG)

- **URL fetched:** https://www.bag.admin.ch/dam/de/sd-web/HI4155V-gbaq/BOTSCH~1.PDF
- **Who publishes:** hosted on bag.admin.ch (Federal Office of Public Health). The document is signed "Im Namen des Schweizerischen Bundesrates".
- **What it is:** "Botschaft zur Änderung des Bundesgesetzes über die Krankenversicherung (Bezug von der Untersuchung oder Behandlung dienenden Mitteln und Gegenständen im EWR)". **It is a draft:** numbered "26.xxx", dated "vom …" with the date left open, placeholders in the footer. 42 pages.
- **Date shown:** none (year "2026-" in the footer placeholder).
- **Caution on subject:** the dispatch is about **medical aids and devices ("Mittel und Gegenstände")**, for example dressings and test strips, bought in the EEA. It is not about medicinal products.

**The page says (section "Anerkennung von Rezepten aus der Schweiz", end of chapter 4):**

> "Sollte ein Produkt im betreffenden EWR-Mitgliedstaat rezeptpflichtig sein, so stellt sich die Frage, ob das Schweizer Rezept im Bezugsland anerkannt wird. Die Anerkennung eines in der Schweiz ausgestellten Rezepts im EWR hängt vom nationalen Recht am Bezugsort ab. Es ist Sache der versicherten Person zu klären, ob das Rezept im betreffenden EWR-Staat anerkannt wird. Nur im Falle der Anerkennung des Schweizer Rezepts könnte dieses Produkt im EWR bezogen werden."

EN: "Should a product require a prescription in the EEA member state concerned, the question arises whether the Swiss prescription is recognised in the country of purchase. Recognition of a prescription issued in Switzerland in the EEA depends on the national law at the place of purchase. It is for the insured person to find out whether the prescription is recognised in the EEA state concerned. Only if the Swiss prescription is recognised could this product be obtained in the EEA."

**Inference:** the Swiss federal government's position is that there is no general recognition of Swiss prescriptions in the EEA; each country decides. The sentence is general in wording ("eines in der Schweiz ausgestellten Rezepts") but sits in a text about medical aids, and the text is a draft. Use with that label, or not at all.

#### 2.2 Other

- **No official Swiss statement about Swiss prescriptions for medicines in EU countries found.**
- **Not verified (search summary only, not an official source):** a search summary attributed to e-rezept.ch, via a Swiss broadcaster, the statement that the Swiss e-prescription can only be redeemed in Switzerland and Liechtenstein. e-rezept.ch was not fetched and I did not establish who runs it. Do not publish.
- Destination-side statements found today that bear on a Swiss prescription (all **inference** from the scope words, since none names Switzerland):
  - Norway's regulation covers prescriptions from "et EØS-land" (an EEA country). Switzerland is not in the EEA. See 3(a).
  - Denmark's page covers "other EU/EEA countries". See 7.2.
  - Sweden's page speaks of "another EU Member State". See 7.1.

---

### 3. Norway

#### 3(a) Prescriptions from other EEA countries dispensed in Norway

**Source:** Helsedirektoratet, guide "Rekvirering og utlevering av legemidler m.m.", page "§ 9-5. Ekspedisjon av EØS-resepter"
- **URL:** https://www.helsedirektoratet.no/veiledere/rekvirering-og-utlevering-av-legemidler-m.m/ekspedering-av-legemidler-etter-resept-og-rekvisisjon/-9-5.ekspedisjon-av-eos-resepter
- **Who publishes:** Helsedirektoratet (Norwegian Directorate of Health). The page says: "Veilederen er laget i samarbeid mellom Helsedirektoratet og Direktoratet for medisinske produkter (DMP)."
- **Date shown:** "Siste faglige endring: 31. oktober 2023". The page's own citation line reads "Helsedirektoratet (2022)".
- The page reproduces the regulation's text ("Forskrift om rekvirering og utlevering av legemidler m.m., kapittel 9, § 9-5. Kilde: lovdata.no") and adds guidance.

**The regulation, as quoted on the page:**

> "Resept utstedt av person med rett til å rekvirere legemidler til mennesker i et EØS-land, kan ekspederes ved et apotek i Norge. Resepten må oppfylle de krav som fremgår av § 5-9."

EN: "A prescription issued by a person entitled to prescribe medicines for humans in an EEA country may be dispensed at a pharmacy in Norway. The prescription must meet the requirements set out in § 5-9."

> "Dersom det er berettiget tvil om reseptens ekthet, innhold eller forståelighet, kan apoteket nekte å ekspedere resepten."

EN: "If there is justified doubt about the prescription's authenticity, content or comprehensibility, the pharmacy may refuse to dispense it."

> "Resepten må gjelde et legemiddel i reseptgruppe C som har markedsføringstillatelse i Norge i henhold til legemiddelforskriften kap. 4, 5 eller 6, eller forordning (EU) 2019/6, jf legemiddelloven § 2."

EN: "The prescription must be for a medicine in prescription group C that has a marketing authorisation in Norway under chapters 4, 5 or 6 of the medicines regulation, or Regulation (EU) 2019/6, cf. § 2 of the Medicines Act."

> "Muntlig resept kan ikke ekspederes."

EN: "An oral prescription cannot be dispensed."

**The guidance on electronic EEA prescriptions, same page:**

> "EØS-resepter kan ikke sendes via Reseptformidleren. Det er derfor i praksis utfordrende for apotekpersonale å validere om elektroniske kanaler som benyttes av utenlandske rekvirenter ved overføring av resept er sikker. Ved mottak av elektroniske EØS resepter finnes det heller ikke felles søkbare internasjonale registre der rekvirenters autorisasjon kan kontrolleres. Apotek skal derfor ikke ekspedere elektroniske EØS resepter med mindre apoteket kan dokumentere at avsender er autentisert og har rekvireringsrett, og at elektronisk kanal er sikker."

EN: "EEA prescriptions cannot be sent through Reseptformidleren [the national prescription exchange]. It is therefore in practice difficult for pharmacy staff to validate whether electronic channels used by foreign prescribers to transmit a prescription are secure. When electronic EEA prescriptions are received there are also no shared searchable international registers in which a prescriber's authorisation can be checked. Pharmacies shall therefore not dispense electronic EEA prescriptions unless the pharmacy can document that the sender is authenticated and has the right to prescribe, and that the electronic channel is secure."

**Conditions and exclusions, summarised from the quotes:** EEA prescriber; requirements of § 5-9 met (not read: § 5-9 itself was not fetched); only prescription group C, so groups A and B are excluded (**inference** from "må gjelde et legemiddel i reseptgruppe C"; the page does not describe what A and B are); the medicine must have a marketing authorisation in Norway; no oral prescriptions; the pharmacy may refuse on justified doubt; electronic EEA prescriptions in effect not dispensed.

**Supporting figure (Helsedirektoratet report, see 3(c)). The page says:**

> "Volumet av resepter fra EU/EØS-land som ekspederes i Norge er i dag svært begrenset. Apotekforeningen viser til tall fra Legemiddelregisteret (innhentet ved hjelp av Folkehelseinstituttet) som viser at det i 2025 ble ekspedert totalt 10 152 resepter på norske apotek hvor papirresepten var utstedt av lege uten norsk autorisasjon."

EN: "The volume of prescriptions from EU/EEA countries dispensed in Norway is very limited today. The pharmacy association refers to figures from the medicines register (obtained with the help of the Institute of Public Health) showing that in 2025 a total of 10,152 prescriptions were dispensed at Norwegian pharmacies where the paper prescription was issued by a doctor without Norwegian authorisation."

No DMP (dmp.no) page of its own was found by search.

#### 3(b) A Norwegian prescription used in other EEA countries

**Source:** Helsenorge, "Purchases of medicines in the EU/EEA"
- **URL:** https://www.helsenorge.no/en/treatment-abroad/purchases-of-medicines-in-the-eueea/
- **Who publishes:** Helsenorge; "Content provided and quality-assured by Helfo".
- **Date shown:** "Last updated 3. March 2026".
- English page (the official English version; the Norwegian version was not fetched).

**The page says:**

> "If you are going to use a Norwegian prescription abroad, you should make sure to bring a paper prescription. A printout of an e-prescription is not enough."

and, as its example:

> "Kari uses medication that is pre-approved on a blue prescription in Norway, which has been prescribed on paper by her Norwegian doctor. She goes to the pharmacy in Spain and collects the medicine there."

The page is about reimbursement. It does not state exclusions for use abroad.

#### 3(c) Norway and the MyHealth@EU ePrescription exchange

**Source 1:** Helsedirektoratet, "MyHealth@EU: Nasjonalt kontaktpunkt og visning av helseopplysninger om europeiske borgere"
- **URL (after redirect):** https://www.helsedirektoratet.no/om-oss/internasjonalt-samarbeid/myhealth-eu-nasjonalt-kontaktpunkt-og-visning-av-helseopplysninger-om-europeiske-borgere
- (requested as …/om-oss/forsoksordninger-og-prosjekter/myhealth-eu-norsk-kontaktpunkt-og-visning-av-helseopplysninger-til-europeiske-borgere)
- **Date shown:** "Først publisert: 29.04.2024. Siste faglige endring: 15.12.2025".

**Receiving direction (foreign e-prescription into Norway). The page says:**

> "Planlagt og utviklet infrastruktur for mottak av e-resepter (ePrescription) fra andre EU/EØS-land. Dette er foreløpig ikke tatt i bruk."

EN: "Planned and developed infrastructure for receiving e-prescriptions (ePrescription) from other EU/EEA countries. This has not been taken into use for the time being."

> "I tillegg legges det til rette for å vise informasjon om e-resepter som pasienten har fått skrevet ut i sitt hjemland (ePrescription). […] Informasjonen fra ePrescription vil ikke kunne brukes som grunnlag for utlevering av legemidler på apotek i Norge."

EN: "In addition, provision is being made to show information about e-prescriptions the patient has been issued in their home country (ePrescription). […] The information from ePrescription will not be usable as a basis for dispensing medicines at pharmacies in Norway."

**Status of the whole. The page says:**

> "I dag er det frivillig for EU/EØS-landene å ta i bruk MyHealth@EU […]"

> "Helsedataforordningen ble vedtatt i EU 11. februar 2025. Forordningen får generell anvendelse i EU fra 26. mars 2027, mens enkelte av bestemmelsene først kommer til anvendelse i mars 2029 eller mars 2031. Forordningen er vurdert som EØS-relevant. For at forordningen skal komme til anvendelse i Norge, forutsetter det blant annet vedtak om å innlemme forordningen i EØS-avtalen, samt godkjenning fra Stortinget."

EN: "Today it is voluntary for EU/EEA countries to adopt MyHealth@EU […]" / "The health data regulation was adopted in the EU on 11 February 2025. It applies generally in the EU from 26 March 2027, while some provisions only apply from March 2029 or March 2031. The regulation is assessed as EEA-relevant. For it to apply in Norway, a decision to incorporate it into the EEA Agreement and the Storting's approval are among the preconditions."

**Source 2:** Helsedirektoratet, report "Konsekvenser av krav i helsedataforordningen 2027 og 2029", chapter 4.3 "E-resept og utleveringsinformasjon"
- **URL:** https://www.helsedirektoratet.no/rapporter/konsekvenser-av-krav-i-helsedataforordningen-2027-og-2029/tiltak-for-a-oppfylle-krav-i-helsedataforordningen/e-resept-og-utleveringsinformasjon
- **Date shown:** "Siste faglige endring: 02. oktober 2026".

**Sending direction (Norwegian e-prescription abroad). The page says:**

> "Dagens e-resept i Norge er ikke kompatibel med EU-format for resept og utleveringsinformasjon."

EN: "Today's e-prescription in Norway is not compatible with the EU format for prescriptions and dispensing information."

**The plan ("trinn 1"), which the report ties to the deadline of March 2029. The page says:**

> "Norsk resept konverteres til EU-format («e-prescription») kun hvis/når den skal ekspederes i annet EU/EØS-land."

> "Resept fra EU/EØS-land konverteres ikke til en norsk e-resept, men er tilgjengelig for visning/lesing for ansatte på norske apotek i forbindelse med ekspedering."

> "Trinn 1 innebærer en minimal konverteringsløsning. […] lavere risiko knyttet til å oppfylle krav i tide til fristen i mars 2029."

EN: "A Norwegian prescription is converted to the EU format only if and when it is to be dispensed in another EU/EEA country." / "A prescription from an EU/EEA country is not converted to a Norwegian e-prescription, but is available for viewing by staff at Norwegian pharmacies in connection with dispensing." / "Step 1 is a minimal conversion solution. […] lower risk in meeting the requirements in time for the deadline of March 2029."

**Answer to 3(c), from the quotes:** today, in neither direction. Receiving: built, not in use, and by Source 1 not a basis for dispensing. Sending: the Norwegian e-prescription is not in the EU format; planned for the March 2029 deadline, subject to the regulation entering the EEA Agreement. **The two sources differ on one point:** Source 1 (Dec 2025) says ePrescription information "vil ikke kunne brukes som grunnlag for utlevering"; Source 2 (Oct 2026) describes a planned step in which pharmacy staff read the EU prescription "i forbindelse med ekspedering" and send back a dispensing message. **Inference:** Source 1 describes the current pilot, Source 2 the plan for 2029. Neither says cross-border dispensing on an e-prescription works today.

---

### 4. Iceland and Liechtenstein as home countries

**Not reached** (budget). No Icelandic or Liechtenstein source was searched or fetched.

Incidental lines from pages read for other questions (**inference** where marked):

- Norway as the country one is in: § 9-5 covers a prescription from "et EØS-land" (3(a)). **Inference:** that includes Iceland and Liechtenstein.
- Denmark as the country one is in: "a prescription issued by a doctor or dentist in other EU/EEA countries […] can be dispensed by a Danish pharmacy" (7.2). **Inference:** same.
- Germany's national contact point names both as places where a prescription can be redeemed (so as destinations, for people insured in Germany): "[…] können Sie die Verschreibung im Behandlungsstaat, in Deutschland, in einem anderen Mitgliedstaat oder in einem der EWR-Staaten Island, Liechtenstein oder Norwegen einlösen." (7.3)

---

### 5. United Kingdom as the home country

#### 5.1 The general GOV.UK page is gone

- https://www.gov.uk/guidance/uk-residents-visiting-the-eueea-and-switzerland-healthcare ("Healthcare for UK nationals visiting the EU") **now redirects** to the NHS page "Applying for healthcare cover abroad (GHIC and EHIC)", https://www.nhs.uk/using-the-nhs/healthcare-abroad/apply-for-a-free-uk-global-health-insurance-card-ghic/ ("Page last reviewed: 12 December 2023. Next review due: 12 December 2026"). That NHS page says **nothing** about whether a UK prescription can be used abroad (its only mention of prescribed medicines is about paying for them in Montenegro).
- https://www.gov.uk/visit-eu-switzerland-norway-iceland-liechtenstein redirects to a Brexit guidance collection; no statement there.
- **Not verified, do not publish:** a search engine's summary of the old GOV.UK page said UK prescriptions can be used in Ireland and Spain and nowhere else in the EU. The live URL no longer serves that text. I could not read it today.

**Result: no official general UK statement found** on recognition of UK prescriptions in the EU/EEA.

#### 5.2 Spain only: GOV.UK country guide

- **URL:** https://www.gov.uk/guidance/healthcare-for-uk-nationals-visiting-spain
- **Who publishes:** "From: Department of Health and Social Care and Foreign, Commonwealth & Development Office".
- **Date shown:** "Published: 31 January 2020. Last updated: 2 September 2021" (the last update note: "Updated to reflect the rules on taking food prescribed for medical reasons to EEA countries and Switzerland.").

**The page says (section "Getting prescriptions"):**

> "You can use a UK prescription to get medicines, including special food required for medical reasons, in Spain."

> "Prescription medicines are not free in Spain. With a GHIC or EHIC you get a reduced rate, but you’ll still pay: 50% of the prescription price […]"

#### 5.3 FCDO travel advice, Spain, "Health"

- **URL:** https://www.gov.uk/foreign-travel-advice/spain/health (FCDO; page metadata: public update 10 Nov 2026)

**The page says (section "Medication"):**

> "The legal status and regulation of some medicines prescribed or bought in the UK can be different in other countries. There are details in the guide to getting healthcare in Spain."

**Inference:** GOV.UK keeps a guide per country ("Healthcare for UK nationals visiting …"), each with its own "Getting prescriptions" section. Only Spain's was read. For any other country the app must read that country's guide; nothing may be carried over from Spain. Note the Spanish statement is the UK's, last updated in 2021; no Spanish source was read.

https://www.nhs.uk/common-health-questions/medicines/can-i-take-my-medicine-abroad/ redirects to travelhealthpro.org.uk, which answered 406. Not read.

---

### 6. The Nordic countries among themselves (Info Norden)

**Could not be read.** norden.org answered **HTTP 403** to every automated fetch:

- https://www.norden.org/en/info-norden/medicines-and-medical-consumables-norway (curl: 403; WebFetch: 403)
- https://www.norden.org/en/info-norden/medicines-and-high-cost-protection-sweden (curl: 403)

I did not try to get around the block. **Nothing from Info Norden is verified, and no date was seen.** A person with a browser has to read these pages, or the app leaves Info Norden out.

Pages that exist according to the search results (titles as returned by the search, not checked):

- Norway: https://www.norden.org/en/info-norden/medicines-and-medical-consumables-norway (also /no/…/legemidler-og-medisinsk-forbruksmateriell-i-norge)
- Sweden: https://www.norden.org/en/info-norden/medicines-and-high-cost-protection-sweden
- Denmark: https://www.norden.org/da/info-norden/medicin-og-medicintilskud-i-danmark (English URL not seen)
- Finland: not seen in the results.

**Not verified, do not publish** (a search engine's summary, not verbatim, pages not opened):

- Sweden: prescriptions from all the Nordic countries and EU/EEA countries are generally valid in Sweden under EU rules; certain strong medicines can never be obtained on a foreign prescription; if you plan to collect an e-prescription in another Nordic or EU country, ask for a paper copy.
- Norway: use of foreign prescriptions does not extend to prescription groups A and B (addictive substances) or to medicines not marketed in Norway; a paper prescription signed by the doctor.

**What the national sources read today say instead (verified, see 3 and 7):** none of the Norwegian, Swedish or Danish pages mentions a separate Nordic arrangement. Each states the EU/EEA rule: paper only, no foreign e-prescription today. Whether a Nordic agreement adds anything is **not established**.

---

### 7. Sweden, Denmark, Germany as the country one is in

#### 7.1 Sweden

**Source:** E-hälsomyndigheten (Swedish eHealth Agency), "How prescriptions for medicinal products work in Sweden"
- **URL:** https://www.ehalsomyndigheten.se/sprak/english/eu/how-prescriptions-work-in-sweden/
- **Date shown:** no date shown.
- English page, in the section "For EU/EES citizens". The Swedish version was not fetched.

**The page says:**

> "Whether or not your prescription from another EU Member State is valid for dispensation in Sweden depends on whether it is an e-prescription or a paper prescription. In order for your prescription to be valid in Sweden, it must be a paper prescription for cross-border use, see information below for the minimum requirements of such a prescription."

> "Prescriptions from other EU Member States for medicinal products which are classified as narcotics or banned substances may not be dispensed in Sweden. This applies to certain sleeping pills, certain painkillers and certain medicines for attention deficit hyperactivity disorder (ADHD), for example."

> "In order to be able to purchase medicinal products as per your prescription, the prescribed medicinal product must be available in Sweden. […] The pharmacist must also be able to understand and interpret the information on the prescription, and judge that it is a valid prescription."

> "If you have an electronic prescription, you must ask your doctor to issue you with a paper prescription for cross-border use instead […]. Please note that it is not considered a valid paper prescription if you receive the prescription via email from your doctor and print it out yourself."

**On foreign electronic prescriptions (section "E-prescriptions across national borders"):**

> "Swedish pharmacies cannot currently handle foreign e-prescriptions. However, Sweden is participating in a European initiative in order to eventually enable the handling of European e-prescriptions from participating countries in Sweden."

Required content of the paper prescription, per the page: patient's first name, surname and date of birth; date of issue; the doctor's first name, surname, professional title, contact information, work address including the country, and signature; the generic name, form, quantity, strength and dosage.

**Planned date:** none stated on the page. **Scope note:** the body says "another EU Member State"; only the section heading says "EU/EES". Whether EEA-only countries (Norway, Iceland, Liechtenstein) are meant is not stated in the body.

#### 7.2 Denmark

**Source:** lifeindenmark.borger.dk, "Prescriptions issued in other EU/EEA countries"
- **URL:** https://lifeindenmark.borger.dk/healthcare/prescriptions-issued-in-other-eu-eea-countries
- **Who publishes:** "Written by the Danish Medicines Agency"; the site calls itself "the official site for newcomers to Denmark"; the page is marked "A part of Your Europe".
- **Date shown:** "Last updated: 12 June 2026".

**The page says:**

> "If you have a prescription issued by a doctor or dentist in other EU/EEA countries it can be dispensed by a Danish pharmacy."

> "In addition, prescriptions issued by Danish doctors or dentists can also be dispensed by pharmacies in other EU/EEA countries."

> "For the time being, it is not possible to issue prescriptions electronically across the member states."

Required content, per the page: surname, first name and date of birth; date of the prescription; the doctor's or dentist's surname, first name, professional qualification, contact details (email and phone or fax number, including country code), work address (including the name of the member state) "as well as the doctor's or dentist's signature (written or digital)"; the INN name, or the brand name for a biological medicine or where the prescriber found it necessary; pharmaceutical form, quantity, strength and dosage.

**Exclusions:** none stated on this page. It links to "Recognition of prescriptions issued in another EU/EEA country" on the Danish Medicines Agency's site, which was not fetched. **Planned date for electronic:** none stated.

#### 7.3 Germany

**Source 1:** EU-PATIENTEN.DE, "Wie löse ich meine Verschreibungen ein?"
- **URL:** https://www.eu-patienten.de/de/behandlung_ausland/verordnungen_einloesen_eu/verordnungen_einloesen_eu.jsp
- **Who publishes:** the page's header: "Nationale Kontaktstelle für die grenzüberschreitende Gesundheitsversorgung".
- **Date shown:** none in the visible text; the page's metadata carries "md_date=2026-07-23".
- **Caution on audience:** this page is in the section "Behandlung im EU-Ausland", written for people insured in Germany who were treated abroad. The sister page under "Behandlung in Deutschland > Verschreibungen einlösen" (for visitors) exists in the menu and was **not** fetched.

**The page says:**

> "Es ist grundsätzlich möglich, eine im Behandlungsstaat ausgestellte Verschreibung in einem Staat, der nicht Behandlungsstaat ist (also auch in Deutschland), einzulösen. Da sich die verschriebenen Produkte, ihre Zusammensetzungen oder Darreichungsformen von Staat zu Staat unterscheiden können, raten wir hiervon derzeit jedoch grundsätzlich ab."

EN: "It is in principle possible to redeem a prescription issued in the state of treatment in a state that is not the state of treatment (so also in Germany). Since the prescribed products, their composition or their dosage forms can differ from state to state, we nevertheless currently advise against this as a rule."

> "Das Verfahren der grenzüberschreitenden Einlösung von Verschreibungen aus anderen Mitgliedstaaten ist noch recht neu. Deshalb empfehlen wir Ihnen, Verschreibungen in dem Behandlungsstaat einzulösen."

EN: "The procedure for redeeming prescriptions from other member states across borders is still fairly new. We therefore recommend that you redeem prescriptions in the state of treatment."

Problems the page lists for redeeming in Germany: the medicine is not available in Germany in that form or is unknown under the name given; "Die Apothekerin oder der Apotheker […] in Deutschland versteht/verstehen die Verschreibung falsch bzw. gar nicht."; the cost is not reimbursed.

Required content, per the page ("Pflichtangaben bei Arzneimitteln"): patient's surname, first names written out, date of birth; date of issue; prescriber's name, first names, professional qualification, direct contact details (email and phone or fax with international prefix), work address including the member state; "Unterschrift (handschriftlich oder digital, je nach Medium der Verschreibung)"; the common name (INN), form, quantity, strength, dosage.

The page says nothing on narcotics and nothing on electronic prescriptions.

**Source 2:** gematik, "FAQ zum E-Rezept"
- **URL:** https://www.gematik.de/anwendungen/e-rezept/faq-e-rezept
- **Who publishes:** gematik. I did not check on a page read today what gematik is in law; from the search listing it is the body that specifies Germany's e-prescription service. **Whether it counts as "official" under the brief's definition is for the caller to judge.**
- **Date shown:** none in the visible text; page metadata "dateModified 2026-06-18".
- The question sits among the FAQ entries addressed to pharmacies.

**The page says:**

> "Kann ich E-Rezepte aus dem europäischen Ausland ebenfalls bearbeiten? E-Rezepte aus dem EU-Ausland sind derzeit noch nicht in Deutschland einlösbar."

EN: "Can I also process e-prescriptions from other European countries? E-prescriptions from other EU countries cannot yet be redeemed in Germany at present."

**Planned date:** none stated on either page. **Not verified:** a search summary mentioned draft gematik specifications (April 2026) for redeeming EU e-prescriptions in Germany; not fetched. **No statement from the Federal Ministry of Health was read** (a search result pointed to a ministry glossary page on the patient mobility directive; not fetched).

---

### URLs fetched today (26 Nov 2026)

Read successfully:

1. https://pharmasuisse.org/system/files/media/documents/2025-07/0025_Aerztliche_Verschreibungen_V02_d.pdf
2. https://www.bag.admin.ch/dam/de/sd-web/HI4155V-gbaq/BOTSCH~1.PDF
3. https://www.helsedirektoratet.no/veiledere/rekvirering-og-utlevering-av-legemidler-m.m/ekspedering-av-legemidler-etter-resept-og-rekvisisjon/-9-5.ekspedisjon-av-eos-resepter
4. https://www.helsenorge.no/en/treatment-abroad/purchases-of-medicines-in-the-eueea/
5. https://www.helsedirektoratet.no/om-oss/internasjonalt-samarbeid/myhealth-eu-nasjonalt-kontaktpunkt-og-visning-av-helseopplysninger-om-europeiske-borgere
6. https://www.helsedirektoratet.no/rapporter/konsekvenser-av-krav-i-helsedataforordningen-2027-og-2029/tiltak-for-a-oppfylle-krav-i-helsedataforordningen/e-resept-og-utleveringsinformasjon
7. https://www.gov.uk/guidance/healthcare-for-uk-nationals-visiting-spain
8. https://www.gov.uk/foreign-travel-advice/spain/health
9. https://www.nhs.uk/using-the-nhs/healthcare-abroad/apply-for-a-free-uk-global-health-insurance-card-ghic/ (reached by redirect; nothing on prescriptions)
10. https://www.ehalsomyndigheten.se/sprak/english/eu/how-prescriptions-work-in-sweden/
11. https://lifeindenmark.borger.dk/healthcare/prescriptions-issued-in-other-eu-eea-countries
12. https://www.eu-patienten.de/de/behandlung_ausland/verordnungen_einloesen_eu/verordnungen_einloesen_eu.jsp
13. https://www.gematik.de/anwendungen/e-rezept/faq-e-rezept

Could not be read:

- https://www.norden.org/en/info-norden/medicines-and-medical-consumables-norway (403, twice)
- https://www.norden.org/en/info-norden/medicines-and-high-cost-protection-sweden (403)
- https://www.gov.uk/guidance/uk-residents-visiting-the-eueea-and-switzerland-healthcare (redirects to item 9; the old text is gone)
- https://www.gov.uk/visit-eu-switzerland-norway-iceland-liechtenstein (redirects to https://www.gov.uk/government/collections/brexit-guidance)
- https://www.nhs.uk/common-health-questions/medicines/can-i-take-my-medicine-abroad/ (redirects to travelhealthpro.org.uk, 406)

### Open, for whoever continues

1. Info Norden (question 6): needs a person with a browser; all pages 403.
2. Switzerland: fetch position paper 0025 from kantonsapotheker.ch itself to settle who publishes it; look for a BAG or Swissmedic page; the "Grenzpraxen" rules the paper reserves were not looked up.
3. UK: read the GOV.UK "Healthcare for UK nationals visiting …" guide of each country the app covers; only Spain was read.
4. Iceland and Liechtenstein (question 4): not started.
5. Germany: the visitor-facing page under "Behandlung in Deutschland > Verschreibungen einlösen" on eu-patienten.de; a Federal Ministry of Health statement; narcotics.
6. Denmark: the Danish Medicines Agency page the borger.dk page links to, for exclusions.
7. Norway: § 5-9 of the regulation (what an EEA prescription must contain); the Norwegian-language Helsenorge page.
