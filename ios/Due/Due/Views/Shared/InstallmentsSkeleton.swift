import SwiftUI

struct InstallmentsSkeleton: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Health card
                VStack(spacing: 12) {
                    HStack {
                        SkeletonRect(width: 140, height: 16)
                        Spacer()
                        SkeletonRect(width: 60, height: 20, cornerRadius: 10)
                    }

                    HStack(spacing: 20) {
                        ForEach(0..<3, id: \.self) { _ in
                            VStack(spacing: 4) {
                                SkeletonRect(width: 50, height: 24)
                                SkeletonRect(width: 40, height: 10)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .padding(16)
                .background(Color.gray.opacity(0.06), in: RoundedRectangle(cornerRadius: DuTheme.radiusLarge))

                // Month rows
                ForEach(0..<6, id: \.self) { _ in
                    VStack(spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                SkeletonRect(width: 100, height: 14)
                                SkeletonRect(width: 60, height: 10)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 4) {
                                SkeletonRect(width: 80, height: 14)
                                SkeletonRect(width: 50, height: 10)
                            }
                        }
                        SkeletonRect(height: 4, cornerRadius: 2)
                    }
                    .padding(12)
                    .background(Color.gray.opacity(0.06), in: RoundedRectangle(cornerRadius: DuTheme.radiusLarge))
                }
            }
            .padding(16)
        }
    }
}
