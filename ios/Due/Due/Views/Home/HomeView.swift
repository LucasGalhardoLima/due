import SwiftUI

struct HomeView: View {
    @Environment(AppTheme.self) private var theme
    let unreadCount: Int
    let data: HomeData
    var onLogoTap: () -> Void
    var onBell: () -> Void
    var onSettings: () -> Void
    var onChat: () -> Void
    var onCartao: () -> Void

    private let pad: CGFloat = 22
    private let sectionSpacing: CGFloat = 22

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    header
                        .padding(.bottom, sectionSpacing)

                    bigNumber

                    Rectangle()
                        .fill(Color.duBorder)
                        .frame(height: 1)
                        .padding(.vertical, sectionSpacing)

                    insights

                    if data.showsCardLine {
                        Rectangle()
                            .fill(Color.duBorder)
                            .frame(height: 1)
                            .padding(.vertical, sectionSpacing)
                        cardLine
                    }
                }
                .padding(.horizontal, pad)
                .padding(.top, 12)
                .padding(.bottom, 110)   // FAB clearance
            }

            fab
                .padding(.trailing, 22)
                .padding(.bottom, 30)
        }
        .background(Color.duBg.ignoresSafeArea())
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 0) {
            Button(action: onLogoTap) {
                HStack(spacing: 10) {
                    DuLogo(size: 26, palette: theme.palette)
                    Text("\(data.monthLabel) · dia \(data.dia)/\(data.totalDias)")
                        .font(DuFont.mono(11, weight: .medium))
                        .tracking(2.0)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.duFgMuted)
                }
            }
            .buttonStyle(.pressable)

            Spacer()

            HStack(spacing: 2) {
                Button(action: onBell) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "bell")
                            .font(.system(size: 18, weight: .regular))
                            .foregroundStyle(Color.duFgMuted)
                            .frame(width: 36, height: 36)
                        if unreadCount > 0 {
                            Circle()
                                .fill(theme.palette.primary)
                                .frame(width: 8, height: 8)
                                .overlay(
                                    Circle().stroke(Color.duBg, lineWidth: 2)
                                )
                                .offset(x: -8, y: 7)
                        }
                    }
                }
                .buttonStyle(.pressable)

                Button(action: onSettings) {
                    Image(systemName: "gearshape")
                        .font(.system(size: 18, weight: .regular))
                        .foregroundStyle(Color.duFgMuted)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.pressable)
            }
        }
    }

    // MARK: THE NUMBER

    private var bigNumber: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Disponível")
                .font(DuFont.mono(11, weight: .medium))
                .tracking(2.4)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)
                .padding(.bottom, 14)

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("R$")
                    .font(DuFont.mono(28, weight: .medium))
                    .foregroundStyle(Color.duFgMuted)
                Text(integerString(data.disponivel))
                    .font(DuFont.mono(64, weight: .bold))
                    .kerning(-2.5)
                    .foregroundStyle(Color.duFg)
                    .monospacedDigit()
            }

            HStack(spacing: 0) {
                Text("≈ ")
                Text("R$\u{00A0}\(integerString(data.porDia))")
                    .font(DuFont.mono(14, weight: .semibold))
                    .foregroundStyle(Color.duFg)
                Text(" por dia até dia \(data.totalDias).")
            }
            .font(DuFont.mono(14))
            .foregroundStyle(Color.duFgMuted)
            .padding(.top, 12)
        }
    }

    // MARK: Insights

    private var insights: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(data.insights) { ins in
                HStack(alignment: .top, spacing: 12) {
                    DuSparkle(size: 12, color: theme.palette.primary)
                        .padding(.top, 4)

                    VStack(alignment: .leading, spacing: 6) {
                        Text(ins.text)
                            .font(DuFont.mono(14))
                            .foregroundStyle(Color.duFg)
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)

                        HStack(spacing: 12) {
                            Text(ins.time)
                                .font(DuFont.mono(10, weight: .medium))
                                .tracking(2.0)
                                .textCase(.uppercase)
                                .foregroundStyle(Color.duFgFaint)
                            if let label = ins.actionLabel {
                                Text("\(label) →")
                                    .font(DuFont.mono(12, weight: .semibold))
                                    .foregroundStyle(theme.palette.primary)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: Card line

    private var cardLine: some View {
        Button(action: onCartao) {
            let urgent = data.cardLevel == .urgent
            HStack(alignment: .lastTextBaseline) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(urgent
                         ? "⚠ Cartão · fecha em \(data.cardCloses) \(data.cardCloses == 1 ? "dia" : "dias")"
                         : "Cartão · fecha em \(data.cardCloses) dias")
                        .font(DuFont.mono(11, weight: .medium))
                        .tracking(2.0)
                        .textCase(.uppercase)
                        .foregroundStyle(urgent ? Color.duDanger : Color.duFgMuted)
                    Text("R$\u{00A0}\(integerString(data.cardFatura))")
                        .font(DuFont.mono(22, weight: .semibold))
                        .kerning(-0.5)
                        .foregroundStyle(urgent ? Color.duDanger : Color.duFg)
                        .monospacedDigit()
                }
                Spacer()
                Text("\(data.cardLimitePct)% do limite")
                    .font(DuFont.mono(12))
                    .foregroundStyle(Color.duFgMuted)
            }
        }
        .buttonStyle(.pressable)
    }

    // MARK: FAB

    private var fab: some View {
        Button {
            HapticManager.impact(.medium)
            onChat()
        } label: {
            Image(systemName: "message.fill")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(theme.palette.gradient,
                            in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .shadow(color: theme.palette.primary.opacity(0.33), radius: 12, x: 0, y: 8)
        }
        .buttonStyle(.pressable)
    }

    // MARK: Helpers

    private func integerString(_ value: Int) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.numberStyle = .decimal
        f.groupingSeparator = "."
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}
