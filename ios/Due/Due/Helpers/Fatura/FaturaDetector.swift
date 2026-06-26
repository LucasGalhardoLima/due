import Foundation

enum FaturaDetector {
    private static let parsers: [FaturaParser] = [
        ItauFaturaParser()
    ]

    static func detectBank(rawText: String) -> FaturaParser? {
        parsers.first { $0.detect(rawText: rawText) }
    }
}
