# The iOS app (I1)

A small native client of the same data as the web app: a SwiftUI list and an Apple map, on the tiles and `index.json` the nightly pipeline publishes, with open or closed worked out from the tiles' intervals. PLAN.md section 11 calls this I1.

`docs/tiles.md` is the contract, and `tests/vectors/` holds the cases the web and this app must agree on. No third-party packages.

## What is here

```
ios/
  Auki.xcodeproj            one app target, one test target, one shared scheme ("Auki")
  Brand.xcconfig            the product's name and the app's identifier, in one place
  Info.plist                the app's two languages; the rest of its Info.plist comes from build settings
  Auki/
    App/                    the entry, the palette (the web's tokens), the clock, the few numbers
    Core/                   the tile contract and the time logic, pure:
                            Tiles, TileFile, Search, HoursStatus, Zone, Geo, Ehditko
    Data/                   TileStore (the data host), Locator (the device's position, once)
    Model/                  SearchModel (the one flow), Listing (what leads at a given moment)
    Text/                   Texts (every string, Finnish and English side by side), Format
    Views/                  the first window, the results (map and sheet), the problem view
    Resources/              the icon, the accent colour, the location question in English
  AukiTests/                the tests
```

New files in `Auki/` and `AukiTests/` belong to their target without a change to the project file: both are folders Xcode keeps in step with the disk.

## Run it in the Simulator

1. Open `ios/Auki.xcodeproj` in Xcode.
2. Pick an iPhone simulator at the top of the window and press Run (⌘R).
3. Give the simulator a place: in the Simulator app, Features → Location → Custom Location…, for example 60.1689 and 24.9316 (Kamppi, Helsinki).
4. Press "Näytä apteekit lähelläni" and allow the location.

The first time a new simulator shows a map it draws a plain grid for a few minutes: the simulator is downloading Apple's map styles. The pharmacies are there at once.

## Tests

```
xcodebuild test -project ios/Auki.xcodeproj -scheme Auki -destination 'platform=iOS Simulator,name=iPhone 17'
```

If no simulator runtime is installed (`xcrun simctl list runtimes` prints none): `xcodebuild -runFirstLaunch`, then `xcodebuild -downloadPlatform iOS`.

42 tests, in Swift Testing:

- **The shared vectors.** The project copies `tests/vectors/*.json` into the test bundle as they are, so both apps are checked against the same bytes: `zone.json`, `tiles.json`, `status.json`, `search.json`, `tile-file.json`, `ehditko.json`. Distances to within 0.5 %, everything else exactly. After `npm run vectors` this command is the other half of the check.
- **The texts and the formats**, in both languages: "klo 21", "klo 20.45", "1,1 km", the non-breaking spaces, "midnight". The distances are compared with what the web's `lib/format.ts` prints for the same metres.
- **What leads the list** at a given moment: the nearest open one, the farther open one only while it is open, the one that opens first, nothing from data that is too old.
- **The store**, against a data host the test answers: a search asks for `index.json` and for squares, and the position is in no address.
- **The name**: `Brand.xcconfig` and `lib/brand.ts` name the product the same.

They run locally, not in CI: see "Why there is no CI job".

## On your own iPhone, with a free Apple ID

The labels are those of recent Xcode and iOS versions. If one has moved, the search field of Settings finds it.

1. **Your Apple ID in Xcode.** Xcode → Settings… → Accounts → the plus → Apple Account. Sign in. A free account gives you a "Personal Team".
2. **Connect the iPhone** with a cable, unlock it, and answer "Trust" to "Trust This Computer?".
3. **Developer Mode on the iPhone.** Settings → Privacy & Security → Developer Mode → on. The phone restarts and asks once more. (The switch appears after the phone has been connected to Xcode once.)
4. **Open `ios/Auki.xcodeproj`.** In the left column click the project (the top row), then the target "Auki", then the tab "Signing & Capabilities".
5. **Team:** choose your name with "(Personal Team)". Leave "Automatically manage signing" on.
   - If Xcode says the bundle identifier can't be registered, somebody has it already: change the first part of `APP_BUNDLE_ID` in `ios/Brand.xcconfig` to something of your own and try again.
