import SwiftUI

struct RootView: View {
    @State private var selectedTab = 0
    @State private var showQuickAdd = false
    @AppStorage("appColorScheme") private var appColorScheme = "system"

    private var resolvedColorScheme: ColorScheme? {
        switch appColorScheme {
        case "light": return .light
        case "dark": return .dark
        default: return nil
        }
    }

    var body: some View {
        tabContent
            .tint(Color.dueVioletAdaptive)
            .preferredColorScheme(resolvedColorScheme)
            .onChange(of: selectedTab) {
                HapticManager.selection()
            }
            .sheet(isPresented: $showQuickAdd) {
                QuickAddSheet()
            }
    }

    @ViewBuilder
    private var tabContent: some View {
        if #available(iOS 26, *) {
            ios26TabView
        } else {
            legacyTabView
        }
    }

    // MARK: - iOS 26+ (custom bar, no TabView)

    @available(iOS 26, *)
    private var ios26TabView: some View {
        ZStack {
            DashboardView()
                .opacity(selectedTab == 0 ? 1 : 0)
                .allowsHitTesting(selectedTab == 0)
            TransactionsView()
                .opacity(selectedTab == 1 ? 1 : 0)
                .allowsHitTesting(selectedTab == 1)
            InstallmentsView()
                .opacity(selectedTab == 2 ? 1 : 0)
                .allowsHitTesting(selectedTab == 2)
        }
        .safeAreaInset(edge: .bottom) {
            customBottomBar
        }
    }

    @available(iOS 26, *)
    private var customBottomBar: some View {
        GlassEffectContainer {
            HStack(spacing: 12) {
                // Tab pill
                HStack(spacing: 0) {
                    tabBarButton("Início", icon: "house.fill", tag: 0)
                    tabBarButton("Fatura", icon: "creditcard.fill", tag: 1)
                    tabBarButton("Parcelas", icon: "calendar.badge.clock", tag: 2)
                }
                .glassEffect(.regular, in: .capsule)

                // FAB — same Y level, trailing
                Button {
                    HapticManager.impact(.medium)
                    showQuickAdd = true
                } label: {
                    Image(systemName: "plus")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(Color.dueTabAccent)
                        .frame(width: 48, height: 48)
                }
                .glassEffect(.regular.interactive(), in: .circle)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 4)
        }
    }

    @available(iOS 26, *)
    private func tabBarButton(_ title: String, icon: String, tag: Int) -> some View {
        Button {
            withAnimation(DueTheme.snappySpring) {
                selectedTab = tag
            }
            HapticManager.selection()
        } label: {
            VStack(spacing: 2) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: selectedTab == tag ? .semibold : .regular))
                Text(title)
                    .font(.caption2.weight(selectedTab == tag ? .medium : .regular))
            }
            .foregroundStyle(selectedTab == tag ? Color.dueTabAccent : .secondary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
        }
    }

    // MARK: - iOS 17–25 Fallback (floating FAB)

    private var legacyTabView: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView(selection: $selectedTab) {
                DashboardView()
                    .tag(0)
                    .tabItem {
                        Label("Início", systemImage: "house.fill")
                    }

                TransactionsView()
                    .tag(1)
                    .tabItem {
                        Label("Fatura", systemImage: "creditcard.fill")
                    }

                InstallmentsView()
                    .tag(2)
                    .tabItem {
                        Label("Parcelas", systemImage: "calendar.badge.clock")
                    }
            }

            fabButton
                .padding(.trailing, 20)
                .padding(.bottom, 70)
        }
    }

    private var fabButton: some View {
        Button {
            HapticManager.impact(.medium)
            showQuickAdd = true
        } label: {
            Image(systemName: "plus")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Color.dueVioletAdaptive, in: Circle())
                .shadow(color: Color.dueVioletAdaptive.opacity(0.4), radius: 8, y: 4)
        }
        .pressableStyle()
    }
}
