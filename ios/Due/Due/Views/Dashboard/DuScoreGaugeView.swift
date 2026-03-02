import SwiftUI

struct DuScoreGaugeView: View {
    let score: Int
    let trend: String
    let components: [DuScoreResponse.ScoreComponent]

    @State private var animatedScore: Int = 0
    @State private var appeared = false

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Du Score")
                    .font(.headline)

                Spacer()

                trendBadge
            }

            ZStack {
                // Background track
                Circle()
                    .stroke(Color.gray.opacity(0.15), lineWidth: 10)

                // Glow layer (blurred stroke behind arc)
                Circle()
                    .trim(from: 0, to: appeared ? CGFloat(score) / 100 : 0)
                    .stroke(
                        scoreColor.opacity(0.4),
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .blur(radius: 6)

                // Main arc with angular gradient
                Circle()
                    .trim(from: 0, to: appeared ? CGFloat(score) / 100 : 0)
                    .stroke(
                        AngularGradient(
                            colors: [scoreColor.opacity(0.6), scoreColor],
                            center: .center,
                            startAngle: .degrees(-90),
                            endAngle: .degrees(-90 + 360 * Double(score) / 100)
                        ),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(DuTheme.gentleSpring, value: appeared)

                VStack(spacing: 4) {
                    Text("\(animatedScore)")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundStyle(scoreColor)
                        .contentTransition(.numericText(value: Double(animatedScore)))

                    Text("de 100")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(height: 140)
            .padding(.horizontal, 20)

            // Component breakdown pills
            if !components.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(components) { component in
                            HStack(spacing: 4) {
                                Text(component.name)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Text("\(component.score)/\(component.maxScore)")
                                    .font(.caption2.weight(.semibold))
                                    .foregroundStyle(componentColor(component))
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(componentColor(component).opacity(0.1), in: Capsule())
                        }
                    }
                }
            }
        }
        .padding(16)
        .duGlass()
        .onAppear {
            appeared = true
            animateScore()
        }
    }

    // MARK: - Score Animation

    private func animateScore() {
        animatedScore = 0
        let steps = min(score, 60)
        guard steps > 0 else { return }
        let interval = 0.8 / Double(steps)

        for i in 1...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + interval * Double(i)) {
                withAnimation(.easeOut(duration: 0.05)) {
                    animatedScore = Int(Double(score) * Double(i) / Double(steps))
                }
            }
        }
    }

    // MARK: - Colors

    private var scoreColor: Color {
        switch score {
        case 0..<40: return .statusDanger
        case 40..<70: return .statusWarning
        default: return .statusSuccess
        }
    }

    private func componentColor(_ component: DuScoreResponse.ScoreComponent) -> Color {
        let ratio = Double(component.score) / Double(max(component.maxScore, 1))
        switch ratio {
        case 0..<0.4: return .statusDanger
        case 0.4..<0.7: return .statusWarning
        default: return .statusSuccess
        }
    }

    @ViewBuilder
    private var trendBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: trendIcon)
                .font(.caption2)
            Text(trendLabel)
                .font(.caption2)
        }
        .foregroundStyle(trendColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(trendColor.opacity(0.15), in: Capsule())
    }

    private var trendIcon: String {
        switch trend {
        case "up": return "arrow.up.right"
        case "down": return "arrow.down.right"
        default: return "arrow.right"
        }
    }

    private var trendLabel: String {
        switch trend {
        case "up": return "Subindo"
        case "down": return "Caindo"
        default: return "Estável"
        }
    }

    private var trendColor: Color {
        switch trend {
        case "up": return .statusSuccess
        case "down": return .statusDanger
        default: return .statusInfo
        }
    }
}
