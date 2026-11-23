# Design log

Design decisions made during the build. The starting point is the canvas (`design/`) and PLAN.md sections 5 and 6; this file records where the build departs from them and why. Add new entries at the end.

Entry format:

## YYYY-MM-DD: short title
- Where: view or component
- Change: what differs from the canvas or PLAN.md
- Why: real data, accessibility, clarity or performance
- Status: done / proposed, waiting for Janne / accepted / rejected

## 2026-11-22: Dark primary button is sky, not cobalt
- Where: Buttons, dark theme
- Change: Primary buttons are sky `#8BBAEC` with navy text in dark mode, as on the dark boards. PLAN.md said actions stay cobalt.
- Why: Cobalt on navy is 2.8:1 and fails 3:1 for a control. PLAN.md section 6 updated.
- Status: accepted

## 2026-11-22: Riga fixture counts agree
- Where: Riga results
- Change: The fixture is the open pharmacy plus the nine nearer closed ones; "Kiinni nyt" shows 9. The board said 9 in one place and 13 in another, with 12 on the map.
- Why: One number, derived from the list, in both places. The far 24-hour pharmacy is an eleventh result from the 24-hour query.
- Status: accepted

## 2026-11-22: No guide link in the banner
- Where: CountryBanner
- Change: The "Näin se toimii Latviassa" link from the canvas is gone. The banner shows the status and the one tip on phone and desktop alike.
- Why: Country guides are not in v1, so the link led nowhere.
- Status: accepted

## 2026-11-22: "Reitti" opens the pharmacy sheet
- Where: NearestOpenCard, phone peek
- Change: The route button opens the sheet with the Google Maps and Apple Maps choices.
- Why: There are two map apps and we should not guess. To be revisited in M5.
- Status: accepted

## 2026-11-22: The name is the button, the row is its hit area
- Where: PharmacyRow
- Change: The pharmacy name is a button whose hit area is stretched over the row. Hover and selection tint the row; keyboard focus rings the row.
- Why: PLAN.md asks for tap-a-row and for no whole-row click targets. One control per row satisfies both: nothing interactive is nested.
- Status: accepted

## 2026-11-22: Footer line on the phone screens
- Where: First visit, place search, phone results
- Change: The not-affiliated line is under the actions in the dark band on the first visit, on the street under the skyline on the place search, and at the end of the sheet in results. Small and muted; each sentence on its own line on the phone.
- Why: The content rules require it on every screen; the phone boards had none.
- Status: accepted

## 2026-11-22: OpenStreetMap credit on the phone map
- Where: StaticMap (MapView from M4)
- Change: A small credit sits at the bottom left of the map, just above the sheet.
- Why: Attribution is required and the phone boards had none.
- Status: accepted

## 2026-11-22: Canvas values win for type, the soon glyph and dark tokens
- Where: globals.css, CrossGlyph, PLAN.md section 6
- Change: Sizes 14, 15 and 16 px and the 33 px walking time come from the canvas. The soon glyph is amber with a `soon` outline. Dark dividers, borders, outlines, sheet and tertiary text come from the dark boards. Dark error is `#FF9D91`.
- Why: The canvas is the approved look. The outline keeps the amber glyph at 3:1 on white. `#FF9D91` is 7.8:1 on the dark surface and 9.2:1 on the ground. PLAN.md section 6 now records all of it.
- Status: accepted

## 2026-11-22: Copy rules for times, numbers and quotation marks
- Where: lib/format.ts, lib/i18n, CLAUDE.md
- Change: Finnish: "klo 20.45", whole hours as "klo 21" in status lines, ranges with an en dash and no spaces, decimal comma, a non-breaking space between a number and its unit and after "klo", quotation marks ”…”, `hyphens: auto`. English: en-GB, 24-hour, "1.1 km".
- Why: The canvas mixed "klo 21 asti", "8.00" and "24 h". One rule, applied in one formatter and unit-tested.
- Status: accepted

## 2026-11-22: Where two times are compared, both keep their minutes
- Where: Ehditkö timeline, phone peek line
- Change: "20.44 … 21.00", not "20.44 … klo 21".
- Why: The eye compares the two numbers; a different format on each side slows that down. Status lines keep the short "klo 21".
- Status: done

