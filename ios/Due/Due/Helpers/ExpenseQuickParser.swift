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
        "mercado": "Mercado",
        "drogasil": "Saúde",
        "spotify": "Assinaturas",
        "netflix": "Assinaturas",
        "posto": "Combustível"
    ]

    private static let regex: NSRegularExpression? = {
        let merchants = categoryByMerchant.keys.joined(separator: "|")
        let pattern = #"(?i)(?:^|\s)(\#(merchants))\s+(\d+(?:[.,]\d{1,2})?)"#
        return try? NSRegularExpression(pattern: pattern)
    }()

    static func parse(_ input: String, now: Date = Date()) -> ExpenseProposal? {
        guard let regex else { return nil }
        let ns = input as NSString
        guard let match = regex.firstMatch(in: input, range: NSRange(location: 0, length: ns.length)),
              match.numberOfRanges == 3 else { return nil }

        let merchantRaw = ns.substring(with: match.range(at: 1)).lowercased()
        let amountRaw = ns.substring(with: match.range(at: 2))
            .replacingOccurrences(of: ",", with: ".")
        guard let amount = Decimal(string: amountRaw) else { return nil }

        let merchant = merchantRaw.prefix(1).uppercased() + merchantRaw.dropFirst()
        let category = categoryByMerchant[merchantRaw] ?? "Outros"

        let timeFmt = DateFormatter()
        timeFmt.locale = Locale(identifier: "pt_BR")
        timeFmt.dateFormat = "HH:mm"

        return ExpenseProposal(
            merchant: merchant,
            amount: amount,
            category: category,
            date: "Hoje",
            time: timeFmt.string(from: now)
        )
    }
}
