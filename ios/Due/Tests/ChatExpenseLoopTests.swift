import Testing
import Foundation
import SwiftData
@testable import Du

@MainActor
struct ChatExpenseLoopTests {
    private func makeContext() throws -> ModelContext {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(
            for: Card.self, Transaction.self, Installment.self, Insight.self,
            configurations: config
        )
        return ModelContext(container)
    }

    // The headline round-trip: typing "iFood 47" produces an expense card,
    // tapping confirm writes a real Transaction with the right sign,
    // merchant, category, and Decimal precision.
    @Test
    func confirmExpenseInsertsTransactionIntoStore() throws {
        let context = try makeContext()
        let vm = ChatViewModel(initialBackend: .ruleBased)
        vm.modelContext = context

        vm.send("iFood 47")

        // Expense card should be the last message in the thread, no typing
        // dot (we short-circuited before respond()).
        let expenseMessage = try #require(vm.thread.last)
        guard case .expense(let proposal) = expenseMessage.content else {
            Issue.record("expected last bubble to be .expense, got \(expenseMessage.content)")
            return
        }
        #expect(proposal.merchant == "Ifood")
        #expect(proposal.category == "Delivery")
        #expect(proposal.amount == Decimal(47))

        vm.confirmExpense(messageID: expenseMessage.id)

        let stored = try context.fetch(FetchDescriptor<Transaction>())
        #expect(stored.count == 1)
        let txn = try #require(stored.first)
        #expect(txn.merchant == "Ifood")
        #expect(txn.category == "Delivery")
        #expect(txn.amount == Decimal(-47))      // negative = expense
        #expect(txn.isIncome == false)
    }

    // Quick-parse must skip the backend entirely so the common case is
    // instant. The rules backend would normally append a typing dot
    // followed by a chips row; neither should appear AFTER the user's
    // message when ExpenseQuickParser matched. The expense card itself
    // must sit at the thread tail.
    @Test
    func quickParseShortCircuitsBeforeBackend() throws {
        let vm = ChatViewModel(initialBackend: .ruleBased)

        vm.send("Uber 23,50")

        // Everything appended after the user's message should be exactly
        // one expense bubble — no typing, no suggestions chip row.
        let userIdx = try #require(vm.thread.firstIndex(where: { msg in
            if case .text(let t) = msg.content, msg.who == .me, t == "Uber 23,50" { return true }
            return false
        }))
        let appended = Array(vm.thread[(userIdx + 1)...])
        #expect(appended.count == 1, "rules backend should not have appended anything else")

        guard case .expense(let proposal) = appended.first?.content else {
            Issue.record("expected .expense at thread tail, got \(String(describing: appended.first?.content))")
            return
        }
        #expect(proposal.merchant == "Uber")
        #expect(proposal.amount == Decimal(string: "23.50"))
    }

    // Confirming a non-expense bubble (e.g., the welcome suggestions row)
    // must not crash and must not insert anything. Guards against the
    // confirmExpense pattern-match growing a hole.
    @Test
    func confirmExpenseOnNonExpenseBubbleIsNoop() throws {
        let context = try makeContext()
        let vm = ChatViewModel(initialBackend: .ruleBased)
        vm.modelContext = context

        let nonExpense = try #require(vm.thread.first)
        vm.confirmExpense(messageID: nonExpense.id)

        let stored = try context.fetch(FetchDescriptor<Transaction>())
        #expect(stored.isEmpty)
    }

    // Free-form text should NOT match the quick parser. Lets the LLM tier
    // earn its keep on questions / habit asks.
    @Test
    func nonExpenseInputDoesNotMatchQuickParser() {
        #expect(ExpenseQuickParser.parse("como tô esse mês?") == nil)
        #expect(ExpenseQuickParser.parse("análise de 6 meses") == nil)
        #expect(ExpenseQuickParser.parse("oi") == nil)
    }
}
