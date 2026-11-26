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


## 2026-11-23: A way to search another place from the results
- Where: Results, the phone's bar and the desktop panel's title
- Change: On the phone the place name in the bar is a button that opens the place search, marked with a search glyph and named "Hae toinen paikka" for screen readers. On desktop the same action is a line of text with the glyph under the title. Before this, only the browser's back button led to another place.
- Why: PLAN.md 7.3 promises "search elsewhere" as a way forward from the results, and nothing on screen offered it. The glyph carries meaning here: a bare name doesn't read as something to press.
- Status: accepted (Janne, 23 Nov 2026), with one change: on the phone the search glyph is a little more visible. It is now 18 px, in the colour of things that can be pressed, with a slightly heavier line. The proposal has left `/dev/states`: every results view there now shows the control, as the app does

## 2026-11-23: Data older than seven days: one notice, quiet rows
- Where: Results with out-of-date data (`/dev/states/stale`)
- Change: PLAN.md section 5 said a notice takes the card's place. Built: the amber notice of the approximate-location case, with the date of the data and one thing to do ("Soita apteekkiin ennen kuin lähdet"). The heading is "Apteekit lähelläsi", not a count of open ones. The list is headed "Lähimmät apteekit", since there is no card for them to be "the others" of. On the phone the sheet is open from the start: there is no answer to peek at. The rows keep the dashed cross and say "Aukioloajat voivat olla vanhentuneet" in the quiet text colour, not in amber.
- Why: Ten amber lines would say the same thing ten times; the notice says it once and the rows stay readable as a list of names and distances, which is what is still true.
- Status: done

## 2026-11-23: At the edge of the coverage: the note and the not-covered view
- Where: Results near a border (`/dev/states/tiles-edge`), the not-covered view (`/dev/states/not-covered`)
- Change:
  - PLAN.md 7.7 worded the note "Ranskan apteekit eivät ole mukana". Built: "Ranska ei ole vielä mukana: sen apteekkeja ei näy tässä." Country names come from the browser (`Intl.DisplayNames`) in the nominative; a genitive would need a hand-kept table of every neighbouring country in two languages.
  - The note is a single plain sentence in the notice style, without a heading: it qualifies the results, it isn't a problem.
  - The not-covered view names the country only where the tiles know it (a square on the border, or never for a square that is all outside). Otherwise the heading alone says it. The covered countries are one sentence, in alphabetical order in the UI language.
- Why: Real names in two languages without a table to keep; and no claim about where the user is that the device can't back.
- Status: done

## 2026-11-23: The data date in the footer, and the data page
- Where: Results footer; `/fi/data`, `/en/data` (`/dev/states/data`)
- Change: PLAN.md section 5 said the data date links to the data page. Built: "Tiedot: OpenStreetMap, haettu 23.11." followed by a link of its own, "Tietoa aineistosta". The page is a table by country (pharmacies, share with hours, share of those read, date fetched), a total, three lines on how to read it and where to fix wrong data. A country whose data is from an earlier run says so in its row.
- Why: A date is a poor name for a link: a screen reader would announce "23.11., link". On a narrow phone the table scrolls sideways rather than squeezing the numbers.
- Status: done

## 2026-11-23: The crosses switch on in the list first
- Where: Results, the card and the list
- Change: The reveal of PLAN.md section 6 (open crosses switch on in order, 30 ms apart, 180 ms each) is built for the card and the list. The map's markers join in M4, when the real map replaces the placeholder. Nothing moves with `prefers-reduced-motion`.
- Why: The placeholder map is replaced in M4; animating it now would be thrown away.
- Status: done, until M4

## 2026-11-23: One map, with MapLibre under it or without (M4)
- Where: `components/MapView.tsx`, `lib/map/camera.ts`
- Change: The placeholder map is gone. MapLibre draws the streets on OpenFreeMap's tiles in our own style, and everything the app itself puts on the map (markers, the dot, edge chips, the selected name, legend, controls, credit) is our own HTML over the canvas. All of it is placed by one piece of arithmetic that works the same whether MapLibre is there or not. So `/dev/states` shows the real map component on the plain ground colour, without calling a service, and when MapLibre can't start (no WebGL) or its tiles never arrive, the markers and chips stay where they were and one line says "Karttapohja ei latautunut. Lista ja merkit toimivat ilman sitä."
- Why: PLAN.md asks that the list still works if the map fails. Markers that are our own buttons from the start make that true of the map's contents too, and keep one marker component for the list's focus handling and names. MapLibre is fetched only once results are on screen: it is 439 KB, and the list must never wait for it.
- Status: done

## 2026-11-23: The sun and the theme on the map (M4, provisional)
- Where: The map's colours (`lib/map/style.ts`; `/dev/map` shows noon, dusk and night in both themes)
- Change: The question the spike decision left open: a dusk look that follows the sun is a third palette, and PLAN.md section 6 has two themes that follow the device. Built this way:
  - The device theme picks light or dark, on the map as everywhere else. The sun never changes the theme.
  - The sun moves the light on the buildings: from its real direction while it is up, dim and from straight above after sunset.
  - In the dark theme the sun also sets how deep the dark is. While there is light in the sky (the sun above −4°) the map is the blue of the first-visit twilight, clearly lighter than night; once it is gone (below −8°) it is the navy of PLAN.md; four steps between, so it never jumps.
  - So: a phone in light mode at dusk shows the light map with the light from above. A phone in dark mode at noon shows the dusk blue with sun-lit buildings: dark, and never lighter at night than by day.
- Why: Janne asked for dusk and night to be clearly different. Letting the sun switch between light and dark would break "the theme follows the device, never the clock" and put a dark map next to a light panel. Keeping the sun inside the dark theme gives the difference where it was asked for and leaves the theme rule whole.
- Not taken: the sun picking the whole look (day, dusk, night) whatever the theme; and no dusk at all (two palettes, the sun moving only the light).
- Status: provisional. It adds a palette, so it is propose-first; built this way in M4, waiting for Janne

## 2026-11-23: Dusk is the twilight blue, night stays as planned (M4, provisional)
- Where: `DUSK` in `lib/map/style.ts`
- Change: Dusk's ground is `#1B3763` against night's `#0A192E`; roads `#4668A2` and `#31528A` against `#28456E` and `#1A3254`; labels lighter to match. Water is the darkest thing on both. In the spike the two differed mostly in how light the roads were.
- Why: "Dusk and night look almost the same" (Janne, on the spike). The values sit between the first-visit twilight's upper sky and the dark theme's surfaces, so the map still belongs next to the dark panel.
- Status: provisional, with the entry above

## 2026-11-23: The buildings rise between zoom 15 and 15.6 (M4, provisional)
- Where: `building-3d` in `lib/map/style.ts`
- Change: Below zoom 15 the map is the flat one. From 15 the buildings grow from nothing to their own height by 15.6. Height carries the change; a short fade of opacity only keeps the first frame from popping. The flat footprints stay underneath, so nothing flickers between the two.
- Why: The spike switched them on at 15 in one step. Growing reads as zooming in on something that was always there. The first view of a city is usually between 13 and 15, so the overview stays calm and the buildings come when single streets matter.
- Status: provisional (left to M4 by the spike decision)

## 2026-11-23: Stronger markers (M4, provisional)
- Where: `MapMarker`, tokens in `app/globals.css`
- Change: Every marker stands on a 2 px ring (white; `#071427` in the dark theme). The capsule is 30 px tall instead of 26, with 13.5 px text at weight 750; selected 36 px. The closed disc is 25 px instead of 21, and its ring takes a tone close to the glyph (`#93A1B5`; dark `#5A7096`) instead of the pale `#BFCAD8`; in the dark theme the disc's fill is a shade lighter (`#132C52`). The glow of an open capsule in the dark theme is a little wider. Shapes and colours of the status glyph are unchanged.
- Why: On real streets a marker without a ring merges with whatever runs under it, and the closed disc all but vanished on the dark map (Janne, on the spike: the markers are too weak). The ring separates without adding a colour, and the lit cross stays the one bold thing: nothing else on the map is saturated.
- Status: provisional (left to M4 by the spike decision)

## 2026-11-23: The selected pharmacy's name stands on a small plate (M4)
- Where: The map on desktop
- Change: The canvas has the name as bare text with a halo. Built: a small plate in the float colour. It goes above the marker when the map's edge or another marker is beside it.
- Why: Real map tiles bring their own labels. The first real screenshot had "Töölön apteekki" printed across "Kamppi".
- Status: done

## 2026-11-23: Edge chips sit on the line towards the pharmacy (M4)
- Where: The map (replaces "Edge chip points at the pharmacy", which had eight fixed positions)
- Change: A chip sits where the line from the middle of the visible map to the pharmacy leaves it, and the arrow turns to the same direction. At most three: the nearest open ones that are off the map. Two that would overlap are moved apart along the edge. Pressing a chip opens the pharmacy and brings it into view together with the dot.
- Why: The map now pans and zooms, so a chip has to move with it; MapLibre gives the exact place. More than three chips would be a second list on the map.
- Status: done

