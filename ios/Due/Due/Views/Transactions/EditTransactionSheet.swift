import SwiftUI

struct EditTransactionSheet: View {
    let transaction: InvoiceTransaction
    let cards: [Card]
    let categories: [Category]
    let selectedCardId: String
    let onSave: (UpdateTransactionRequest, String) async -> Bool

    @Environment(\.dismiss) private var dismiss

    @State private var description: String
    @State private var amountText: String
    @State private var purchaseDate: Date
    @State private var installmentsCount: Int
    @State private var editCardId: String
    @State private var selectedCategoryId: String?
    @State private var isSubscription = false
    @State private var isSaving = false

    init(
        transaction: InvoiceTransaction,
        cards: [Card],
        categories: [Category],
        selectedCardId: String,
        onSave: @escaping (UpdateTransactionRequest, String) async -> Bool
    ) {
        self.transaction = transaction
        self.cards = cards
        self.categories = categories
        self.selectedCardId = selectedCardId
        self.onSave = onSave

        _description = State(initialValue: transaction.description)
        _amountText = State(initialValue: String(format: "%.2f", transaction.amount))
        _purchaseDate = State(
            initialValue: DateFormatters.apiDate.date(from: String(transaction.purchaseDate.prefix(10))) ?? Date()
        )
        _installmentsCount = State(initialValue: transaction.totalInstallments)
        _editCardId = State(initialValue: selectedCardId)

        // Match category by name
        let matchedId = categories.first(where: { $0.name == transaction.category })?.id
        _selectedCategoryId = State(initialValue: matchedId)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Detalhes") {
                    TextField("Descrição", text: $description)

                    TextField("Valor", text: $amountText)
                        .keyboardType(.decimalPad)

                    DatePicker("Data", selection: $purchaseDate, displayedComponents: .date)
                        .environment(\.locale, Locale(identifier: "pt_BR"))
                }

                Section("Cartão e categoria") {
                    Picker("Cartão", selection: $editCardId) {
                        ForEach(cards) { card in
                            Text(card.name).tag(card.id)
                        }
                    }

                    Picker("Categoria", selection: $selectedCategoryId) {
                        Text("Nenhuma").tag(String?.none)
                        ForEach(categories) { cat in
                            Text("\(cat.emoji ?? "") \(cat.name)")
                                .tag(Optional(cat.id))
                        }
                    }
                }

                Section("Parcelas") {
                    Stepper("Parcelas: \(installmentsCount)x", value: $installmentsCount, in: 1...48)

                    Toggle("Assinatura", isOn: $isSubscription)
                }
            }
            .navigationTitle("Editar transação")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salvar") {
                        Task { await save() }
                    }
                    .disabled(!isValid || isSaving)
                }
            }
        }
    }

    private var isValid: Bool {
        !description.isEmpty && parsedAmount > 0 && !editCardId.isEmpty
    }

    private var parsedAmount: Double {
        let cleaned = amountText
            .replacingOccurrences(of: ",", with: ".")
            .trimmingCharacters(in: .whitespaces)
        return Double(cleaned) ?? 0
    }

    private func save() async {
        isSaving = true
        let request = UpdateTransactionRequest(
            description: description,
            amount: parsedAmount,
            purchaseDate: DateFormatters.apiDate.string(from: purchaseDate) + "T12:00:00.000Z",
            installmentsCount: installmentsCount,
            cardId: editCardId,
            categoryId: selectedCategoryId,
            isSubscription: isSubscription
        )

        let success = await onSave(request, transaction.transactionId)
        isSaving = false
        if success {
            HapticManager.notification(.success)
            dismiss()
        }
    }
}
