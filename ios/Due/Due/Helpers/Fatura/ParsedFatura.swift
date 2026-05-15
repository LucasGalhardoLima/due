import Foundation

struct ParsedFatura: Sendable, Equatable {
    let bank: String
    let billingPeriod: String
    let transactions: [ParsedTransaction]
    let skippedInstallments: [SkippedInstallment]
    let stats: ParseStats
}

struct ParsedTransaction: Sendable, Equatable {
    let purchaseDate: String
    let rawDescription: String
    let amount: Decimal
    let installmentsCount: Int
    let bankCategory: String
    let city: String
}

struct SkippedInstallment: Sendable, Equatable {
    let description: String
    let amount: Decimal
    let installmentNumber: Int
    let installmentsTotal: Int
}

struct ParseStats: Sendable, Equatable {
    let totalLines: Int
    let newPurchases: Int
    let skippedOngoing: Int
    let skippedAdjustments: Int
}

protocol FaturaParser: Sendable {
    var bankId: String { get }
    func detect(rawText: String) -> Bool
    func parse(rawText: String) throws -> ParsedFatura
}

enum FaturaParseError: Error, Equatable {
    case unknownBillingPeriod
    case unsupportedBank
}
