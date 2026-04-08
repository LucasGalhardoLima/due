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

struct UpdateTransactionRequest: Encodable {
    let description: String
    let amount: Double
    let purchaseDate: String
    let installmentsCount: Int
    let cardId: String
    let categoryId: String?
    let isSubscription: Bool
}

struct TransactionResponse: Decodable {
    let id: String
}
