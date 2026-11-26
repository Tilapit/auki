import CoreLocation
import XCTest

/// A finger on a pharmacy's sheet, in the Simulator: what no unit test can say. The sheet
/// opens at half the screen with the picked marker above it, a pull down closes it, its
/// content moves the sheet before it scrolls, and the map behind it can still be used.
///
/// Run on demand, never with the unit tests (`ios/README.md`, "Tests"):
///
///     xcrun simctl privacy "iPhone 17" grant location io.github.tilapit.auki
///     xcodebuild test -project ios/Auki.xcodeproj -scheme AukiUITests -destination 'platform=iOS Simulator,name=iPhone 17'
///
/// The app under test is the real one. It stands in Kamppi, Helsinki, and reads the real
/// tiles of the data host, so these tests need the network. They press nothing that leaves
/// the app: not the route, not the call.
@MainActor
final class PharmacySheetGestureTests: XCTestCase {
    /// Starts the app with the results on screen. `results`: where their sheet rests.
    private func launch(results: String = "medium", _ more: [String] = []) -> XCUIApplication {
        continueAfterFailure = false
        XCUIDevice.shared.location = XCUILocation(location: CLLocation(latitude: 60.1689, longitude: 24.9316))
        let app = XCUIApplication()
        app.launchArguments = ["-autostart", "-detent", results, "-AppleLanguages", "(fi)"] + more
        app.launch()
        XCTAssertTrue(
            app.staticTexts["results-title"].waitForExistence(timeout: 30),
            "No results came. The app needs the location permission (the simctl line above this class) and the network."
        )
        return app
    }

    /// The sheets glide to their places in real time.
    private func settle() {
        Thread.sleep(forTimeInterval: 1.2)
    }

    private func screen(_ app: XCUIApplication) -> CGRect {
        app.windows.firstMatch.frame
    }

    /// Opens the sheet of the first pharmacy of the list and gives its name on the sheet.
    private func openFirstRow(_ app: XCUIApplication) -> XCUIElement {
        app.buttons.matching(identifier: "pharmacy-row").firstMatch.tap()
        let name = app.staticTexts["pharmacy-name"]
        XCTAssertTrue(name.waitForExistence(timeout: 5), "A press on a row opens the pharmacy's sheet")
        settle()
        return name
    }

    /// True when the sheet rests at half the screen: its first line stands just under the middle.
    private func atHalf(_ name: XCUIElement, _ app: XCUIApplication) -> Bool {
        let height = screen(app).height
        return name.frame.minY > height * 0.45 && name.frame.minY < height * 0.62
    }

    private func drag(_ element: XCUIElement, by distance: CGFloat) {
        let start = element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        start.press(forDuration: 0.1, thenDragTo: start.withOffset(CGVector(dx: 0, dy: distance)))
        settle()
    }

    func testARowOpensTheSheetAtHalfTheScreenWithThePickedMarkerAboveIt() {
        let app = launch()
        let name = openFirstRow(app)
        XCTAssertTrue(atHalf(name, app), "The sheet opens at half the screen: its name is at \(name.frame.minY) of \(screen(app).height)")

        // The map shows above it, with the picked pharmacy's marker in it.
        let marker = app.buttons["marker-picked"]
        XCTAssertTrue(marker.waitForExistence(timeout: 5), "The picked pharmacy has its marker")
        XCTAssertTrue(marker.isHittable, "The picked marker is in view")
        XCTAssertLessThan(marker.frame.maxY, name.frame.minY, "The picked marker stands above the sheet")
        XCTAssertGreaterThan(marker.frame.minY, 0)
        XCTAssertTrue(marker.label.hasPrefix(name.label), "It is the marker of the pharmacy the sheet names")

        // What the sheet is for is in view at this height, without pulling it up.
        let route = app.buttons["route"]
        XCTAssertTrue(route.isHittable, "The route button is in view at half the screen")
        XCTAssertLessThan(route.frame.maxY, screen(app).height)
    }

    func testFromTheOpenListTheResultsStepDownSoTheMapShowsAboveTheSheet() {
        // The results fully up, as after reading the list: they cover the map.
        let app = launch(results: "large")
        let name = openFirstRow(app)
        XCTAssertTrue(atHalf(name, app), "The name is at \(name.frame.minY) of \(screen(app).height)")
        let marker = app.buttons["marker-picked"]
        XCTAssertTrue(marker.waitForExistence(timeout: 5))
        XCTAssertTrue(marker.isHittable, "The map shows above the sheet, although the list was open")
        XCTAssertLessThan(marker.frame.maxY, name.frame.minY)
        // The results are under the sheet, not standing taller than it.
        XCTAssertFalse(app.staticTexts["results-title"].isHittable)
    }

