import SwiftUI

struct ChatView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "bubble.left.and.text.bubble.right")
                    .font(.system(size: 48))
                    .foregroundStyle(.secondary)

                VStack(spacing: 8) {
                    Text("Converse com a Du")
                        .font(.title3.weight(.semibold))
                    Text("Pergunte sobre seus gastos, orçamentos e parcelas")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                Spacer()
            }
            .padding(24)
            .duNavigationGlass()
            .duGradientBackground()
            .navigationTitle("Chat")
        }
    }
}
