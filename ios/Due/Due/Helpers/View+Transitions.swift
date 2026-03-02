import SwiftUI

// MARK: - Content State Transition

extension View {
    func contentStateTransition<T: Equatable>(value: T) -> some View {
        self
            .animation(DuTheme.gentleSpring, value: value)
            .transition(.opacity.combined(with: .offset(y: 8)))
    }
}
