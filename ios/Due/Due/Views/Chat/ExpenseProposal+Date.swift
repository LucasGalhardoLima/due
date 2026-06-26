import Foundation

extension ExpenseProposal {
    /// Resolves the proposal's free-form date/time strings into a concrete
    /// `Date` for Transaction.timestamp. Accepts the three shapes Du
    /// currently emits — "Hoje", "Ontem", "dd/MM" — and falls back to
    /// `now` on anything else. The time string is "HH:mm" pt-BR; an
    /// empty/unparseable time keeps the calendar day with the current
    /// hour/minute (matches "I logged it right now" intuition).
    func proposedDate(now: Date = Date(),
                      calendar: Calendar = .current,
                      locale: Locale = Locale(identifier: "pt_BR")) -> Date {
        var cal = calendar
        cal.locale = locale

        let baseDay: Date = {
            let label = date.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            switch label {
            case "", "hoje":
                return now
            case "ontem":
                return cal.date(byAdding: .day, value: -1, to: now) ?? now
            default:
                let parser = DateFormatter()
                parser.locale = locale
                parser.calendar = cal
                parser.dateFormat = "dd/MM"
                if let parsed = parser.date(from: label) {
                    // dd/MM has no year — pin it to the current year so a
                    // confirmation in May 2026 doesn't write a 2001 row.
                    let year = cal.component(.year, from: now)
                    var comps = cal.dateComponents([.day, .month], from: parsed)
                    comps.year = year
                    return cal.date(from: comps) ?? now
                }
                return now
            }
        }()

        let timeFmt = DateFormatter()
        timeFmt.locale = locale
        timeFmt.calendar = cal
        timeFmt.dateFormat = "HH:mm"
        guard let parsedTime = timeFmt.date(from: time) else {
            return baseDay
        }
        let h = cal.component(.hour, from: parsedTime)
        let m = cal.component(.minute, from: parsedTime)
        return cal.date(bySettingHour: h, minute: m, second: 0, of: baseDay) ?? baseDay
    }
}
