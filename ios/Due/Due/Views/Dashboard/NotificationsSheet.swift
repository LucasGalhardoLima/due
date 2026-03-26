import SwiftUI

struct NotificationsSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                Spacer()

                EmptyStateView(
                    icon: "checkmark.seal",
                    title: "Tudo tranquilo por aqui",
                    subtitle: "Nenhuma conta próxima. Aproveite a paz! ✌️",
                    iconColor: Color.statusSuccess.opacity(0.7)
                )

                Spacer()
            }
            .padding(24)
            .duGradientBackground()
            .navigationTitle("Notificações")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fechar") { dismiss() }
                }
            }
        }
    }
}