## 2026-11-23: The first view keeps the answer clear of the dot (M4)
- Where: `toScene` in `lib/live.ts`; the phone's camera in `MapView`
- Change: The view was wide enough for the nearest five and no more. When the pharmacy in the card was only a block away, its marker sat on top of the dot. Now the view goes closer until the two stand about 90 px apart (at most zoom 16.5 in the scene's terms); the others get edge chips or are a pinch away. On the phone the position sits in the middle of what the bar and the sheet leave free, not of what the sheet alone leaves. A sheet that doesn't collapse (searching, problems, out-of-date data) tells the map its real height, so the dot is no longer half under it.
- Why: Real data. In a city centre the nearest open pharmacy is often 100 m away and the fifth a kilometre. The dot and the answer are the two things the first glance needs.
- Status: done

## 2026-11-23: The halo is the device's accuracy, and lies under the markers (M4)
- Where: You-are-here on the map
- Change: The halo is as wide as the accuracy the device reports, in the map's own scale, and never under the canvas's 64 px. It is drawn under every marker; the dot stays above the unlit ones.
- Why: A halo of fixed size says nothing once the map zooms. Over the markers it dimmed the ones inside it.
- Status: done

## 2026-11-23: Following a walk (M4)
- Where: `hooks/useLivePosition.ts`, `follow` in `hooks/usePharmacySearch.ts`
- Change: While results from the device's own position are on screen and the page is visible, the dot follows `watchPosition`. The watch asks for high accuracy; the first answer still doesn't. After 300 m, and only if the fix is surer than the distance moved, the tiles already on the device are ranked again and the results change in place, with the map framed around the new position. A searched place is never followed. The locate control on desktop brings the dot back to the middle and searches nothing: "Päivitä sijainti" is the control that searches again.
- Why: PLAN.md 7.1, step 11. A fix that only got vaguer (a phone indoors) would otherwise shuffle the list. A searched place is not where the user is, and a watch there would bring a permission prompt nobody pressed for.
- Status: done; the walk itself is for Janne to try on a phone

## 2026-11-23: The sheet drags (M4)
- Where: Phone bottom sheet (`ResultsShell`)
- Change: The sheet follows the finger between its two places. Past the middle it shows what it will hold; let go, it settles on the nearer place, or the way it was thrown. Collapsed, the whole sheet is the handle; open, only the handle is, so the list under it scrolls as usual. The handle stays a button for taps and the keyboard. The map waits until the sheet has settled and then moves once.
- Why: PLAN.md section 5 and the earlier entry "Sheet drag and landscape phones wait". Pulling the open list down from its content would fight the list's own scrolling; that can come later if it is missed.
- Status: done; real Safari on a phone is for Janne to try

## 2026-11-23: The map's credit names three (M4)
- Where: The map, bottom left
- Change: With the real map the credit reads "OpenFreeMap © OpenMapTiles © OpenStreetMapin tekijät", three links in our own small plate, instead of MapLibre's own control. Without the map tiles it is OpenStreetMap alone, as before, since then only the pharmacies are theirs.
- Why: OpenFreeMap asks for this credit wherever its tiles are shown. Our own plate keeps the typeface and the quiet look of the canvas.
- Status: done

## 2026-11-23: The lit markers switch on with the list (M4)
- Where: The map's markers
- Change: The reveal of PLAN.md section 6 now covers the map: lit capsules switch on in the list's order, 30 ms apart, 180 ms each. A pharmacy that opens while the view is on screen lights up the same way. Nothing moves with `prefers-reduced-motion`.
- Why: Completes "The crosses switch on in the list first".
- Status: done

## 2026-11-23: Where most nearby pharmacies have no listed hours (provisional)
- Where: Results: the card, the collapsed sheet, the heading and the bar line (`arrange` in `lib/results.ts`, `HoursUnknownCard`; `/dev/states`, proposal "hours" with current and proposed side by side, and the group "Hours coverage")
- Change: Janne's decision of 23 Nov on the M3 report: don't guess hours, and where most nearby pharmacies have none listed, the card must not send people past them to a far one whose hours are known. Until now the card led with the nearest pharmacy whose hours say it is open, in the Málaga fixture 1.9 km away, past seven that may well be open. Built:
  - The rule: when more than half of the pharmacies nearer than the nearest one known to be open have hours we can't read, and that one is more than 500 m farther than the nearest of them, the nearest of them leads. The same when no pharmacy is known to be open at all.
  - "Can't read" is missing, unparseable or uncertain: for someone deciding where to walk they are the same. Out-of-date data is not this case; it has its own view.
  - The card is headed "Lähin apteekki" and keeps the pharmacy's honest status line. One sentence says how many of the pharmacies shown it is true of ("Lähistöllä on 8 apteekkia, joiden aukioloaikoja ei tiedetä. Osa niistä voi olla auki.") and what to do ("Soita ennen kuin lähdet."). The count is of the whole list, not only of those nearer than the open one, so that it agrees with the rows under the card.
  - "Soita" is the first and the primary action, "Reitti" the second. Without a phone number in OpenStreetMap "Reitti" leads and the sentence says why: the only way to find out is to go there.
  - The nearest pharmacy known to be open stays, as one line under the actions: "Lähin, jonka tiedetään olevan auki: Farmacia Estación, 1,9 km, auki klo 22 asti." Not "varmasti auki": the hours are OpenStreetMap's.
  - One small line names the country's share from `index.json`, which is on the device already, and leads to the data page: "Espanja: aukioloajat on merkitty 18 %:lle apteekeista." The country is in the nominative, as in the edge-of-coverage note, so no table of inflected names is needed.
  - With no pharmacy known to be open, the card keeps "Hätätilanteessa soita 112" prominent and names no "Avautuu ensimmäisenä": nothing says the others are closed.
  - The heading and the phone's bar stop counting: "Lähimpien apteekkien aukioloaikoja ei tiedetä" and "Aukioloaikoja ei tiedetä", in place of "1 auki klo 20.41" or "Lähistöllä ei ole yhtään apteekkia auki", which the data can't back.
  - Where the open one is hardly farther (200 m against 300 m), it leads as before, and one line under its status says what lies nearer: "Lähempänä on 2 apteekkia, joiden aukioloaikoja ei tiedetä." "Lähin auki nyt" is then the nearest we know of, and the card says so.
  - The collapsed sheet carries the same in three rows: the nearest with its status, "Tiedetään olevan auki: …" with its distance, and "Soita" next to "Kaikki 10 apteekkia".
  - Left for M6: where night duty rotates, the country's official duty lookup goes between the known-open line and the share line. The place is marked in the component.
- Why: In Greece 7 % of pharmacies have opening hours in OpenStreetMap, in Spain 18 %, in Italy 23 % (the run of 23 Nov 2026). There the old card answered "which pharmacy has hours in the data", not "which pharmacy can help me". A pharmacy 120 m away that may be open is a better first step than a certain one half an hour's walk away, as long as the app says what it doesn't know. The 500 m is about six minutes on foot: a fair price for knowing, and more than that is a different errand.
- Status: provisional. It changes the card of a main view, so it is propose-first; built this way under the night-run rule and shown in `/dev/states`, waiting for Janne. Open in it: the 500 m, and whether a nearest pharmacy without a phone number should give way to the nearest one that has one.

## 2026-11-23: The data page: when each country was last fetched, and what a low share means
- Where: `/fi/data`, `/en/data` (`/dev/states/data`)
- Change:
  - Above the table: when the pipeline last ran ("Viimeisin haku: 23.11. klo 3.33"), and under it the countries that run could not refresh, by name.
  - Each country's row has the date and the time of its last successful fetch, on the device's clock. It was a date. On a phone the time sits under the country's name and the fifth column goes: with it the table was wider than the screen and the column that says how fresh the data is was the one scrolled out of sight. There the table is one step down the type scale (14 px), and its headings break at soft hyphens written into the strings ("Apteek-keja"), not where the browser's hyphenation would. On a desktop the headings keep whole words, and "(aiempi haku)" sits under the time instead of beside it. The first baselines showed why: CI's Linux browsers have no Finnish hyphenation dictionary, and the table that fitted on this Mac pushed its last column off the page there, at both sizes. A browser test now measures that the table fits at 390 and 1440 px in both languages.
  - The share with opening hours is repeated as a short bar under the number, so that the column can be read down at a glance: Norway 95 %, Greece 7 %. The bar is in the link blue, not in a status colour, and hidden from screen readers: the number is the text.
  - One more line of explanation: where the share is low, most pharmacies read "Aukioloaikoja ei ole merkitty", hours are never guessed, and the thing to do is to call.
  - The fixture behind `/dev/states/data` now holds the real numbers of the run of 23 Nov 2026. With made-up numbers every country sat between 73 and 80 %, and the page hid what it is there to show.
- Why: Janne's decisions of 23 Nov: show each country's last successful run (the pipeline now makes a second attempt at night for the countries that failed), and show each country's coverage.
- Status: done for the times and the last run (decided). The bar and the explanation belong to the hours-coverage work above and are provisional with it

## 2026-11-24: Every touch on the map is the map's own
- Where: `components/MapView.tsx`, `MapView.module.css`; `tests/e2e/touch.spec.ts`
- Change: Janne tried the map on an iPhone on 23 Nov: a pinch sometimes zoomed the whole page, a one-finger drag did nothing or felt stiff, and the map didn't always react. Two causes, both ours:
  - MapLibre only counts the touches that begin inside the element it listens on. The markers lay beside that element, each with a 44 px target, so a drag that began on one moved nothing, and a pinch with one finger on one was a one-finger gesture to the map. In a city centre the ten markers cover a good part of the middle of the screen. Once MapLibre is drawing, the markers now live inside that element: a drag or a pinch that begins on a marker moves the map, and a tap on it still opens the pharmacy. A mouse drag that ends on the marker it began on is not a press on it.
  - Nothing told the browser to keep its hands off the map before MapLibre had arrived, when it couldn't start, or on the markers and chips at any time: there a pinch zoomed the page. The whole map now has `touch-action: none`, in every state, and that covers everything on it.
  - The gestures themselves are MapLibre's own and were always switched on: one finger moves the map and it glides on when thrown, two fingers zoom around themselves, two taps come closer, a tap with two fingers goes back out. Turning and tilting stay off (S1).
- Why: Measured against the code before: with real touch input a drag from a marker moved the map 0 px, and the plain ground, the failed map and every marker answered `touch-action: auto`. Both are tests now. The sheet and the bar still let two fingers zoom the page: text must stay zoomable (PLAN.md section 9).
- Status: done. Real Safari on Janne's iPhone is the check that counts: DevTools touch in Chromium is the nearest thing a test can get. Not done: the map doesn't move under a finger in the fraction of a second before MapLibre has arrived, or when it can't start; it no longer zooms the page then.

## 2026-11-24: While the map moves, positions are written and nothing is rendered
- Where: `place` in `components/MapView.tsx`; `styleChanges` in `lib/map/style.ts`
- Change:
  - The edge chips' positions were React state. With an open pharmacy off the map, every frame of a pan set that state, and the whole map view with its markers rendered again, sixty times a second. Now the state holds only which chips there are and what they say; where they are is written straight to the elements, by the code that places the markers.
  - On the phone each marker is a layer of its own (`will-change: transform`), so moving it repaints nothing, not even its glow. Not on the desktop layout: there it changed how the markers' text is drawn, by a few pixels in 52 baseline images, for nothing a mouse needs. The halo's size and the map's ready mark are written only when they change.
  - A new sun, or a new step from dusk to night, no longer sets the style again. The properties that differ are set one by one, a handful of colours and the light. Only another theme, which has other layers, sets the style as a whole. The style was never set on the minute's tick; that was checked and holds.
- Why: Measured on a CPU four times slower, phone-sized, real Helsinki pharmacies, the map tile host answered locally, about 310 frames of panning with one edge chip. Script time during the pan: on the dev server 3,209 ms before and 357 ms after, with 46 and then 0 frames longer than 34 ms; on a production build 656 ms before and 263 ms after, no long frames either way. Janne's test ran on the dev server, where React's development build made the per-frame render nine times as expensive: that was the lag. The map's code arrived 0.2 s after the first result on the production build and 0.3 s on the dev server, on this machine: the dev server's chunk is not what kept the map plain for seconds.
- Status: done. The drawing of real map tiles on the phone's GPU is not in these numbers; the production preview on the phone will show it.

## 2026-11-24: Every pharmacy on the map: the ten as markers, the rest as the map's own signs (provisional)
- Where: `lib/map/area.ts`, the layer `area-pharmacies` in `lib/map/style.ts`, `components/mapSigns.ts`, `MapView`; `/dev/map` on invented pharmacies
- Change: Janne, 23 Nov: show all pharmacies on the map, as a map layer and not as HTML markers, thinned out at low zoom; keep HTML only where it adds something; the list stays the nearest ten.
  - Every pharmacy on the tiles the device holds, apart from those the results already mark, is a point in one GeoJSON source, drawn by MapLibre as one symbol layer above the labels. In Helsinki that is 106 signs from the four squares the search loads.
  - The signs are the list's four glyphs on a disc, drawn once per theme: a lit disc of 20 px for open (green) and for closing soon (amber), an unlit disc of 18 px with the outlined cross for closed, the dashed cross where the hours aren't known. Smaller than the list's markers, without a distance and without a glow.
  - Thinning: signs may not overlap, and where they would the open ones are placed first. They shrink to half size by zoom 9. No clusters: a cluster's number says nothing about what is open, and the lit signs are the answer.
  - A press within 18 px of a sign opens the pharmacy sheet through the same code as a row; while it is selected it has a marker like the list's, with its name.
  - Statuses follow the clock from the intervals already on the device. The layer is given new data only when a pharmacy opens or closes, a tile arrives or the list is ranked again, not every minute.
- Why: The tiles were on the phone already and the map showed ten of them. Where this departs from Janne's note: the list's ten keep their HTML markers. They are where HTML adds something: the capsule with the distance is the one bold signal, they are the same component with MapLibre and without it (so the map still works when it can't be drawn, and `/dev/states` shows them), and they stay buttons in the list's order. Ten elements moved by a transform are not what made zooming slow (see the entry above); hundreds would be, and those are the layer. The alternative, the ten as symbols too, would give two renderings of the same marker and a switch between them when MapLibre arrives.
- Status: provisional. Open in it: whether the ten should become symbols as well; the signs' sizes; whether a pharmacy beyond the ten should be reachable without the map (for a keyboard it is reached by searching its place).

## 2026-11-24: Moved by hand, the map asks for the new area's tiles (provisional)
- Where: `Tiles.loadArea` in `lib/search.ts`, `squaresIn` in `lib/map/area.ts`, `showArea` in `hooks/usePharmacySearch.ts`; PLAN.md 7.1 and the table of 7.6
- Change: When the user drags, pinches or zooms the map and it comes to rest on squares whose tiles aren't on the device, the client fetches them and the map draws their pharmacies. The requests are the same as the search's: a tile by its number.
  - Only a move made by hand asks. Framing the results, selecting a pharmacy and following a walk ask for nothing, so what is requested follows from where the user looks, never from where they are.
  - A view that touches more than twelve squares (about zoom 8 on a phone) asks for nothing: pharmacies are dots on top of each other there.
  - A square that doesn't load is remembered apart from the search's own failures: the list never depended on it.
  - The list, the card and the bar don't change: they are the answer for the place searched.
- Why: Janne, 23 Nov: load the tiles of a new area when the map is moved there, squares and never the position. It changes one row of the table in PLAN.md 7.6 ("when": also when the user moves the map). The claim itself stands: the position leaves the device in one request, and a tile request names a square.
- Status: provisional, because it touches the privacy table. Checked by a browser test: after the map is dragged to Sipoo, the new requests are tile numbers and no request carries the position.

## 2026-11-24: The phone's sheet rests on one row (provisional)
- Where: `ResultsView` (`SheetRow`), `/dev/states`, proposal "sheet" with the old and the new collapsed sheet side by side
- Change: At its lowest the sheet is the handle and one row: the cross, the name, then the distance in bold and the status in its tone, and one button. "Reitti" for an open pharmacy, "Soita" (else "Reitti") where the hours are unknown, "112" where nothing is open. The second lines of the old collapsed sheet and "Kaikki N apteekkia" moved to the card. The row's buttons are words without icons, except 112. The ehditkö line is not in the row: the too-late warning still takes the status's place.
- Why: Janne on an iPhone, 23 Nov: the collapsed answer took too much of the screen. It was 179 px of 844; the row is 86, and 105 when the status wraps. An icon in the button and the timeline line each cost more width than the row has at 390 px: "3 min · Perillä 20.44, sulkeutuu 21.00" measures 256 px against 249.
- Status: provisional. It changes the layout of a main view.

## 2026-11-24: Three places for the sheet: the row, the card, the list (provisional)
- Where: `ResultsShell`
- Change: The sheet rests on the row, at the card (as tall as the notices, the card and "Kaikki N apteekkia", at most 60 % of the screen) and open at nearly full height (its top 88 px down, the bar stays). It drags between all three, settles on the nearest or one place the way it was thrown, and shows the list as soon as it is pulled 24 px above the card. The handle steps up one place at a time and from the list back to the row; its name says what a press does. The glide is 260 ms. With nothing open the sheet starts at the card.
- Why: Janne: the sheet must go down so that the map gets the screen, then the card, then the list, as in Apple Maps and Google Maps. The old open sheet (473 px) was about as tall as a card (432 px in Helsinki), so the list needed a place of its own. 112 must stay prominent when nothing is open (PLAN.md 7.6): there the card is what the user meets first.
- Status: provisional. For Janne's phone: the throw (0.5 px a millisecond), whether the whole card as the handle feels right, the bottom safe area under the row, and whether 60 % is the right cap.

## 2026-11-24: The list waits out of reach until it is opened (provisional)
- Where: `ResultsShell`
- Change: At the card the lists and the footer are hidden from sight, the keyboard and screen readers. A card control under the screen's edge opens the sheet when it takes focus. Opening the list from "Kaikki N apteekkia" moves focus to the first row, because the button then goes away. The results announcement sits outside everything the sheet hides; before, on the phone, it sat inside content that was not displayed while the sheet was collapsed.
- Why: Nothing focused may be out of sight, and a screen reader's press on a covered row would land on whatever covers it.
- Status: provisional with the sheet

## 2026-11-24: The map waits for the sheet, and the chips keep off the credit
- Where: `--map-pad` in `ResultsShell.module.css`; `chipInsets` in `MapView`
- Change: The camera's free area is above the row at the lowest place, and above the card both at the card and with the list open. It doesn't move during a drag or when the list opens. On the phone the edge chips stay 40 px above the sheet, clear of the map's credit line.
- Why: The open list covers nearly the whole map: moving the camera under it would only show as a jump when the list closes. With the lower sheet the bottom edge of the map is in use, and a chip there lay on the credit.
- Status: done

## 2026-11-24: A mouse drags the sheet, not what is written on it
- Where: `ResultsShell` (`onDragStart`, and the drag's first step)
- Change: While the sheet is dragged its text can't be selected, and any selection is dropped when the drag begins. Where a press can move the sheet, the browser may not pick up a link or selected text and carry it off instead.
- Why: CI's Linux browsers found it, in both engines: dragging the sheet by a pharmacy's name selected the text on the way, and the next press on it started the browser's own drag-and-drop, which cancels the sheet's. A link (the call) would be carried off the same way on any desktop browser. A finger never did this; a mouse in a narrow window did. The text stays selectable whenever the sheet isn't being dragged.
- Status: done

## 2026-11-24: The list is in walking order, by time (M5)
- Where: `byWalking`, `walkMinutes` and `atLeastStraight` in `lib/walking.ts`; list rows, the card, markers, edge chips
- Change: With walking times the list is the first ten of the twenty candidates by walking time, among equals by walking distance. PLAN.md said "by walking distance"; section 7.1 now says time.
  - Minutes are whole and rounded up, never less than one: 158 seconds is "3 min".
  - A walk is never taken to be shorter than the straight line at 5 km/h.
  - A pharmacy with no walking route comes after all that have one and keeps its straight-line distance, labelled "linnuntietä", in a list that is otherwise on foot.
  - When walking times don't come within a second and a half the list is by straight line, the list's heading says "Linnuntietä" and the footer "Etäisyydet ovat linnuntietä.", as the M0 fallback view had it.
  - The list's own line about its order stays "Kävelymatkan mukaan" in Finnish, where the word covers the walk either way; in English it is now "By walking time" (it was "By walking distance").
- Why: The rows lead with the minutes, so the number the eye runs down is the one that is in order (openrouteservice walks at one speed, so the two orders differ only on a hiking trail). Rounded up, because the same number says whether one gets there before closing: "3 min" must not mean three and a half. The lower bound, because the service measures between the nearest points of the street network: from a park to a pharmacy inside a block it can come out shorter than the straight line, and ehditkö would then promise too much.
- Status: done

## 2026-11-24: Ehditkö counts from the minute on the clock, and "too late" does not wait for the last hour (M5)
- Where: `lib/ehditko.ts`, `ehditkoFor` in `lib/live.ts`, the card
- Change: The walk is counted from the start of the minute the clock shows, so the three numbers always add up: at 20.41.40 with three minutes to walk the card says "Perillä 20.44", "Sulkeutuu 21.00", "16 min pelivaraa". The timeline starts at 60 minutes before closing by that same minute. "Et ehdi ennen sulkemista" is said whenever the walk would end at closing time or after it, also when closing is more than an hour away (a long walk); PLAN.md 7.1 read as if the hour came first. Both times are on the pharmacy's clock, and a closing at midnight reads 24.00.
- Why: Counted from the second, the card showed "20.44 … 21.00 … 15 min" for forty seconds of every minute. The walking time is already rounded up, so starting from the whole minute is inside its margin. A pharmacy one can't reach in time is the case ehditkö exists for, whatever the hour.
- Status: done

## 2026-11-24: The next open pharmacy is one a walk still reaches (M5)
- Where: `worthTheWalk` and `noneShownOpen` in `lib/live.ts`, `arrange` in `lib/results.ts`, `findFarOpen` in `lib/search.ts`
- Change: A pharmacy that is open now but closes before a walk there would end carries `tooLate`. It is not offered as "Seuraava auki", neither in the card nor in a sheet's "Ei varastossa?" line. When the only open pharmacies of the list are like that, the wider search runs as if nothing nearby were open, never returns one of the list's own, and its pharmacy is the next open one in the too-late card: with its straight-line distance, and "Reitti" without the walking figure beyond 3 km.
- Why: With real walking times the card could say "Et ehdi" about one pharmacy and put forward another that closes at the same minute. And with one open pharmacy nearby that can't be reached, the card ended in a warning and a call button while a 24-hour pharmacy stood a taxi ride away.
- Status: done. Not changed: the heading and the bar still count the closing one as open, because it is.

## 2026-11-24: The route line (M5)
- Where: `lib/map/style.ts` (two line layers on one source), `MapView`, `hooks/useRouteLine.ts`, `ResultsView` (`routeTo`); `/dev/map` shows an invented one
- Change: The walking route is drawn from the dot to the marker of the selected pharmacy: `#2F5CA6` 5.5 px on a white 10 px casing in the light theme, `#8BBAEC` 5 px on a 14 px blurred glow of the same colour in the dark one, at dusk and at night alike. It lies over the streets and roofs and under the labels, the signs and our own markers. The line is openrouteservice's, joined at both ends to the dot and to the marker by a straight piece.
  - Unasked it leads to the card's pharmacy, as on the Helsinki board, but only while that pharmacy is open and a walk reaches it in time. Selecting any of the list's ten draws its line, closed or not.
  - No line for the far open pharmacy, for one beyond 3 km, for a pharmacy picked from the map's signs, or when the list is by straight line.
  - It is asked for only once MapLibre is drawing, a quarter of a second after the selection settles, and once per pharmacy and position.
- Why: The board shows the line to the card's pharmacy in the first view. It is the card's "Reitti" made visible, so it follows the card's rule: no route to a closed door. The limits keep it to walks and inside the day's 2,000 routes. A line the map can't draw is not worth a request, and `/dev/states`, which calls no service and has no MapLibre, shows none.
- Status: done. For Janne's eye on `/dev/map` and on the phone: the glow's strength at night, and the straight pieces at the ends where the dot is far from a street.

## 2026-11-24: "Reitti" still opens the pharmacy sheet (M5)
- Where: the card, the phone's row
- Change: None to the button: it opens the sheet with the Google Maps and Apple Maps links, as decided on 22 Nov and left "to be revisited in M5". What M5 adds is the line on the map, drawn for the same pharmacy while the sheet is open and, for the card's own pharmacy, before it is asked for.
- Why: The line on our map shows where; turn-by-turn belongs to the map app, and there are still two of them.
- Status: done

## 2026-11-24: The pharmacy sheet's links (M5)
- Where: `PharmacySheet`, `osmNoteUrl`, `websiteHost` and `emailAddress` in `lib/maps.ts`
- Change: The facts list gets two rows when OpenStreetMap has them: "Sähköposti", a `mailto:` link showing the address, and "Verkkosivu", a link showing the host name without "www.". The footnote ends "Väärät tiedot? Korjaa OpenStreetMapissa.", a link to OpenStreetMap's note form with its marker on the pharmacy. Where the hours are missing, unreadable or uncertain the same link also stands under the status line.
  - An email link carries one address and nothing else: the first of the tag's values, and only when it is an address. A website is linked only when it is an `http` or `https` address with a host.
  - The links open in the same tab, like the route hand-off, and carry the pharmacy's position or nothing.
- Why: PLAN.md section 5. The email tag is free text in OpenStreetMap ("a@x.fi; b@x.fi", or an address with a query after it), and a `mailto:` built from it unchecked could pick up a subject or a second recipient.
  - A long address or host name breaks where it must, without the hyphen the Finnish hyphenation would put into it: an address is copied letter by letter.
- Status: done

## 2026-11-24: Too late to walk: the phone row's button is the call (provisional with the sheet)
- Where: `ResultsView`, the sheet's row
- Change: When the row says "Et ehdi ennen sulkemista", its button is "Soita" where the pharmacy has a number, and "Reitti" only where it has none.
- Why: The card takes "Reitti" away from a pharmacy one can't reach in time and keeps the call, which can ask them to wait. The row had the route button next to the warning.
- Status: provisional, as the row is

## 2026-11-24: The sheet's week: equal days as one line (M5)
- Where: `lib/week.ts`, `daysLabel` and `dayHoursText` in `lib/status.ts`, `PharmacySheet`
- Change: "Aukioloajat" lists the coming seven days from the tile's intervals, on the pharmacy's clock, with equal days grouped and named as a door sign names them, Monday first whatever day it is today: "Joka päivä 8.00–24.00"; "Ma–pe 8.00–21.00", "La 10.00–18.00", "Su suljettu". A day that differs stands apart: in Christmas week "Ma–to 8.00–21.00", "Pe–su suljettu".
  - An opening past midnight belongs to the day it begins on ("18.00–2.00") and is not said again the next morning. One that lasts for days is cut at midnight: "8.00–24.00", then "ympäri vuorokauden", then "0.00–8.00".
  - A day with a stretch the data calls unknown reads "ei tiedossa", never "suljettu". A day beyond the data's window is left out, so data three days old lists five days.
  - Nothing is listed for hours that are missing, unreadable or out of date: the status line already says which.
- Why: PLAN.md section 5, and the canvas's sheet. Grouped in week order because that is how hours are read; listed from today in order of date, a week that starts on a Thursday would name the weekdays twice ("to–pe", then "ma–ke"). What it can't say: whether a day that differs is a holiday or the ordinary rule. It shows the coming week as it will be.
- Status: done

## 2026-11-25: Medicine availability: one line, where the card already talks about stock (provisional)
- Where: the "Lähin auki nyt" card in all its forms, `PharmacySheet`, `MedicineLine` in `components/MedicineDialog.tsx`; `/dev/states`, "Proposals", current and proposed side by side
- Change: New, by Janne's scope change of 24 Nov 2026. "Etsitkö tiettyä lääkettä? Tarkista saatavuus" stands right under "Ei varastossa? Seuraava auki: …", in the card and in every pharmacy sheet: the second line of the same thought, starting where that text starts, with no rule between them. In a card without that line (nothing else open, or the prescription banner above it) it is the card's last section, under a hairline of its own. The words after the question are a text button in the link colour; pressed, it opens the medicine dialog (next entry).
  - Only where the pharmacy's country has a stock search of its own that the app may link to (PLAN.md 7.9). Elsewhere there is no line: Riga's views are as they were.
  - With out-of-date data, where a notice has the card's place, the line stands under the notice.
  - Nothing is asked before the line is pressed, and the first window is untouched.
- Why: The card and the sheet are where the app already says "Ei varastossa?". The question belongs next to that line, and "Reitti" opens the sheet, so everyone on their way to a pharmacy passes it. Next to that line it makes the card 28 px taller (measured at 390 and 1440 px). As a section of its own under a second hairline, which was the first try, it cost 53 px and read as a new subject; a field or a button would have cost three times that.
  - Seen, not changed: in the Helsinki fixture at the card's place on the phone, those 28 px put the nearest pharmacy's marker under the sheet's edge, so it gets its edge chip, which overlaps what is left of the marker. The fixture's map view is fixed; the live app frames the map for the sheet at its lowest. The overlap of a chip and its own half-hidden marker is older than this change.
  - Considered and not taken: a search field on the first window (questions on the first visit are on the rejected list); a fourth block button in the sheet (three are already there, and this is not what most people came for); the line at the end of the list (out of sight on the phone until the list is open and scrolled).
- Status: provisional, waiting for Janne: the placement, and the wording of both halves of the line

## 2026-11-25: The medicine dialog: where to check, never whether (provisional)
- Where: `MedicineDialog`, `lib/stock/providers.ts`, `medicine` in `lib/i18n/`; `/dev/states`, "Medicine availability"
- Change: A dialog of its own, "Tarkista lääkkeen saatavuus". Phone: the whole screen, like the counter card. Desktop: a card 520 px wide in the middle. From the top: one or two sentences naming the country's service and who runs it, and under them, smaller and quieter, what limits it (not every pharmacy takes part; the app is not in the Finnish App Store, with the date that was checked); the field "Lääkkeen nimi"; the service's own hint on what it searches by; the link as a primary block button named after where it leads ("Avaa apteekki.fi") with the leaving-the-app mark; two small lines, what is sent and to whom, and that the stock information is the service's own and worth confirming with the pharmacy.
  - The field is there only when the service's address can carry a name. For a service that takes none there is no field, and the small line says to type the name into the service's own search. The app does not ask for what it can't pass on.
  - The link opens in a tab of its own. Every other link in the app opens in the same tab (entry of 24 Nov, "The pharmacy sheet's links").
  - The keyboard's "go" follows the link.
  - No medicine is named in any text of the app, and the field has no placeholder.
  - Germany and Norway have no stock search across all pharmacies. Their dialogs say that first, then what the link leads to instead: a reservation service that under half of Germany's pharmacies have joined, and the Norwegian pharmacy association's page on how to check each chain.
  - Finland's hint says to type the name alone: Lääkehaku finds nothing for a name followed by a strength, or for the substance's name.
- Why: The app knows nothing about stock, so the dialog's job is to say who does, and to be exact about what happens to the name on the way. A dialog and not a section of the sheet: the sheet is already a screen tall, and the explanation needs five lines.
  - The whole screen on the phone because the keyboard comes up from below: a sheet anchored to the bottom would have its field and its link under it.
  - A tab of its own because this hand-off is a search the user comes back from: they look up which pharmacy has it, then return for the route and the hours, and the results should be as they left them. A route hand-off ends the visit; this one doesn't.
  - No example in the field: any product named there would read as a suggestion (CLAUDE.md, "No medical advice").
  - The button is named after the host, because that is what the address bar will show next, and it is the user's choice of who gets the name.
- Status: provisional, waiting for Janne: the tab of its own, the texts, and whether the dialog should name the pharmacy it was opened from

## 2026-11-25: A medicine's name stays on the device until the link is opened
- Where: the field in `MedicineDialog`, `medicineText` in `lib/stock/provider.ts`, PLAN.md 7.6, `tests/e2e/medicine.spec.ts`
- Change: The field is not in a form and has no `name`; its value lives in the open dialog's memory and is cleared when the dialog closes; `autocomplete`, `autocorrect`, `autocapitalize` and `spellcheck` are off. The name goes into the link's address as typed: trimmed, inner spaces single, control characters dropped, at most 80 characters. It is never lower-cased, corrected or looked up. The link has `rel="noopener noreferrer"`.
- Why: Janne's rule 4 of 24 Nov: a medicine's name is health information and never goes to our server. Each choice closes one way it could leak:
  - A form without an action submits to the page's own address, so a press of Enter before the scripts have loaded would have put the name into our server's log. Without a form there is nothing to submit.
  - With `autocomplete` on, the browser keeps the name and offers it to the next person who uses the device.
  - Chrome's and Edge's enhanced spell-check send what is typed to their makers, and a medicine's name is exactly the kind of word a spell-checker stops at.
  - Without `noopener` the service's tab could reach back into ours.
- Status: done. Not in our hands: the phone's own keyboard may learn the word, and the service sees the user's IP address with the name, as it would had they typed it there.

## 2026-11-25: Live stock: the seam, and what it would look like (example data, /dev/states only)
- Where: `StockProvider.stock` in `lib/stock/provider.ts`, `lib/fixtures/stock.ts`, `components/dev/StockExample.tsx`; `/dev/states/medicine-stock`
- Change: Not in the live app. In `/dev/states` the medicine dialog shows, under its link, what a provider with an agreed API could answer: the product as the service names it, "Tieto: apteekki.fi, klo 20.30", and one row per pharmacy on screen with the service's word for it: "Varastossa", "Vähän jäljellä", "Ei varastossa", "Ei tietoa", each with a mark of its own shape (full, half, ring, dashed ring). A dashed frame and the badge "Esimerkkiaineistoa" stand around it, and the last line says the figures are invented.
- Why: Janne's item 3: a clear seam, shown, never live. Even here the claim is the service's: its name and the time are part of every answer, and "Ei tietoa" is a level of its own, because a pharmacy the service has no line to is not a pharmacy that is out of stock. The marks differ in shape because status is never told by colour alone (PLAN.md section 9).
- Status: example only. To decide when a service agrees to an API: where the answer shows (in the dialog as here, or on the list's rows), and how the service's pharmacies are matched to OpenStreetMap's.

## 2026-11-25: Accessibility pass (M7): a control's name contains what it shows
- Where: `lib/travel.ts`, `components/Measure.tsx`, `lib/i18n/` (`card.routeLabel`, `card.directionsLabel`, `card.showAtCounterLabel`, `app.otherLanguageLabel`, `data.home`), `components/DataPage.tsx`
- Change: Found by axe (rule `label-content-name-mismatch`, WCAG 2.5.3 Label in Name, level A): 506 controls whose name did not contain the text on them. Their names now do:
  - A marker or an edge chip that shows "3 min" or "130 m" is named "…, 3 min kävellen" and "…, 130 m linnuntietä". Until now "…, 3 minuuttia kävellen".
  - A button that shows "Reitti": "Reitti kävellen: Kampin apteekki" (was "Kävelyreitti: Kampin apteekki"); English "Route on foot to …" and "Route to …" (were "Walking directions to …", "Directions to …").
  - "Näytä apteekissa": "Näytä apteekissa: apteekkikortti latviaksi" (was "Näytä apteekkikortti latviaksi").
  - The round language link that shows "EN": "EN: In English" (was "Vaihda kieli: English", Finnish words in a link marked as English). On the English page "FI: Suomeksi".
  - The wordmark on the data page, which is a link: the app's name as it shows, then ": takaisin apteekkihakuun".
- Why: Someone who uses the phone by voice says what they see on a control to press it, and the name is what the system listens for. A name that starts with the visible word also reads in the order the eye takes it.
  - The full words stay where text is read and is not a control's name: the rows of the list, the card and the announcement of the results still say "3 minuuttia kävellen". `travel()` gives both forms (`long` for a name, `spoken` for reading).
  - PLAN.md section 9 had "Walking directions to …" as its example of a specific name: updated.
- Status: done. For the VoiceOver pass: listen to a marker's name and hear how "3 min" and "130 m" are read in Finnish and in English.

## 2026-11-25: Accessibility pass (M7): the keyboard on the map
- Where: `components/MapView.tsx` (`focusIntoView`), `components/MapView.module.css`, `components/ResultsShell.tsx`
- Change: Found by the keyboard run (`tests/e2e/keyboard.spec.ts`), which asks that whatever has the focus can be seen:
  - With the phone's list open, the map under it is inert. Until now Tab went on from the list's last row to ten markers under the sheet.
  - A marker that takes the keyboard's focus where it can't be seen (under the bar or the sheet, under a chip or a control, beyond the map's edge) comes to the middle of the part of the map that shows. Only the keyboard's focus does this: a press selects the marker, and a selected one is framed already.
  - Where markers lie on one another, the one with the keyboard's focus is drawn in front.
  - The map is no longer something a browser can scroll (`overflow: clip`). Chromium scrolled the map's own box to a focused marker beyond its edge, and the zoom buttons and every marker went with it: the map stood 800 px to the left until the page was loaded again.
- Why: PLAN.md section 9, "nothing focused is ever off screen", held for the sheet and not for the map. The fixes are the smallest that make it hold: nothing is taken out of the tab order that can be seen, and nothing moves for a mouse or a finger.
- Status: done

## 2026-11-25: Accessibility pass (M7): 320 px, credit links, review sheets
- Where: `components/ResultsShell.module.css` (the phone's bar), `components/MapView.module.css` (`.attribution a`), `components/dev/Sheets.tsx`, `lib/dev/viewList.ts`
- Change:
  - At 320 px wide the two lines of the phone's bar wrap, and the bar grows by a line when it must. Found by the reflow run (`tests/e2e/reflow.spec.ts`): "Aukioloaikoja ei tiedetä", "Ei yhtään auki klo 23.40" and "Aukiolotiedot vanhentuneet" ended in an ellipsis there. From 360 px up nothing changes.
  - The map's credit links are 24 px tall to press and still 18 px tall to look at (WCAG 2.5.8).
  - The two review sheets of `/dev/states` have an `h1`. "Lähin auki nyt: the ehditkö cases" is now eight views of one card each: the card is a landmark with a name, and one page with eight of them had eight landmarks by one name (axe, `landmark-unique`). No page of the app has two.
- Why: 320 px is a small iPhone with Display Zoom on, and a desktop window at 400 %. An ellipsis there hid the one line that says whether anything is open.
- Status: done. Seen, not changed: a place name too long for the bar ends in an ellipsis at every width from 360 px up, as designed in M1 ("the name from the search, however long").

## 2026-11-25: Accessibility pass (M7): what axe still reports, and why it is left failing
- Where: `tests/e2e/axe.spec.ts`; the phone views `helsinki-half`, `riga-peek`, `riga-half`, `far-open-peek`, `far-open-half`, `nothing-open-half`, `stress-half`, `hours-half`
- Change: None. In these eight views axe reports `target-size` (WCAG 2.5.8) for 20 map markers: each lies partly under another control, the bar's buttons, the sheet's handle, an edge chip or the credit, so that less than 24 by 24 px of it can be pressed.
- Why: A marker stands where its pharmacy is, and the bar and the sheet lie over the map's edges: some marker is always half under one of them, on any map. The criterion excepts this twice: a target whose position is essential (its own example is pins on a map), and one whose function another control on the page offers at full size (every marker's pharmacy is a row of the list, which map.spec.ts holds). axe can know neither. Making a half-covered marker impossible to press would lose touches, which is what the phone test of 25 Nov was about.
  - By the night-run rule the test is not changed to pass: no rule is off and no view is left out, so these eight tests fail in CI.
- Status: superseded on 26 Nov 2026 ("A marker is a button only where a finger has room for it", at the end). No exception is recorded: the finding was right, and the markers changed.

## 2026-11-25: iOS (I1): the map with a sheet over it, in three places (provisional)
- Where: `ios/Auki/Views/ResultsView.swift`, `ResultsSheet.swift`
- Change: New: the canvas has no iOS board. The map fills the screen and a system sheet lies over its lower part, with the three places the web's phone sheet has: a row (the heading and the pharmacy that leads), half the screen (the card and the start of the list), the whole screen (the list). It can't be dismissed. The map stays usable behind it up to the half place, and what the sheet covers counts as off the map: framing, Apple's attribution and the map's own button stay above it.
  - The sheet's background is the palette's sheet colour, white by day and navy in the dark, not the system's glass.
  - The card has one button, "Näytä kartalla", because I1 has no route and no call: pressing it, or a row, frames the position and that pharmacy on the map and marks both.
  - A pharmacy picked on the map scrolls the list to its row. One picked in the list stays where it is.
- Why: The web's phone layout, in the system's own parts, so it feels native and reads the same. A list under a half-height map was the other option: simpler, and the map would have been a strip.
- Status: provisional, waiting for Janne: the layout of a main view on a new platform

## 2026-11-25: iOS (I1): the lit cross, the palette and the system typeface
- Where: `ios/Auki/Views/CrossGlyph.swift`, `ios/Auki/App/Palette.swift`
- Change: The status glyph is the web's path with the web's four shapes and stroke weights: filled and lit, amber with an outline, an unlit outline, a dashed outline; in the dark the open one glows. The colours are the tokens of `app/globals.css`, light and dark. The typeface is the system's (San Francisco), not the web's.
  - On the map a pharmacy is a disc with the glyph: green and filled when open, amber when it closes soon, a pale disc with the outline otherwise. No minutes in it: I1 has no walking times.
  - Apple's own points of interest are switched off on the map. Otherwise Apple's pharmacy signs would stand next to ours, with no status and from other data.
  - The glyph grows with the text size, and at the accessibility sizes the distance moves under the name so that neither is squeezed.
- Why: The lit cross is the one bold signal and has to be the same on both platforms. The system typeface is what makes an iOS app read as native, it follows the user's text size without work, and a second font file would have been the app's only asset to license. Propose-first by CLAUDE.md, since it is a typeface: this is the proposal.
- Status: provisional, waiting for Janne: the system typeface on iOS

## 2026-11-25: iOS (I1): the texts are the web's, and three are its own
- Where: `ios/Auki/Text/Texts.swift`, `ios/Auki.xcodeproj` (the location question)
- Change: Every line the web also has is worded as in `lib/i18n/`, Finnish first, then English. Three texts exist only here:
  - The system's location question: "Lähimpien apteekkien näyttämiseen. Sovellus ei lähetä sijaintiasi palvelimelleen eikä tallenna sitä." / "To show the pharmacies nearest to you. The app does not send your location to its server and does not save it."
  - Location denied: "Sijainti on estetty tältä sovellukselta" with "Voit sallia sen Asetuksista." and the button "Avaa Asetukset".
  - Offline: "Yritä uudelleen, kun yhteys palaa." in place of the web's "Haku jatkuu itsestään", because I1 does not retry by itself.
  - The first window keeps the web's "Sijaintiasi ei tallenneta."
  - With an approximate position (the user's own choice in the system's question) the sheet starts with the web's notice, "Sijaintisi on likimääräinen. Etäisyydet voivat heittää.", without the web's link to place search, which I1 doesn't have.
- Why: One voice on both platforms. The location question says what the app does and not more: it does not say the position never leaves the phone, because Apple's map is told which part of the map is on screen, as the map tile host is on the web.
- Status: provisional, waiting for Janne: the wording of the location question, which is a privacy statement

## 2026-11-25: The phone: a thumb's tap, and a map that can be dragged from anywhere on it
- Where: `MapView` (the markers' layer), `ResultsShell` (the sheet's drag, its handle, its row, the bar); `tests/e2e/touch.spec.ts`, `tests/e2e/sheet.spec.ts`
- Change: Janne's iPhone, 25 Nov: "sometimes a touch doesn't register". Found with real touch input in Chromium and with the browser's own hit test in WebKit, and each fixed:
  - A tap whose finger travelled 7 to 12 px is still a click by the browser's own rule, and the app threw it away as a drag at 6 px: on a marker, and on every button of the sheet below the open list, where the whole sheet is its own handle. A finger now has 12 px, and on the sheet only when the sheet ends where it began; a mouse keeps 6 px.
  - The credit line, 334 px of the screen's 390 and 22 px tall, lies right above the sheet, where a thumb starts a drag. It and the edge chips were outside the element MapLibre listens on: a drag that began on them moved nothing. They are now in the markers' layer, which is moved into that element.
  - The handle's invisible strip above the sheet's edge, 12 px tall for a 44 px target, was as wide as the screen: a drag that began there pulled the sheet. It is 88 px wide now, around the handle.
  - A tap on the sheet's row beside its button did nothing. It raises the sheet to the card. The handle stays the control with a name, for the keyboard and screen readers.
  - The 8 px gap between the bar's two controls took touches. It is the map's now.
- Why: Each of these was a touch that landed on the screen and did nothing. Not found: any listener of ours that isn't passive (MapLibre's own `touchmove` and `wheel` are, and have to be), or anything that runs per frame at rest (no frame was asked for in two seconds).
- Status: done. Not checkable here: how far a finger may travel on an iPhone before Safari stops calling it a tap. The app no longer has an opinion below 12 px.

## 2026-11-25: The pharmacy's details on the phone: a place card, not a modal
- Where: `ResultsView`, `ResultsShell`, `PharmacySheet`; `/dev/states`, "sheet", "walking-sheet" and the rest with a pharmacy open
- Change: By Janne's finding of 25 Nov (a 38 s recording: the details opened at full height, the map was gone, a drag down did not close them). They now take the list's place in the bottom sheet, as they always did in the desktop's panel, and are not a modal dialog any more.
  - The sheet opens at a middle height: down to the first route button, and never more than 60 % of the screen. Short details leave more of the map.
  - The map moves so that the pharmacy's marker is in view above the sheet, together with the dot.
  - A drag takes the sheet fully up, or down to the row, where the details close. The close button and Escape bring back what the sheet showed before: the row, the card, or the list where it was scrolled.
  - At the middle nothing in them scrolls. Fully up they scroll, and from their top a pull down takes the sheet down. The open list now does the same.
  - The handle reads "Näytä lisää" at the middle and "Näytä vähemmän" fully up.
  - Focus goes to the pharmacy's name when they open, and back to what opened them when they close: remembered by the app, because a dialog that is no modal is not handed focus back by the browser, and Safari gives a pressed button none to begin with.
- Why: Apple Maps' place card is what the hand expects of a sheet over a map. The map and the marker are half of the answer ("where is it?") and were hidden by the other half.
  - Not a modal, because a modal makes the map above it dead: a touch there would do nothing, or only close the sheet. The results sheet has never been one either.
  - The middle height follows the content, as the card's does, so that the route button is in view without a drag where it fits.
  - Considered and not taken: a fixed half screen (cuts the route button off on a pharmacy with many lines of hours); reordering the details so that the buttons come first (the canvas's order is name, status, facts, buttons, and this was a change of behaviour, not of layout).
- Status: done, by Janne's request. Provisional within it: the middle height's rule, and that the close button returns to the list while a drag down returns to the row.

## 2026-11-25: Markers from afar: one in full, the rest as the map's small signs
- Where: `lib/map/declutter.ts`, `MapMarker`, `MapView`; `/dev/map` with `?z=12`
- Change: By Janne's finding of 25 Nov (six or seven capsules on top of each other around Kamppi at zooms 12 to 14, covering the dot; at country zoom the nearest still large over southern Finland). On every frame the map now decides which markers are drawn in full:
  - In order: the selected pharmacy, the nearest open one, the other open ones from the nearest, then the rest. One that would overlap the dot or anything already placed is drawn as the small sign the map itself draws for the pharmacies beyond the list, in that layer's size for the zoom. It stays a button with the pharmacy's name.
  - The first is always in full while the map shows streets or a region, and stands just clear of the dot, the shorter way, when it would have covered it. The dot is never under a marker.
  - Below zoom 11 only the first is in full. Below zoom 8, a country, it is a sign too.
  - A sign needs 6 px more room to come back in full than it took to become one, so a slow pinch doesn't make it flicker.
- Why: A pile of capsules says less than one capsule and five signs. The signs are the map's existing second level, so nothing new had to be designed. Sizes are measured once per render; a pan or a pinch reads nothing from the page.
  - The app's own framings never go below zoom 8, so the answer is always in full in a view the app chose; only a pinch gets to where it is a sign.
  - Seen, not changed: a sign may lie partly under the first capsule after that has stepped off the dot.
- Status: done, by Janne's request. Provisional within it: the two zoom limits (11 and 8).

## 2026-11-25: The map draws two device pixels per CSS pixel, not three (provisional)
- Where: `MAP_PIXEL_RATIO` in `lib/map/camera.ts`, the `pixelRatio` MapLibre is made with; `/dev/map/…?px=3` shows it as it was
- Change: On a phone with three device pixels to one, the map's canvas is 780 px wide for 390, not 1170. The markers, the sheet and every text of the page are not the canvas and stay at the screen's own sharpness.
- Why: Janne's recording of 25 Nov: the map changed on 40 to 50 of 60 frames a second in pans and pinches, with single gaps of 50 to 65 ms. Measured here on real tiles in the live flow at Kamppi, CPU four times slower:
  - No frame had 50 ms of script in it, ours or MapLibre's (Chromium's long-animation-frame entries: none). Our own work is 0.7 ms a frame, a GPS fix costs 5.6 ms, and nothing runs per frame at rest.
  - What a frame costs is drawing, per pixel. The same pans and pinches on a 3x screen: a frame every 50 ms and 263 gaps over 50 ms before; every 33 ms and 63 gaps now.
  - That was a software renderer, not a phone's GPU: it shows where the cost is, not what the phone gains. The phone has to confirm it.
- Status: provisional, waiting for Janne's phone. If the map looks soft at rest, the next step is three at rest and two while it moves.

## 2026-11-25: The phone's screen edges: the scene's own colours behind the status bar and the browser's bar
- Where: `DuskScene` (first window, place search), `MapView` and `ResultsShell` (map views); checked in the iOS 27.2 Simulator's Safari
- Change: Janne's iPhone, 25 Nov: dark bands above and below the first window. With test pages in the Simulator: Safari colours both strips from the body's background, unless something fixed lies at that edge of the page and is at least 6 px tall, whose colour then wins. `theme-color` is not read.
  - The dusk scenes pin the sky's upper colour to the top edge and the street's to the bottom, 8 px each and the colour of what is already there, and the body behind them is the street's colour. `theme-color` follows the sky's upper colour while a scene shows, for browsers that still go by it.
  - The map views pin the map's ground colour to the top, and the body behind them is the sheet's colour.
  - Neither is pulled past its ends (`overscroll-behavior`): above the sky there is no more sky.
- Why: One picture from edge to edge, at every sky. Before: `#071427` above a sky of `#143266` and under a street of `#0b1b31`. After: the strip and the page's first row are the same colour at night, at golden hour and by day, and so are the last row and the lower strip.
- Status: done. The 8 px strips can't be seen on the page; if a later Safari reads the edges some other way, they are the thing to revisit.

## 2026-11-26: A marker is a button only where a finger has room for it
- Where: `lib/map/declutter.ts` (`declutter`'s `away`, `crowded`, `hasRoom`), `place()` in `components/MapView.tsx`, `spread` in `lib/map/camera.ts`; the phone views `riga-peek`, `riga-half`, `helsinki-half`, `far-open-peek`, `far-open-half`, `nothing-open-half`, `stress-half`, `hours-half`, `sheet-far`, `sheet-sparse`, `walking-sheet-unknown`
- Change: axe's `target-size` (WCAG 2.5.8) failed on map markers in eight phone views on 25 Nov, and in twelve views once the small signs of the iPhone findings were in: a strip of 44 by 1 px of a marker above the sheet, half a marker under the bar with its own chip lying on it, a disc cut by the screen's edge, signs four pixels apart. A marker still stands where its pharmacy is. What changed is which markers are offered to press, worked out by the same pure code that decides full or sign, on every frame:
  - The bar, the sheet, the credit or the map's edge leaves less than 24 by 24 px of its button, or hides more of what is drawn of it than its outer quarter: it is not drawn. Its pharmacy is in the list. An open one gets its edge chip, and a chip comes only then: a pharmacy is on the map as its marker or as its chip, never as both. Before, the chip came 40 px before the sheet reached the marker, and lay on it.
  - The quarter came from looking at the first version, which went by the 24 px alone: in `walking-half` the open pharmacy's capsule stood with its lower half under the sheet, 28 px of its button free, and its chip gone. A capsule is 30 px tall with its time in the middle 15; what is hidden beyond its padding is the text.
  - An edge chip, a zoom button or the markers that matter more leave it no room: it is drawn where it is and is no button (`inert`: no press, no focus, passed by a screen reader), like the signs the map itself draws for the pharmacies beyond the list. Capsules and discs come before signs, each kind in the order that decides full or sign, and one is a button only if that takes the room of none before it. A press on a pile goes to the sign on top.
  - A chip that would take the room of the answer's marker moves on along its edge.
  - The marker the keyboard is on stays as it is until the keyboard has left it.
  - With the phone's list fully open the map is inert and a strip of it shows above the list: no chip is drawn there, where its upper edge used to show. And no chip is given where the map can't hold one whole.
  - The map asks for 25 px where the criterion asks for 24. It counts in whole pixels and a browser lays out in fractions; the first failures showed only in CI's Linux, by a few pixels.
- Why: The finding was right: half a marker under the sheet is nothing a finger can aim at, and a sliver that opens a pharmacy is how the wrong one gets opened. The exception WCAG allows for pins on a map would have recorded the problem, not removed it. Nothing is lost that could be used: every pharmacy is a row of the list, an open one off the map has its chip, and a sign in a pile becomes a button as soon as a pinch gives it room.
  - Considered and dropped: hiding the signs of a pile that have no room. Nine pharmacies in seventy pixels would have shown as three, and the map's own layer of signs beyond the list would have gone on showing all of its own.
  - Considered and dropped: moving chips off every marker. A chip would walk the edge away from the line to its pharmacy; only the answer's marker is worth that.
  - Seen, not changed: a marker that stands whole above the sheet can lie partly under the credit line (`helsinki-half`). It has its room above it.
  - Seen, not changed: the phone's bar is counted as the strip down to 64 px, as the camera's framing counts it. A phone that lays the bar lower (a safe area at the top) would need that number measured.
- Status: done. It changes the look of the phone views named above, where a half-covered marker is gone or a chip is gone from a marker that shows; the baselines are new.

## 2026-11-26: The map under a finger: the glide after a flick, and which way one finger zooms (provisional)
- Where: `lib/map/glide.ts`, the map's making in `components/MapView.tsx`; `/dev/map/…?touch=maplibre` shows it as it was; `node scripts/map-feel.ts` measures both
- Change: By Janne's note of 25 Nov: the map's feel, close to Apple Maps on an iPhone. Each gesture on his list was tried with real touches in Chromium, the CPU four times slower. A pinch keeps the place between the fingers where it is, two taps come closer, a tap with two fingers goes back out, and the page never scrolls or zooms: those were as they should be, and each has its test now. Two were not:
  - **After a flick** MapLibre's own glide starts at about half the finger's speed, which shows as a hitch at letting go, and is over within half a second. The map now leaves at the finger's speed and loses the same share of it every millisecond: 0.998, the rate of a list on an iPhone, which MapLibre's own maps on iOS use too. Measured on `/dev/map`, two runs as MapLibre has it and three as it is now, how far the map went on after the finger lifted: 14 to 19 px and 240 to 296 px after a slow flick, 58 to 102 px and 558 to 617 px at 1,000 to 1,400 px/s, 86 to 221 px and 912 to 1,213 px at about 2,000 px/s; at rest after 0.2 to 0.7 s before and 1.8 to 2.6 s now.
  - The finger's speed is that of its last tenth of a second of movement, read from the touches themselves, their own places and times, as a touch screen itself reckons a flick. What the map has drawn meanwhile is not asked: a device that draws slowly would otherwise seem to have a slow finger. The gap between the last movement and the lifting is not counted in; a finger that had held still for more than 70 ms before lifting has stopped, and nothing glides.
  - The glide begins as far into itself as the map stood still between the finger's last frame and its own first one, so that the map is where it would have been. A finger laid on the gliding map stops it there. Slower than 100 px/s at lifting there is no glide, and none is longer than that of 3,200 px/s.
  - Only for one finger: after a pinch the map ends as MapLibre ends it, a mouse keeps MapLibre's short glide, and whoever has asked the device for less motion gets none.
  - **Two taps and a drag** zoomed in when the finger went down. Apple's guide to Maps on an iPhone says up to zoom in and down to zoom out, and so it is now. MapLibre has no setting for the direction; its handler takes a rate, and the rate has the other sign. That handler is not part of MapLibre's public face: if it is renamed the direction goes back, and `tests/e2e/touch.spec.ts` fails.
- Why: A map that stops dead under a thumb feels broken on a phone, and one that zooms the wrong way is unlearned every time. The numbers of a list are the ones a thumb already knows.
  - Frames while the map moves are as even as before: one every 27 to 33 ms on a software renderer with the CPU four times slower, at most one over 50 ms in a flick, with either glide. A longer glide costs more frames, not slower ones.
  - Tiles around the view are not fetched ahead. A flick brought two or three new map squares into view, the last of them there 0.4 to 1.3 s after the finger lifted, later the faster the flick. Fetching the squares next to the view beforehand would close that, and would tell the map tile host more than "which map squares are on screen" (PLAN.md 7.6): that is a change to what the app says it sends, and Janne's to decide.
- Status: provisional, waiting for Janne's phone. The rate (0.998), the slowest flick that glides (100 px/s) and the fastest that counts (3,200 px/s) are the three numbers to turn if it feels wrong.
  - In tests a flick is all of its touches sent at once: on any machine that is the fastest flick the map counts, and the tests hold the glide of that one. A flick with a speed of its own can't be sent from a test: a touch bears the time it was sent at, and sent one by one a step takes thirty milliseconds here and over a hundred in CI, which the map rightly takes for a finger that stops and starts. Chromium's own synthesized flick is truer, and `scripts/map-feel.ts` measures with it on a Mac, but in CI's Linux it moved nothing. CI also draws a gliding map only every few tenths of a second, so the test holds each drawn frame to the list's curve at that frame's own time. Three failed CI runs went into finding this out; the second of them is what moved the app's reckoning from frames to touches.

## 2026-11-25: iOS: a pharmacy's sheet over the results, as a place card in Apple's Maps (provisional)
- Where: `ios/Auki/Views/PharmacySheet.swift`, `ResultsView.swift`; `design/ios-basics/`
- Change: New, by Janne's brief of 25 Nov 2026 (the iOS app's missing basics: a pharmacy sheet with the opening hours, a call button and an Apple Maps route) and his note of the same day on how the web's pharmacy sheet should behave. A press on a row, on the card's "Reitti" or on a marker opens a sheet of the pharmacy's own, lying over the results.
  - It opens at half the screen. The map shows above it and can still be used, and it moves to hold the picked marker and the dot in the part that shows.
  - A pull down closes it, and so does its close button. The results are under it as they were.
  - A finger on its content moves the sheet first: the content scrolls only once the sheet is fully up. This is the system's own behaviour for a sheet with two heights, asked for by name so that it stays.
  - Results that were fully open step down to half the screen when a pharmacy is picked, so they don't stand taller than the sheet over them.
  - Another marker pressed while the sheet is up changes the pharmacy in it. The sheet stays where it is.
  - Closing it clears the pick: no marker stays marked. In I1 the last pick stayed marked.
- Why: A sheet that opened fully up would hide the one thing a pick on a map is for, which is seeing where the pharmacy is. A sheet of its own, and not the details in the list's place inside the results' sheet (the web's desktop way): only a sheet of its own can be closed with a pull down, and the list is still there, at its place, when it goes.
- Status: provisional, waiting for Janne: a new view on iOS. Tried with real touches in the Simulator (seven tests, `ios/README.md`), not on a phone.

## 2026-11-25: iOS: in a pharmacy's sheet the buttons stand before the facts (provisional)
- Where: `ios/Auki/Views/PharmacySheet.swift`; `design/ios-basics/light.jpg`
- Change: From the top: the glyph, the name and the address, with the close button; the status with the distance beside it; "Reitti Apple Kartoissa" as the primary button, the whole width, with the walking mark and the mark for leaving the app; under it "Soita" and "Näytä kartalla" side by side; then what OpenStreetMap knows (Aukioloajat, Esteettömyys, Puhelin, Sähköposti, Verkkosivu) between two hairlines; and the web's footnote, with "Korjaa OpenStreetMapissa" as a link. On the web and on the canvas the facts come first and the buttons after them.
  - The week's hours are grouped as on the web: "Ma–pe 8.00–21.00", "La 10.00–16.00", "Su suljettu". Hours that are not times are shown as OpenStreetMap writes them.
  - Without a phone number there is no "Soita", and "Näytä kartalla" has the row.
  - With the largest text sizes the two lower buttons stand one under the other, the distance goes under the status, and each fact's label stands above its value.
  - A long email address breaks after its at sign or before a dot. The system put a hyphen into one, which read as part of the address.
  - Hours missing or unreadable: "Korjaa OpenStreetMapissa" stands right under the status, as on the web.
- Why: The sheet opens at half the screen. There is room for about five lines under the name, and on a phone in the street those are the route and the call: with the facts first, the route button was under the screen's edge at the height the sheet opens at. The hours start right under the buttons and are one pull away.
  - "Näytä kartalla" is kept here, not on the card: fully up, the sheet covers the map, and the button brings it down to half and the map back to the pharmacy. With VoiceOver it is the way back to the map without dragging a sheet.
  - No button for Google Maps: the brief asks for Apple Maps, which every iPhone has. To decide.
  - Not here yet: "Ei varastossa? Seuraava auki", the medicine line, the counter card.
- Status: provisional, waiting for Janne: the order departs from the canvas's sheet

## 2026-11-25: iOS: the card's buttons are the web's, "Reitti" and "Soita" (provisional)
- Where: the card in `ios/Auki/Views/ResultsSheet.swift`
- Change: In place of I1's one button, "Näytä kartalla". "Reitti" is the primary button, with the walking mark within three kilometres, and opens the pharmacy's sheet, as on the web. "Soita" stands beside it where OpenStreetMap has a number. A pharmacy that is not open, the one that opens first, has "Näytä tiedot" in place of "Reitti". A row's hint for VoiceOver is "Näytä tiedot".
- Why: One voice on both platforms, now that the route and the call exist. "Reitti" opens the sheet and not Apple Maps at once: the sheet says where the link leads and what it carries before the app is left, and the map moves to the pharmacy on the way. No route to a closed door: what is worth opening there is its hours.
  - To decide: whether on iOS, where there is one map app to hand off to, the card's "Reitti" should start the route at once.
- Status: provisional, waiting for Janne: changes the card of I1, which was provisional itself

## 2026-11-25: iOS: the route is a link that carries only the pharmacy's position
- Where: `ios/Auki/Core/Handoff.swift`, the route button of the pharmacy's sheet
- Change: The button opens `https://maps.apple.com/?daddr=<latitude>,<longitude>&dirflg=w`, the link the web app makes, through the system. Beyond three kilometres in a straight line it has no `dirflg`, and Apple Maps picks how to get there. It is not MapKit's own hand-off (`MKMapItem.openInMaps`).
- Why: The sheet says "linkissä on vain apteekin sijainti", and with a link that is true to the letter and can be tested: a unit test reads the link and finds the destination and the way of travel in it, nothing else. One rule and one test case for both apps (PLAN.md 7.6).
  - MapKit's hand-off would also need two ways of making its map item: the one that iOS 17 knows is deprecated from iOS 26 on.
  - What it costs: Apple Maps names the destination by its address or as a dropped pin, not by the pharmacy's name.
  - The button was not pressed in the Simulator: Apple's Maps app, once opened there, puts its own questions over every later screenshot (`ios/README.md`). It has to be tried on a phone.
- Status: done. The hand-off itself is not yet tried on a real iPhone.


## 2026-11-26: The first window is for a first visit, and links that leave the app open in a tab of their own
- Where: `lib/geolocation.ts` (`locatesOnArrival`, `rememberLocated`), `hooks/usePharmacySearch.ts`; `components/NewTab.tsx` and every link to another site; `tests/e2e/flow.spec.ts`
- Change: Janne's decision of 26 Nov. Two things that sent people back to the start:
  - **The first window came on every visit in Safari.** The app went straight to the map only where the browser said permission was given, and Safari says "prompt" for a site it lets through. After the first "Näytä apteekit lähelläni" that brings a position the app now leaves a mark of its own on the device, and a later visit asks for the position on arrival: the window opens on its status line and gives way to the map. The browser then asks or doesn't, as it sees fit.
  - **A hand-off took the tab.** The route in a map app, a pharmacy's website, the note form, a source and the map's credits opened in the app's own tab, and coming back began from the first window. They open in a tab of their own now, as the medicine search already did.
- Why: The window is an introduction, and a person needs it once. And the answer someone left for a map app should be there when they come back.
  - The mark is `located-before` in the browser's local storage: one character, no position, no time. It is the first thing the app keeps on the device, so PLAN.md 7.6 and the README say so, and a browser test reads the whole of the storage after a search and finds that mark alone.
  - Only a position that came leaves it. Someone who refused, or searched by a place name, has not asked for this, and gets the window again.
  - A browser that says the site is blocked is believed, and the window keeps its button: asking would fail at once and land the person on the place search with an error they did not cause today.
  - Considered and dropped: leaving the mark when the button is pressed. A person who then refuses would be asked again on every visit.
  - A link that opens a new tab says so to a screen reader, after its own words, so its name still begins with what it shows (WCAG 2.5.3): "Reitti Google Mapsissa (avautuu uuteen välilehteen)". Nothing changes for the eye: the buttons already carry the mark of a link that leaves the app, and the text links name where they lead.
  - Phone numbers and email addresses open as before: they are not pages, and a new tab for them would be an empty one.
- Status: done. Not tried on a real iPhone: whether Safari asks again on a later visit is Safari's to decide, and the app can't see it.
  - The other half of Janne's note, the last results coming back from the tab's own storage after a reload, is a pull request of its own: it keeps the position in the tab, which changes what the footer's "Sijaintiasi ei tallenneta." may say.

## 2026-11-26: A tab that is loaded again shows the results it had, and what that does to the footer's sentence (provisional)
- Where: `lib/session.ts`, `hooks/usePharmacySearch.ts` (the arrival, the search, what is kept and forgotten), `components/MapStage.tsx` (the open pharmacy); `lib/i18n/` (`footer.privacy`, `meta.description`); `tests/e2e/session.spec.ts`
- Change: The other half of Janne's note of 26 Nov: "the last results come back from sessionStorage". The tab keeps its last search in its own session storage and, loaded again, goes straight to those results: the same order, the same pharmacy's details open, no question about the position and no second request for walking times.
  - Kept: the position the search was made for, the time it was fixed, the walking times that came, and the id of the pharmacy whose details are open. Not the pharmacies: they are read again from the tiles, so a status is never older than the minute the tab came back.
  - Half an hour, counted from the position, not from the last load: after that the tab locates again. A position from the device is followed as before, and the list is ranked again at the first fix far enough from the old one, without the two-minute wait that follows a fresh ranking.
  - Forgotten when the user leaves the results: back to the first window, the search box, a new position. Never kept for a search that found nothing.
  - What comes out of storage is read as untrusted text, field by field. A tab can't be made to show a place or a time that is not one.
- Why: Links out open in a tab of their own since today, which covers coming back while the tab is alive. A phone that is short of memory throws the tab away meanwhile, and then the answer someone walked off with was gone. The same held for a change of language.
  - **It keeps a position on the device, which the app has not done until now.** Results can't come back without the position they were ranked from: the distances alone would give it away as well. So `PLAN.md` 7.6 now names the two keys and what is in them, and the README says the same.
  - **The footer's sentence.** "Sijaintiasi ei tallenneta." / "Your location is not saved." is no longer true as written once a tab keeps the position. This branch says "Sijaintiasi ei tallenneta palvelimelle." / "Your location is not saved on a server.", and the page's description with it. That is the smallest change that makes it true, and it is weaker than before: it reads as if the position were saved somewhere else, which it now is.
  - Other wordings considered: "Sijaintiasi käytetään vain tähän hakuun." (says less, promises nothing about keeping); "Sijaintiasi ei tallenneta palvelimelle. Välilehti muistaa viimeisen haun, kunnes suljet sen." (the whole truth, and long for a line that is meant to be quiet).
  - The other way out: keep the old sentence and don't keep the position. A tab that is loaded again then locates anew, as a later visit does since today: the results come back a second or two later, Safari may ask again, and the walking times are asked for again.
  - The iOS app keeps nothing and its sentence stays as it was.
- Status: provisional, and not merged: the privacy claims are Janne's (`CLAUDE.md`). The pull request waits for his word on the sentence.
