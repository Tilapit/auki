# Design files

From the Claude Design canvas "Auki: nettisivujen design", 22 Nov 2026. This is the approved direction for v1, not a pixel spec: `CLAUDE.md` says what can be refined. Reference only; the app never imports anything from this folder.

- `png/`: the v1 boards rendered from the source files at 2x, one per board, named after the board file (`Main.png`). The closest thing to the target look.
- `canvas/`: the v1 boards as Claude Design source files. Inline styles carry exact sizes, colours and copy. Don't copy the markup: `<x-dc>`, `{{...}}`, `sc-for` and `sc-if` belong to the canvas runtime, and image URLs starting with `/_blob/` only load on the canvas. The map images on the boards were rendered from OpenStreetMap data for the mockups; the app draws its map with MapLibre (PLAN.md section 6). `canvas.json` has the board order and sizes, plus the notes written on the canvas (in Finnish).
- `later/`: concepts for after v1. Don't build them.
- `skyline.svg`: the first-visit illustration. The app draws the same geometry as an inline SVG (`components/Skyline.tsx`), so its colours can follow the sky.

## v1 boards (`canvas/`)

| File | Board | Shows |
|---|---|---|
| `Start.dc.html` | Aloitus, desktop | First visit: dusk scene, headline, location button, place search |
| `Welcome.dc.html` | Ensimmäinen käynti, phone | The same on a phone, actions in the dark band at the bottom |
| `PlaceSearch.dc.html` | Haku ilman sijaintia, phone | Place search, with the note shown when location is blocked |
| `MapFirst.dc.html` | Kartta ensin, phone | Full-screen map with the collapsed "Lähin auki nyt" peek |
| `Main.dc.html` | Helsinki, to 20.41, desktop, light | List panel and map, card with the ehditkö timeline |
| `MobileHelsinki.dc.html` | Helsinki, to 20.41, phone | The card with the timeline, and the list |
| `Riga.dc.html` | Riika, pe 23.40, desktop, dark | Night: one 24 h pharmacy lit, closed ones collapsed, "Resepti Suomesta?", edge chip |
| `MobileRiga.dc.html` | Riika, pe 23.40, phone, dark | The same on a phone |
| `PharmacyMenu.dc.html` | Apteekin valikko, phone | Pharmacy sheet with the Google Maps and Apple Maps hand-off |
| `Counter.dc.html` | Apteekkikortti, phone | Counter card in Latvian with English below, marked as an unreviewed translation |

`PharmacyMenu` also shows a link to reviews and photos in Google Maps. That link is planned for later, not v1.

## Later (`later/`)

| File | Board | Shows |
|---|---|---|
| `PharmacyAbroad.dc.html` | Apteekki ulkomailla | Per-pharmacy "Does a Finnish e-prescription work here?" |
| `Rate.dc.html` | Kerro käynnistä | Visit report with "Ohita" always visible |
| `GuideDE.dc.html` | Maaopas: Saksa | Country guide with the doctor's-email message |

Sample data: OpenStreetMap, fetched 19 Nov 2026. Times are simulated (Helsinki on a Thursday at 20:41, Riga on a Friday at 23:40). Pharmacy names are examples only.

## The phone, 24 Nov 2026 (`phone/`)

Screenshots for the pull request "The map and the sheet on the phone": the sheet's three places against the old collapsed sheet (`sheet.jpg`, `sheet-cases.jpg`, from `/dev/states`), and the real app in Helsinki with every pharmacy on the map (`map.jpg`, `desktop.jpg`: real map tiles, OpenStreetMap's pharmacies of 23 Nov, the clock set to Tuesday at 14.00 and at 20.41).

## M5, 24 Nov 2026 (`m5/`)

Screenshots for the pull request "M5: walking times, ehditkö and the route line". From `/dev/states`, built from tile data with walking times through the live code: the row, the card with the timeline, the list in walking order, too late with the next open one (`walking.jpg`), the same in dark and the pharmacy sheet with its links (`dark-and-sheet.jpg`), and two desktop cases (`desktop.jpg`). From `/dev/map`, on real map tiles: the route line by day, at dusk and at night (`route-desktop.jpg`, `route-phone.jpg`). The route in these is invented, two corners between the dot and the marker: there was no openrouteservice key on the day.

## M7, the accessibility pass, 25 Nov 2026 (`m7/`)

Screenshots for the pull request "M7". From `/dev/states`, in Chromium. The phone's bar at 320 px wide, before and after its two lines were allowed to wrap, in three views and both themes (`bar-320.jpg`; "before" is the old rule put back by a style sheet on the same build). The keyboard on the map at the desktop size: Tab to a marker beyond the map's edge, where Chromium used to scroll the whole map out of place, and the same press now; and a marker in focus drawn in front of those that lie on it (`keyboard-desktop.jpg`). On the phone, a marker that was under the sheet when Tab came to it (`keyboard-phone.jpg`). The review sheets with their heading, and two of the eight card cases, one to a page (`review-sheets.jpg`).

Added on 26 Nov: the map's markers before and after a marker became a button only where a finger has room for it, in four phone views, light and dark (`markers.jpg`, `markers-dark.jpg`). These are CI's own baseline images at 1×, before and after, cut to the map. The two keyboard images are of 25 Nov: since the 26th a marker beyond the map's edge or under the sheet is not drawn and takes no focus, so the upper half of `keyboard-desktop.jpg` and all of `keyboard-phone.jpg` show a state that is no longer reached. The lower half of `keyboard-desktop.jpg`, the marker in focus in front of those that lie on it, still holds.

## Medicine availability, 25 Nov 2026 (`medicine/`)

