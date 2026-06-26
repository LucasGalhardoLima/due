import SwiftUI

enum AppMode: String, CaseIterable, Identifiable, Codable {
    case dark, light, system

    var id: String { rawValue }

    var label: String {
        switch self {
        case .dark: return "Escuro"
        case .light: return "Claro"
        case .system: return "Sistema"
        }
    }

    var subtitle: String {
        switch self {
        case .dark: return "Mais focado, menos brilho"
        case .light: return "Mais legibilidade no sol"
        case .system: return "Acompanha o iOS"
        }
    }

    var preferredColorScheme: ColorScheme? {
        switch self {
        case .dark: return .dark
        case .light: return .light
        case .system: return nil
        }
    }
}

@Observable
final class AppTheme {
    var palette: DuPalette {
        didSet { UserDefaults.standard.set(palette.rawValue, forKey: Self.paletteKey) }
    }
    var mode: AppMode {
        didSet { UserDefaults.standard.set(mode.rawValue, forKey: Self.modeKey) }
    }
    var chatBackend: ChatBackendKind {
        didSet { UserDefaults.standard.set(chatBackend.rawValue, forKey: Self.backendKey) }
    }

    private static let paletteKey = "du.theme.palette"
    private static let modeKey = "du.theme.mode"
    private static let backendKey = "du.chat.backend"

    init() {
        let savedPalette = UserDefaults.standard.string(forKey: Self.paletteKey).flatMap(DuPalette.init(rawValue:))
        let savedMode = UserDefaults.standard.string(forKey: Self.modeKey).flatMap(AppMode.init(rawValue:))
        self.palette = savedPalette ?? .tokyoNight
        self.mode = savedMode ?? .dark
        self.chatBackend = AppTheme.persistedBackend()
    }

    /// Read the persisted backend without instantiating the full theme.
    /// Used by RootView so the chat view-model can spin up with the user's
    /// last pick. Defaults to `.auto` for new installs — the resolver picks
    /// the best tier; users (well, only devs in DEBUG) can override.
    static func persistedBackend() -> ChatBackendKind {
        UserDefaults.standard.string(forKey: backendKey).flatMap(ChatBackendKind.init(rawValue:)) ?? .auto
    }
}
