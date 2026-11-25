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

## The iOS app, I1, 25 Nov 2026 (`ios-i1/`)

Screenshots for the pull request "I1: the iOS app". From the iOS Simulator (iPhone 17, iOS 27.2), with a position set in Kamppi, Helsinki, and the real pharmacies of the data host as fetched from OpenStreetMap on 24 Nov. The app's clock was set with its debug launch argument: Wednesday 25 Nov at 20.41, and the night after at 2.30. The first window, the results, a pharmacy picked with the sheet at its lowest place, and the list (`light.jpg`); the same in the dark, with the night when nothing nearby is open (`dark.jpg`); that night by day, English, location denied, and the largest text size (`states.jpg`). The map under the markers is Apple's.

