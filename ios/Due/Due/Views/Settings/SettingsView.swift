import SwiftUI
import Clerk

struct SettingsView: View {
    @AppStorage("appColorScheme") private var appColorScheme = "system"
    @Environment(\.dismiss) private var dismiss

    private var user: User? { Clerk.shared.user }

    private var displayName: String {
        [user?.firstName, user?.lastName]
            .compactMap { $0 }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespaces)
            .isEmpty
            ? "Usuário"
            : [user?.firstName, user?.lastName].compactMap { $0 }.joined(separator: " ")
    }

    var body: some View {
        NavigationStack {
            Form {
                appearanceSection
                accountSection
                aboutSection
            }
            .navigationTitle("Configurações")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fechar") { dismiss() }
                }
            }
        }
    }

    // MARK: - Aparência

    private var appearanceSection: some View {
        Section("Aparência") {
            Picker("Tema", selection: $appColorScheme) {
                Text("Sistema").tag("system")
                Text("Claro").tag("light")
                Text("Escuro").tag("dark")
            }
            .pickerStyle(.segmented)
        }
    }

    // MARK: - Conta

    private var accountSection: some View {
        Section("Conta") {
            HStack(spacing: 12) {
                initialsAvatar

                VStack(alignment: .leading, spacing: 2) {
                    Text(displayName)
                        .font(.subheadline.weight(.medium))

                    if let email = user?.primaryEmailAddress?.emailAddress {
                        Text(email)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Button(role: .destructive) {
                Task {
                    try? await Clerk.shared.signOut()
                }
            } label: {
                Label("Sair da conta", systemImage: "rectangle.portrait.and.arrow.right")
            }
        }
    }

    // MARK: - Sobre

    private var aboutSection: some View {
        Section("Sobre") {
            LabeledContent("Versão", value: appVersion)
        }
    }

    // MARK: - Helpers

    private var initialsAvatar: some View {
        let initials = displayName
            .split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined()

        return Text(initials)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.white)
            .frame(width: 36, height: 36)
            .background(Color.duVioletAdaptive, in: Circle())
    }

    private var appVersion: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }
}
