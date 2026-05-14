import SwiftUI
import SwiftData

struct OnboardingView: View {
    @Environment(AppTheme.self) private var theme
    @Environment(\.modelContext) private var modelContext
    var onDone: () -> Void

    @State private var step = 0
    @State private var name = ""
    @State private var importChoice: ImportChoice?

    enum ImportChoice: String, Identifiable {
        case sheet, card, scratch
        var id: String { rawValue }
        var icon: String {
            switch self {
            case .sheet: return "tablecells"
            case .card: return "creditcard"
            case .scratch: return "pencil"
            }
        }
        var title: String {
            switch self {
            case .sheet: return "Importar planilha"
            case .card: return "Subir fatura do cartão"
            case .scratch: return "Começar do zero"
            }
        }
        var subtitle: String {
            switch self {
            case .sheet: return "Google Sheets, Notion, CSV"
            case .card: return "PDF ou foto · processo no seu device"
            case .scratch: return "Você me conta o que rola"
            }
        }
    }

    private let pad: CGFloat = 24

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            header.padding(.bottom, 40)

            Group {
                switch step {
                case 0: stepGreeting
                case 1: stepImport
                default: stepFirstInteraction
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .transition(.opacity.combined(with: .move(edge: .bottom)))
        }
        .padding(.horizontal, pad)
        .padding(.top, pad)
        .padding(.bottom, pad + 16)
        .background(Color.duBg.ignoresSafeArea())
        .animation(.spring(response: 0.45, dampingFraction: 0.85), value: step)
    }

    // MARK: Header (logo + dot indicator)

    private var header: some View {
        HStack {
            DuLogo(size: 26, palette: theme.palette)
            Spacer()
            HStack(spacing: 6) {
                ForEach(0..<3) { i in
                    Capsule()
                        .fill(i <= step ? theme.palette.primary : Color.duFgFaint)
                        .frame(width: i == step ? 18 : 6, height: 6)
                }
            }
        }
    }

    // MARK: Step 0 — greeting

