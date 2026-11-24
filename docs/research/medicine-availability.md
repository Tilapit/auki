# Medicine availability: who shows pharmacy stock, country by country

Checked on 24 and 25 November 2026, for Janne's scope change of 24 Nov (PLAN.md, decision D9): show where a medicine is in stock, starting where it is allowed. Six countries: Finland, Sweden, Denmark, Austria, Germany and Norway.

This file is the evidence. What the app does with it is in `lib/stock/providers.ts` and PLAN.md 7.9.

## The answer in one table

| Country | Service | Run by | In the app |
|---|---|---|---|
| Finland | Lääkehaku on apteekki.fi | Suomen Apteekkariliitto | **Offered.** The link carries the medicine's name |
| Germany | IhreApotheken.de | IhreApotheken GmbH & Co. KGaA | **Offered**, as what it is: a reservation service of under half of the pharmacies. The link carries the name |
| Austria | ApoApp | Österreichische Apothekerkammer | **Offered** as a link to the Chamber's page about the app. No name: the lookup is in the app only |
| Norway | None across the chains | Apotekforeningen's page explains how to check each chain | **Offered** as a link to that page. No name |
| Sweden | Lagerstatus on Fass | Lif, with Sveriges Apoteksförening | **Built, not offered.** Fass's terms ask for a free agreement before a service links to it |
| Denmark | Stock in the "apoteket" app | Danmarks Apotekerforening | **Nothing.** Behind MitID, and only for one's own prescriptions |

No country has a documented public API or open data for stock per pharmacy. Every hand-off is a plain link, and nothing is fetched from any service.

## How it was checked

- Each service's own pages, terms of use and `robots.txt` were read, with `curl` and a plain user agent.
- Where a link pattern mattered, I used the service's own search in a browser and read the address it led to (Finland, Sweden).
- Where a site's `robots.txt` keeps automated agents off a page, the page was not loaded, and the pattern comes from what the site publishes about itself (Germany).
- **Confirmed** means I or the research run loaded the page that says it. **Inferred** means it follows from what was loaded and is marked so.
- Terms are paraphrased, with the section and the address, so the original sentence can be found. Nothing here is legal advice: it is what the published terms say on a plain reading.
- No undocumented endpoint was called. Scripts were read for the names of pages only, and not at all on Fass, whose terms forbid analysing its code.

## Finland: Lääkehaku on apteekki.fi

**What it is.** A free search by the Association of Finnish Pharmacies, without login. The user types a product's name or its Vnr number, picks a pack, then a place, and gets a list of pharmacies with "Varastossa: Kyllä" or "Ei", the distance, the opening hours and the phone number. It also shows the price and Kela's reimbursement. Prescription and over-the-counter products are both there. Confirmed in a browser on 25 Nov.

**Coverage.** Its terms speak of the pharmacies "belonging to the service". The list for one product had 791 outlets, branch pharmacies and Åland included. No outlet of Yliopiston Apteekki was among them (one product checked). So: most pharmacies, not all, and the app says so.

**API or open data.** None found: nothing on apteekki.fi, nothing on the widget's host, and no hits on avoindata.suomi.fi for "apteekki", "Apteekkariliitto", "lääkehaku" or "saatavuushäiriö". The search is a widget in a frame from `laakehakupalvelu.apteekkariliitto.fi`, and its headers name the sites that may frame it (apteekki.fi and three others). Reuse today is by agreement with Apteekkariliitto.

**Terms and robots.**
- Site terms, https://www.apteekki.fi/kayttoehdot.html: the Association holds the copyright to the content. Nothing about links to the site, and nothing about automated use.
- Lääkehaku's own terms, https://laakehakupalvelu.apteekkariliitto.fi/Kayttoehdot.aspx: nothing about links or automated use either. Section 3.2: the provider may block use that disturbs the service.
- `robots.txt` of apteekki.fi disallows `/media/forms` and nothing else. The widget's host has none.

