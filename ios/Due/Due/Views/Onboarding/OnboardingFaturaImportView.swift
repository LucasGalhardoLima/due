import SwiftUI
import SwiftData
import UniformTypeIdentifiers

struct OnboardingFaturaImportView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(AppTheme.self) private var theme

    var onDone: () -> Void
    var onBack: () -> Void

    struct CardDraft: Equatable, Sendable {
        let name: String
        let limit: Decimal
        let closingDay: Int
        let dueDay: Int
    }

    enum ErrorState: Equatable, Sendable {
        case extract(PDFTextExtractor.ExtractError)
        case unsupportedBank
        case parse(FaturaParseError)
        case fileImportFailed(String)
        case commitFailed(String)

        var message: String {
            switch self {
            case .extract(.fileTooLarge): "Arquivo grande demais (máx 5 MB)."
            case .extract(.unsupported): "Não consegui abrir esse PDF. Pode estar corrompido."
            case .extract(.passwordRequired): "PDF protegido por senha."
            case .extract(.passwordIncorrect): "Senha incorreta."
            case .extract(.imageOnly): "Esse PDF parece ser uma foto digitalizada. Por enquanto só leio PDFs com texto."
            case .unsupportedBank: "Por enquanto só leio faturas do Itaú."
            case .parse(.unknownBillingPeriod): "Não consegui achar a data de fechamento dessa fatura."
            case .parse(.unsupportedBank): "Banco não suportado."
            case .fileImportFailed(let m): "Erro abrindo o arquivo: \(m)"
            case .commitFailed(let m): "Erro salvando os dados: \(m)"
            }
        }
    }

    enum Phase: Equatable {
        case idle
        case extracting
        case needsPassword(wasWrong: Bool)
        case error(ErrorState)
        case setupCard(ParsedFatura)
        case review(ParsedFatura, CardDraft)
        case committing
        case done
    }

    @State private var phase: Phase = .idle
    @State private var pickedURL: URL?
    @State private var showPicker = false
    @State private var passwordInput = ""

    var body: some View {
        Group {
            switch phase {
            case .idle:
                idleView
            case .extracting:
                progressView(title: "Lendo o PDF…")
            case .needsPassword(let wasWrong):
                passwordView(wasWrong: wasWrong)
            case .error(let state):
                errorView(state)
            case .setupCard(let fatura):
                OnboardingCardSetupSheet(fatura: fatura) { draft in
                    phase = .review(fatura, draft)
                } onBack: {
                    resetToIdle()
                }
            case .review(let fatura, let draft):
                OnboardingFaturaReviewView(fatura: fatura, card: draft) {
                    Task { @MainActor in
                        phase = .committing
                        await runCommit(fatura: fatura, draft: draft)
                    }
                } onBack: {
                    phase = .setupCard(fatura)
                }
            case .committing:
                progressView(title: "Salvando…")
            case .done:
                Color.clear.onAppear {
                    HapticManager.notification(.success)
                    onDone()
                }
            }
        }
        .fileImporter(
            isPresented: $showPicker,
            allowedContentTypes: [.pdf],
            allowsMultipleSelection: false
        ) { result in
            handleFilePick(result)
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.85), value: phase)
    }

    // MARK: - Phase views

    private var idleView: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Quase lá")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            Text("Manda a fatura.")
                .font(DuFont.mono(30, weight: .bold))
                .kerning(-0.6)
                .foregroundStyle(Color.duFg)
                .padding(.top, 16)

            Text("PDF do app do banco. Nada sai do seu celular sem você ver.")
                .font(DuFont.mono(14))
                .lineSpacing(4)
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 14)

            Spacer(minLength: 16)

            HStack(spacing: 12) {
                DuSparkle(size: 14, color: theme.palette.primary)
                Text("\u{201C}Fatura lida. 38 lançamentos categorizados.\u{201D}")
                    .font(DuFont.mono(13))
                    .foregroundStyle(Color.duFgMuted)
                    .lineSpacing(2)
            }
            .padding(.horizontal, 16).padding(.vertical, 14)
            .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.duBorder, lineWidth: 1)
            )
            .padding(.bottom, 12)

            VStack(spacing: 12) {
                Button {
                    HapticManager.impact(.light)
                    showPicker = true
                } label: {
                    OnboardingPrimaryButton(title: "Escolher arquivo", enabled: true, icon: "doc.fill")
                }
                .buttonStyle(.pressable)

                Button {
                    HapticManager.impact(.light)
                    onBack()
                } label: {
                    OnboardingSecondaryButton(title: "Voltar")
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private func progressView(title: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            ProgressView()
                .tint(theme.palette.primary)
            Text(title)
                .font(DuFont.mono(14))
                .foregroundStyle(Color.duFgMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
    }

    private func passwordView(wasWrong: Bool) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(wasWrong ? "Senha incorreta" : "Senha do PDF")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(wasWrong ? Color.duFg : Color.duFgMuted)

            Text("Itaú usa os 5 primeiros dígitos do cartão.")
                .font(DuFont.mono(14))
                .lineSpacing(4)
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 12)

            SecureField("", text: $passwordInput)
                .font(DuFont.display(22, weight: .medium))
                .foregroundStyle(Color.duFg)
                .keyboardType(.numberPad)
                .padding(.top, 32)
                .padding(.bottom, 12)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(Color.duBorder).frame(height: 1.5)
                }

            Spacer(minLength: 16)

            VStack(spacing: 12) {
                Button {
                    guard let url = pickedURL, !passwordInput.isEmpty else { return }
                    HapticManager.impact(.light)
                    phase = .extracting
                    Task {
                        await runExtraction(url: url, password: passwordInput)
                    }
                } label: {
                    OnboardingPrimaryButton(title: "Desbloquear", enabled: !passwordInput.isEmpty)
                }
                .buttonStyle(.pressable)
                .disabled(passwordInput.isEmpty)

                Button {
                    resetToIdle()
                } label: {
                    OnboardingSecondaryButton(title: "Cancelar")
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private func errorView(_ state: ErrorState) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Algo travou")
                .font(DuFont.mono(13, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            Text(state.message)
                .font(DuFont.mono(18, weight: .medium))
                .foregroundStyle(Color.duFg)
                .lineSpacing(4)
                .padding(.top, 16)

            Spacer(minLength: 24)

            VStack(spacing: 12) {
                Button {
                    HapticManager.impact(.light)
                    resetToIdle()
                } label: {
                    OnboardingPrimaryButton(title: "Tentar outro arquivo", enabled: true, icon: "arrow.clockwise")
                }
                .buttonStyle(.pressable)

                Button {
                    HapticManager.impact(.light)
                    onBack()
                } label: {
                    OnboardingSecondaryButton(title: "Voltar")
                }
                .buttonStyle(.pressable)
            }
        }
    }

    // MARK: - Flow

    private func resetToIdle() {
        passwordInput = ""
        pickedURL = nil
        phase = .idle
    }

    private func handleFilePick(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            pickedURL = url
            passwordInput = ""
            phase = .extracting
            Task {
                await runExtraction(url: url, password: nil)
            }
        case .failure(let err):
            phase = .error(.fileImportFailed(err.localizedDescription))
        }
    }

    private func runExtraction(url: URL, password: String?) async {
        let outcome: ExtractionOutcome = await Task.detached(priority: .userInitiated) {
            do {
                let text = try PDFTextExtractor.extractText(from: url, password: password)
                guard let parser = FaturaDetector.detectBank(rawText: text) else {
                    return .failure(.unsupportedBank)
                }
                do {
                    let fatura = try parser.parse(rawText: text)
                    return .success(fatura)
                } catch let parseErr as FaturaParseError {
                    return .failure(.parse(parseErr))
                } catch {
                    return .failure(.fileImportFailed(error.localizedDescription))
                }
            } catch let ex as PDFTextExtractor.ExtractError {
                return .failure(.extract(ex))
            } catch {
                return .failure(.fileImportFailed(error.localizedDescription))
            }
        }.value

        switch outcome {
        case .success(let fatura):
            phase = .setupCard(fatura)
        case .failure(.extract(.passwordRequired)):
            phase = .needsPassword(wasWrong: false)
        case .failure(.extract(.passwordIncorrect)):
            phase = .needsPassword(wasWrong: true)
        case .failure(let err):
            phase = .error(err)
        }
    }

    private enum ExtractionOutcome: Sendable {
        case success(ParsedFatura)
        case failure(ErrorState)
    }

    @MainActor
    private func runCommit(fatura: ParsedFatura, draft: CardDraft) async {
        let newCard = Card(
            name: draft.name,
            limit: draft.limit,
            closingDay: draft.closingDay,
            dueDay: draft.dueDay
        )
        modelContext.insert(newCard)

        var calendar = Calendar(identifier: .gregorian)
        let tz = TimeZone(identifier: "America/Sao_Paulo") ?? .current
        calendar.timeZone = tz

        let isoFormatter = DateFormatter()
        isoFormatter.dateFormat = "yyyy-MM-dd"
        isoFormatter.locale = Locale(identifier: "en_US_POSIX")
        isoFormatter.timeZone = tz

        let ptBR = Locale(identifier: "pt_BR")

        for parsed in fatura.transactions {
            guard let purchaseDate = isoFormatter.date(from: parsed.purchaseDate) else { continue }
            let category = parsed.bankCategory.isEmpty
                ? "Outros"
                : parsed.bankCategory.capitalized(with: ptBR)
            let merchant = parsed.rawDescription

            if parsed.installmentsCount > 1 {
                let installment = Installment(
                    merchant: merchant,
                    totalAmount: parsed.amount,
                    installmentCount: parsed.installmentsCount,
                    firstDate: purchaseDate,
                    card: newCard
                )
                modelContext.insert(installment)

                var perInstallment = parsed.amount / Decimal(parsed.installmentsCount)
                var rounded = Decimal()
                NSDecimalRound(&rounded, &perInstallment, 2, .plain)

                for i in 0..<parsed.installmentsCount {
                    let date = calendar.date(byAdding: .month, value: i, to: purchaseDate) ?? purchaseDate
                    let txn = Transaction(
                        merchant: merchant,
                        amount: -abs(rounded),
                        category: category,
                        timestamp: date,
                        card: newCard,
                        installment: installment
                    )
                    modelContext.insert(txn)
                }
            } else {
                let txn = Transaction(
                    merchant: merchant,
                    amount: -abs(parsed.amount),
                    category: category,
                    timestamp: purchaseDate,
                    card: newCard
                )
                modelContext.insert(txn)
            }
        }

        let prettyBank = fatura.bank == "itau" ? "Itaú" : fatura.bank.capitalized
        let insight = Insight(
            text: "\(fatura.stats.newPurchases) lançamentos importados da fatura \(prettyBank) (\(fatura.billingPeriod)).",
            actionLabel: "Ver no Cartão",
            kind: .insight,
            navigateTo: "cartao"
        )
        modelContext.insert(insight)

        do {
            try modelContext.save()
            phase = .done
        } catch {
            phase = .error(.commitFailed(error.localizedDescription))
        }
    }
}
