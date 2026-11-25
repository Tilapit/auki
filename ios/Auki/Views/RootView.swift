import SwiftUI

/// One view per state of the search.
struct RootView: View {
    @Environment(SearchModel.self) private var model

    var body: some View {
        switch model.phase {
        case .first, .locating, .searching:
            FirstView()
        case .results:
            ResultsView()
        case .problem(let problem):
            ProblemView(problem: problem)
        }
    }
}

/// The first window: one sentence, one button, nothing asked until it is pressed.
struct FirstView: View {
    @Environment(SearchModel.self) private var model
    @Environment(\.texts) private var texts

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer(minLength: 24)

            AppMark(size: 72)
                .padding(.bottom, 28)

            Text(texts.headline)
                .font(.largeTitle.weight(.bold))
                .foregroundStyle(Palette.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
                .padding(.bottom, 28)

            Button {
                Task { await model.search() }
            } label: {
                HStack(spacing: 10) {
                    if busy { ProgressView().tint(Palette.onAction) }
                    Text(busyText ?? texts.locate)
                }
                .frame(maxWidth: .infinity, minHeight: 28)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(busy)

            Text(texts.privacy)
                .font(.footnote)
                .foregroundStyle(Palette.meta)
                .padding(.top, 12)

            Spacer(minLength: 24)

            Text(texts.project)
                .font(.footnote)
                .foregroundStyle(Palette.meta)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 20)
        .frame(maxWidth: 520, maxHeight: .infinity, alignment: .leading)
        .frame(maxWidth: .infinity)
        .background(Palette.paper.ignoresSafeArea())
    }

    private var busy: Bool { model.phase == .locating || model.phase == .searching }

    private var busyText: String? {
        switch model.phase {
        case .locating: texts.locating
        case .searching: texts.searching
        default: nil
        }
    }
}

/// When something is in the way: what it is, what to do about it, and 112.
struct ProblemView: View {
    let problem: Problem

    @Environment(SearchModel.self) private var model
    @Environment(\.texts) private var texts
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer(minLength: 24)

            Text(texts.title(of: problem))
                .font(.title.weight(.bold))
                .foregroundStyle(Palette.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)

            if let body = texts.body(of: problem) {
                Text(body)
                    .font(.body)
                    .foregroundStyle(Palette.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 10)
            }

            VStack(spacing: 10) {
                if problem == .denied, let settings = URL(string: UIApplication.openSettingsURLString) {
                    Button {
                        openURL(settings)
                    } label: {
                        Text(texts.openSettings).frame(maxWidth: .infinity, minHeight: 28)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                Button {
                    Task { await model.search() }
                } label: {
                    Text(texts.retry).frame(maxWidth: .infinity, minHeight: 28)
                }
                .buttonStyle(problem == .denied ? AnyButtonStyle(SecondaryButtonStyle()) : AnyButtonStyle(PrimaryButtonStyle()))
            }
            .padding(.top, 28)

            EmergencyLink()
                .padding(.top, 20)

            Spacer(minLength: 24)

            Text(texts.project)
                .font(.footnote)
                .foregroundStyle(Palette.meta)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 20)
        .frame(maxWidth: 520, maxHeight: .infinity, alignment: .leading)
        .frame(maxWidth: .infinity)
        .background(Palette.paper.ignoresSafeArea())
    }
}

/// "Hätätilanteessa soita 112": a call link, wherever the app has no pharmacy to offer.
struct EmergencyLink: View {
    @Environment(\.texts) private var texts

    var body: some View {
        if let url = URL(string: "tel:112") {
            Link(destination: url) {
                Label(texts.emergency, systemImage: "phone")
                    .font(.callout.weight(.semibold))
                    .frame(minHeight: 44)
            }
            .tint(Palette.action)
        }
    }
}

// MARK: Buttons: a filled one and an outlined one, twelve-point corners, no shadow

struct PrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(Palette.onAction)
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
            .background(Palette.action.opacity(configuration.isPressed ? 0.85 : 1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .opacity(isEnabled ? 1 : 0.8)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(Palette.ink)
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
            .background(Palette.sheet.opacity(configuration.isPressed ? 0.7 : 1), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Palette.outline, lineWidth: 1.5))
    }
}

/// Lets a view pick one of two button styles.
struct AnyButtonStyle: ButtonStyle {
    private let body: (Configuration) -> AnyView

    init<Style: ButtonStyle>(_ style: Style) {
        body = { AnyView(style.makeBody(configuration: $0)) }
    }

    func makeBody(configuration: Configuration) -> some View {
        body(configuration)
    }
}
