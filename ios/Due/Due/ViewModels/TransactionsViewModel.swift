import Foundation

@MainActor
@Observable
final class TransactionsViewModel {
    var cards: [Card] = []
    var categories: [Category] = []
    var selectedCardId: String?
    var invoice: InvoiceSummary?
    var isLoading = false
    var error: String?
    var errorKind: ErrorKind?

    // Sheets
    var showAddSheet = false
    var editingTransaction: InvoiceTransaction?

    // Delete confirmation
    var transactionToDelete: InvoiceTransaction?
    var showDeleteConfirmation = false

    private let api = APIClient.shared

    var currentMonth: Int { Calendar.current.component(.month, from: Date()) }
    var currentYear: Int { Calendar.current.component(.year, from: Date()) }

    /// Transaction date groups sorted descending
    var sortedDateGroups: [(key: String, transactions: [InvoiceTransaction])] {
        guard let invoice else { return [] }
        return invoice.transactions
            .sorted { $0.key > $1.key }
            .map { (key: $0.key, transactions: $0.value) }
    }

    func loadCards() async {
        do {
            cards = try await api.request(.cards())
            if selectedCardId == nil {
                selectedCardId = cards.first(where: \.isDefault)?.id ?? cards.first?.id
            }
        } catch {
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }
    }

    func loadCategories() async {
        do {
            categories = try await api.request(.categories())
        } catch {
            // Non-critical — categories only needed for add form
        }
    }

    func loadInvoice() async {
        guard let cardId = selectedCardId else { return }

        isLoading = true
        error = nil

        do {
            invoice = try await api.request(
                .invoiceSummary(month: currentMonth, year: currentYear, cardId: cardId)
            )
        } catch {
            self.error = error.localizedDescription
            self.errorKind = (error as? APIError)?.kind ?? .loadFailure
        }

        isLoading = false
    }

    func createTransaction(_ request: CreateTransactionRequest) async -> Bool {
        do {
            let _: TransactionResponse = try await api.request(.createTransaction(), body: request)
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func updateTransaction(_ request: UpdateTransactionRequest, transactionId: String) async -> Bool {
        do {
            let _: TransactionResponse = try await api.request(
                .updateTransaction(id: transactionId), body: request
            )
            await loadInvoice()
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
        let snapshot = invoice
        removeTransactionLocally(transaction)
        HapticManager.notification(.success)

        do {
            let _: TransactionResponse = try await api.request(
                .deleteTransaction(id: transaction.transactionId)
            )
        } catch {
            // Rollback on failure
            invoice = snapshot
            self.error = error.localizedDescription
            HapticManager.notification(.error)
        }
    }

    private func removeTransactionLocally(_ transaction: InvoiceTransaction) {
        guard var txns = invoice?.transactions else { return }
        for (date, group) in txns {
            txns[date] = group.filter { $0.id != transaction.id }
            if txns[date]?.isEmpty == true {
                txns.removeValue(forKey: date)
            }
        }
        invoice = invoice.map {
            InvoiceSummary(
                month: $0.month, year: $0.year, status: $0.status,
                total: $0.total - transaction.amount,
                limit: $0.limit, budget: $0.budget, available: $0.available + transaction.amount,
                transactions: txns, dueDate: $0.dueDate, closingDate: $0.closingDate
            )
        }
    }

    func load() async {
        async let cardsTask: () = loadCards()
        async let categoriesTask: () = loadCategories()
        _ = await (cardsTask, categoriesTask)
        await loadInvoice()
    }
}
