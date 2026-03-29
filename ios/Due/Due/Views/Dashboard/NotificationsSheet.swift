import SwiftUI

struct NotificationsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = NotificationsViewModel()
    var onNavigateToChat: (() -> Void)?

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.notifications.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.notifications.isEmpty {
                    emptyState
                } else {
                    notificationList
                }
            }
            .duGradientBackground()
            .navigationTitle("Notificações")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fechar") { dismiss() }
                }
                if !viewModel.notifications.isEmpty && viewModel.unreadCount > 0 {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Marcar tudo como lido") {
                            Task { await viewModel.markAllAsRead() }
                        }
                        .font(.caption)
                    }
                }
            }
        }
        .task {
            await viewModel.load()
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack {
            Spacer()
            EmptyStateView(
                icon: "checkmark.seal",
                title: "Tudo tranquilo por aqui",
                subtitle: "Nenhuma notificação no momento. Aproveite a paz! ✌️",
                iconColor: Color.statusSuccess.opacity(0.7)
            )
            Spacer()
        }
        .padding(24)
    }

    // MARK: - Notification List

    private var notificationList: some View {
        List {
            ForEach(Array(viewModel.notifications.enumerated()), id: \.element.id) { index, notification in
                NotificationRowView(notification: notification)
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                    .staggeredAppearance(index: index)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        handleTap(notification)
                    }
                    .swipeActions(edge: .trailing) {
                        if !notification.isRead {
                            Button {
                                Task { await viewModel.markAsRead(notification.id) }
                            } label: {
                                Label("Lido", systemImage: "envelope.open")
                            }
                            .tint(Color.duMintAdaptive)
                        }
                    }
            }
        }
        .listStyle(.plain)
        .refreshable {
            await viewModel.load()
        }
    }

    // MARK: - Tap Handler

    private func handleTap(_ notification: AppNotification) {
        Task { await viewModel.markAsRead(notification.id) }

        switch notification.type {
        case .aiTip, .spendingInsight, .weeklySummary:
            dismiss()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                onNavigateToChat?()
            }
        case .achievement:
            break
        }
    }
}

// MARK: - Notification Row

struct NotificationRowView: View {
    let notification: AppNotification

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Type icon
            Image(systemName: notification.typeIcon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(iconColor)
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.12))
                .clipShape(Circle())

            // Content
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(notification.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(notification.isRead ? .secondary : .primary)

                    Spacer()

                    Text(notification.relativeTimestamp)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }

                Text(notification.body)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            // Unread dot
            if !notification.isRead {
                Circle()
                    .fill(Color.duMintAdaptive)
                    .frame(width: 8, height: 8)
                    .padding(.top, 6)
            }
        }
        .padding(14)
        .duGlass()
    }

    private var iconColor: Color {
        switch notification.type {
        case .aiTip: Color.statusInfo
        case .weeklySummary: Color.duVioletAdaptive
        case .spendingInsight: Color.statusWarning
        case .achievement: Color.statusSuccess
        }
    }
}
