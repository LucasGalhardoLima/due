import Foundation

@MainActor
@Observable
final class NotificationsViewModel {
    var notifications: [AppNotification] = []
    var unreadCount: Int = 0
    var isLoading = false
    var error: ErrorKind?

    private let api = APIClient.shared

    func load() async {
        isLoading = true
        error = nil

        do {
            let response: NotificationsResponse = try await api.request(.notifications())
            notifications = response.notifications
            unreadCount = response.unreadCount
        } catch {
            // Backend not yet available — use mock data
            if notifications.isEmpty {
                notifications = Self.mockNotifications
                unreadCount = Self.mockNotifications.filter { !$0.isRead }.count
            }
            self.error = (error as? APIError)?.kind ?? .loadFailure
        }

        isLoading = false
    }

    func markAsRead(_ id: String) async {
        guard let index = notifications.firstIndex(where: { $0.id == id }),
              !notifications[index].isRead else { return }

        notifications[index].isRead = true
        unreadCount = max(0, unreadCount - 1)

        do {
            let _: EmptyResponse = try await api.request(
                .markNotificationRead(id: id),
                body: MarkReadBody(isRead: true)
            )
        } catch {
            // Revert on failure
            notifications[index].isRead = false
            unreadCount += 1
        }
    }

    func markAllAsRead() async {
        let previousNotifications = notifications
        let previousCount = unreadCount

        for i in notifications.indices {
            notifications[i].isRead = true
        }
        unreadCount = 0

        do {
            let _: EmptyResponse = try await api.request(.markAllNotificationsRead(), body: EmptyBody())
        } catch {
            notifications = previousNotifications
            unreadCount = previousCount
        }
    }

    func loadUnreadCount() async {
        do {
            let response: UnreadCountResponse = try await api.request(.unreadNotificationCount())
            unreadCount = response.unreadCount
        } catch {
            // Keep current count on failure
        }
    }

    // MARK: - Mock Data (backend not yet available)

    private static let mockNotifications: [AppNotification] = {
        let now = Date()
        return [
            AppNotification(
                id: "mock-1",
                type: .spendingInsight,
                title: "Gasto acima do normal",
                body: "Seus gastos com delivery aumentaram 40% este mês comparado ao anterior.",
                deepLink: nil,
                isRead: false,
                createdAt: now.addingTimeInterval(-3600)
            ),
            AppNotification(
                id: "mock-2",
                type: .aiTip,
                title: "Dica do Du",
                body: "Você sabia que pode economizar R$120/mês revisando suas assinaturas?",
                deepLink: nil,
                isRead: false,
                createdAt: now.addingTimeInterval(-7200)
            ),
            AppNotification(
                id: "mock-3",
                type: .weeklySummary,
                title: "Resumo semanal",
                body: "Você gastou R$1.230 esta semana. Alimentação foi sua maior categoria.",
                deepLink: nil,
                isRead: true,
                createdAt: now.addingTimeInterval(-86400)
            ),
            AppNotification(
                id: "mock-4",
                type: .achievement,
                title: "Conquista desbloqueada! 🏆",
                body: "Você ficou dentro do orçamento por 2 semanas seguidas!",
                deepLink: nil,
                isRead: true,
                createdAt: now.addingTimeInterval(-172800)
            ),
        ]
    }()
}

private struct MarkReadBody: Encodable {
    let isRead: Bool
}

private struct EmptyBody: Encodable {}

private struct EmptyResponse: Decodable {}
