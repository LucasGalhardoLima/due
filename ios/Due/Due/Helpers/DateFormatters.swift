import Foundation

enum DateFormatters: Sendable {
    /// ISO 8601 for API communication
    nonisolated(unsafe) static let iso8601: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    /// ISO 8601 without fractional seconds fallback
    nonisolated(unsafe) static let iso8601NoFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    /// "dd/MM/yyyy" display format
    static let dayMonthYear: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "dd/MM/yyyy"
        f.locale = Locale(identifier: "pt_BR")
        return f
    }()

    /// "dd MMM" short display (e.g., "15 jan")
    static let dayMonth: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "dd MMM"
        f.locale = Locale(identifier: "pt_BR")
        return f
    }()

    /// "MMMM yyyy" for month headers (e.g., "janeiro 2026")
    static let monthYear: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        f.locale = Locale(identifier: "pt_BR")
        return f
    }()

    /// "yyyy-MM-dd" for API date-only strings
    static let apiDate: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    static func parseISO(_ string: String) -> Date? {
        iso8601.date(from: string) ?? iso8601NoFraction.date(from: string)
    }
}
