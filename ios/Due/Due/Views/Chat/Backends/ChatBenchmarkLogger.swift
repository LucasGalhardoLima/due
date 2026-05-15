#if DEBUG
import Foundation

// JSONL log of every chat exchange across backends. One line per turn.
// Compiled only into DEBUG — RELEASE builds dead-strip the whole enum
// and the call site in ChatViewModel is also #if DEBUG-wrapped.
// File: <Documents>/du-chat-benchmark.jsonl
//
// Pull from device with:
//   Xcode → Window → Devices and Simulators → select Du → Download Container
// Then dig into AppData/Documents/du-chat-benchmark.jsonl.
//
// Schema:
// {
//   "ts": "2026-05-05T13:45:00Z",
//   "family": "rules" | "llamaCpp",
//   "model_id": "rules" | "qwen3-0.6b" | "qwen3.5-0.8b" | "gemma3-1b" | "llama3.2-1b",
//   "kind": "ruleBased" | "qwen3_06b" | …,           // raw enum
//   "prompt": "iFood 47",
//   "raw_response": "<full assistant text or empty if structured-only>",
//   "structured": {"type":"expense", ...} | null,
//   "first_token_ms": 1240,
//   "total_ms": 2300,
//   "output_tokens": 28,
//   "parse_success": true
// }
@MainActor
enum ChatBenchmarkLogger {
    private static let fileName = "du-chat-benchmark.jsonl"
    private static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    static var fileURL: URL? {
        guard let docs = try? FileManager.default.url(
            for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true
        ) else { return nil }
        return docs.appendingPathComponent(fileName)
    }

    struct Entry {
        let backend: ChatBackendKind
        let prompt: String
        let rawResponse: String
        let structured: StructuredOutput?
        let stats: BackendStats
    }

    static func log(_ entry: Entry) {
        guard let url = fileURL else { return }
        let line = makeLine(entry: entry)
        guard let data = (line + "\n").data(using: .utf8) else { return }

        if FileManager.default.fileExists(atPath: url.path) {
            if let handle = try? FileHandle(forWritingTo: url) {
                defer { try? handle.close() }
                _ = try? handle.seekToEnd()
                try? handle.write(contentsOf: data)
            }
        } else {
            try? data.write(to: url, options: [.atomic])
            // Stragglers from DEBUG builds must never reach iCloud Backup.
            var mutableURL = url
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            try? mutableURL.setResourceValues(values)
        }
    }

    private static func makeLine(entry: Entry) -> String {
        let modelId = LocalModelCatalog.config(for: entry.backend)?.id ?? "rules"
        var dict: [String: Any] = [
            "ts": iso.string(from: Date()),
            "family": entry.backend.family.rawValue,
            "model_id": modelId,
            "kind": entry.backend.rawValue,
            "prompt": entry.prompt,
            "raw_response": entry.rawResponse,
            "first_token_ms": entry.stats.firstTokenMs,
            "total_ms": entry.stats.totalMs,
            "output_tokens": entry.stats.outputTokens,
            "parse_success": entry.stats.parseSuccess,
        ]
        if let structured = entry.structured {
            dict["structured"] = serialize(structured)
        }
        guard let data = try? JSONSerialization.data(withJSONObject: dict, options: [.sortedKeys]),
              let json = String(data: data, encoding: .utf8) else { return "{}" }
        return json
    }

    private static func serialize(_ s: StructuredOutput) -> [String: Any] {
        switch s {
        case .expense(let e):
            return [
                "type": "expense",
                "merchant": e.merchant,
                "amount": e.amount,
                "category": e.category,
                "date": e.date,
                "time": e.time
            ]
        case .insight(let i):
            var d: [String: Any] = ["type": "insight", "title": i.title, "body": i.body]
            if let a = i.action { d["action"] = a }
            if let n = i.navigateTo { d["navigateTo"] = n.rawValue }
            return d
        }
    }
}
#endif