**Link with the medicine: yes.** `https://www.apteekki.fi/laakehaku.html?ehto=<name>`. This is the address the site's own header search opens: typing a name there and pressing Enter leads to it, and the page then shows the products by that name. A space and letters outside ASCII arrive intact when percent-encoded.
- It matches a product's name or Vnr, not the active substance: a brand name found 30 products, the substance's Finnish name none.
- A name followed by a strength found nothing. The dialog's hint says to type the name alone.

**Link with a place: no.** The place is typed inside the widget. An inner page of the widget takes coordinates, but it is a bare frame on another host and not a public way in, so the app does not use it. It would be the first thing to ask Apteekkariliitto about.

**How fresh.** The service's terms (2.2) say the data is updated regularly, that updates can lag, and that a phone call to the pharmacy is the way to be sure. The answer per pharmacy is yes or no, without counts. An update interval is not stated anywhere I could read.

**Also in Finland.**
- Yliopiston Apteekki shows stock per branch on its own product pages, in four levels, for its 17 branches. Its terms ask for consent before its content is copied. Not linked: one chain, and its search results could not be confirmed. A candidate for later.
- Fimea publishes shortage notices as open data (CC BY 4.0). They are national, from the companies, and say nothing about a pharmacy's shelf.
- Kela's medicine search has prices and reimbursement only.

## Sweden: Lagerstatus on Fass

**What it is.** Fass is run by Lif, the association of the research-based pharmaceutical industry. Its stock lookup is a cooperation with Sveriges Apoteksförening and the chains. No login. Three steps: the medicine, the pack, the place.

**Coverage.** Apotek Hjärtat, Apoteket AB, DOZ Apotek and Kronans Apotek report stock. Online pharmacies do not, and some smaller members of the pharmacy association are not on Fass's list. Narcotic medicines and growth hormones are not shown, and a search returns at most 60 pharmacies.

**API or open data.** Fass has a documented API, by contract with Lif. Stock is not in it: its specification has no path for stock or pharmacies. No open data. Stock is not kept centrally: by the pharmacy association's own account, each question is passed on to the chains' systems.

**Terms: this is why Sweden is not offered.** Fass's terms of use (updated 23 Sep 2026), https://fass.se/portal-document/terms-of-use:
- 4.4: Lif welcomes links to Fass.
- 4.5: for systematic linking, such as integration into other digital services, "ska ett separat, kostnadsfritt avtal ingås med Lif", whether the party is commercial or not. Read on 25 Nov.
- 4.6: the contact is info@fass.se.
- 5.1 forbids scraping, crawling and scripted retrieval. 5.2 asks for written permission before Fass content is built into another service.
- Fass's page about its API says a direct link needs no agreement, and offers a free linking agreement with technical instructions and notice of address changes. The terms are newer and stricter, so the app follows the terms.

A link that an app builds for every Swedish pharmacy is systematic linking on any plain reading. The agreement is free. Until Janne has it, Sweden's provider is in `AWAITING_AGREEMENT`, shown in `/dev/states` and nowhere in the live app.

**Link with the medicine: yes, once agreed.** `https://fass.se/search?query=<name>`. Confirmed in a browser: the search field holds the name and the results are for it. The old address with the same parameter redirects there. Without a name the way in is `https://fass.se/pharmacy-stock-status`. Lif says the addresses changed in autumn 2025 and that the linking agreement comes with the current structure.

**Link with a place: no.** The place is the third step, typed or taken from the device.

**How fresh.** No interval is stated. Each pharmacy is responsible for its own stock information. The pharmacy association describes four answers: in stock, few in stock, can be ordered, a substitute in stock.

## Denmark: nothing to hand over to

- The stock lookup is in the "apoteket" app of Danmarks Apotekerforening and nowhere on the web.
- The app needs MitID at first login, and shows stock only for medicines the user has a prescription for.
- In a reply on Google Play dated 22 June 2026 the association says there is no lookup that works without login.
- apoteket.dk has information and prices. medicinpriser.dk, by the medicines agency, has prices and a documented API for them, and no stock.

A traveller from Finland has no MitID, so a link to the app would lead nowhere. The app offers nothing in Denmark.

## Austria: ApoApp

**What it is.** The app of the Austrian Chamber of Pharmacists, presented on 26 January 2026. Its medicine search shows which pharmacies nearby have a medicine. No account is needed.

