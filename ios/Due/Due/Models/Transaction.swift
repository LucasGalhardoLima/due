import Foundation

struct CreateTransactionRequest: Codable {
    let description: String
    let amount: Double
    let purchaseDate: String
    let installmentsCount: Int
    let cardId: String
    let categoryId: String?
    let isSubscription: Bool
}

typealias UpdateTransactionRequest = CreateTransactionRequest

struct TransactionResponse: Decodable {
    let id: String
    let description: String
    let amount: Double
    let purchaseDate: String
    let installmentsCount: Int
    let cardId: String
    let categoryId: String
    let isSubscription: Bool
    let active: Bool
}