## 2026-11-22: Layouts for the states without a design
- Where: ProgressView, ProblemView, PlaceSearch
- Change: Location problems (denied, unavailable, timeout, unsupported) use the place-search screen with a note, as designed for denied. Locating keeps the first-visit window. Searching, none found, offline and service error keep the map with the message in the panel or sheet.
- Why: Only the first visit and blocked location were on the canvas. The position is known in the second group, so the map stays.
- Status: accepted

## 2026-11-22: Pharmacy details and counter card on desktop
- Where: ResultsView, CounterCard
- Change: On desktop the pharmacy details take the list's place in the left panel, with "Takaisin listaan". The counter card is a centred dialog. On the phone both are as on the canvas.
- Why: Neither had a desktop board. The map and the selected marker stay visible next to the details.
- Status: accepted

## 2026-11-22: Theme follows the device, never the clock
- Where: globals.css
- Change: Light and dark come from `prefers-color-scheme`. Both cities render in both themes. "At night" in PLAN.md means the dark theme.
- Why: The boards paired Riga with dark and Helsinki with light only as examples.
- Status: accepted

## 2026-11-22: Latvian paper-prescription line is a draft
- Where: Counter card fixture
- Change: The paper variant has drafted Latvian with `reviewed: false`, so the "Käännös tarkistamatta" badge shows.
- Why: The canvas had Latvian only for the e-prescription. Needs a native check before any launch (PLAN.md 8.3).
- Status: accepted

## 2026-11-22: No reviews link in the pharmacy sheet
- Where: PharmacySheet
- Change: "Arvostelut ja kuvat Google Mapsissa" from the board is left out.
- Why: It is planned for later, not v1 (design/README.md).
- Status: accepted

## 2026-11-22: The first-visit sky follows the sun
- Where: First visit, place search (DuskScene, lib/sky.ts)
- Change: The sky is computed from the sun's altitude at an approximate position taken from the device time zone (a table of European zones, Helsinki as fallback). Four looks are blended: night (full at −12° and below), twilight (−4°, the canvas dusk), golden hour (+2°) and day (+12° and above). An inline script picks the look before first paint; nothing animates; without JavaScript the twilight look stays.
- Why: Approved by Janne. Helsinki is dark by four in November and light at eleven in June, and the window a person opens the app in should look like the one outside. No location permission and no network request are involved.
- Status: accepted

## 2026-11-22: Windows follow the clock, the cross is always lit
- Where: Skyline
- Change: Few windows are lit from 00.30 to 05.30, many from 16.00 to 23.00, some otherwise. Lit windows fade towards glass as the sun rises. The pharmacy cross, its glow and its shop window never change, except that the glow is softer by day.
- Why: People keep their own hours whatever the sun does; the pharmacy is the one constant. That is the point of the picture.
- Status: accepted

## 2026-11-22: The top of the sky stays dark in every look
- Where: lib/sky.ts palettes
- Change: The first three gradient stops, which sit behind the headline and the text button, keep at least 4.5:1 against white in every look and every blend. Even the day sky starts at a deep blue. A unit test walks three whole days in ten-minute steps.
- Why: The headline and buttons must stay readable at noon in June. A blend of two colours that each pass also passes.
- Status: accepted

## 2026-11-22: Golden hour reads warm above the roofs
- Where: lib/sky.ts, golden look
- Change: The fourth sky stop at golden hour is a pink haze (`#D8C4C8`), not light blue.
- Why: The lower stops are hidden behind the buildings, so with a blue fourth stop golden hour looked the same as twilight.
- Status: done

## 2026-11-22: Skyline is an inline SVG
- Where: components/Skyline.tsx
- Change: The illustration is drawn inline with colours from CSS variables, cropped like `object-fit: cover` with the pharmacy kept in view. `public/skyline.svg` is gone; geometry is unchanged from `design/skyline.svg`.
- Why: An image file cannot take its colours from the sky. Approved with the sky.
- Status: accepted

## 2026-11-22: Location note is darker
- Where: PlaceSearch note
- Change: The note behind the "location is blocked" text is 62% navy instead of 40%.
- Why: It can sit over the pale daytime horizon, where 40% left white text under 4.5:1.
- Status: done

