import Foundation

// Deterministic merchant+amount extractor. Runs BEFORE any LLM tier so
// the common "iFood 47" / "Uber 23,50" path bypasses model warmup and
// produces an ExpenseProposal in microseconds. Returns nil for anything
// that doesn't look like an expense (questions, free-form chat) — the
// caller is expected to fall through to its backend.
//
// Why a hand-rolled regex instead of NLTagger: NLTagger gives PoS tags
// but no amount handling, and the merchant whitelist is small + brand-
// shaped (proper nouns we already know). A dictionary lookup over a
// narrow set is simpler, faster, and dependency-free. Swapping in
// NLTagger is justified only when we start accepting free-form
// merchants that aren't on the whitelist.
enum ExpenseQuickParser: Sendable {
    /// Merchants we recognize today. Order matters only for category mapping,
    /// not for regex correctness (the pattern is `|`-joined anyway).
    private static let categoryByMerchant: [String: String] = [
        "ifood": "Delivery",
        "uber": "Mobilidade",
        "99": "Mobilidade",
        "padaria": "Mercado",
        "padoca": "Mercado",
        "mercado": "Mercado",
        "drogasil": "Saúde",
        "spotify": "Assinaturas",
        "netflix": "Assinaturas",
        "posto": "Combustível",
        // Delivery / food
        "rappi": "Delivery",
        "ze delivery": "Delivery",
        "ze": "Delivery",
        "zé": "Delivery",
        "burger king": "Delivery",
        "mcdonalds": "Delivery",
        "subway": "Delivery",
        "starbucks": "Delivery",
        // Saúde
        "farmacia": "Saúde",
        "farmácia": "Saúde",
        "drogaria": "Saúde",
        "remedio": "Saúde",
        "remédio": "Saúde",
        "academia": "Saúde",
        "smart fit": "Saúde",
        // Combustível
        "gasolina": "Combustível",
        "combustivel": "Combustível",
        "combustível": "Combustível",
        "etanol": "Combustível",
        // Outros
        "picpay": "Outros",
        "shopee": "Outros",
        "shein": "Outros"
    ]

    // Static DateFormatter — allocated once, not per parse() call.
    private static let timeFmt: DateFormatter = {
        let fmt = DateFormatter()
        fmt.locale = Locale(identifier: "pt_BR")
        fmt.dateFormat = "HH:mm"
        return fmt
    }()

    // Regex for "merchant amount" (standard order).
    // Multi-word merchants are sorted longest-first so "burger king"
    // wins over a bare "burger" if we add it later.
    private static let regex: NSRegularExpression? = {
        let sorted = categoryByMerchant.keys
            .sorted { $0.count > $1.count }
            .map { NSRegularExpression.escapedPattern(for: $0) }
            .joined(separator: "|")
        let pattern = #"(?i)(?:^|\s)(\#(sorted))\s+(\d+(?:[.,]\d{1,2})?)"#
        return try? NSRegularExpression(pattern: pattern)
    }()

    // Regex for "gastei/paguei/comprei/gasto AMOUNT (no|na|de|em|pro|pra|num|numa) merchant"
    // Capture groups: (1) amount, (2) merchant
    private static let prepRegex: NSRegularExpression? = {
        let sorted = categoryByMerchant.keys
            .sorted { $0.count > $1.count }
            .map { NSRegularExpression.escapedPattern(for: $0) }
            .joined(separator: "|")
        let pattern = #"(?i)(?:gastei|paguei|comprei|gasto)\s+(\d+(?:[.,]\d{1,2})?)\s+(?:no|na|de|em|pro|pra|num|numa)\s+(\#(sorted))"#
        return try? NSRegularExpression(pattern: pattern)
    }()

    static func parse(_ input: String, now: Date = Date()) -> ExpenseProposal? {
        // ── Step 1: strip optional date prefix ──────────────────────────────
        var dateLabel = "Hoje"
        var body = input.trimmingCharacters(in: .whitespacesAndNewlines)

        let lc = body.lowercased()
        if lc.hasPrefix("anteontem ") {
            // "Anteontem" is not handled by ExpenseProposal+Date — use "Ontem" as fallback.
            dateLabel = "Ontem"
            body = String(body.dropFirst("anteontem ".count))
        } else if lc.hasPrefix("ontem ") {
            dateLabel = "Ontem"
            body = String(body.dropFirst("ontem ".count))
        }

        // ── Step 2: try preposition pattern (amount before merchant) ─────────
        if let proposal = matchPrep(body, dateLabel: dateLabel, now: now) {
            return proposal
        }

        // ── Step 3: try standard merchant+amount pattern ─────────────────────
        return matchStandard(body, dateLabel: dateLabel, now: now)
    }

    // MARK: - Private helpers

    private static func matchStandard(_ input: String, dateLabel: String, now: Date) -> ExpenseProposal? {
        guard let regex else { return nil }
        let ns = input as NSString
        guard let match = regex.firstMatch(in: input, range: NSRange(location: 0, length: ns.length)),
              match.numberOfRanges == 3 else { return nil }

        let merchantRaw = ns.substring(with: match.range(at: 1)).lowercased()
        let amountRaw = ns.substring(with: match.range(at: 2))
            .replacingOccurrences(of: ",", with: ".")
        guard let amount = Decimal(string: amountRaw) else { return nil }

        return proposal(merchantRaw: merchantRaw, amount: amount, dateLabel: dateLabel, now: now)
    }

    private static func matchPrep(_ input: String, dateLabel: String, now: Date) -> ExpenseProposal? {
        guard let prepRegex else { return nil }
        let ns = input as NSString
        guard let match = prepRegex.firstMatch(in: input, range: NSRange(location: 0, length: ns.length)),
              match.numberOfRanges == 3 else { return nil }

        let amountRaw = ns.substring(with: match.range(at: 1))
            .replacingOccurrences(of: ",", with: ".")
        let merchantRaw = ns.substring(with: match.range(at: 2)).lowercased()
        guard let amount = Decimal(string: amountRaw) else { return nil }

        return proposal(merchantRaw: merchantRaw, amount: amount, dateLabel: dateLabel, now: now)
    }

    private static func proposal(merchantRaw: String, amount: Decimal, dateLabel: String, now: Date) -> ExpenseProposal {
        let merchant = merchantRaw.prefix(1).uppercased() + merchantRaw.dropFirst()
        let category = categoryByMerchant[merchantRaw] ?? "Outros"

        return ExpenseProposal(
            merchant: merchant,
            amount: amount,
            category: category,
            date: dateLabel,
            time: timeFmt.string(from: now)
        )
    }
}
