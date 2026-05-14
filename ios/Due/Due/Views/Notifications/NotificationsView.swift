import SwiftUI

struct NotificationsView: View {
    @Environment(AppTheme.self) private var theme
    let groups: [NotificationGroup]
    var onBack: () -> Void
    var onMarkAllRead: () -> Void = {}

    private let pad: CGFloat = 24

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                header.padding(.bottom, 28)

                Text("Du fez algumas coisas.")
                    .font(DuFont.mono(32, weight: .bold))
                    .kerning(-1.0)
                    .foregroundStyle(Color.duFg)
                    .padding(.bottom, 8)

                Text("Tudo que rolou em segundo plano enquanto você não tava aqui.")
                    .font(DuFont.mono(14))
                    .lineSpacing(2)
                    .foregroundStyle(Color.duFgMuted)
                    .padding(.bottom, 32)

                ForEach(groups) { group in
                    Text(group.label)
                        .font(DuFont.mono(11, weight: .medium))
                        .tracking(2.0)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.duFgMuted)
                        .padding(.bottom, 12)

                    VStack(spacing: 0) {
                        ForEach(Array(group.items.enumerated()), id: \.element.id) { idx, item in
                            row(item)
                                .padding(.vertical, 14)
                            if idx < group.items.count - 1 {
                                Rectangle().fill(Color.duBorder).frame(height: 1)
                            }
                        }
                    }
                    .padding(.bottom, 28)
                }

                footerHint
            }
            .padding(.horizontal, pad)
            .padding(.top, 12)
            .padding(.bottom, 40)
        }
        .background(Color.duBg.ignoresSafeArea())
    }

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
                Text("Avisos")
                    .font(DuFont.mono(11, weight: .medium))
                    .tracking(2.4)
                    .textCase(.uppercase)
                    .foregroundStyle(Color.duFgMuted)
            }
            Spacer()
            Button(action: onMarkAllRead) {
                Text("Marcar tudo lido")
                    .font(DuFont.mono(12, weight: .medium))
                    .foregroundStyle(theme.palette.primary)
            }
            .buttonStyle(.pressable)
        }
    }

    private func row(_ item: NotificationItem) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .fill(item.urgent ? Color.duDanger.opacity(0.12) : theme.palette.primary.opacity(0.12))
                    .frame(width: 22, height: 22)
                    .overlay(kindGlyph(item).frame(width: 12, height: 12))
                if item.unread {
                    Circle()
                        .fill(theme.palette.primary)
                        .frame(width: 8, height: 8)
                        .overlay(Circle().stroke(Color.duBg, lineWidth: 2))
                        .offset(x: 4, y: -4)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline) {
                    Text(item.title)
                        .font(DuFont.mono(14, weight: item.unread ? .semibold : .medium))
                        .foregroundStyle(item.urgent ? Color.duDanger : Color.duFg)
                        .lineSpacing(1)
                    Spacer()
                    Text(item.time)
                        .font(DuFont.mono(10, weight: .medium))
                        .tracking(1.5)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.duFgFaint)
                }
                Text(item.body)
                    .font(DuFont.mono(13))
                    .lineSpacing(1)
                    .foregroundStyle(Color.duFgMuted)
                if let action = item.action {
                    Button {} label: {
                        Text("\(action) →")
                            .font(DuFont.mono(12, weight: .semibold))
                            .foregroundStyle(item.urgent ? Color.duDanger : theme.palette.primary)
                    }
                    .buttonStyle(.pressable)
                    .padding(.top, 4)
                }
            }
        }
        .opacity(item.unread ? 1.0 : 0.62)
    }

    @ViewBuilder
    private func kindGlyph(_ item: NotificationItem) -> some View {
        let color = item.urgent ? Color.duDanger : theme.palette.primary
        switch item.kind {
        case .auto:
            DuSparkle(size: 12, color: color)
        case .alert:
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(color)
        case .insight:
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(color)
        case .reminder:
            Image(systemName: "clock")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(color)
        }
    }

    private var footerHint: some View {
        VStack(alignment: .leading, spacing: 0) {
            Rectangle().fill(Color.duBorder).frame(height: 1)
            HStack(spacing: 4) {
                (Text("Du te avisa quando algo importa: um padrão estranho, uma fatura próxima, ou quando ele faz uma coisa em segundo plano. Você decide o quanto. ")
                    + Text("Ajustar →").font(DuFont.mono(12, weight: .medium)).foregroundColor(theme.palette.primary))
                    .font(DuFont.mono(12))
                    .lineSpacing(2)
                    .foregroundStyle(Color.duFgFaint)
            }
            .padding(.top, 16)
        }
        .padding(.top, 16)
    }
}