## 2026-11-22: One definition per colour token
- Where: app/globals.css
- Change: Each colour is written once as `light-dark(light, dark)`. `data-theme` on any element only flips `color-scheme`.
- Why: Two copies of the dark table would drift apart. The review override in /dev/states uses the same mechanism as the device setting. Checked against the production CSS, where the build compiles `light-dark()` to a fallback.
- Status: done

## 2026-11-22: Phone layout below 900 px, panel 440 px
- Where: ResultsShell
- Change: Below 900 px: full-screen map with the bottom sheet. From 900 px: a 440 px list panel and the map.
- Why: The panel plus a usable map needs about 900 px. 440 px is what the desktop boards measure.
- Status: done

## 2026-11-22: The collapsed sheet is as tall as its content
- Where: Phone bottom sheet
- Change: The peek hugs its content (measured, so it also holds at larger text sizes) instead of leaving about 100 px empty under the buttons as on the board.
- Why: The map gets the space.
- Status: done

## 2026-11-22: Each view renders the footer
- Where: SiteFooter
- Change: The footer is rendered by each view rather than the layout PLAN.md section 10 named.
- Why: It sits in a different place in each view: on the street, in the panel, at the end of the sheet. Still one `footer` landmark per page.
- Status: done

## 2026-11-22: Legend names the dashed cross only when one is there
- Where: Map legend
- Change: "Ajat ei tiedossa" appears as a fourth entry only when a result has unknown hours. Uncertain hours reuse the dashed glyph, with amber text.
- Why: Three entries stay the normal case. No fifth glyph is added to the status system.
- Status: done

## 2026-11-22: Focus and headings
- Where: Sky scenes, dialogs, problem notes, counter card
- Change: Focus rings are white on the sky scenes. Opening the pharmacy details or the counter card moves focus to its title, not the close button. Problem notes start with a real heading. The counter-card switch is a button group, not a `nav`, and its title is an `h2`.
- Why: Cobalt disappears on the gradient. Reading should start from the name. PLAN.md section 9 moves focus to the error heading and asks for one `h1` per page.
- Status: done

## 2026-11-22: Too late: the next open pharmacy gets the main actions
- Where: NearestOpenCard
- Change: When you would arrive after closing, the card shows the warning with both times and a "Soita" for the closing pharmacy, then the next open pharmacy with its own "Reitti" and "Soita". The closing pharmacy has no route button.
- Why: A route button to a pharmacy that closes before you get there is a trap, but a call can ask them to wait.
- Status: accepted

## 2026-11-22: Straight-line fallback shows metres, not minutes
- Where: Card, rows, markers, footer
- Change: Without walking data the large number is the straight-line distance, labelled "linnuntietä", the list says "Linnuntietä", and there is no ehditkö timeline.
- Why: No walking time means no honest arrival time. Guessing minutes would break principle 3.
- Status: done

## 2026-11-22: Locating keeps the button's footprint
- Where: First visit, locating and waiting
- Change: The status line is the same size and place as the button it replaces, with the lit cross pulsing slowly (still under reduced motion). The waiting hint is a second line inside it.
- Why: Nothing jumps when the state changes, and the cross doubles as the progress sign.
- Status: done

## 2026-11-22: Long and repeated names
- Where: Card, rows, sheet, top bar
- Change: Names wrap; the walking-time column never does. Finnish hyphenation needs four letters before a break and three after. Only the phone top bar cuts text short. Same-named pharmacies, and ones without a name, show the street next to the name.
- Why: Checked with the stress fixture: a 90-character name, three unnamed pharmacies, a place name that does not fit the bar.
- Status: done

## 2026-11-22: Language switch is a link
- Where: LanguageSwitch
- Change: "In English" / "Suomeksi" (and "EN" / "FI" on the phone map) is a link to the same page in the other language, with `hreflang` and `lang`.
- Why: The locale lives in the URL. It names one language; it is not a toggle.
- Status: done

## 2026-11-22: "Kiinni nyt" and the sort label on the phone
- Where: Phone sheet
- Change: The collapsed closed group and "Kävelymatkan mukaan" also show on the phone.
- Why: The phone boards cut off before them; the straight-line fallback needs its label on every size.
- Status: done

