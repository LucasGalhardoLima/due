import SwiftUI

struct TransactionsView: View {
    @State private var viewModel = TransactionsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    if viewModel.isLoading && viewModel.invoice == nil {
                        TransactionsSkeleton()
                    } else if let error = viewModel.error, viewModel.invoice == nil {
                        ErrorView(message: error) {
                            Task { await viewModel.load() }
                        }
                    } else {
                        if viewModel.cards.count > 1 {
                            cardPicker
                        }
                        VStack(spacing: 16) {
                            invoiceHeader
                            transactionsList
                        }
                        .padding(16)
                    }
                }
            }
            .duNavigationGlass()
            .duGradientBackground()
            .navigationTitle("Fatura")
            .refreshable {
                await viewModel.loadInvoice()
            }
            .sheet(isPresented: $viewModel.showAddSheet) {
                Task { await viewModel.loadInvoice() }
            } content: {
                AddTransactionSheet(
                    cards: viewModel.cards,
                    categories: viewModel.categories,
                    onSave: viewModel.createTransaction
                )
            }
        }
        .task {
            await viewModel.load()
        }
    }

    // MARK: - Card Picker

    private var cardPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(viewModel.cards) { card in
                    Button {
                        viewModel.selectedCardId = card.id
                        HapticManager.selection()
                        Task { await viewModel.loadInvoice() }
                    } label: {
                        Text(card.name)
                            .font(.subheadline.weight(.medium))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                viewModel.selectedCardId == card.id
                                    ? Color.duVioletAdaptive
                                    : Color.gray.opacity(0.15),
                                in: Capsule()
                            )
                            .foregroundStyle(
                                viewModel.selectedCardId == card.id ? .white : .primary
                            )
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Invoice Header

    @ViewBuilder
    private var invoiceHeader: some View {
        if let invoice = viewModel.invoice {
            VStack(spacing: 4) {
                Text("Total da fatura")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                AnimatedCurrencyText(value: invoice.total)
                    .font(.system(.title, design: .rounded, weight: .bold))

                if invoice.limit > 0 {
                    Text("de \(CurrencyFormatter.format(invoice.limit))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Transactions List

    @ViewBuilder
    private var transactionsList: some View {
        let groups = viewModel.sortedDateGroups

        if groups.isEmpty {
            EmptyStateView(
                icon: "tray",
                title: "Nenhuma transação",
                subtitle: "Nenhuma transação nesta fatura",
                ctaTitle: "Adicionar transação"
            ) {
                viewModel.showAddSheet = true
            }
        } else {
            LazyVStack(spacing: 16) {
                ForEach(Array(groups.enumerated()), id: \.element.key) { groupIndex, group in
                    Section {
                        ForEach(Array(group.transactions.enumerated()), id: \.element.id) { index, transaction in
                            TransactionRow(transaction: transaction)
                                .staggeredAppearance(index: groupIndex * 5 + index)
                        }
                    } header: {
                        Text(formatDateGroup(group.key))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func formatDateGroup(_ dateString: String) -> String {
        guard let date = DateFormatters.apiDate.date(from: dateString) else {
            return dateString
        }
        return DateFormatters.dayMonthYear.string(from: date).uppercased()
    }
}
