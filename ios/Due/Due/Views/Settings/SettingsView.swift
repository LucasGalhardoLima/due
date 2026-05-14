import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(AppTheme.self) private var theme
    @Environment(\.modelContext) private var modelContext
    var onBack: () -> Void

    private let pad: CGFloat = 24

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                header.padding(.bottom, 28)

                Text("Aparência")
                    .font(DuFont.mono(32, weight: .bold))
                    .kerning(-1.0)
                    .foregroundStyle(Color.duFg)
                    .padding(.bottom, 8)

                Text("Como o Du fica na sua tela. Você pode mudar quando quiser.")
                    .font(DuFont.mono(14))
                    .foregroundStyle(Color.duFgMuted)
                    .lineSpacing(2)
                    .padding(.bottom, 32)

                section(title: "Modo") {
                    ForEach(AppMode.allCases) { mode in
                        modeRow(mode)
                    }
                }
                .padding(.bottom, 32)

                section(title: "Paleta") {
                    ForEach(DuPalette.allCases) { p in
                        paletteRow(p)
                    }
                }
                .padding(.bottom, 32)

                section(title: "Backend do chat (dev)") {
                    ForEach(ChatBackendKind.allCases) { b in
                        backendRow(b)
                    }
                }

                #if DEBUG
                Spacer().frame(height: 32)
                section(title: "Dados (dev)") {
                    devActionRow(
                        label: "Popular com dados de exemplo",
                        sub: "Cartão · 5 transações · 2 insights"
                    ) {
                        try? MockSeeder.seed(context: modelContext)
                    }
                    devActionRow(
                        label: "Apagar tudo",
                        sub: "Limpa o store local"
                    ) {
                        try? MockSeeder.wipe(context: modelContext)
                    }
                }
                #endif
            }
            .padding(.horizontal, pad)
            .padding(.top, 12)
            .padding(.bottom, 40)
        }
        .background(Color.duBg.ignoresSafeArea())
    }

    #if DEBUG
    private func devActionRow(label: String, sub: String, action: @escaping () -> Void) -> some View {
        Button {
            HapticManager.impact(.light)
            action()
        } label: {
            row(label: label, sub: sub, active: false, swatch: nil)
        }
        .buttonStyle(.pressable)
    }
    #endif

    // MARK: Header

    private var header: some View {
        HStack(spacing: 14) {
            Button(action: onBack) {
                Image(systemName: "arrow.left")
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(Color.duFg)
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.pressable)
            Text("Ajustes")
                .font(DuFont.mono(11, weight: .medium))
                .tracking(2.4)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)
            Spacer()
        }
    }

    private func section<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(DuFont.mono(11, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)
            VStack(spacing: 10) { content() }
        }
    }

    private func modeRow(_ mode: AppMode) -> some View {
        let active = theme.mode == mode
        return Button {
            theme.mode = mode
        } label: {
            row(label: mode.label, sub: mode.subtitle, active: active, swatch: nil)
        }
        .buttonStyle(.pressable)
    }

    private func paletteRow(_ palette: DuPalette) -> some View {
        let active = theme.palette == palette
        return Button {
            theme.palette = palette
        } label: {
            row(label: palette.name, sub: palette.subtitle, active: active, swatch: palette)
        }
        .buttonStyle(.pressable)
    }

    private func backendRow(_ kind: ChatBackendKind) -> some View {
        let active = theme.chatBackend == kind
        return Button {
            theme.chatBackend = kind
        } label: {
            row(label: kind.label, sub: kind.subtitle, active: active, swatch: nil)
        }
        .buttonStyle(.pressable)
    }

    private func row(label: String, sub: String, active: Bool, swatch: DuPalette?) -> some View {
        HStack {
            HStack(spacing: 12) {
                if let swatch {
                    RoundedRectangle(cornerRadius: 7, style: .continuous)
                        .fill(swatch.gradient)
                        .frame(width: 22, height: 22)
                        .overlay(
                            Group {
                                if active {
                                    RoundedRectangle(cornerRadius: 7, style: .continuous)
                                        .stroke(swatch.primary, lineWidth: 1.5)
                                        .padding(-3)
                                }
                            }
                        )
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(DuFont.mono(14, weight: .medium))
                        .foregroundStyle(Color.duFg)
                    Text(sub)
                        .font(DuFont.mono(11, weight: .medium))
                        .tracking(1.0)
                        .foregroundStyle(Color.duFgFaint)
                }
            }
            Spacer()
            if active {
                Image(systemName: "checkmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 20, height: 20)
                    .background(theme.palette.primary, in: Circle())
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .background(active ? Color.duSurfaceHi : Color.duSurface,
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(active ? Color.duBorderHi : Color.duBorder, lineWidth: 1)
        )
    }
}
