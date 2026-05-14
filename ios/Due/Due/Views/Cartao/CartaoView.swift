import SwiftUI

struct CartaoView: View {
    @Environment(AppTheme.self) private var theme
    let data: CartaoData
    var onBack: () -> Void
    var onChat: () -> Void

    private let pad: CGFloat = 24

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                header.padding(.bottom, 24)
                bigNumber
                progressStrip.padding(.top, 18)
                duSays.padding(.top, 22)
                composition.padding(.top, 28)
                lancamentos.padding(.top, 32)
                actions.padding(.top, 32)
            }
            .padding(.horizontal, pad)
            .padding(.top, 12)
            .padding(.bottom, 40)
        }
        .background(Color.duBg.ignoresSafeArea())
    }

    // MARK: Header

    private var header: some View {
        HStack {
            HStack(spacing: 14) {
                Button(action: onBack) {
                    Image(systemName: "arrow.left")
                        .font(.system(size: 18, weight: .regular))
                        .foregroundStyle(Color.duFg)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.pressable)
                Text("Cartão")
                    .font(DuFont.mono(11, weight: .medium))
                    .tracking(2.4)
                    .textCase(.uppercase)
                    .foregroundStyle(Color.duFgMuted)
            }
            Spacer()
            let urgent = data.pct > 80
            Text("Fecha em \(data.fechaEm)d")
                .font(DuFont.mono(10, weight: .semibold))
                .tracking(1.8)
                .textCase(.uppercase)
                .foregroundStyle(urgent ? Color.duDanger : Color.duFgMuted)
                .padding(.horizontal, 11).padding(.vertical, 5)
                .background(
                    urgent ? Color.duDanger.opacity(0.12) : Color.duSurface,
                    in: Capsule()
                )
                .overlay(
                    Capsule().stroke(urgent ? Color.duDanger.opacity(0.28) : Color.duBorder, lineWidth: 1)
                )
        }
    }

    // MARK: Big number

    private var bigNumber: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fatura aberta")
                .font(DuFont.mono(11, weight: .medium))
                .tracking(2.4)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("R$")
                    .font(DuFont.mono(24, weight: .medium))
                    .foregroundStyle(Color.duFgMuted)
                Text(integerString(data.fatura))
                    .font(DuFont.mono(56, weight: .bold))
                    .kerning(-2.0)
                    .foregroundStyle(Color.duFg)
                    .monospacedDigit()
            }

            (Text("\(data.pct)% de R$ \(integerString(data.limite)). Te sobram ")
                + Text("R$\u{00A0}\(integerString(data.livre))").font(DuFont.mono(14, weight: .semibold)).foregroundColor(Color.duFg)
                + Text(" antes de bater o teto."))
                .font(DuFont.mono(14))
                .foregroundStyle(Color.duFgMuted)
                .lineSpacing(2)
        }
    }

    private var progressStrip: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.duSurface).frame(height: 4)
                Capsule()
                    .fill(LinearGradient(
                        colors: data.pct > 80
                            ? [theme.palette.primary, .duDanger]
                            : [theme.palette.primary, theme.palette.primaryDark],
                        startPoint: .leading, endPoint: .trailing
                    ))
                    .frame(width: geo.size.width * CGFloat(data.pct) / 100, height: 4)
            }
        }
        .frame(height: 4)
    }

    // MARK: Du says

    private var duSays: some View {
        Button(action: onChat) {
            HStack(alignment: .top, spacing: 12) {
                DuSparkle(size: 12, color: theme.palette.primary)
                    .padding(.top, 4)
                VStack(alignment: .leading, spacing: 6) {
                    (Text("Quase metade da fatura é ")
                        + Text("delivery + mercado").font(DuFont.mono(14, weight: .semibold))
                        + Text(". Se segurar essa semana, fechamos com ")
                        + Text("R$ 1.180").font(DuFont.mono(14, weight: .semibold)).foregroundColor(theme.palette.primary)
                        + Text(" a menos."))
                        .font(DuFont.mono(14))
                        .foregroundStyle(Color.duFg)
                        .multilineTextAlignment(.leading)
                        .lineSpacing(2)

                    Text("Falar com Du →")
                        .font(DuFont.mono(12, weight: .semibold))
                        .foregroundStyle(theme.palette.primary)
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 14)
            .overlay(alignment: .top)    { Rectangle().fill(Color.duBorder).frame(height: 1) }
            .overlay(alignment: .bottom) { Rectangle().fill(Color.duBorder).frame(height: 1) }
        }
        .buttonStyle(.pressable)
    }

    // MARK: Composition

    private var composition: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Onde foi")
                .font(DuFont.mono(11, weight: .medium))
                .tracking(2.0)
                .textCase(.uppercase)
                .foregroundStyle(Color.duFgMuted)

            VStack(spacing: 14) {
                ForEach(data.categorias) { cat in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            HStack(spacing: 8) {
                                Text(cat.name)
                                    .font(DuFont.mono(14, weight: .medium))
                                    .foregroundStyle(Color.duFg)
                                if cat.over {
                                    Text("Acima")
                                        .font(DuFont.mono(9, weight: .bold))
                                        .tracking(1.2)
                                        .textCase(.uppercase)
                                        .foregroundStyle(Color.duDanger)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(Color.duDanger.opacity(0.14), in: Capsule())
                                }
                            }
                            Spacer()
                            Text("R$ \(integerString(cat.valor))")
                                .font(DuFont.mono(14, weight: .semibold))
                                .foregroundStyle(Color.duFg)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.duSurface)
                                Capsule()
                                    .fill(cat.over ? Color.duDanger : theme.palette.primary)
                                    .opacity(cat.over ? 0.9 : 0.7)
                                    .frame(width: geo.size.width * min(1.0, CGFloat(cat.share) * 3 / 100))
                            }
                        }
                        .frame(height: 3)
                    }
                }
            }
        }
    }

    // MARK: Lançamentos

    private var lancamentos: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Últimos lançamentos")
                    .font(DuFont.mono(11, weight: .medium))
                    .tracking(2.0)
                    .textCase(.uppercase)
                    .foregroundStyle(Color.duFgMuted)
                Spacer()
                Text("Ver todos")
                    .font(DuFont.mono(11, weight: .medium))
                    .foregroundStyle(theme.palette.primary)
            }
            .padding(.bottom, 14)

            VStack(spacing: 0) {
                ForEach(Array(data.recent.enumerated()), id: \.element.id) { idx, txn in
                    HStack(alignment: .firstTextBaseline) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(txn.merchant)
                                .font(DuFont.mono(14, weight: .medium))
                                .foregroundStyle(Color.duFg)
                            Text("\(txn.category) · \(txn.when)")
                                .font(DuFont.mono(10, weight: .medium))
                                .tracking(1.5)
                                .textCase(.uppercase)
                                .foregroundStyle(Color.duFgFaint)
                        }
                        Spacer()
                        Text(brl(txn.amount))
                            .font(DuFont.mono(14, weight: .medium))
                            .foregroundStyle(Color.duFg)
                    }
                    .padding(.vertical, 12)
                    if idx < data.recent.count - 1 {
                        Rectangle().fill(Color.duBorder).frame(height: 1)
                    }
                }
            }
        }
    }

    // MARK: Actions

    private var actions: some View {
        VStack(spacing: 8) {
            actionRow("Pagar fatura agora")
            actionRow("Bloquear cartão até fechar")
        }
    }

    private func actionRow(_ label: String) -> some View {
        Button {} label: {
            HStack {
                Text(label)
                    .font(DuFont.mono(14, weight: .medium))
                    .foregroundStyle(Color.duFg)
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(Color.duFgMuted)
            }
            .padding(.horizontal, 18).padding(.vertical, 14)
            .background(Color.duSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color.duBorder, lineWidth: 1))
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

    private func brl(_ value: Double) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "pt_BR")
        f.numberStyle = .decimal
        f.minimumFractionDigits = 2
        f.maximumFractionDigits = 2
        f.groupingSeparator = "."
        f.decimalSeparator = ","
        return "R$ " + (f.string(from: NSNumber(value: value)) ?? "0,00")
    }
}
