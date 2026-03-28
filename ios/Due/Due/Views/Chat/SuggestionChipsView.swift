import SwiftUI

struct SuggestionChipsView: View {
    let onSelect: (String) -> Void

    private let suggestions = [
        "Como estou esse mes?",
        "Meus parcelamentos",
        "Adiciona gasto",
    ]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(suggestions.enumerated()), id: \.offset) { index, suggestion in
                    Button {
                        HapticManager.impact(.light)
                        onSelect(suggestion)
                    } label: {
                        Text(suggestion)
                            .font(.subheadline)
                            .foregroundStyle(Color.duVioletAdaptive)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .duGlass(in: Capsule())
                    }
                    .pressableStyle()
                    .staggeredAppearance(index: index)
                }
            }
            .padding(.horizontal, 16)
        }
    }
}
