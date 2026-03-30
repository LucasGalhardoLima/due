import SwiftUI

struct ActionCardView: View {
    let card: ActionCard
    let onAction: (CardAction) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(card.title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(card.actions) { action in
                        Button {
                            onAction(action)
                        } label: {
                            Text(action.label)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(Color.duVioletAdaptive)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(
                                    Capsule()
                                        .fill(Color(light: .mint50, dark: .violet400.opacity(0.2)))
                                )
                                .overlay(
                                    Capsule()
                                        .stroke(Color(light: .mint300, dark: .violet300.opacity(0.4)), lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(14)
    }
}
