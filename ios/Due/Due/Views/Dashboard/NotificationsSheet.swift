import SwiftUI

struct NotificationsSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "bell")
                    .font(.system(size: 48))
                    .foregroundStyle(.secondary)

                VStack(spacing: 8) {
                    Text("Nenhuma notificação")
                        .font(.title3.weight(.semibold))
                    Text("Dicas, resumos semanais e alertas aparecerão aqui")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

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
