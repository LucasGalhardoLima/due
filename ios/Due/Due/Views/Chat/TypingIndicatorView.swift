import SwiftUI

struct TypingIndicatorView: View {
    @State private var phase = 0.0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.secondary.opacity(0.5))
                    .frame(width: 6, height: 6)
                    .offset(y: dotOffset(for: index))
            }
        }
        .frame(height: 20)
        .onAppear {
            withAnimation(
                .easeInOut(duration: 0.6)
                .repeatForever(autoreverses: true)
            ) {
                phase = 1.0
            }
        }
    }

    private func dotOffset(for index: Int) -> CGFloat {
        let delay = Double(index) * 0.15
        let adjusted = max(0, phase - delay)
        return -4 * sin(adjusted * .pi)
    }
}
