import Testing
import Foundation
import SwiftData
@testable import Du

@MainActor
struct NotificationsViewModelTests {
    private func makeContext() throws -> ModelContext {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(
            for: Card.self, Transaction.self, Installment.self, Insight.self,
            configurations: config
        )
        return ModelContext(container)
    }

    private static let isoFmt: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    private func date(_ iso: String) -> Date {
        guard let d = Self.isoFmt.date(from: iso) else { fatalError("Bad ISO \(iso)") }
        return d
    }

    @Test
    func emptyStoreReturnsNoGroups() {
        let result = NotificationsViewModel.project(
            now: date("2026-05-14T12:00:00Z"),
            insights: []
        )
        #expect(result.isEmpty)
    }

    // Insights from different days bucket into Hoje / Ontem / Esta semana
    // / Mais antigas, in that order. Empty buckets are skipped (the view
    // never renders a blank "Esta semana" header).
    @Test
    func insightsBucketByRelativeDate() {
        let now = date("2026-05-14T12:00:00Z")
        let insights = [
            Insight(createdAt: now,                                     text: "Hoje agora.",      kind: .auto),
            Insight(createdAt: date("2026-05-14T08:00:00Z"),            text: "Hoje cedo.",       kind: .alert),
            Insight(createdAt: date("2026-05-13T18:00:00Z"),            text: "Ontem.",           kind: .insight),
            Insight(createdAt: date("2026-05-10T09:00:00Z"),            text: "Quatro dias.",    kind: .reminder),
            Insight(createdAt: date("2026-04-01T09:00:00Z"),            text: "Mês passado.",    kind: .auto)
        ]

        let result = NotificationsViewModel.project(now: now, insights: insights)

        #expect(result.map(\.label) == ["Hoje", "Ontem", "Esta semana", "Mais antigas"])
        #expect(result[0].items.count == 2)
        #expect(result[1].items.count == 1)
        #expect(result[2].items.count == 1)
        #expect(result[3].items.count == 1)
    }

    // Newest-first within each bucket so a freshly-written insight
    // appears at the top of "Hoje" instead of sliding under the older one.
    @Test
    func itemsWithinABucketSortNewestFirst() {
        let now = date("2026-05-14T12:00:00Z")
        let insights = [
            Insight(createdAt: date("2026-05-14T08:00:00Z"), text: "Older today.",  kind: .auto),
            Insight(createdAt: now,                          text: "Newest.",       kind: .auto),
            Insight(createdAt: date("2026-05-14T10:00:00Z"), text: "Middle.",       kind: .auto)
        ]

        let result = NotificationsViewModel.project(now: now, insights: insights)
        #expect(result.count == 1)
        #expect(result[0].items.map(\.title) == ["Newest.", "Middle.", "Older today."])
    }

    // The view contract: an insight's `read` flag flows through to
    // `NotificationItem.unread`, `urgent` flows through, `actionLabel`
    // becomes `action`. The kind enum stays 1:1.
    @Test
    func insightFieldsMapOneToOneIntoNotificationItem() {
        let now = date("2026-05-14T12:00:00Z")
        let insight = Insight(
            createdAt: now,
            text: "Cartão a 85% do limite. Faltam 5 dias.",
            actionLabel: "Ver cartão",
            kind: .alert,
            urgent: true,
            read: false
        )

        let group = NotificationsViewModel.project(now: now, insights: [insight]).first
        let item = try! #require(group?.items.first)
        #expect(item.unread == true)
        #expect(item.urgent == true)
        #expect(item.kind == .alert)
        #expect(item.action == "Ver cartão")
        #expect(item.title == "Cartão a 85% do limite.")
        #expect(item.body == "Faltam 5 dias.")
    }

    // Single-sentence insights render with empty body; the view skips
    // the second line when body is empty so no awkward gap appears.
    @Test
    func singleSentenceTextProducesEmptyBody() {
        let (title, body) = NotificationsViewModel.splitTitleBody("Delivery passou do teto.")
        #expect(title == "Delivery passou do teto.")
        #expect(body == "")
    }

    // Insight order in the @Query result is reverse-chronological per
    // RootView, but the projector doesn't rely on that — it sorts
    // internally. Pass entities in any order and the result is stable.
    @Test
    func unsortedInputProducesSortedOutput() {
        let now = date("2026-05-14T12:00:00Z")
        let a = Insight(createdAt: date("2026-05-14T08:00:00Z"), text: "A.", kind: .auto)
        let b = Insight(createdAt: now,                          text: "B.", kind: .auto)
        let result = NotificationsViewModel.project(now: now, insights: [a, b]).first
        #expect(result?.items.map(\.title) == ["B.", "A."])
    }

    // Mark-all-read round-trip: SwiftData store insights start unread,
    // a call mirroring RootView.markAllInsightsRead flips the flags and
    // a fresh fetch + projection produces unread:false everywhere.
    @Test
    func markAllReadRoundTripsThroughSwiftData() throws {
        let context = try makeContext()
        let now = date("2026-05-14T12:00:00Z")
        context.insert(Insight(createdAt: now, text: "A.", kind: .auto, read: false))
        context.insert(Insight(createdAt: now, text: "B.", kind: .alert, urgent: true, read: false))
        try context.save()

        let before = try context.fetch(FetchDescriptor<Insight>())
        for ins in before where !ins.read { ins.read = true }
        try context.save()

        let after = try context.fetch(FetchDescriptor<Insight>())
        let projected = NotificationsViewModel.project(now: now, insights: after)
        let unreadCount = projected.flatMap(\.items).filter(\.unread).count
        #expect(unreadCount == 0)
    }
}
