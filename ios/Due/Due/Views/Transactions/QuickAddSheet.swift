import SwiftUI

struct QuickAddSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var inputText = ""
    @State private var state: QuickAddState = .idle
    @State private var parsedResult: AIParseResponse?
    @State private var cards: [Card] = []
    @State private var categories: [Category] = []

    // Editable fields for parsed result
    @State private var editDescription = ""
    @State private var editAmount = ""
    @State private var editDate = Date()
    @State private var editInstallments = 1
    @State private var editCardId = ""
    @State private var editCategoryId: String?

    @State private var showManualForm = false

    private let api = APIClient.shared

    enum QuickAddState {
        case idle, parsing, parsed, saving
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                aiInputSection

                if state == .parsing {
                    ProgressView("Processando...")
                        .padding()
                }

                if state == .parsed || state == .saving {
                    parsedResultCard
                }

                Spacer()
            }
            .padding(16)
            .duGradientBackground()
            .navigationTitle("Adicionar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
            }
            .sheet(isPresented: $showManualForm) {
                AddTransactionSheet(
                    cards: cards,
                    categories: categories,
                    onSave: saveTransaction,
                    prefill: manualPrefill
                )
            }
        }
        .task {
            await loadData()
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    // MARK: - AI Input

    private var aiInputSection: some View {
        VStack(spacing: 12) {
            TextField("Ex: Uber 25 reais ontem", text: $inputText, axis: .vertical)
                .font(.body)
                .lineLimit(3...6)
                .padding(16)
                .duGlass()

            Button {
                Task { await parseInput() }
            } label: {
                HStack {
                    Image(systemName: "sparkles")
                    Text("Processar")
                }
                .font(.headline)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.duTabAccent, in: Capsule())
            }
            .pressableStyle()
            .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty || state == .parsing)
            .opacity(state == .parsed || state == .saving ? 0.5 : 1)
        }
    }

    // MARK: - Parsed Result

    private var parsedResultCard: some View {
        VStack(spacing: 16) {
            VStack(spacing: 12) {
                resultRow(label: "Descrição", value: editDescription)
                resultRow(label: "Valor", value: CurrencyFormatter.format(Double(editAmount.replacingOccurrences(of: ",", with: ".")) ?? 0))

                if let date = parsedResult?.date {
                    resultRow(label: "Data", value: formatDisplayDate(date))
                }

                if editInstallments > 1 {
                    resultRow(label: "Parcelas", value: "\(editInstallments)x")
                }

                if let cardName = cards.first(where: { $0.id == editCardId })?.name {
                    resultRow(label: "Cartão", value: cardName)
                }

                if let catId = editCategoryId,
                   let cat = categories.first(where: { $0.id == catId }) {
                    resultRow(label: "Categoria", value: "\(cat.emoji ?? "") \(cat.name)")
                }
            }
            .padding(16)
            .duGlass()

            HStack(spacing: 12) {
                Button {
                    showManualForm = true
                } label: {
                    Text("Editar")
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.gray.opacity(0.15), in: Capsule())
                }

                Button {
                    Task { await saveFromParsed() }
                } label: {
                    HStack {
                        if state == .saving {
                            ProgressView()
                                .tint(.white)
                        }
                        Text("Salvar")
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.duTabAccent, in: Capsule())
                }
                .disabled(state == .saving)
            }
        }
        .transition(.opacity.combined(with: .move(edge: .bottom)))
    }

    private func resultRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(width: 80, alignment: .leading)
            Text(value)
                .font(.subheadline.weight(.medium))
            Spacer()
        }
    }

    // MARK: - Actions

    private func loadData() async {
        do {
            async let cardsTask: [Card] = api.request(.cards())
            async let catsTask: [Category] = api.request(.categories())
            let (c, cats) = try await (cardsTask, catsTask)
            cards = c
            categories = cats
            if editCardId.isEmpty {
                editCardId = cards.first(where: \.isDefault)?.id ?? cards.first?.id ?? ""
            }
        } catch {
            // Non-critical
        }
    }

    private func parseInput() async {
        withAnimation(DuTheme.defaultSpring) {
            state = .parsing
        }

        let request = AIParseRequest(
            text: inputText,
            currentDate: DateFormatters.apiDate.string(from: Date())
        )

        do {
            let response: AIParseResponse = try await api.request(.parseExpense(), body: request)
            parsedResult = response

            editDescription = response.description ?? ""
            editAmount = response.amount.map { String(format: "%.2f", $0) } ?? ""
            editInstallments = response.installments ?? 1

            if let dateStr = response.date, let date = DateFormatters.apiDate.date(from: dateStr) {
                editDate = date
            }
            if let cardId = response.cardId {
                editCardId = cardId
            }
            editCategoryId = response.categoryId

            withAnimation(DuTheme.defaultSpring) {
                state = .parsed
            }
        } catch {
            withAnimation(DuTheme.defaultSpring) {
                state = .idle
            }
        }
    }

    private func saveFromParsed() async {
        withAnimation { state = .saving }

        let amount = Double(editAmount.replacingOccurrences(of: ",", with: ".")) ?? 0
        let dateString = DateFormatters.apiDate.string(from: editDate) + "T12:00:00.000Z"

        let request = CreateTransactionRequest(
            description: editDescription,
            amount: amount,
            purchaseDate: dateString,
            installmentsCount: editInstallments,
            cardId: editCardId,
            categoryId: editCategoryId,
            isSubscription: false
        )

        let success = await saveTransaction(request)
        if success {
            HapticManager.notification(.success)
            dismiss()
        } else {
            withAnimation { state = .parsed }
        }
    }

    private func saveTransaction(_ request: CreateTransactionRequest) async -> Bool {
        do {
            let _: TransactionResponse = try await api.request(.createTransaction(), body: request)
            return true
        } catch {
            return false
        }
    }

    private var manualPrefill: AddTransactionPrefill {
        AddTransactionPrefill(
            description: editDescription,
            amount: editAmount,
            date: editDate,
            installments: editInstallments,
            cardId: editCardId,
            categoryId: editCategoryId
        )
    }

    private func formatDisplayDate(_ dateString: String) -> String {
        guard let date = DateFormatters.apiDate.date(from: dateString) else { return dateString }
        return DateFormatters.dayMonthYear.string(from: date)
    }
}
