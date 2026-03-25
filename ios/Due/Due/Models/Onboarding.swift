import Foundation

struct OnboardingStatus: Decodable {
    let completedAt: String?
    let step: Int

    var isCompleted: Bool { completedAt != nil }
}

struct OnboardingStepUpdate: Encodable {
    let step: Int?
    let completed: Bool?

    static func step(_ n: Int) -> OnboardingStepUpdate {
        OnboardingStepUpdate(step: n, completed: nil)
    }

    static func complete() -> OnboardingStepUpdate {
        OnboardingStepUpdate(step: nil, completed: true)
    }
}

struct CreateCardRequest: Encodable {
    let name: String
    let limit: Double
    let closingDay: Int
    let dueDay: Int
}

struct CreateIncomeRequest: Encodable {
    let description: String
    let amount: Double
    let isRecurring: Bool
    let month: Int
    let year: Int
}

struct SeedCategoriesResponse: Decodable {
    let created: Bool
}
