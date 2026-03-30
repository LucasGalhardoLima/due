import SwiftUI

struct RootView: View {
    @State private var selectedTab = 0
    @State private var shouldStartQuickAdd = false
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
            .tint(Color.duVioletAdaptive)
            .preferredColorScheme(resolvedColorScheme)
            .onChange(of: selectedTab) {
                HapticManager.selection()
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
            ChatView(startInQuickAddMode: shouldStartQuickAdd)
                .opacity(selectedTab == 1 ? 1 : 0)
                .allowsHitTesting(selectedTab == 1)
                .onChange(of: selectedTab) { oldValue, newValue in
                    if newValue == 1 && shouldStartQuickAdd {
                        // Reset after ChatView appears with quick-add mode
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            shouldStartQuickAdd = false
                        }
                    }
                }
        }
        .safeAreaInset(edge: .bottom) {
            customBottomBar
        }
    }

    @available(iOS 26, *)
    private var customBottomBar: some View {
        GlassEffectContainer {
            HStack(spacing: 12) {
                // Tab pills
                HStack(spacing: 0) {
                    tabBarButton("Início", icon: "house.fill", tag: 0)
                    tabBarButton("Chat", icon: "bubble.left.and.text.bubble.right.fill", tag: 1)
                }
                .glassEffect(.regular, in: .capsule)

                // FAB — opens Chat with quick-add context
                Button {
                    HapticManager.impact(.medium)
                    shouldStartQuickAdd = true
                    withAnimation(DuTheme.snappySpring) {
                        selectedTab = 1
                    }
                } label: {
                    Image(systemName: "plus")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(Color.duTabAccent)
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
            withAnimation(DuTheme.snappySpring) {
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
            .foregroundStyle(selectedTab == tag ? Color.duTabAccent : .secondary)
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

                ChatView(startInQuickAddMode: shouldStartQuickAdd)
                    .tag(1)
                    .tabItem {
                        Label("Chat", systemImage: "bubble.left.and.text.bubble.right.fill")
                    }
            }
            .onChange(of: selectedTab) { oldValue, newValue in
                if newValue == 1 && shouldStartQuickAdd {
                    // Reset after ChatView appears with quick-add mode
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        shouldStartQuickAdd = false
                    }
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
            shouldStartQuickAdd = true
            withAnimation(DuTheme.snappySpring) {
                selectedTab = 1
            }
        } label: {
            Image(systemName: "plus")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Color.duVioletAdaptive, in: Circle())
                .shadow(color: Color.duVioletAdaptive.opacity(0.4), radius: 8, y: 4)
        }
        .pressableStyle()
    }
}
