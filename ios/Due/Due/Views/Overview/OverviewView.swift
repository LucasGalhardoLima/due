import SwiftUI

struct OverviewView: View {
    @Environment(AppTheme.self) private var theme
    let data: OverviewData
    var onBack: () -> Void
    var onChat: (String?) -> Void

    @State private var openHabitIndex: Int? = 0
    private let pad: CGFloat = 22

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    lede.padding(.vertical, 14).padding(.bottom, 8)
                    statsStrip.padding(.vertical, 14)
                    monthChart.padding(.top, 14).padding(.bottom, 28)

                    Text("3 padrões pra resolver")
                        .font(DuFont.mono(10, weight: .medium))
                        .tracking(2.4)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.duFgFaint)
                        .padding(.bottom, 14)

                    VStack(spacing: 0) {
                        ForEach(Array(data.habits.enumerated()), id: \.element.id) { idx, habit in
                            habitRow(idx: idx, habit: habit, isLast: idx == data.habits.count - 1)
                        }
                    }

                    Text("Quer que eu monte um plano de 30 dias pra atacar os três?")
                        .font(DuFont.mono(13))
                        .lineSpacing(2)
                        .foregroundStyle(Color.duFgMuted)
                        .padding(.top, 32).padding(.bottom, 12)
                }
                .padding(.horizontal, pad)
                .padding(.bottom, 110)
            }
        }
        .background(Color.duBg.ignoresSafeArea())
        .overlay(alignment: .bottom) { pinnedActions }
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 10) {
            Button(action: onBack) {
                Image(systemName: "arrow.left")
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(Color.duFg)
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.pressable)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    DuSparkle(size: 9, color: theme.palette.primary)
                    Text("Análise · \(rangeLabel)")
                        .font(DuFont.mono(10, weight: .medium))
                        .tracking(2.4)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.duFgFaint)
                }
                Text("Seus últimos 6 meses")
                    .font(DuFont.display(15, weight: .semibold))
                    .kerning(-0.2)
                    .foregroundStyle(Color.duFg)
            }
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    // MARK: Lede

    private var lede: some View {
        HStack(alignment: .top, spacing: 10) {
            DuLogo(size: 22, palette: theme.palette)
            (Text("Olhei tudo. Tem ")
                + Text("3 padrões").font(DuFont.mono(14, weight: .semibold)).foregroundColor(theme.palette.primary)
                + Text(" que tão te custando caro. Cortando os três, sobra ")
                + Text("R$ \(integerString(data.economyPotential6mo))").font(DuFont.mono(14, weight: .semibold)).foregroundColor(theme.palette.primary)
                + Text(" em 6 meses."))
                .font(DuFont.mono(14))
                .lineSpacing(2)
                .foregroundStyle(Color.duFg)
        }
    }

    // MARK: Stats strip

    private var statsStrip: some View {
        VStack(spacing: 0) {
            Rectangle().fill(Color.duBorder).frame(height: 1)
            HStack(spacing: 0) {
                stat(label: "Total gasto",  value: "R$ \(thousands(data.totalSpent))", divider: true)
                stat(label: "Média/mês",    value: "R$ \(thousands(data.avgMonth))",   divider: true)
                stat(label: "Pior mês",     value: data.peakMonth,                     divider: false)
            }
            .padding(.vertical, 14)
            Rectangle().fill(Color.duBorder).frame(height: 1)
        }
    }

    private func stat(label: String, value: String, divider: Bool) -> some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                Text(label)
                    .font(DuFont.mono(9, weight: .medium))
                    .tracking(2.4)
                    .textCase(.uppercase)
                    .foregroundStyle(Color.duFgFaint)
                Text(value)
                    .font(DuFont.mono(18, weight: .bold))
                    .kerning(-0.4)
                    .foregroundStyle(Color.duFg)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 8)
            if divider {
                Rectangle().fill(Color.duBorder).frame(width: 1, height: 36)
            }
        }
    }

    // MARK: Month chart

    private var monthChart: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Mês a mês")
                .font(DuFont.mono(10, weight: .medium))
                .tracking(2.4)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgFaint)
                .padding(.bottom, 14)

            HStack(alignment: .bottom, spacing: 0) {
                ForEach(Array(data.totals.enumerated()), id: \.offset) { idx, val in
                    let isLast = idx == data.totals.count - 1
                    let h = CGFloat(val) / 32_000.0 * 80
                    VStack(spacing: 6) {
                        Text("\(String(format: "%.1f", Double(val)/1000))k")
                            .font(DuFont.mono(10, weight: isLast ? .semibold : .medium))
                            .foregroundStyle(isLast ? theme.palette.primary : Color.duFgMuted)
                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                            .fill(isLast ? AnyShapeStyle(theme.palette.primary) : AnyShapeStyle(Color.duFg.opacity(0.16)))
                            .frame(width: 18, height: h)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 100, alignment: .bottom)
            .padding(.bottom, 8)

            HStack(spacing: 0) {
                ForEach(data.months, id: \.self) { m in
                    Text(m)
                        .font(DuFont.mono(10, weight: .medium))
                        .tracking(1.8)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.duFgFaint)
                        .frame(maxWidth: .infinity)
                }
            }

            (Text("Subiu ")
                + Text("+24%").font(DuFont.mono(12, weight: .semibold)).foregroundColor(Color.duDanger)
                + Text(" em 6 meses. Renda subiu 0%."))
                .font(DuFont.mono(12))
                .foregroundStyle(Color.duFgMuted)
                .padding(.top, 14)
        }
    }

    // MARK: Habit row

    private func habitRow(idx: Int, habit: OverviewHabit, isLast: Bool) -> some View {
        let isOpen = openHabitIndex == idx
        let sevColor = habit.severity == .high ? Color.duDanger : Color.duWarn
        return VStack(alignment: .leading, spacing: 0) {
            Rectangle().fill(Color.duBorder).frame(height: 1)
            VStack(alignment: .leading, spacing: 0) {
                Button {
                    withAnimation(.easeOut(duration: 0.22)) {
                        openHabitIndex = isOpen ? nil : idx
                    }
                } label: {
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(idx + 1)")
                            .font(DuFont.mono(12, weight: .bold))
                            .foregroundStyle(sevColor)
                            .frame(width: 28, height: 28)
                            .background(sevColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))

                        VStack(alignment: .leading, spacing: 4) {
                            Text(habit.title)
                                .font(DuFont.mono(14, weight: .semibold))
                                .lineSpacing(1)
                                .foregroundStyle(Color.duFg)
                            Text(habit.kpi)
                                .font(DuFont.mono(12, weight: .medium))
                                .foregroundStyle(sevColor)
                        }
                        Spacer(minLength: 8)
                        miniBars(values: habit.trend, color: sevColor)
                    }
                }
                .buttonStyle(.pressable)
                .padding(.vertical, 16)

                if isOpen {
                    VStack(alignment: .leading, spacing: 14) {
                        Text(habit.lede)
                            .font(DuFont.mono(13))
                            .lineSpacing(2)
                            .foregroundStyle(Color.duFgMuted)
                        VStack(spacing: 0) {
                            ForEach(Array(habit.details.enumerated()), id: \.element.id) { i, d in
                                HStack {
                                    Text(d.label).font(DuFont.mono(12)).foregroundStyle(Color.duFgMuted)
                                    Spacer()
                                    Text(d.value).font(DuFont.mono(12, weight: .medium)).foregroundStyle(Color.duFg)
                                }
                                .padding(.vertical, 7)
                                if i < habit.details.count - 1 {
                                    Rectangle().fill(Color.duBorder).frame(height: 1)
                                }
                            }
                        }
                        Button {
                            onChat("Como cortar \(habit.title.lowercased())?")
                        } label: {
                            HStack(spacing: 6) {
                                DuSparkle(size: 10, color: theme.palette.primary)
                                Text("Pedir plano pro Du")
                                    .font(DuFont.mono(12, weight: .medium))
                                    .foregroundStyle(Color.duFg)
                            }
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .overlay(Capsule().stroke(Color.duBorderHi, lineWidth: 1))
                            .clipShape(Capsule())
                        }
                        .buttonStyle(.pressable)
                    }
                    .padding(.leading, 40)
                    .padding(.bottom, 16)
                }
            }
            if isLast { Rectangle().fill(Color.duBorder).frame(height: 1) }
        }
    }

    private func miniBars(values: [Int], color: Color) -> some View {
        let maxVal = values.max() ?? 1
        return HStack(alignment: .bottom, spacing: 4) {
            ForEach(Array(values.enumerated()), id: \.offset) { idx, v in
                let h = max(2, CGFloat(v) / CGFloat(maxVal) * 28)
                let isLast = idx == values.count - 1
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(isLast ? color : Color.duFg.opacity(0.18))
                    .frame(width: 7, height: h)
            }
        }
        .frame(height: 28)
    }

    // MARK: Pinned bottom

    private var pinnedActions: some View {
        HStack(spacing: 8) {
            Button {
                onChat("Monta o plano de 30 dias")
            } label: {
                HStack(spacing: 8) {
                    DuSparkle(size: 12, color: .white)
                    Text("Monta o plano")
                        .font(DuFont.mono(14, weight: .semibold))
                        .foregroundStyle(.white)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(theme.palette.primary, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .shadow(color: theme.palette.primary.opacity(0.25), radius: 12, x: 0, y: 6)
            }
            .buttonStyle(.pressable)

            Button(action: onBack) {
                Text("Depois")
                    .font(DuFont.mono(14, weight: .medium))
                    .foregroundStyle(Color.duFg)
                    .padding(.horizontal, 18).padding(.vertical, 14)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.duBorder, lineWidth: 1))
            }
            .buttonStyle(.pressable)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 22)
    }

    // MARK: Helpers

    private func integerString(_ value: Int) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.numberStyle = .decimal
        f.groupingSeparator = "."
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    private func thousands(_ value: Int) -> String {
        String(format: "%.1f", Double(value)/1000).replacingOccurrences(of: ".", with: ",") + "k"
    }

    private var rangeLabel: String {
        guard let first = data.months.first, let last = data.months.last else {
            return ""
        }
        return "\(first) → \(last)"
    }
}
