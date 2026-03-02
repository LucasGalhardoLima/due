import SwiftUI

struct InstallmentsView: View {
    @State private var viewModel = InstallmentsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if viewModel.isLoading && viewModel.timeline == nil {
                        InstallmentsSkeleton()
                    } else if let error = viewModel.error, viewModel.timeline == nil {
                        ErrorView(message: error) {
                            Task { await viewModel.load() }
                        }
                    } else if viewModel.timeline != nil {
                        healthCard
                        timelineSection
                    } else {
                        EmptyStateView(
                            icon: "calendar.badge.clock",
                            title: "Sem parcelas",
                            subtitle: "Você não tem parcelas ativas"
                        )
                    }
                }
                .padding(16)
            }
            .duNavigationGlass()
            .duGradientBackground()
            .navigationTitle("Parcelas")
            .refreshable {
                HapticManager.impact(.light)
                await viewModel.load()
            }
        }
        .task {
            await viewModel.load()
        }
    }

    // MARK: - Health Card

    @ViewBuilder
    private var healthCard: some View {
        if let health = viewModel.health {
            VStack(spacing: 12) {
                HStack {
                    Text("Saúde das parcelas")
                        .font(.headline)
                    Spacer()
                    scoreLabel(health)
                }

                HStack(spacing: 20) {
                    statItem(value: "\(health.activeCount)", label: "Ativas")
                    statItem(
                        value: CurrencyFormatter.formatCompact(health.totalMonthlyCommitment),
                        label: "Mensal"
                    )
                    statItem(value: "\(health.score)", label: "Score")
                }

                if !health.insights.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(health.insights, id: \.self) { insight in
                            HStack(alignment: .top, spacing: 8) {
                                Image(systemName: "lightbulb.fill")
                                    .font(.caption2)
                                    .foregroundStyle(Color.statusWarning)
                                Text(insight)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .padding(16)
            .duGlass()
        }
    }

    private func scoreLabel(_ health: InstallmentHealthResponse) -> some View {
        Text(health.scoreLabel)
            .font(.caption.weight(.semibold))
            .foregroundStyle(healthColor(health.score))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(healthColor(health.score).opacity(0.15), in: Capsule())
    }

    private func statItem(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title3, design: .rounded, weight: .bold))
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Timeline

    @ViewBuilder
    private var timelineSection: some View {
        if let timeline = viewModel.timeline {
            LazyVStack(spacing: 12) {
                ForEach(Array(timeline.months.enumerated()), id: \.element.id) { index, month in
                    MonthRow(month: month)
                        .staggeredAppearance(index: index)
                }
            }
        }
    }

    // MARK: - Helpers

    private func healthColor(_ score: Int) -> Color {
        switch score {
        case 0..<40: return .statusDanger
        case 40..<70: return .statusWarning
        default: return .statusSuccess
        }
    }
}

// MARK: - Month Row

private struct MonthRow: View {
    let month: InstallmentMonth
    @State private var expanded = false

    var body: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(DuTheme.defaultSpring) {
                    expanded.toggle()
                }
                HapticManager.selection()
            } label: {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(month.label)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.primary)

                        Text("\(month.installmentCount) parcelas")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text(CurrencyFormatter.format(month.totalCommitted))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.primary)

                        Text("\(Int(month.limitUsagePercent))% do limite")
                            .font(.caption2)
                            .foregroundStyle(statusColor.opacity(0.8))
                    }

                    Image(systemName: "chevron.right")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .rotationEffect(.degrees(expanded ? 90 : 0))
                }
                .padding(12)
            }
            .buttonStyle(PressableButtonStyle())

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.gray.opacity(0.15))
                        .frame(height: 4)

                    Capsule()
                        .fill(statusColor)
                        .frame(width: min(geo.size.width, geo.size.width * month.limitUsagePercent / 100), height: 4)
                }
            }
            .frame(height: 4)
            .padding(.horizontal, 12)
            .padding(.bottom, expanded ? 8 : 12)

            // Expanded entries
            if expanded {
                VStack(spacing: 0) {
                    ForEach(month.transactions) { entry in
                        HStack(spacing: 12) {
                            Text(entry.category.prefix(1).uppercased())
                                .font(.caption2.weight(.bold))
                                .foregroundStyle(Color.duVioletAdaptive)
                                .frame(width: 28, height: 28)
                                .background(Color.duVioletAdaptive.opacity(0.12), in: Circle())

                            VStack(alignment: .leading, spacing: 2) {
                                Text(entry.description)
                                    .font(.caption)
                                    .lineLimit(1)
                                Text("\(entry.installmentNumber)/\(entry.totalInstallments)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Text(CurrencyFormatter.format(entry.amount))
                                .font(.caption.weight(.medium))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                    }
                }
                .padding(.bottom, 12)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .duGlass()
    }

    private var statusColor: Color {
        switch month.status {
        case "danger": return .statusDanger
        case "warning": return .statusWarning
        default: return .statusSuccess
        }
    }
}