## 2026-11-22: Next-open name is a link
- Where: Card and sheet, "Ei varastossa?" line
- Change: The pharmacy name in the sentence is a link, not a button.
- Why: A button is laid out as a block inside the line, which let the comma after the name wrap to the next line alone, as it does on the board.
- Status: done

## 2026-11-22: Edge chip points at the pharmacy
- Where: StaticMap
- Change: The arrow turns to the real bearing and the chip sits on the nearest of eight edge positions. The label says the direction in words.
- Why: An arrow that always points up says nothing. MapLibre gives exact placement from M4.
- Status: done

## 2026-11-22: English times and minutes
- Where: lib/format.ts
- Change: English shows "09:00", "Open until midnight" and "3 min".
- Why: en-GB pads the hour and abbreviates to "3 mins"; midnight as "00:00" or "24:00" in a sentence reads oddly. The PLAN.md copy table is updated.
- Status: done

## 2026-11-22: Route links are real links
- Where: PharmacySheet
- Change: The Google Maps and Apple Maps buttons are links that carry only the pharmacy's coordinates.
- Why: PLAN.md 7.6 and section 9: real links, and the map app uses its own location.
- Status: done

## 2026-11-22: Search engines are told to stay out
- Where: Metadata
- Change: `robots: noindex, nofollow` on every page.
- Why: The repo and the site stay private until decision D1 is settled.
- Status: done

## 2026-11-22: Stress fixture
- Where: /dev/states
- Change: A third fixture, at a fixed weekday afternoon, with ten results: many open at once, long and repeated names, missing, unclear and uncertain hours, a pharmacy without prescriptions, an approximate location.
- Why: Both canvas scenes are evenings, so no board shows the densest case for the map and the list.
- Status: done

## 2026-11-22: Audit 1: loading shows unlit crosses
- Where: Searching state
- Change: The placeholder rows carry unlit crosses instead of grey skeleton bars, and the line reads "Katsotaan, mitkä apteekit ovat auki juuri nyt…".
- Why: Swap test: grey bars would load a coffee-shop list just as well. The unlit sign waiting to be switched on is this app's own picture, and it sets up the reveal planned for M3.
- Status: done

## 2026-11-22: Audit 2: the heading says what is open now
- Where: Results title, phone top bar
- Change: The desktop title is "2 apteekkia auki juuri nyt" or, at night, "Yksi apteekki auki tähän aikaan yöstä". The phone bar's second line is "2 auki klo 20.41".
- Why: Swap test: "Apteekit lähelläsi" names the page; any finder has that title. The answer to the question, at this minute, is what the heading is for.
- Status: done

## 2026-11-22: Audit 3: problems point to 112, the green cross and the map apps
- Where: Service error, offline, none found
- Change: Each has "Hätätilanteessa soita 112." as a phone link. Offline adds that on the street a pharmacy is the lit green cross. Service error links to a pharmacy search in Google Maps and Apple Maps (no location in the link).
- Why: Swap test: a heading, a grey sentence and "Try again" is every error screen. Someone who needs medicine now needs another way to a pharmacy, not only a retry. No advice is given (principle 6).
- Status: done

## 2026-11-22: Audit 4: the pharmacy sheet answers pharmacy questions
- Where: PharmacySheet
- Change: Under the actions: "Ei varastossa? Seuraava auki: …" for the next open pharmacy. Abroad the sheet also offers "Näytä apteekissa".
- Why: Swap test: hours, access, phone and route buttons make a place card for anything. PLAN.md already asks every pharmacy detail for the next nearest open one, and the counter card was reachable only from the nearest pharmacy.
- Status: done

## 2026-11-22: Audit 5: "Kiinni nyt" says when the first one opens
- Where: ClosedGroup
- Change: The line under "Kiinni nyt" is "9 apteekkia, ensimmäinen avautuu huomenna klo 8".
- Why: Swap test: a count of closed places is filler. At 23.40 the useful fact is how long the wait is.
- Status: done

## 2026-11-22: Proposal A: desktop list shows every result
- Where: Desktop results panel
- Change: Current: two rows and "Näytä kaikki 7", as on the canvas. Proposed: all rows, the panel scrolls.
- Why: The card stays on top and the list, which is the product, is one click nearer. Side by side in /dev/states.
- Status: accepted. Now the only version; the earlier one is removed.

