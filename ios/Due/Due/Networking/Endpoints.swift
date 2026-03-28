import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

struct Endpoint {
    let path: String
    let method: HTTPMethod
    let queryItems: [URLQueryItem]

    init(path: String, method: HTTPMethod = .get, queryItems: [URLQueryItem] = []) {
        self.path = path
        self.method = method
        self.queryItems = queryItems
    }

    var url: URL? {
        var components = URLComponents(string: AppConfig.apiBaseURL + path)
        if !queryItems.isEmpty {
            components?.queryItems = queryItems
        }
        return components?.url
    }
}

// MARK: - Dashboard

extension Endpoint {
    static func budgetSummary(month: Int, year: Int) -> Endpoint {
        Endpoint(
            path: "/api/budget/summary",
            queryItems: [
                URLQueryItem(name: "month", value: String(month)),
                URLQueryItem(name: "year", value: String(year)),
            ]
        )
    }

    static func duScore() -> Endpoint {
        Endpoint(path: "/api/dashboard/du-score")
    }

    static func upcomingBills(limit: Int = 5) -> Endpoint {
        Endpoint(
            path: "/api/dashboard/upcoming-bills",
            queryItems: [URLQueryItem(name: "limit", value: String(limit))]
        )
    }
}

// MARK: - Transactions

extension Endpoint {
    static func invoiceSummary(month: Int, year: Int, cardId: String) -> Endpoint {
        Endpoint(
            path: "/api/invoices/summary",
            queryItems: [
                URLQueryItem(name: "month", value: String(month)),
                URLQueryItem(name: "year", value: String(year)),
                URLQueryItem(name: "cardId", value: cardId),
            ]
        )
    }

    static func cards() -> Endpoint {
        Endpoint(path: "/api/cards")
    }

    static func categories() -> Endpoint {
        Endpoint(path: "/api/categories")
    }

    static func createTransaction() -> Endpoint {
        Endpoint(path: "/api/transactions", method: .post)
    }

    static func updateTransaction(id: String) -> Endpoint {
        Endpoint(path: "/api/transactions/\(id)", method: .put)
    }

    static func deleteTransaction(id: String) -> Endpoint {
        Endpoint(path: "/api/transactions/\(id)", method: .delete)
    }

    static func transactionList(month: Int, year: Int, categoryId: String? = nil, cardId: String? = nil) -> Endpoint {
        var items = [
            URLQueryItem(name: "month", value: String(month)),
            URLQueryItem(name: "year", value: String(year)),
        ]
        if let categoryId {
            items.append(URLQueryItem(name: "categoryId", value: categoryId))
        }
        if let cardId {
            items.append(URLQueryItem(name: "cardId", value: cardId))
        }
        return Endpoint(path: "/api/transactions", queryItems: items)
    }
}

// MARK: - Onboarding

extension Endpoint {
    static func onboardingStatus() -> Endpoint {
        Endpoint(path: "/api/user/onboarding")
    }

    static func updateOnboardingStep() -> Endpoint {
        Endpoint(path: "/api/user/onboarding", method: .put)
    }

    static func seedCategories() -> Endpoint {
        Endpoint(path: "/api/onboarding/seed-categories", method: .post)
    }

    static func createCard() -> Endpoint {
        Endpoint(path: "/api/cards", method: .post)
    }

    static func createIncome() -> Endpoint {
        Endpoint(path: "/api/income", method: .post)
    }
}

// MARK: - AI

extension Endpoint {
    static func parseExpense() -> Endpoint {
        Endpoint(path: "/api/ai/parse-expense", method: .post)
    }

    static func aiInsights() -> Endpoint {
        Endpoint(path: "/api/ai/insights")
    }
}

// MARK: - Chat

extension Endpoint {
    static func chatStream() -> Endpoint {
        Endpoint(path: "/api/chat", method: .post)
    }
}

// MARK: - Installments

extension Endpoint {
    static func installmentsTimeline(months: Int = 6, cardId: String? = nil) -> Endpoint {
        var items = [URLQueryItem(name: "months", value: String(months))]
        if let cardId {
            items.append(URLQueryItem(name: "cardId", value: cardId))
        }
        return Endpoint(path: "/api/installments/timeline", queryItems: items)
    }

    static func installmentsHealth(cardId: String? = nil) -> Endpoint {
        var items: [URLQueryItem] = []
        if let cardId {
            items.append(URLQueryItem(name: "cardId", value: cardId))
        }
        return Endpoint(path: "/api/installments/health", queryItems: items)
    }
}
