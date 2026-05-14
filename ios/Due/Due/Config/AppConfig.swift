import Foundation

enum AppConfig {
    #if DEBUG
    static let apiBaseURL = "http://localhost:3001"
    #else
    static let apiBaseURL = "https://due-rosy.vercel.app"
    #endif

    static let clerkPublishableKey = "pk_test_Y2xlYW4tZG9nLTMxLmNsZXJrLmFjY291bnRzLmRldiQ"
}