## 2026-11-22: Proposal B: banner names its source
- Where: CountryBanner
- Change: Current: status and tip. Proposed: also "Lähde: Kanta, tarkistettu 19.11.2026." with a link.
- Why: Principles 3 and 7: show sources and freshness. Side by side in /dev/states.
- Status: accepted. Now the only version; the earlier one is removed.

## 2026-11-22: Proposal C: counter card stays light in dark mode
- Where: CounterCard
- Change: Current: follows the device theme. Proposed: always light.
- Why: A stranger reads it at arm's length in a lit pharmacy, like a paper document; the canvas opens it light from the dark Riga board. Side by side in /dev/states.
- Status: accepted. Now the only version; the earlier one is removed.

## 2026-11-22: Proposal D: tight slack in amber
- Where: Ehditkö timeline (`lib/ehditko.ts`)
- Change: The slack is in the "closes soon" colour when it is under 5 minutes or under 20% of the walking time, whichever is larger. Otherwise green.
- Why: A walking estimate can be off by more than the slack, and by more on a long walk; green says "plenty of time". Janne set the threshold relative to the walk.
- Status: accepted

## 2026-11-22: Proposal E: one surface instead of three stacked cards
- Where: Results panel abroad at night
- Change: Current: the card, the prescription banner and "Kiinni nyt" are three rounded cards, as on the Riga board. Proposed: the banner is a section of the card and "Kiinni nyt" a plain row.
- Why: From the audit: a stack of rounded cards is the look PLAN.md section 6 warns against. It changes a main view's layout, so it waits. Side by side in /dev/states.
- Status: accepted. Now the only version; the earlier one is removed.

## 2026-11-22: One small 112 line in the results footer
- Where: SiteFooter, ProblemView, nothing-open card
- Change: The results footer starts with "Hätätilanteessa soita 112." as a phone link. In the nothing-open, none-found, error and offline states the line is prominent in the content instead, and the footer doesn't repeat it. No national advice lines yet.
- Why: Route, don't resolve: the one number that works everywhere in the EU is always within reach. Advice lines wait until they are verified in M6.
- Status: accepted

## 2026-11-22: Place name without reverse geocoding
- Where: Results title line, phone top bar (`placeLabel` in `lib/results.ts`)
- Change: A located user sees the city from `addr:city` of the nearest five pharmacies, when they have one and agree ("Helsinki", "Rīga" as written in OpenStreetMap). Otherwise "Lähelläsi". A searched place keeps the name from the search. The boards showed "Kamppi, Helsinki" for a located user.
- Why: No extra request and no exact position sent anywhere for a label. An honest "Lähelläsi" beats a wrong district.
- Status: accepted

## 2026-11-22: Nothing open
- Where: Results when no pharmacy is open, not even far away
- Change: The card becomes "Avautuu ensimmäisenä": the pharmacy that opens first (the nearest among equals), "Näytä tiedot" instead of a route button, and the 112 line. The other closed pharmacies are a plain list, not folded. The phone bar says "Ei yhtään auki klo 23.40".
- Why: The state had no design. The question changes from "where now" to "how long must I wait", and a route to a closed door would be a trap.
- Status: done

## 2026-11-22: Checked in WebKit, hyphenation tightened
- Where: All views; `:lang(fi)` hyphenation
- Change: The screenshot run now covers WebKit as well as Chromium. The views match apart from text rendering. Finnish hyphenation now needs four letters on each side of a break.
- Why: WebKit broke "vuorokau-den" where Chromium didn't; a three-letter tail reads badly in either.
- Status: done

## 2026-11-22: Sheet drag and landscape phones wait
- Where: Phone bottom sheet
- Change: The sheet opens and closes by tapping its handle or "Kaikki 8 apteekkia". Dragging is planned for M4 with the real map. Landscape phones get the phone layout and are cramped: a known limitation.
- Why: Drag only makes sense once the map behind it pans; landscape needs its own layout decision.
- Status: accepted

