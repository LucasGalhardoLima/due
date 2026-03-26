import Foundation

enum DrilldownFilter {
    case category(id: String, name: String, emoji: String?)
    case card(id: String, name: String)

    var title: String {
        switch self {
        case .category(_, let name, let emoji):
            return [emoji, name].compactMap { $0 }.joined(separator: " ")
        case .card(_, let name):
            return name
        }
    }
}

@MainActor
@Observable
final class TransactionDrilldownViewModel {
    let filter: DrilldownFilter

    var transactions: [InvoiceTransaction] = []
    var cards: [Card] = []
    var categories: [Category] = []
    var isLoading = false
    var error: String?
    var errorKind: ErrorKind?

    // Edit
    var editingTransaction: InvoiceTransaction?

    // Delete confirmation
    var transactionToDelete: InvoiceTransaction?
    var showDeleteConfirmation = false

    private let api = APIClient.shared

    var currentMonth: Int { Calendar.current.component(.month, from: Date()) }
    var currentYear: Int { Calendar.current.component(.year, from: Date()) }

    init(filter: DrilldownFilter) {
        self.filter = filter
    }

    func load() async {
        isLoading = true
        error = nil

        async let cardsTask: () = loadCards()
        async let categoriesTask: () = loadCategories()
        async let transactionsTask: () = loadTransactions()
        _ = await (cardsTask, categoriesTask, transactionsTask)

        isLoading = false
    }

    func loadTransactions() async {
        do {
            var categoryId: String?
            var cardId: String?

            switch filter {
            case .category(let id, _, _):
                categoryId = id
            case .card(let id, _):
                cardId = id
            }

            let response: TransactionListResponse = try await api.request(
                .transactionList(
                    month: currentMonth,
                    year: currentYear,
                    categoryId: categoryId,
                    cardId: cardId
                )
            )
            transactions = response.transactions
        } catch {
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }
    }

    private func loadCards() async {
        do {
            cards = try await api.request(.cards())
        } catch {}
    }

    private func loadCategories() async {
        do {
            categories = try await api.request(.categories())
        } catch {}
    }

    func updateTransaction(_ request: UpdateTransactionRequest, transactionId: String) async -> Bool {
        do {
            let _: TransactionResponse = try await api.request(
                .updateTransaction(id: transactionId), body: request
            )
            await loadTransactions()
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func confirmDelete(_ transaction: InvoiceTransaction) {
        transactionToDelete = transaction
        showDeleteConfirmation = true
    }

    func deleteTransaction() async {
        guard let transaction = transactionToDelete else { return }
        transactionToDelete = nil

        // Optimistic removal
        let snapshot = transactions
        transactions.removeAll { $0.id == transaction.id }
        HapticManager.notification(.success)

        do {
            let _: TransactionResponse = try await api.request(
                .deleteTransaction(id: transaction.transactionId)
            )
        } catch {
            // Rollback on failure
            transactions = snapshot
            self.error = error.localizedDescription
            HapticManager.notification(.error)
        }
    }
}
