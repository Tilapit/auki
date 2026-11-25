import Foundation

/// The product's name. It is written in one place, `ios/Brand.xcconfig`, and reaches the app
/// through its Info.plist: nothing in the code spells it out (PLAN.md, decision D4).
enum Brand {
    static let name: String = Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String ?? ""
}