**Coverage.** Nearly 1,000 of more than 1,400 pharmacies at the launch, by the press reports of that day. A pharmacy has to agree to share its stock. No later figure was found.

**No web version, no link into it.** The Chamber's website has a pharmacy search without any medicine field. The app claims only the news pages of the site as links, so no web address opens its medicine search. The link the app offers is the Chamber's page about ApoApp, https://www.apothekerkammer.at/apoapp, which has both store links.

**A limit for our users.** The App Store listing exists in the Austrian and German stores and answers "not found" in the Finnish and Swedish ones (checked 25 Nov). The dialog says that the app is not in the Finnish App Store, with the date. Google Play's countries could not be checked.

**Terms.** The app's terms forbid commercial use of the app and call the stock shown a snapshot that is not binding. Nothing about links to the Chamber's pages. `robots.txt` of the site closes only its own system folders.

**API or open data.** None for stock. The medicines agency BASG publishes its register of supply restrictions as a documented XML export, without login: shortages per product, not stock per pharmacy.

**How fresh.** "Real time" in the press release; every ten minutes per pharmacy by what was said at the press conference.

## Germany: IhreApotheken.de

**There is no national stock search.** ABDA's official portal aponet.de has a pharmacy search and the duty pharmacies, and no stock. The state's e-prescription app has no stock lookup either. The pharmacy associations' apps answer by chat. This is inferred from all of them together.

**What IhreApotheken.de is.** A pre-order platform: the user picks a local pharmacy and reserves a medicine there, for collection or delivery. Over-the-counter products directly, prescription medicines with the prescription. No login. It is the platform of "Zukunftspakt Apotheke", with the pharmacists' cooperative Noweda behind it. It is not a search for which pharmacy has a medicine, and the dialog does not call it one.

**How partial.** Its sitemap lists 7,236 pharmacies. Germany had 16,444 at the end of September 2026 (ABDA). That is 44 %. How many of them share live stock is not published.

**API.** None public. The site has a partner interface that its `robots.txt` closes, and it says its service is built into partners' apps: integration by agreement exists.

**Terms and robots.**
- The terms of use say nothing about links or automated use. Copying content needs consent.
- `robots.txt` keeps every crawler off the search results and asks for a ten-second delay. It names AI agents, Claude's among them, and keeps them off product and search pages as well.
- So the result page was not loaded for this research. A person following a link is not a crawler, and the link is one the site publishes itself.

**Link with the medicine: yes, by the site's own declaration.** The front page carries a schema.org `SearchAction` with the template `https://ihreapotheken.de/suche?search={search_term_string}`. Read in the page's source on 25 Nov. What the result page shows was not seen. **To check by hand, once:** open `https://ihreapotheken.de/suche?search=ibuprofen` and see that the name is searched.

**Link with a place.** The site's own finder takes a postcode or a town in its address. It can't be combined with a medicine, so the app does not use it.

**How fresh.** Availability is per chosen pharmacy. Where the pharmacy's own system is connected it is current; elsewhere the site shows an estimate and the pharmacy confirms.

**Not picked.** gesund.de works the same way with a smaller network and through its app. Its search address could not be established.

## Norway: no service across the chains

- The pharmacy association's page "Lagerstatus i apotek" says how to check: search on each chain's own site. It names Apotek 1, Vitusapotek and Ditt apotek, Boots, and Farmasiet, which together cover more than 90 % of the country's pharmacies, for prescription medicines. Read on 25 Nov.
- The medicines agency DMP and Helsenorge send people to the same page.
- A public view across all pharmacies has been proposed by the health directorate and is not built. A law change of June 2026 gives the ministry access to stock when supply is at risk, not the public.
- Felleskatalogen has no stock lookup. Its guidelines ask for written consent before its pages are shown inside an app.

**The link the app offers** is the association's page, by the short address the medicines agency uses: `https://www.apotek.no/kampanje/lagerstatus-i-apotek`. It takes no name.

**Why not a chain's search.** Vitusapotek's search address is confirmed and published by the site. Apotek 1's could not be seen working, and Boots closes its search to automated agents. A link to one chain would favour it and leave out the pharmacies of the others.