Screenshots for the pull request "Medicine availability: a hand-off to each country's own stock search". All from `/dev/states`: the card without and with the line, the pharmacy sheet with it, and the line under the out-of-date notice (`line.jpg`); Finland's dialog empty, with an invented name typed, and in dark, with the card in dark (`dialog.jpg`); Germany, Austria, Norway and Sweden, the last of which is not in the live app (`countries.jpg`); the dialog on the desktop in both themes (`desktop.jpg`); and the seam for live stock on example data, labelled as such (`stock.jpg`). No medicine is named: "Esimerkkivalmiste" is an invented name.

## The iOS app, I1, 25 Nov 2026 (`ios-i1/`)

Screenshots for the pull request "I1: the iOS app". From the iOS Simulator (iPhone 17, iOS 27.2), with a position set in Kamppi, Helsinki, and the real pharmacies of the data host as fetched from OpenStreetMap on 24 Nov. The app's clock was set with its debug launch argument: Wednesday 25 Nov at 20.41, and the night after at 2.30. The first window, the results, a pharmacy picked with the sheet at its lowest place, and the list (`light.jpg`); the same in the dark, with the night when nothing nearby is open (`dark.jpg`); that night by day, English, location denied, and the largest text size (`states.jpg`); and the system's location question with the app's sentence in it (`question.jpg`). The map under the markers is Apple's.

## The iPhone findings, 25 Nov 2026 (`iphone/`)

Screenshots for the pull request "The iPhone findings of 25 Nov". The pharmacy's details in the phone's sheet at their middle height and fully up, from `/dev/states`, and once in Safari itself (`sheet.jpg`). The live flow at an invented position in Kamppi with the real pharmacies of the data host, zoomed out step by step, production before and this branch after; the last one is the fixture at country zoom (`markers.jpg`). From the iOS 27.2 Simulator's Safari (iPhone 18 Pro): the first window with the strips behind the status bar and behind Safari's own bar, production before and this branch after at four skies (`edges.jpg`), and the same for a map view on real map tiles (`edges-map.jpg`).

## The iOS app's basics, 25 Nov 2026 (`ios-basics/`)

Screenshots for the pull request "The iOS app's basics: a pharmacy's sheet with its hours, the call and the route". From the iOS Simulator (iPhone 17, iOS 27.2), with a position set in Kamppi, Helsinki, the real pharmacies of the data host as fetched from OpenStreetMap on 25 Nov, and the app's clock set to Wednesday 25 Nov at 20.41. The results with the card's new buttons, a pharmacy's sheet at half the screen with its marker above it, the same sheet fully up, and a pharmacy without a name, hours or a phone number (`light.jpg`); the same in the dark, with a closed pharmacy last (`dark.jpg`); English at half the screen and fully up, and the largest text size at both heights (`states.jpg`). What the sheets say of each pharmacy is OpenStreetMap's, as it is written there: the note on the ramp is a mapper's own words. The map under the markers is Apple's.

## The pharmacy sheet's rows and figures, 26 Nov 2026 (`sheet-rows/`)

Screenshots for the pull request "The pharmacy sheet: the medicine search as a row of its own, and the typeface's ordinary figures". From `/dev/states`: the card with the medicine row as its last section (`card.jpg`); a pharmacy's details on the desktop (`sheet-desktop.jpg`) and on the phone in both themes (`sheet-phone.jpg`, `sheet-phone-dark.jpg`), with the row under "Ei varastossa?" and the hours, the phone number and the distance in the typeface's proportional figures. `figures.png` is the typeface's two sets of figures side by side, set from the font file the app serves: the zero has its slash in both.

## M6, cut down, 25 Nov 2026 (`m6/`)

Screenshots for the pull request "M6, cut down: the abroad banner with the field result, and the counter card". From `/dev/states`: the Riga results with the banner in the card, and the counter card in Latvian (e-prescription and paper), in German where a Finnish e-prescription can't be used, and in English for Malta (`cards.jpg`); and every country's banner with its counter card's lines as text, the review page in three columns (`abroad.jpg`).

## Prescriptions for any pair of countries, 26 Nov 2026 (`prescriptions/`)

Screenshots for the pull request "Prescription from home?: for anyone, in any covered country". The banner as the phone's card shows it, from `/dev/states`: a prescription from Finland in Latvia (`fi-lv.jpg`); one from Germany in Latvia, where the electronic prescription is on no list and the trip's line is labelled as Finnish (`de-lv.jpg`); one from Estonia in Finland with "Lisätiedot ja lähteet" open, cut where the phone's sheet ends (`ee-fi.jpg`); a phone that suggests no country, in English and in the dark (`ask-en.jpg`). The counter card in Finnish for a visitor with an e-prescription from Estonia (`card-fi.jpg`).

## The system typeface, 27 Nov 2026 (`system-font/`)

Before and after for the pull request "The typeface is the device's own", from `/dev/states` in Chromium on a Mac, where the system's typeface is SF Pro as on an iPhone: a pharmacy's details (`sheet.jpg`), the card (`card.jpg`), the desktop in both themes (`desktop-light.jpg`, `desktop-dark.jpg`), the first window and the counter card (`first-and-counter.jpg`), and the map's street names on real tiles (`map.jpg`, from `/dev/map`).

## The sheet's and the card's hierarchy, 27 Nov 2026 (`sheet-hierarchy/`)

Before and after for the pull request "A clearer pharmacy sheet and card", in Chromium on a Mac: a pharmacy's details as they open on the phone (`details-middle.jpg`) and fully up (`details-full.jpg`, from the comparison views of `/dev/states`), the card (`card.jpg`), the details in the desktop's panel (`desktop-light.jpg`, `desktop-dark.jpg`), and the dark sheet against the real map at night and at dusk (`surface.jpg`, from `/dev/map`).
