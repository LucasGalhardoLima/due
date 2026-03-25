import Foundation

struct InvoiceSummary: Decodable {
    let month: Int
    let year: Int
    let status: String?
    let total: Double
    let limit: Double
    let budget: Double
    let available: Double
    let transactions: [String: [InvoiceTransaction]]
    let dueDate: String?
    let closingDate: String?
}

struct InvoiceTransaction: Decodable, Identifiable {
    let id: String
    let transactionId: String
    let description: String
    let amount: Double
    let category: String
    let categoryIcon: String
    let installmentNumber: Int
    let totalInstallments: Int
    let cardName: String
    let purchaseDate: String
}

struct TransactionListResponse: Decodable {
    let month: Int
    let year: Int
    let transactions: [InvoiceTransaction]
    let total: Int
}
