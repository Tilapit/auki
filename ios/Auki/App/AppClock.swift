import Foundation

/// The current instant, epoch seconds. The one place the app reads the time.
enum AppClock {
    static let now: @Sendable () -> Int = {
        #if DEBUG
        return Int(Date().timeIntervalSince1970) + DebugOptions.clockOffset
        #else
        return Int(Date().timeIntervalSince1970)
        #endif
    }
}

#if DEBUG
/// Launch arguments of debug builds, for looking at a state without tapping through to it
/// (`ios/README.md`, "Screenshots"). None of this is in a release build.
///
/// - `-now <epoch seconds>`: the app's clock starts from that moment, and runs on from it.
/// - `-autostart`: the search starts as if the button had been pressed.
/// - `-detent peek|medium|large`: where the results sheet starts.
/// - `-select <n>`: with `-autostart`, the nth pharmacy of the results is picked, counting from 0: its sheet opens.
/// - `-detail large`: that sheet starts fully up, not at half the screen.
/// - `-problem denied|unavailable|timeout|offline|failed|none|notCovered`: that view.
enum DebugOptions {
    static func value(_ name: String) -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: "-\(name)"), index + 1 < arguments.count else { return nil }
        return arguments[index + 1]
    }

    static func has(_ name: String) -> Bool {
        ProcessInfo.processInfo.arguments.contains("-\(name)")
    }

    static let clockOffset: Int = {
        guard let moment = value("now").flatMap({ Int($0) }) else { return 0 }
        return moment - Int(Date().timeIntervalSince1970)
    }()

    @MainActor
    static func apply(to model: SearchModel) async {
        if let problem = value("problem").flatMap(problem(named:)) {
            model.show(problem)
        } else if has("autostart") {
            await model.search()
            if let index = value("select").flatMap({ Int($0) }), model.found.indices.contains(index) {
                try? await Task.sleep(for: .seconds(1))
                model.selectedID = model.found[index].pharmacy.id
            }
        }
    }

    private static func problem(named name: String) -> Problem? {
        switch name {
        case "denied": .denied
        case "unavailable": .unavailable
        case "timeout": .timeout
        case "offline": .offline
        case "failed": .failed
        case "none": Problem.none
        case "notCovered": .notCovered
        default: nil
        }
    }
}
#endif
