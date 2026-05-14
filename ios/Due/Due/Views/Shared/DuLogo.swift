import SwiftUI

// "Du" wordmark in a rounded square — gradient retints from the active palette.
struct DuLogo: View {
    let size: CGFloat
    var palette: DuPalette = .tokyoNight
    var inverted: Bool = false   // light=true → solid dark fill instead of gradient

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.25, style: .continuous)
                .fill(inverted
                      ? AnyShapeStyle(Color(hex: 0x0A0B0D))
                      : AnyShapeStyle(palette.gradient))
            Text("Du")
                .font(.custom("Geist-Bold", fixedSize: size * 0.46))
                .kerning(-0.5)
                .foregroundStyle(.white)
                .offset(y: size * 0.02)
        }
        .frame(width: size, height: size)
    }
}

// 4-point sparkle (used for AI-accent moments)
struct SparkleShape: Shape {
    func path(in rect: CGRect) -> Path {
        let cx = rect.midX, cy = rect.midY
        let w = rect.width / 2, h = rect.height / 2
        var p = Path()
        p.move(to: CGPoint(x: cx, y: cy - h))                                  // top
        p.addLine(to: CGPoint(x: cx + w * 0.18, y: cy - h * 0.18))             // top-right inner
        p.addLine(to: CGPoint(x: cx + w, y: cy))                               // right
        p.addLine(to: CGPoint(x: cx + w * 0.18, y: cy + h * 0.18))             // bottom-right inner
        p.addLine(to: CGPoint(x: cx, y: cy + h))                               // bottom
        p.addLine(to: CGPoint(x: cx - w * 0.18, y: cy + h * 0.18))             // bottom-left inner
        p.addLine(to: CGPoint(x: cx - w, y: cy))                               // left
        p.addLine(to: CGPoint(x: cx - w * 0.18, y: cy - h * 0.18))             // top-left inner
        p.closeSubpath()
        return p
    }
}

struct DuSparkle: View {
    var size: CGFloat = 12
    var color: Color = .accentColor

    var body: some View {
        SparkleShape()
            .fill(color)
            .frame(width: size, height: size)
    }
}
