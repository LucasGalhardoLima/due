import SwiftUI

struct DashboardSkeleton: View {
    var body: some View {
        VStack(spacing: 20) {
            // Summary cards
            HStack(spacing: 12) {
                ForEach(0..<3, id: \.self) { _ in
                    VStack(alignment: .leading, spacing: 8) {
                        SkeletonRect(width: 50, height: 10)
                        SkeletonRect(width: 80, height: 20)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Color.gray.opacity(0.06), in: RoundedRectangle(cornerRadius: DuTheme.radiusLarge))
                }
            }

            // Du Score gauge
            VStack(spacing: 12) {
                HStack {
                    SkeletonRect(width: 80, height: 16)
                    Spacer()
                    SkeletonRect(width: 60, height: 20, cornerRadius: 10)
                }

                SkeletonCircle(size: 140)
                    .padding(.horizontal, 20)
            }
            .padding(16)
            .background(Color.gray.opacity(0.06), in: RoundedRectangle(cornerRadius: DuTheme.radiusLarge))

            // Upcoming bills header
            HStack {
                SkeletonRect(width: 120, height: 16)
                Spacer()
            }
            .padding(.horizontal, 4)

            // Bill rows
            ForEach(0..<3, id: \.self) { _ in
                HStack(spacing: 12) {
                    SkeletonRect(width: 4, height: 32, cornerRadius: 2)
                    VStack(alignment: .leading, spacing: 4) {
                        SkeletonRect(width: 140, height: 14)
                        SkeletonRect(width: 80, height: 10)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        SkeletonRect(width: 70, height: 14)
                        SkeletonRect(width: 40, height: 10)
                    }
                }
                .padding(12)
                .background(Color.gray.opacity(0.06), in: RoundedRectangle(cornerRadius: DuTheme.radiusLarge))
            }
        }
    }
}
