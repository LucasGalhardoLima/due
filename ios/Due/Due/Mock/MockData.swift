import Foundation

// ─────────────────────────────────────────────────────────────
// Residual mock data. Home, Cartão, and Notifications are now
// projected from SwiftData via their respective *ViewModel.project
// functions, so the per-screen statics that used to live here have
// been deleted.
//
// What remains: `MockData.overview` is read by OverviewViewModel
// for the editorial sections (`habits`, `economyPotential6mo`) that
// require real pattern-detection AI we haven't built yet. When that
// pipeline lands, this file disappears — only the view-contract
// structs below stay (they're tied to the view layouts, not to
// mock content).
// ─────────────────────────────────────────────────────────────

enum MockData {
    static let overview = OverviewData(
        months: ["out", "nov", "dez", "jan", "fev", "mar"],
        totals: [24_100, 25_800, 27_200, 26_900, 28_400, 30_017],
        totalSpent: 178_400,
        peakMonth: "mar",
        economyPotential6mo: 4_303 * 6,
        habits: [
            OverviewHabit(
                title: "Delivery virou hábito",
                kpi: "+R$ 1.180/mês acima do teto",
                trend: [410, 520, 680, 870, 1050, 1180],
                severity: .high,
                lede: "12× por semana em média. Subiu 32% desde janeiro.",
                details: [
                    .init(label: "Frequência",      value: "12×/semana"),
                    .init(label: "Ticket médio",    value: "R$ 67,40"),
                    .init(label: "iFood",           value: "78% dos pedidos"),
                    .init(label: "Janela crítica", value: "Qua–Sex, 21h")
                ]
            ),
            OverviewHabit(
                title: "Estouro no fim do mês",
                kpi: "+47% nos últimos 8 dias",
                trend: [60, 50, 80, 70, 90, 95],
                severity: .high,
                lede: "Padrão se repete há 5 meses. Sintoma de cartão sem rédea.",
                details: [
                    .init(label: "Dias 23–30",            value: "47% do mês"),
                    .init(label: "Dias 1–22",             value: "53% do mês"),
                    .init(label: "Categoria que mais sobe", value: "Lazer")
                ]
            ),
            OverviewHabit(
                title: "Assinaturas duplicadas",
                kpi: "R$ 89/mês perdidos",
                trend: [89, 89, 89, 89, 89, 89],
                severity: .medium,
                lede: "Spotify Family + Spotify pessoal. Disney+ não usado há 3 meses.",
                details: [
                    .init(label: "Spotify (×2)",     value: "R$ 55,80"),
                    .init(label: "Disney+ inativa",  value: "R$ 33,90")
                ]
            )
        ]
    )

}

// MARK: - Home

struct HomeData {
    let disponivel: Int
    let monthLabel: String   // PT-BR short month, e.g. "MAI"
    let dia: Int
    let totalDias: Int
    let cardCloses: Int
    let cardFatura: Int
    let cardLimitePct: Int
    let insights: [HomeInsight]
    let recentes: [RecentItem]

    var diasRestantes: Int { max(1, totalDias - dia) }
    var porDia: Int { disponivel / diasRestantes }

    enum CardLevel { case later, soon, urgent }
    var cardLevel: CardLevel {
        switch cardCloses {
        case ...3: return .urgent
        case 4...6: return .soon
        default: return .later
        }
    }
}

struct HomeInsight: Identifiable {
    let id = UUID()
    let time: String
    let text: String
    let actionLabel: String?
}

struct RecentItem: Identifiable {
    let id = UUID()
    let name: String
    let amount: Double      // negative = despesa, positive = entrada
    let sub: String
    var isIncome: Bool { amount > 0 }
}

// MARK: - Cartão

struct CartaoData {
    let fatura: Int
    let limite: Int
    let fechaEm: Int
    let categorias: [CartaoCategory]
    let recent: [CartaoTxn]
    // Estimated total when the open invoice closes. 0 = not enough data to project.
    let projecao: Int

    // Guard against division-by-zero when there are no cards yet —
    // CartaoViewModel returns `limite: 0` in that case and computing
    // pct without the guard yields NaN → fatal Int conversion.
    var pct: Int {
        guard limite > 0 else { return 0 }
        return Int((Double(fatura) / Double(limite) * 100).rounded())
    }
    var livre: Int { limite - fatura }
}

struct CartaoCategory: Identifiable {
    let id = UUID()
    let name: String
    let valor: Int
    let share: Int          // percentage of bill
    let over: Bool
}

struct CartaoTxn: Identifiable {
    let id = UUID()
    let merchant: String
    let amount: Double
    let category: String
    let when: String
}

// MARK: - Overview

struct OverviewData {
    let months: [String]
    let totals: [Int]
    let totalSpent: Int
    let peakMonth: String
    let economyPotential6mo: Int
    let habits: [OverviewHabit]

    var avgMonth: Int { totalSpent / 6 }
}

struct OverviewHabit: Identifiable {
    let id = UUID()
    let title: String
    let kpi: String
    let trend: [Int]
    let severity: Severity
    let lede: String
    let details: [Detail]

    enum Severity { case high, medium }

    struct Detail: Identifiable {
        let id = UUID()
        let label: String
        let value: String
    }
}

// MARK: - Notifications

struct NotificationGroup: Identifiable {
    let id = UUID()
    let label: String
    let items: [NotificationItem]
}

struct NotificationItem: Identifiable {
    let id = UUID()
    let unread: Bool
    let kind: Kind
    let title: String
    let body: String
    let time: String
    let action: String?
    let urgent: Bool

    enum Kind { case auto, alert, insight, reminder }
}