    private var stepGreeting: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Oi 👋")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            (Text("Eu sou o Du.\n")
                + Text("Seu coach financeiro.").foregroundColor(Color.duFgMuted))
                .font(DuFont.mono(36, weight: .bold))
                .kerning(-0.7)
                .lineSpacing(4)
                .foregroundStyle(Color.duFg)
                .padding(.top, 16)

            Text("Sem dashboards, sem planilha. Você fala, eu organizo. Pra começar, como te chamo?")
                .font(DuFont.mono(16))
                .lineSpacing(4)
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 24)
                .frame(maxWidth: 320, alignment: .leading)

            Spacer(minLength: 24)

            VStack(spacing: 12) {
                TextField("seu nome", text: $name)
                    .font(DuFont.display(22, weight: .medium))
                    .foregroundStyle(Color.duFg)
                    .padding(.bottom, 12)
                    .overlay(alignment: .bottom) {
                        Rectangle().fill(Color.duBorder).frame(height: 1.5)
                    }

                Button {
                    if name.trimmingCharacters(in: .whitespaces).isEmpty { return }
                    HapticManager.impact(.light)
                    step = 1
                } label: {
                    primaryButtonLabel("Continuar", enabled: !name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .buttonStyle(.pressable)
            }
        }
    }

    // MARK: Step 1 — import

    private var stepImport: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Prazer, \(name.trimmingCharacters(in: .whitespaces))")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            Text("Por onde começamos?")
                .font(DuFont.mono(30, weight: .bold))
                .kerning(-0.6)
                .foregroundStyle(Color.duFg)
                .padding(.top, 16)

            Text("Posso puxar o que você já tem, ou começamos do zero.")
                .font(DuFont.mono(14))
                .lineSpacing(2)
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 12)

            VStack(spacing: 0) {
                ForEach([ImportChoice.sheet, .card, .scratch]) { opt in
                    importRow(opt)
                }
            }
            .padding(.top, 32)

            Spacer(minLength: 24)

            Button {
                guard importChoice != nil else { return }
                HapticManager.impact(.light)
                step = 2
            } label: {
                primaryButtonLabel("Continuar", enabled: importChoice != nil)
            }
            .buttonStyle(.pressable)
            .padding(.top, 24)
        }
    }

    private func importRow(_ opt: ImportChoice) -> some View {
        let active = importChoice == opt
        return Button {
            importChoice = opt
        } label: {
            HStack(spacing: 14) {
                Image(systemName: opt.icon)
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(active ? .white : Color.duFgMuted)
                    .frame(width: 36, height: 36)
                    .background(active ? AnyShapeStyle(theme.palette.primary) : AnyShapeStyle(Color.duSurface),
                                in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 2) {
                    Text(opt.title)
                        .font(DuFont.display(15, weight: .semibold))
                        .kerning(-0.1)
                        .foregroundStyle(Color.duFg)
                    Text(opt.subtitle)
                        .font(DuFont.mono(12))
                        .foregroundStyle(Color.duFgMuted)
                }
                Spacer()
                if active {
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 22, height: 22)
                        .background(theme.palette.primary, in: Circle())
                }
            }
            .padding(.vertical, 16)
            .overlay(alignment: .bottom) {
                Rectangle().fill(Color.duBorder).frame(height: 1)
            }
        }
        .buttonStyle(.pressable)
    }

    // MARK: Step 2 — first interaction

    private var stepFirstInteraction: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Quase lá")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            Text(stepTitle)
                .font(DuFont.mono(30, weight: .bold))
                .kerning(-0.6)
                .lineSpacing(2)
                .foregroundStyle(Color.duFg)
                .padding(.top, 16)

            Text(stepBody)
                .font(DuFont.mono(14))
                .lineSpacing(4)
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 14)

            Spacer(minLength: 16)

            HStack(spacing: 12) {
                DuSparkle(size: 14, color: theme.palette.primary)
                Text(successQuote)
                    .font(DuFont.mono(13))
                    .foregroundStyle(Color.duFgMuted)
                    .lineSpacing(2)
            }
            .padding(.horizontal, 16).padding(.vertical, 14)
            .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.duBorder, lineWidth: 1))
            .padding(.bottom, 12)

            Button {
                HapticManager.impact(.medium)
                writeInitialState()
                onDone()
            } label: {
                primaryButtonLabel("Entrar", enabled: true)
            }
            .buttonStyle(.pressable)
        }
    }

    // Scratch path is the only one that completes purely on-device today:
    // it writes a welcome Insight so the first Home isn't completely empty
    // and demonstrates the SwiftData write round-trip. The sheet/card paths
    // will gain their own import handlers (CSV parser, VNRecognizeTextRequest
    // over fatura PDFs) and will write the parsed entities themselves.
    private func writeInitialState() {
        guard importChoice == .scratch || importChoice == nil else { return }
        modelContext.insert(Insight(
            text: "Tudo pronto. Me conta seu primeiro gasto e eu organizo.",
            actionLabel: "Falar com Du",
            kind: .insight,
            navigateTo: "chat"
        ))
        try? modelContext.save()
    }

    private var stepTitle: String {
        switch importChoice {
        case .sheet: return "Mande sua planilha."
        case .card: return "Manda a fatura."
        case .scratch, .none: return "Me conta um gasto. Qualquer um."
        }
    }
    private var stepBody: String {
        switch importChoice {
        case .sheet: return "Eu leio o formato sozinho. Sem template, sem ajuste."
        case .card: return "PDF ou print. Nada sai do seu celular sem você ver."
        case .scratch, .none: return "Pode digitar, falar, ou tirar foto do recibo. Eu entendo."
        }
    }
    private var successQuote: String {
        switch importChoice {
        case .sheet: return "“40 lançamentos importados. Categorizei tudo.”"
        case .card: return "“Fatura lida. 38 lançamentos categorizados.”"
        case .scratch, .none: return "“Tudo pronto. Manda ver.”"
        }
    }

    // MARK: Common button label

    private func primaryButtonLabel(_ title: String, enabled: Bool) -> some View {
        HStack {
            Text(title)
                .font(DuFont.display(15, weight: .semibold))
                .foregroundStyle(enabled ? .white : Color.duFgFaint)
            Spacer()
            Image(systemName: "arrow.right")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(enabled ? .white : Color.duFgFaint)
        }
        .padding(.horizontal, 20).padding(.vertical, 16)
        .background(enabled ? AnyShapeStyle(theme.palette.primary) : AnyShapeStyle(Color.duSurface),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .opacity(enabled ? 1.0 : 0.5)
    }
}
