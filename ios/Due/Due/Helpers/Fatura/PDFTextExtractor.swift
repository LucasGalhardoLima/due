import Foundation
import PDFKit

enum PDFTextExtractor {
    static let maxBytes: Int = 5 * 1024 * 1024

    enum ExtractError: Error, Equatable {
        case fileTooLarge
        case unsupported
        case passwordRequired
        case passwordIncorrect
        case imageOnly
    }

    static func extractText(from url: URL, password: String? = nil) throws -> String {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }

        if let size = (try? FileManager.default.attributesOfItem(atPath: url.path))?[.size] as? Int,
           size > maxBytes {
            throw ExtractError.fileTooLarge
        }

        guard let document = PDFDocument(url: url) else {
            throw ExtractError.unsupported
        }

        if document.isLocked {
            guard let password, !password.isEmpty else {
                throw ExtractError.passwordRequired
            }
            guard document.unlock(withPassword: password) else {
                throw ExtractError.passwordIncorrect
            }
        }

        var text = ""
        for i in 0..<document.pageCount {
            if let page = document.page(at: i), let pageText = page.string {
                text.append(pageText)
                text.append("\n")
            }
        }

        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            throw ExtractError.imageOnly
        }

        return text
    }
}