    func testTheCardsRouteButtonOpensTheSameSheet() throws {
        let app = launch()
        let route = app.buttons["lead-route"]
        // In the small hours nothing nearby may be open: then the card has no route to offer.
        try XCTSkipUnless(route.exists, "No pharmacy nearby is open right now: the card has no route button")
        route.tap()
        let name = app.staticTexts["pharmacy-name"]
        XCTAssertTrue(name.waitForExistence(timeout: 5))
        settle()
        XCTAssertTrue(atHalf(name, app))
        XCTAssertTrue(app.buttons["route"].isHittable)
        XCTAssertTrue(app.buttons["marker-picked"].isHittable)
    }

    func testAPullDownClosesItAndTheResultsAreThereAgain() {
        let app = launch()
        let name = openFirstRow(app)
        drag(name, by: 520)
        XCTAssertTrue(name.waitForNonExistence(timeout: 5), "A pull down closes the sheet")
        // Back at the results, with no pharmacy picked.
        XCTAssertTrue(app.staticTexts["results-title"].isHittable)
        XCTAssertTrue(app.buttons.matching(identifier: "pharmacy-row").firstMatch.isHittable)
        XCTAssertFalse(app.buttons["marker-picked"].exists)
    }

    func testAFingerOnTheContentMovesTheSheetBeforeAnythingScrolls() {
        let app = launch()
        let name = openFirstRow(app)
        XCTAssertTrue(atHalf(name, app))

        // Up: the sheet comes up whole. Had its content scrolled in place, the name would
        // have left by the sheet's upper edge and the marker would still show above it.
        drag(name, by: -360)
        XCTAssertLessThan(name.frame.minY, screen(app).height * 0.25, "The sheet is fully up")
        XCTAssertTrue(name.isHittable, "Its content is where it was in it: the name is the first line")
        XCTAssertFalse(app.buttons["marker-picked"].isHittable, "Fully up, the sheet covers the map")

        // Down again from the content's top: back to half the screen, still open.
        drag(name, by: 300)
        XCTAssertTrue(name.exists, "A pull down from fully up goes to half the screen first")
        XCTAssertTrue(atHalf(name, app), "The name is at \(name.frame.minY) of \(screen(app).height)")

        // And down once more: closed.
        drag(name, by: 520)
        XCTAssertTrue(name.waitForNonExistence(timeout: 5))
    }

    func testAnotherMarkerPressedWhileTheSheetIsUpChangesThePharmacy() throws {
        let app = launch()
        let name = openFirstRow(app)
        let first = name.label
        let top = name.frame.minY

        // A marker of another pharmacy, in the part of the map that shows above the sheet.
        let other = app.buttons.matching(identifier: "marker").allElementsBoundByIndex.first {
            $0.isHittable && $0.frame.maxY < top - 24 && $0.frame.minY > 120 && !$0.label.hasPrefix(first)
        }
        let marker = try XCTUnwrap(other, "No other pharmacy's marker shows above the sheet")
        let label = marker.label
        marker.tap()
        settle()

        XCTAssertNotEqual(name.label, first, "The sheet names the pharmacy that was pressed")
        XCTAssertTrue(label.hasPrefix(name.label), "\(label) / \(name.label)")
        XCTAssertTrue(atHalf(name, app), "The sheet stays at half the screen")
        XCTAssertTrue(app.buttons["marker-picked"].label.hasPrefix(name.label))
    }

    func testShowOnTheMapBringsItDownToHalfAndTheCloseButtonClosesIt() {
        // The second pharmacy of the results, with its sheet fully up from the start.
        let app = launch(["-select", "1", "-detail", "large"])
        // (`-select` waits a second after the results before it picks.)
        let name = app.staticTexts["pharmacy-name"]
        XCTAssertTrue(name.waitForExistence(timeout: 10))
        settle()
        XCTAssertLessThan(name.frame.minY, screen(app).height * 0.25, "The sheet starts fully up")

        app.buttons["show-on-map"].tap()
        settle()
        XCTAssertTrue(atHalf(name, app), "The name is at \(name.frame.minY) of \(screen(app).height)")
        let marker = app.buttons["marker-picked"]
        XCTAssertTrue(marker.isHittable)
        XCTAssertLessThan(marker.frame.maxY, name.frame.minY)

        app.buttons["close"].tap()
        XCTAssertTrue(name.waitForNonExistence(timeout: 5), "The close button closes the sheet")
        XCTAssertTrue(app.staticTexts["results-title"].isHittable)
    }
}
