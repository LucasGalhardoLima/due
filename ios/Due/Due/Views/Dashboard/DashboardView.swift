import SwiftUI

struct DashboardView: View {
    @State private var viewModel = DashboardViewModel()
    @State private var showSettings = false
    @State private var showNotifications = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    if viewModel.isLoading && viewModel.budgetSummary == nil {
                        DashboardSkeleton()
                    } else if let error = viewModel.error, viewModel.budgetSummary == nil {
                        ErrorView(message: error) {
                            Task { await viewModel.load() }
                        }
                    } else {
                        headlineSection
                        spendingPulseSection
                        attentionSection
                        cardLinesSection
                        installmentsSection
                        insightSection
                    }
                }
                .padding(16)
            }
            .duNavigationGlass()
            .duGradientBackground()
            .navigationTitle("Inicio")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showNotifications = true
                    } label: {
                        Image(systemName: "bell")
                    }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .refreshable {
                HapticManager.impact(.light)
                await viewModel.load()
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showNotifications) {
                NotificationsSheet()
            }
        }
        .task {
            await viewModel.load()
        }
    }

    // MARK: - 1. Headline

    @ViewBuilder
    private var headlineSection: some View {
        if let text = viewModel.headlineText {
            Text(text)
                .font(.system(.title, design: .rounded, weight: .bold))
                .staggeredAppearance(index: 0)
        }
    }

    // MARK: - 2. Spending Pulse

    @ViewBuilder
    private var spendingPulseSection: some View {
        if let text = viewModel.spendingPulseText {
            Text(text)
                .font(.body)
                .foregroundStyle(.secondary)
                .staggeredAppearance(index: 1)
        }
    }

    // MARK: - 3. Attention List (over-budget categories)

    @ViewBuilder
    private var attentionSection: some View {
        let categories = viewModel.attentionCategories
        if !categories.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(categories.enumerated()), id: \.element.id) { index, category in
                    NavigationLink {
                        TransactionDrilldownView(filter: .category(
                            id: category.categoryId,
                            name: category.categoryName,
                            emoji: category.categoryEmoji
                        ))
                    } label: {
                        HStack(spacing: 8) {
                            Text(viewModel.severityDot(for: category))
                                .font(.caption)

                            Text(attentionText(for: category))
                                .font(.subheadline)
                                .multilineTextAlignment(.leading)

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .buttonStyle(.plain)
                    .staggeredAppearance(index: index + 2)
                }
            }
            .padding(14)
            .duGlass()
        }
    }

    // MARK: - 4. Credit Card Lines

    @ViewBuilder
    private var cardLinesSection: some View {
        let lines = viewModel.cardLines
        if !lines.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(lines.enumerated()), id: \.element.card.id) { index, line in
                    NavigationLink {
                        TransactionDrilldownView(filter: .card(
                            id: line.card.id,
                            name: line.card.name
                        ))
                    } label: {
                        HStack(spacing: 0) {
                            Text(cardLineText(for: line))
                                .font(.subheadline)
                                .multilineTextAlignment(.leading)

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .buttonStyle(.plain)
                    .staggeredAppearance(index: lines.count + index + 2)
                }
            }
            .padding(14)
            .duGlass()
        }
    }

    // MARK: - 5. Installments Sentence

    @ViewBuilder
    private var installmentsSection: some View {
        if let sentence = viewModel.installmentsSentence {
            Text(sentence)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .staggeredAppearance(index: 8)
        }
    }

    // MARK: - 6. Quick Insight

    @ViewBuilder
    private var insightSection: some View {
        if let insight = viewModel.aiInsight {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "sparkles")
                    .font(.subheadline)
                    .foregroundStyle(Color.duVioletAdaptive)

                Text(insight)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(14)
            .duGlass()
            .staggeredAppearance(index: 9)
        }
    }

    // MARK: - Text Builders

    private func attentionText(for category: BudgetSummary.CategorySpending) -> String {
        let name = category.categoryName
        let spent = CurrencyFormatter.formatCompact(category.actualSpending)

        if category.status == "exceeded", let limit = category.budgetLimit {
            let limitStr = CurrencyFormatter.formatCompact(limit)
            return "\(name): \(spent) de \(limitStr)"
        } else if let limit = category.budgetLimit {
            let pct = Int(category.percentage)
            return "\(name): \(spent) (\(pct)% do limite de \(CurrencyFormatter.formatCompact(limit)))"
        }
        return "\(name): \(spent)"
    }

    private func cardLineText(for line: (card: Card, total: Double, daysUntilClosing: Int)) -> String {
        let total = CurrencyFormatter.formatCompact(line.total)
        let days = line.daysUntilClosing
        let closingText: String
        if days == 0 {
            closingText = "fecha hoje"
        } else if days == 1 {
            closingText = "fecha amanha"
        } else {
            closingText = "fecha em \(days) dias"
        }
        return "\(line.card.name): \(total) \u{00B7} \(closingText)"
    }
}
