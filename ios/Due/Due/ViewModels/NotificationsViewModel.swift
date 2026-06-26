import Foundation

// Projects raw SwiftData Insight entities into the NotificationsView's
// grouped contract. Pure function — easy to unit-test by feeding hand-
// crafted insight arrays.
//
// Title/body split: Insight has a single `text` field. We split on the
// first sentence so a two-sentence insight ("X. Y.") renders title "X."
// and body "Y." — matches how the seeder + onboarding write insights
// today. Single-sentence inputs render with an empty body, which the
// view handles cleanly (it just doesn't render the second line).
@MainActor
enum NotificationsViewModel {
    static func project(
        now: Date = .now,
        insights: [Insight]
    ) -> [NotificationGroup] {
        let cal = Calendar.current

        // Bucket: 0 = today, 1 = yesterday, 2 = this week, 3 = older.
        // Stable ordering preserved within each bucket: newest first.
        let sorted = insights.sorted { $0.createdAt > $1.createdAt }
        var buckets: [Int: [Insight]] = [:]
        for ins in sorted {
            buckets[bucketIndex(ins.createdAt, now: now, cal: cal), default: []].append(ins)
        }

        let groupSpec: [(Int, String)] = [
            (0, "Hoje"),
            (1, "Ontem"),
            (2, "Esta semana"),
            (3, "Mais antigas")
        ]
        return groupSpec.compactMap { (idx, label) in
            guard let items = buckets[idx], !items.isEmpty else { return nil }
            return NotificationGroup(
                label: label,
                items: items.map { mapToItem($0, now: now, cal: cal) }
            )
        }
    }

    // MARK: - Bucketing

    private static func bucketIndex(_ date: Date, now: Date, cal: Calendar) -> Int {
        // Compare against the injected `now`, not the wall clock, so bucketing
        // is deterministic in tests (isDateInToday/isYesterday read the real
        // date). In production `now` is `.now`, so behavior is unchanged.
        if cal.isDate(date, inSameDayAs: now) { return 0 }
        if let yesterday = cal.date(byAdding: .day, value: -1, to: now),
           cal.isDate(date, inSameDayAs: yesterday) { return 1 }
        let days = cal.dateComponents([.day], from: date, to: now).day ?? 0
        if days < 7 { return 2 }
        return 3
    }

    // MARK: - Item mapping

    private static func mapToItem(_ ins: Insight, now: Date, cal: Calendar) -> NotificationItem {
        let (title, body) = splitTitleBody(ins.text)
        return NotificationItem(
            unread: !ins.read,
            kind: kind(from: ins.kind),
            title: title,
            body: body,
            time: displayTime(for: ins.createdAt, now: now, cal: cal),
            action: ins.actionLabel,
            urgent: ins.urgent
        )
    }

    private static func kind(from kind: InsightKind) -> NotificationItem.Kind {
        switch kind {
        case .auto:     return .auto
        case .alert:    return .alert
        case .insight:  return .insight
        case .reminder: return .reminder
        }
    }

    /// Splits "Foo. Bar baz." into ("Foo.", "Bar baz."). When no sentence
    /// boundary is present the whole string becomes the title and body
    /// is empty — view renders title-only cleanly.
    static func splitTitleBody(_ text: String) -> (title: String, body: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let dotRange = trimmed.range(of: ". ") else {
            return (trimmed, "")
        }
        let title = String(trimmed[..<dotRange.upperBound]).trimmingCharacters(in: .whitespaces)
        let body = String(trimmed[dotRange.upperBound...])
        return (title, body)
    }

    // MARK: - Time strings

    private static let timeFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "HH:mm"
        return f
    }()

    private static let weekdayFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "EEE"
        return f
    }()

    private static let dayMonthFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.dateFormat = "dd MMM"
        return f
    }()

    static func displayTime(for date: Date, now: Date, cal: Calendar) -> String {
        let mins = cal.dateComponents([.minute], from: date, to: now).minute ?? 0
        if mins < 60 { return "agora" }
        let yesterday = cal.date(byAdding: .day, value: -1, to: now)
        if cal.isDate(date, inSameDayAs: now)
            || (yesterday.map { cal.isDate(date, inSameDayAs: $0) } ?? false) {
            return timeFmt.string(from: date)
        }
        let days = cal.dateComponents([.day], from: date, to: now).day ?? 0
        if days < 7 {
            let wd = String(weekdayFmt.string(from: date).prefix(3))
                .replacingOccurrences(of: ".", with: "")
                .lowercased()
            return "\(wd), \(timeFmt.string(from: date))"
        }
        return dayMonthFmt.string(from: date).lowercased()
    }
}
