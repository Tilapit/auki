import SwiftUI

@main
struct AukiApp: App {
    @State private var model = SearchModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .environment(\.texts, Texts(.current))
                .tint(Palette.action)
                #if DEBUG
                .task { await DebugOptions.apply(to: model) }
                #endif
        }
    }
}
