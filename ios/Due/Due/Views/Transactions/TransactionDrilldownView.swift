import SwiftUI

struct TransactionDrilldownView: View {
    @State private var viewModel: TransactionDrilldownViewModel

    init(filter: DrilldownFilter) {
        _viewModel = State(initialValue: TransactionDrilldownViewModel(filter: filter))
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.transactions.isEmpty {
                TransactionsSkeleton()
            } else if viewModel.error != nil, viewModel.transactions.isEmpty {
                let kind = viewModel.errorKind ?? .loadFailure
                ErrorView(
                    icon: kind.icon,
                    title: kind.title,
                    message: kind.message,
                    ctaTitle: kind.ctaTitle
                ) {
                    Task { await viewModel.load() }
                }
            } else if viewModel.transactions.isEmpty {
                EmptyStateView(
                    icon: "line.3.horizontal.decrease.circle",
                    title: "Nada por aqui",
                    subtitle: "Essa categoria não tem gastos nesta fatura.",
                    iconColor: Color.duVioletAdaptive.opacity(0.5)
                )
            } else {
                List {
                    Section {
                        header
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                    }

                    Section {
                        ForEach(viewModel.transactions) { transaction in
                            TransactionRow(transaction: transaction)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    viewModel.editingTransaction = transaction
                                }
                                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                    Button(role: .destructive) {
                                        viewModel.confirmDelete(transaction)
                                    } label: {
                                        Label("Excluir", systemImage: "trash")
                                    }
                                }
                                .swipeActions(edge: .leading) {
                                    Button {
                                        viewModel.editingTransaction = transaction
                                    } label: {
                                        Label("Editar", systemImage: "pencil")
                                    }
                                    .tint(.duVioletAdaptive)
                                }
                                .contextMenu {
                                    Button {
                                        viewModel.editingTransaction = transaction
                                    } label: {
                                        Label("Editar", systemImage: "pencil")
                                    }
                                    Button(role: .destructive) {
                                        viewModel.confirmDelete(transaction)
                                    } label: {
                                        Label("Excluir", systemImage: "trash")
                                    }
                                }
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .duNavigationGlass()
        .duGradientBackground()
        .navigationTitle(viewModel.filter.title)
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.loadTransactions()
        }
        .sheet(item: $viewModel.editingTransaction) { transaction in
            EditTransactionSheet(
                transaction: transaction,
                cards: viewModel.cards,
                categories: viewModel.categories,
                selectedCardId: cardIdForTransaction(transaction),
                onSave: viewModel.updateTransaction
            )
        }
        .alert("Excluir transação?", isPresented: $viewModel.showDeleteConfirmation) {
            Button("Cancelar", role: .cancel) {
                viewModel.transactionToDelete = nil
            }
            Button("Excluir", role: .destructive) {
                Task { await viewModel.deleteTransaction() }
            }
        } message: {
            Text("Esta ação vai excluir a transação e todas as suas parcelas.")
        }
        .task {
            await viewModel.load()
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 4) {
            Text("\(viewModel.transactions.count) transações")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            AnimatedCurrencyText(
                value: viewModel.transactions.reduce(0) { $0 + $1.amount }
            )
            .font(.system(.title2, design: .rounded, weight: .bold))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    // MARK: - Helpers

    private func cardIdForTransaction(_ transaction: InvoiceTransaction) -> String {
        viewModel.cards.first(where: { $0.name == transaction.cardName })?.id ?? ""
    }
}