## For live stock: whom to ask, and what the answer has to allow

The seam is `StockProvider.stock` in `lib/stock/provider.ts`. No provider has it. It needs an agreement per country:

| Country | Whom to ask | What exists today |
|---|---|---|
| Finland | Suomen Apteekkariliitto | The widget is shared with named sites by agreement. No API is published |
| Sweden | Lif for the linking agreement, info@fass.se. For stock itself, Sveriges Apoteksförening and the chains | The Fass API has no stock |
| Austria | Österreichische Apothekerkammer | Nothing public |
| Germany | IhreApotheken, through Zukunftspakt Apotheke | A partner interface, not public |
| Denmark | Danmarks Apotekerforening | Nothing public |
| Norway | Nobody yet | No shared source |

What an agreed interface has to allow, for the rules of PLAN.md 7.6 to hold:
- It can be called from the browser, without a secret. A key that must stay on a server would put the medicine's name through our server, which is what rule 4 of Janne's note forbids. That would need a new decision.
- It says when its figures are from, and has a level for "not known".
- It identifies pharmacies in a way that can be matched to OpenStreetMap's: a position, or an official number that OpenStreetMap also carries.

## What I could not check

- Germany: the result page of IhreApotheken.de, for the reason above. One click settles it.
- Sweden: whether Lif reads clause 4.5 as covering an app of this size. The answer to Janne's message settles it.
- Finland: the update interval of Lääkehaku, and whether every Yliopiston Apteekki branch is really absent (one product was checked).
- Austria: today's number of pharmacies in ApoApp, and whether the app can be installed from Google Play in Finland.
- Norway: Apotek 1's and Boots's search pages as a user sees them.
- Everything was requested from one Nordic address. Blocking from other countries is untested.

## Sources

Finland
- Lääkehaku: https://www.apteekki.fi/laakehaku.html · its terms: https://laakehakupalvelu.apteekkariliitto.fi/Kayttoehdot.aspx
- apteekki.fi terms: https://www.apteekki.fi/kayttoehdot.html · https://www.apteekki.fi/robots.txt
- Yliopiston Apteekki terms: https://www.yliopistonapteekki.fi/verkkoapteekki/kayttoehdot
- Fimea open data: https://fimea.fi/tietoa_fimeasta/avoin-data

Sweden
- Fass terms of use: https://fass.se/portal-document/terms-of-use
- Stock lookup and what it covers: https://fass.se/pharmacy-stock-status · https://fass.se/portal-document/pharmacys-inventory-status · https://fass.se/portal-document/stock-status-at-pharmacies
- Fass API: https://fass.se/health/portal-document/fass-api
- Sveriges Apoteksförening on the lookup: https://sverigesapotek.se/hitta-lakemedel/

Denmark
- The app's stock lookup: https://www.apoteket.dk/brug-apoteket/app/lagerstatus-og-restordrer
- Prices: https://www.medicinpriser.dk/ · https://api.medicinpriser.dk/

Austria
- ApoApp: https://www.apothekerkammer.at/apoapp · launch: https://www.apothekerkammer.at/pk-apoapp · terms: https://www.apothekerkammer.at/nutzungsbedingungen-der-apoapp
- BASG's data on supply restrictions: https://www.basg.gv.at/fuer-unternehmen/datenbereitstellung-vertriebseinschraenkungen

Germany
- IhreApotheken.de: https://ihreapotheken.de/ · terms: https://ihreapotheken.de/nutzungsbedingungen · https://ihreapotheken.de/robots.txt · questions and answers: https://ihreapotheken.de/faq
- Number of pharmacies: https://www.apotheken-umschau.de/gesundheitspolitik/apotheken-in-deutschland-zahl-sinkt-auf-16444-1618973.html
- aponet.de: https://www.aponet.de/apothekensuche

Norway
- Apotekforeningen, "Lagerstatus i apotek": https://www.apotek.no/kampanje/lagerstatus-i-apotek
- Helsenorge: https://www.helsenorge.no/medisiner/far-du-ikke-tak-i-medisinen-din/
- Felleskatalogen's guidelines: https://www.felleskatalogen.no/medisin/retningslinjer-digital-bruk
