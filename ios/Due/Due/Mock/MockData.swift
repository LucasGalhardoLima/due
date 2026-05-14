import Foundation

// ─────────────────────────────────────────────────────────────
// All hard-coded values from the prototype live here so they're
// trivial to replace once real data lands. Each screen's view
// reads from `MockData.{home,cartao,overview,notifications,...}`
// — never hard-codes the values inline.
//
// To wire real data: swap `MockData.foo` for the live source and
// delete the static here. The view contract (the structs below)
// is what survives.
// ─────────────────────────────────────────────────────────────

enum MockData {
    static let home = HomeData(
        disponivel: 4983,
        monthLabel: "MAR",
        dia: 24,
        totalDias: 31,
        cardCloses: 10,
        cardFatura: 21403,
        cardLimitePct: 85,
        insights: [
            HomeInsight(time: "agora", text: "Delivery passou do teto em R$ 1.180.", actionLabel: "Ver"),
            HomeInsight(time: "ontem", text: "3 parcelas terminam em abril. Liberam R$ 2.340 na próxima fatura.", actionLabel: nil)
        ],
        recentes: [
            RecentItem(name: "iFood",              amount: -47.90,    sub: "hoje · 19:24"),
            RecentItem(name: "Supermercado Extra", amount: -312.45,   sub: "ontem"),
            RecentItem(name: "Salário",            amount: 35_000,    sub: "22 mar"),
            RecentItem(name: "Spotify",            amount: -34.90,    sub: "20 mar")
        ]
    )

    static let cartao = CartaoData(
        fatura: 21_403,
        limite: 25_000,
        fechaEm: 5,
        categorias: [
            CartaoCategory(name: "Delivery",    valor: 5_840, share: 27, over: true),
            CartaoCategory(name: "Mercado",     valor: 3_892, share: 18, over: true),
            CartaoCategory(name: "Mobilidade",  valor: 2_410, share: 11, over: false),
            CartaoCategory(name: "Assinaturas", valor: 1_670, share: 8,  over: false),
            CartaoCategory(name: "Saúde",       valor: 1_480, share: 7,  over: false),
            CartaoCategory(name: "Outros",      valor: 6_111, share: 29, over: false)
        ],
        recent: [
            CartaoTxn(merchant: "iFood",         amount: 47.90,  category: "Delivery",    when: "hoje · 21:14"),
            CartaoTxn(merchant: "Uber",          amount: 23.50,  category: "Mobilidade",  when: "hoje · 14:20"),
            CartaoTxn(merchant: "Pão de Açúcar", amount: 312.45, category: "Mercado",     when: "ontem · 19:32"),
            CartaoTxn(merchant: "Drogasil",      amount: 89.10,  category: "Saúde",       when: "ontem · 11:08"),
            CartaoTxn(merchant: "Spotify",       amount: 34.90,  category: "Assinaturas", when: "ter · 03:00"),
            CartaoTxn(merchant: "iFood",         amount: 62.30,  category: "Delivery",    when: "seg · 20:45")
        ]
    )

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

    static let notifications: [NotificationGroup] = [
        NotificationGroup(label: "Hoje", items: [
            NotificationItem(unread: true,  kind: .auto,
                title: "Categorizei 3 lançamentos do cartão",
                body: "iFood, Uber, e Drogasil entraram em Delivery, Mobilidade e Saúde.",
                time: "agora", action: "Revisar", urgent: false),
            NotificationItem(unread: true,  kind: .alert,
                title: "Cartão a 85% do limite",
                body: "Faltam 5 dias pra fechar. Você ainda tem R$ 3.097 livres.",
                time: "14:22", action: "Ver cartão", urgent: true),
            NotificationItem(unread: true,  kind: .insight,
                title: "Padrão detectado: delivery cresceu 32%",
                body: "Comparado aos últimos 3 meses. Quer que eu monte um plano?",
                time: "09:10", action: "Falar com Du", urgent: false)
        ]),
        NotificationGroup(label: "Ontem", items: [
            NotificationItem(unread: false, kind: .auto,
                title: "Salário registrado",
                body: "R$ 35.000 entrou via PIX. Tudo certo.",
                time: "08:02", action: nil, urgent: false),
            NotificationItem(unread: false, kind: .reminder,
                title: "Lembrete: aluguel vence em 3 dias",
                body: "R$ 4.200 pra Imobiliária Sul.",
                time: "07:45", action: "Marcar como pago", urgent: false)
        ]),
        NotificationGroup(label: "Esta semana", items: [
            NotificationItem(unread: false, kind: .insight,
                title: "Você bateu a meta de mercado",
                body: "Ficou 8% abaixo do teto. 🔥",
                time: "seg, 07:30", action: nil, urgent: false)
        ])
    ]

    static let initialUnreadCount = 3
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
    var showsCardLine: Bool { cardLevel != .later }
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