6. **Choose your iPhone** as the run destination at the top of the window, and press Run (⌘R). macOS may ask for your login password so that Xcode can use the signing key: "Always Allow".
7. **The first launch is refused**, "Untrusted Developer". On the iPhone: Settings → General → VPN & Device Management → your Apple ID under "Developer App" → Trust. Press Run again.
8. In the app, press "Näytä apteekit lähelläni" and allow the location.

Two things to know:

- **Seven days.** An app signed with a free Apple ID stops opening after a week. Run it again from Xcode and it has another week.
- **Keep git clean.** Step 5 writes `DEVELOPMENT_TEAM = …` into `Auki.xcodeproj/project.pbxproj`. Either leave that line uncommitted, or move it: put `DEVELOPMENT_TEAM = ` and the ten characters into a new file `ios/Local.xcconfig` (git ignores it; `Brand.xcconfig` includes it), then `git checkout ios/Auki.xcodeproj/project.pbxproj`.

## Screenshots

Debug builds take launch arguments, so a state can be looked at without tapping through to it. None of them is in a release build (`Auki/App/AppClock.swift`).

```
xcrun simctl boot "iPhone 17"
xcrun simctl install "iPhone 17" <the built Auki.app>
xcrun simctl privacy "iPhone 17" grant location io.github.tilapit.auki
xcrun simctl location "iPhone 17" set 60.1689,24.9316
xcrun simctl ui "iPhone 17" appearance dark
xcrun simctl launch "iPhone 17" io.github.tilapit.auki -autostart -now 1795632060 -detent medium
xcrun simctl io "iPhone 17" screenshot shot.png
```

- `-autostart`: the search starts as if the button had been pressed.
- `-now <epoch seconds>`: the app's clock starts from that moment. The tiles hold eight days of hours, so an evening or a night of the same week can be looked at in the afternoon.
- `-detent peek|medium|large`: where the sheet starts. `-select <n>`: the nth pharmacy is picked.
- `-problem denied|unavailable|timeout|offline|failed|none|notCovered`: that view.
- `-AppleLanguages "(en)"`: English.

Don't open Apple's own Maps app in the same simulator: its permission questions then stand on top of every screenshot until the simulator is erased.

## What the phone sends

- **To the data host** (`Config.tilesOrigin`): `GET /tiles/v1/index.json` and `GET /tiles/v1/10/{x}/{y}.json`. A request names a square of 20 to 30 km, never a position. The position is only compared, on the phone, with the pharmacies of the squares it has loaded. No cookies, nothing stored on disk.
- **To Apple**, by MapKit: the part of the map that is on screen, as any app with an Apple map sends it. This is the app's one third party, as the map tile host is the web app's.
- Nothing else. There is no server of ours in I1: no walking times, no place search, no analytics.

## What I1 leaves out

By the brief: walking times and ehditkö on screen, the route, medicine availability. iPhone only, upright only: an iPad runs it as an iPhone app. Also not here yet: the pharmacy sheet with its details and hand-offs, place search, the prescription banner and the counter card abroad, the notice near the edge of the coverage, offline use, and a refresh that follows a walk (the blue dot follows it; the list is refreshed with the button).

`Core/Ehditko.swift` is in and tested against its vectors, and nothing on screen uses it: it is there for I2.

## Why there is no CI job

macOS minutes count ten times on a private repository, and every job is rounded up to a whole minute, so the smallest possible run costs ten minutes of the month's 2,000.

- Here, on this Mac, a clean build and the 42 tests take about ten seconds with the simulator already running.
- On a hosted macOS runner the same job has to check out, pick an Xcode, start a simulator and build from nothing. I estimate four to six minutes; it is not measured. That is 40 to 60 of the 2,000 minutes for every push.
- Run only on pushes that touch `ios/`, `tests/vectors/` or `lib/brand.ts`, an iOS piece with ten pushes would take 400 to 600 minutes: a fifth to a third of the month.

So the tests run locally until the repository is public, as PLAN.md section 11 says, and each iOS pull request includes their output.
