import SwiftUI
import SwiftData

// State machine for the redesigned app: Home is the root, everything else is
// pushed via NavigationStack. No tabs. Du-access is the FAB on Home only.
struct RootView: View {
    @Environment(AppTheme.self) private var theme
    @Environment(\.modelContext) private var modelContext
    @State private var path: [AppDestination] = RootView.initialPath()
    @State private var chatVM = ChatViewModel(initialBackend: AppTheme.persistedBackend())

    @Query private var cards: [Card]
    @Query private var transactions: [Transaction]
    @Query(sort: \Insight.createdAt, order: .reverse) private var insights: [Insight]

    /// Debug helper. Pass `-startScreen chat|cartao|overview|notifications|settings`
    /// (or set `du.startScreen` UserDefault) to skip Home and land on a screen for screenshots.
    private static func initialPath() -> [AppDestination] {
        let args = CommandLine.arguments
        if let i = args.firstIndex(of: "-startScreen"), i + 1 < args.count,
           let dest = AppDestination(rawValue: args[i + 1]) {
            return [dest]
        }
        if let raw = UserDefaults.standard.string(forKey: "du.startScreen"),
           let dest = AppDestination(rawValue: raw) {
            return [dest]
        }
        return []
    }

    private var unreadCount: Int {
        insights.filter { !$0.read }.count
    }

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(
                unreadCount: unreadCount,
                data: HomeViewModel.project(
                    transactions: transactions,
                    cards: cards,
                    insights: insights
                ),
                onLogoTap: { /* future: open profile */ },
                onBell: {
                    // unreadCount comes from SwiftData Insights, so we mark
                    // them read here. NotificationsView itself still renders
                    // MockData fixtures (those have their own `unread` flags)
                    // and will switch to the same store when its migration
                    // slice lands — until then the bell-dot and the
                    // Notifications list can disagree on what's "unread".
                    for ins in insights where !ins.read {
                        ins.read = true
                    }
                    try? modelContext.save()
                    path.append(.notifications)
                },
                onSettings: { path.append(.settings) },
                onChat: { path.append(.chat) },
                onCartao: { path.append(.cartao) }
            )
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: AppDestination.self) { dest in
                destinationView(dest)
                    .toolbar(.hidden, for: .navigationBar)
            }
        }
        .tint(theme.palette.primary)
        .onAppear { chatVM.onNavigate = navigate(to:) }
        .onChange(of: theme.chatBackend) { _, new in
            chatVM.backendKind = new
        }
    }

    @ViewBuilder
    private func destinationView(_ dest: AppDestination) -> some View {
        switch dest {
        case .chat:
            ChatView(viewModel: chatVM, onBack: { path.removeLast() })
        case .cartao:
            CartaoView(
                data: CartaoViewModel.project(
                    cards: cards,
                    transactions: transactions
                ),
                onBack: { path.removeLast() },
                onChat: { navigate(to: .chat) }
            )
        case .overview:
            OverviewView(
                data: OverviewViewModel.project(transactions: transactions),
                onBack: { path.removeLast() },
                onChat: { _ in navigate(to: .chat) }
            )
        case .notifications:
            NotificationsView(onBack: { path.removeLast() })
        case .settings:
            SettingsView(onBack: { path.removeLast() })
        case .home, .onboarding:
            EmptyView()
        }
    }

    /// Navigate from any source. If we're already deep, replace the tail when
    /// jumping to a sibling so we don't pile up screens.
    private func navigate(to dest: AppDestination) {
        if path.last == dest { return }
        path.append(dest)
    }
}