## 2026-11-22: City names in the UI language
- Where: Results title line, phone top bar, a far pharmacy's address (`lib/exonyms.ts`)
- Change: `addr:city` goes through a small table of Finnish and English names for the larger cities of the covered countries: "Rīga" reads "Riika" in Finnish and "Riga" in English. A language is left out where it uses the local name ("Tallinn" in English, "Praha" in Finnish), and everything else keeps the OpenStreetMap spelling. The lookup ignores case and missing marks ("Riga") and reads through Danish postal districts ("København K"). Cities are compared after translation, so two spellings of one city agree. A searched place keeps the name from the search.
- Why: Janne's decision. The local spelling in a Finnish sentence read like raw data. Haparanda and Mariehamn are in the table although they are small: that is where a Finn most often meets a Swedish name.
- Status: accepted

## 2026-11-22: Nothing open nearby, a farther one is
- Where: Results when no listed pharmacy is open (`arrange` in `lib/results.ts`, NearestOpenCard, collapsed sheet)
- Change: "Nothing open" now shows only when the 24-hour search within 30 km also finds nothing. When that search finds one, it leads as "Lähin auki nyt" with its distance and the route hand-off, and "Avautuu ensimmäisenä" sits below it in the same card. Decided on the way:
  - The far one counts as a result: "1 auki klo 23.40", "Kaikki 10 apteekkia".
  - It shows its straight-line distance, not a walking time, and its city when that isn't the place named above ("Daugavas iela 29, Mārupe").
  - Beyond 3 km in a straight line the route button shows a directions sign instead of the walker, and the Google and Apple links name no way of travel.
  - The card says "Lähemmät 9 apteekkia ovat kiinni." and leaves out when most of them open: the block below already says when the first one does.
  - "Kiinni nyt" then reads "8 muuta apteekkia", because the ninth is named in the card. A pharmacy shown in the card is never repeated in the list.
  - The collapsed sheet gets one line, "Avautuu ensimmäisenä huomenna klo 8", with the walking time, in the same columns as the row above.
  - The edge chip for the far one is named "Lähin auki", not "Seuraava auki", and on the phone it sits clear of the map credit.
- Why: Janne's decision on the order. At that moment there are two ways forward, travel now or wait for the nearest door to open, and the card should hold both. A walking time for 6 km would be a number nobody uses.
- Status: accepted

## 2026-11-22: Where focus goes when the view changes (M1)
- Where: FirstVisit, PlaceSearch, the map views
- Change: When the location button gives way to the status line, focus moves to that line. A location problem moves focus to the note's heading; choosing "Hae paikan nimellä" moves it to the field. After a search the user started, focus moves to the map view's title. Headings that only the app focuses show no ring: they are not controls.
- Why: PLAN.md section 9. The pressed button disappears, and a keyboard or screen-reader user would otherwise be dropped at the top of the page. The ring around a note's heading also overlapped the line below it.
- Status: done

## 2026-11-22: What a place search can answer (M1)
- Where: PlaceSearch
- Change: Four states the boards didn't have: looking the name up ("Haetaan paikkaa…"), no place by that name (the note quotes the name and keeps it in the field), the lookup failed, and offline. The note has no icon. Only the latest event is shown: the search's answer replaces the location note until the next search.
- Why: The search runs through our server to Nominatim and can fail in ways the user has to be told about. One note at a time keeps the phone screen readable.
- Status: done

## 2026-11-22: Approximate location offers place search (M1)
- Where: ApproximateNotice (the map views)
- Change: The notice has the action "Hae paikan nimellä", and its text is shortened to "Etäisyydet voivat heittää." The boards had the sentence without a way to act on it.
- Why: PLAN.md 7.1: show the notice "with place search". The action keeps the name it has on the first window.
- Status: done

## 2026-11-22: Back steps through the views (M1)
- Where: The whole flow (`hooks/usePharmacySearch.ts`)
- Change: The first window, the search box and the map view are steps in the browser's history, with the address unchanged. The back button and the back arrow go one step back without loading the page again. Refreshing the location on a searched place switches to the device's location.
- Why: On a phone the back gesture is how people leave a view. Without this it left the site.
- Status: done

## 2026-11-22: M1 stops at the searching view
- Where: After the position is known
- Change: Once a position is found the app shows the map view with the placeholder and stays there. There is no pharmacy data to show before M2 and M3.
- Why: The only honest alternatives were an error message for a service that doesn't exist yet, or fixture pharmacies around the user's real position. Both would say something false.
- Status: done, until M3

