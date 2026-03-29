import Foundation

struct AppNotification: Codable, Identifiable {
    let id: String
    let type: NotificationType
    let title: String
    let body: String
    let deepLink: String?
    var isRead: Bool
    let createdAt: Date

    var relativeTimestamp: String {
        let now = Date()
        let interval = now.timeIntervalSince(createdAt)
        let minutes = Int(interval / 60)
        let hours = Int(interval / 3600)
        let days = Int(interval / 86400)

        if minutes < 1 { return "agora" }
        if minutes < 60 { return "há \(minutes)min" }
        if hours < 24 { return "há \(hours)h" }
        if days == 1 { return "ontem" }
        if days < 7 { return "há \(days) dias" }
        return DateFormatters.dayMonth.string(from: createdAt)
    }

    var typeIcon: String {
        type.icon
    }
}

enum NotificationType: String, Codable {
    case aiTip = "ai_tip"
    case weeklySummary = "weekly_summary"
    case spendingInsight = "spending_insight"
    case achievement = "achievement"

    var icon: String {
        switch self {
        case .aiTip: "lightbulb.fill"
        case .weeklySummary: "chart.bar.fill"
        case .spendingInsight: "arrow.up.right"
        case .achievement: "trophy.fill"
        }
    }
}

struct NotificationsResponse: Codable {
    let notifications: [AppNotification]
    let unreadCount: Int
}

struct UnreadCountResponse: Codable {
    let unreadCount: Int
}
