import Foundation
import Network

/// Queues transactions when offline and syncs them when connectivity returns.
@MainActor
@Observable
final class OfflineTransactionQueue {
    static let shared = OfflineTransactionQueue()

    private(set) var pendingCount = 0

    private var queue: [QueuedTransaction] = []
    private let monitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "com.du.networkMonitor")
    private var isSyncing = false

    private init() {
        loadQueue()
        startMonitoring()
    }

    // MARK: - Public

    func enqueue(_ request: CreateTransactionRequest) {
        let item = QueuedTransaction(
            id: UUID().uuidString,
            request: request,
            createdAt: Date()
        )
        queue.append(item)
        pendingCount = queue.count
        saveQueue()

        #if DEBUG
        print("[OfflineQueue] Enqueued transaction: \(request.description) — \(pendingCount) pending")
        #endif
    }

    // MARK: - Network Monitoring

    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard path.status == .satisfied else { return }
            Task { @MainActor [weak self] in
                await self?.flush()
            }
        }
        monitor.start(queue: monitorQueue)
    }

    // MARK: - Flush

    func flush() async {
        guard !isSyncing, !queue.isEmpty else { return }
        isSyncing = true

        #if DEBUG
        print("[OfflineQueue] Flushing \(queue.count) queued transactions")
        #endif

        var remaining: [QueuedTransaction] = []

        for item in queue {
            do {
                struct TxResponse: Decodable { let id: String }
                let _: TxResponse = try await APIClient.shared.request(
                    Endpoint.createTransaction(),
                    body: item.request
                )
                #if DEBUG
                print("[OfflineQueue] Synced: \(item.request.description)")
                #endif
            } catch {
                let apiError = error as? APIError
                if apiError?.kind == .offline {
                    // Still offline — keep remaining items and stop
                    remaining.append(item)
                    remaining.append(contentsOf: queue.suffix(from: queue.firstIndex(where: { $0.id == item.id })!).dropFirst())
                    break
                }
                // Non-network errors (4xx, decoding) — drop the item to avoid infinite retries
                #if DEBUG
                print("[OfflineQueue] Dropped (non-retryable): \(item.request.description) — \(error)")
                #endif
            }
        }

        queue = remaining
        pendingCount = queue.count
        saveQueue()
        isSyncing = false
    }

    // MARK: - Persistence

    private static var fileURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("offline_transaction_queue.json")
    }

    private func saveQueue() {
        do {
            let data = try JSONEncoder().encode(queue)
            try data.write(to: Self.fileURL, options: .atomic)
        } catch {
            #if DEBUG
            print("[OfflineQueue] Save failed: \(error)")
            #endif
        }
    }

    private func loadQueue() {
        do {
            let data = try Data(contentsOf: Self.fileURL)
            queue = try JSONDecoder().decode([QueuedTransaction].self, from: data)
            pendingCount = queue.count
        } catch {
            queue = []
            pendingCount = 0
        }
    }
}

// MARK: - Queued Transaction

private struct QueuedTransaction: Codable, Identifiable {
    let id: String
    let request: CreateTransactionRequest
    let createdAt: Date
}