## 2026-11-22: The map's look: three variants on real tiles (spike S1)
- Where: The map (`/dev/map`, `lib/map/style.ts`, screenshots in `design/map-spike/`)
- Change: MapLibre on OpenFreeMap's vector tiles with our own style, built from the map tokens of PLAN.md section 6, and the app's own markers on top. Three variants, each at day, dusk and night, in Helsinki and Riga:
  - A, flat and calm: water, muted parks, three road weights, flat buildings, few labels.
  - B: A plus buildings in 3D from zoom 15, lit from the side the sun is really on.
  - C: B plus a pitched camera and a sky in the colours of the first-visit sky.
- Recommendation: A for v1.
  - The lit cross stays the one bold thing on the map. In B and C the roofs become the brightest shapes at dusk and compete with it.
  - C costs 1.7 s more on the phone profile, shows fewer pharmacies at once, and hides how far apart they are. Its sky is a decorative gradient outside the first-visit scene, which CLAUDE.md lists as tried and rejected.
  - B costs nothing measurable, so its light stays in the style code as an option to look at again in M4, with the route line and real markers on top.
  - Two palettes, not three: the map should follow the device theme like the panels next to it. The dusk palette shows what a clock-driven third would look like; next to a light or dark panel it would belong to neither.
  - Our own typeface on the map works and took minutes, not the hour allowed: keep it. It has no Greek or Cyrillic, so those labels need a fallback typeface before Greece is covered.
- Why: PLAN.md decision D6 and proposal P9: the look comes from our style, not from the tile host, and that is easier to judge on real tiles than to argue.
- Numbers (production build with `DEV_ROUTES=1`, phone profile: slow 4G and a 4× slower CPU, cold cache, median of three):
  - `maplibre-gl` 6.19: 292 KB gzipped, plus its worker 154 KB. It is by far the heaviest thing in the app, so the list must never wait for it.
  - Style: 5.7 to 6.3 KB, 1.1 to 1.3 KB gzipped.
  - Map code ready after 3.2 s; first full render after 6.5 s (A and B) and 8.2 s (C); 664 KB transferred in all.
  - Glyphs for two weights: 275 KB on disk, fetched one 256-character range at a time.
- Status: decided on 22 Nov 2026, not as recommended: see the next entry

## 2026-11-22: The map's look, decided: flat from afar, sun-lit buildings up close
- Where: The map (M4): `lib/map/style.ts`, the markers
- Change: Janne's decision on the spike (S1). It keeps more of B than the recommendation did:
  - Top-down only. Variant C is dropped: no pitched camera and no sky on the map.
  - Overview zooms look like A: flat and calm.
  - From about zoom 15, B's buildings fade in: 3D, lit from the side the sun is really on.
  - The markers get stronger. In the spike they are too weak against the map.
  - Dusk and night become clearly different. In the spike they look almost the same.
- Why: Janne's call from the screenshots in `design/map-spike/`. The numbers allow it: B rendered as fast as A on the phone profile (6.5 s), and C was the one variant with a cost (8.2 s). Below zoom 15, A and B draw the same flat map, so the overview stays calm and the buildings rise only where single streets matter.
- Left for M4, each one decided there provisionally and shown on `/dev/map` first:
  - The fade: over which zooms the buildings rise (the spike switches them on at zoom 15), and whether height or opacity carries it.
  - The markers: size, contrast and ring against each palette. The closed disc is the weakest. The lit cross has to stay the one bold thing next to lit roofs too: at dusk B's roofs were the brightest shapes on the map.
  - Dusk against night: the palettes `DUSK` and `NIGHT` in `lib/map/style.ts` are both dark navy and differ mostly in how light the roads are.
  - How the sun's phases meet the device theme. PLAN.md section 6 says the map stays on the light and dark themes, and that the theme never follows the clock. A dusk look of its own is a third palette that follows the sun, so it departs from that. M4 has to say which wins where: what the map shows at dusk on a phone in light mode, and at noon on a phone in dark mode. Until then section 6 stands as it is.
- Not changed now: the spike keeps all three variants and their screenshots, as the record of what was compared. M4 takes C out of the style code when it builds the real map.
- Status: accepted (Janne, 22 Nov 2026); details provisional until M4

