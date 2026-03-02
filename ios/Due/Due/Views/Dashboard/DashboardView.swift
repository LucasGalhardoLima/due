import SwiftUI

struct DashboardView: View {
    @State private var viewModel = DashboardViewModel()
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if viewModel.isLoading && viewModel.budgetSummary == nil {
                        DashboardSkeleton()
                    } else if let error = viewModel.error, viewModel.budgetSummary == nil {
                        ErrorView(message: error) {
                            Task { await viewModel.load() }
                        }
                    } else {
                        summarySection
                        duScoreSection
                        topSpendingSection
                        upcomingBillsSection
                    }
                }
                .padding(16)
            }
            .duNavigationGlass()
            .duGradientBackground()
            .navigationTitle("Início")
            .toolbar {
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
        }
        .task {
            await viewModel.load()
        }
    }

    // MARK: - Summary Cards

    @ViewBuilder
    private var summarySection: some View {
        if let summary = viewModel.budgetSummary {
            let cards = HStack(spacing: 12) {
                SummaryCardView(label: "Receita", value: summary.totalIncome, color: .statusSuccess)
                SummaryCardView(label: "Gastos", value: summary.totalSpending, color: .statusDanger)
                SummaryCardView(label: "Sobra", value: summary.remaining, color: .mint500)
            }

            if #available(iOS 26, *) {
                GlassEffectContainer { cards }
            } else {
                cards
            }
        }
    }

    // MARK: - Du Score

    @ViewBuilder
    private var duScoreSection: some View {
        if let score = viewModel.duScore {
            DuScoreGaugeView(score: score.score, trend: score.trend, components: score.components)
        }
    }

    // MARK: - Top Spending

    @ViewBuilder
    private var topSpendingSection: some View {
        if let summary = viewModel.budgetSummary {
            TopSpendingWidget(categories: summary.categories)
        }
    }

    // MARK: - Upcoming Bills

    @ViewBuilder
    private var upcomingBillsSection: some View {
        if viewModel.upcomingBills.isEmpty, viewModel.budgetSummary != nil {
            EmptyStateView(
                icon: "checkmark.circle",
                title: "Tudo em dia!",
                subtitle: "Nenhuma conta próxima"
            )
        } else if !viewModel.upcomingBills.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("Próximas contas")
                    .font(.headline)
                    .padding(.horizontal, 4)

                ForEach(Array(viewModel.upcomingBills.enumerated()), id: \.element.id) { index, bill in
                    UpcomingBillRow(bill: bill)
                        .staggeredAppearance(index: index)
                }
            }
        }
    }
}
