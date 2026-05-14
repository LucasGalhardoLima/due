import Foundation

// The original scripted behaviour, lifted from ChatViewModel verbatim so we
// have a baseline to A/B against the local model. Same prompts, same replies.
struct RuleBasedBackend: ChatBackend {
    let kind: ChatBackendKind = .ruleBased

    func prepare() async throws { /* no-op */ }

    func reply(to message: String, history _: [ChatMessage]) -> AsyncThrowingStream<ChatStreamEvent, Error> {
        AsyncThrowingStream { continuation in
            let start = DispatchTime.now()

            Task {
                // Mimic the prototype's typing pause for parity with the localMLX path.
                try? await Task.sleep(for: .milliseconds(950))

                let lower = message.lowercased()

                if let proposal = parseExpense(from: message) {
                    continuation.yield(.structured(.expense(proposal)))
                    continuation.yield(.done(stats(from: start, tokens: 0, parseSuccess: true)))
                    continuation.finish()
                    return
                }

                let events: [ChatStreamEvent] = makeReply(for: lower)
                for event in events {
                    continuation.yield(event)
                }
                continuation.yield(.done(stats(from: start, tokens: 0, parseSuccess: !events.isEmpty)))
                continuation.finish()
            }
        }
    }

    // MARK: -

    private func makeReply(for lower: String) -> [ChatStreamEvent] {
        if lower.contains("6 meses") || lower.contains("análise") || lower.contains("relatório") || lower.contains("relatorio") || lower.contains("habits") {
            return [
                .finalText("Olhei seus últimos 6 meses. Achei 3 padrões importantes."),
                .structured(.insight(ChatInsight(
                    title: "Delivery virou hábito",
                    body: "12× por semana em média. Subiu 32% desde janeiro. Esse é o teu maior vazamento.",
                    action: "Ver plano",
                    navigateTo: .overview))),
                .structured(.insight(ChatInsight(
                    title: "Você sempre estoura no fim do mês",
                    body: "Últimos 5 meses: gastos sobem 47% nos últimos 8 dias. Sintoma de cartão sem controle.",
                    action: "Como evitar",
                    navigateTo: .overview))),
                .suggestions(["Me mostra o relatório completo", "Como cortar delivery sem sofrer", "Ok, bora resolver"])
            ]
        }
        if lower.contains("mês") || lower.contains("como tô") || lower.contains("como to") {
            return [
                .finalText("Tá no caminho. R$ 4.983 disponíveis até dia 30. Ritmo de R$ 124/dia."),
                .finalText("Mas atenção: cartão tá em 85% do limite e fecha em 5 dias. Se segurar delivery essa semana, fechamos o mês com R$ 1.180 a mais."),
                .suggestions(["Ver cartão", "Bloquear cartão até fechar"])
            ]
        }
        if lower.contains("cartão") || lower.contains("cartao") || lower.contains("fatura") {
            return [
                .finalText("Tua fatura tá em R$ 21.403. 85% do limite. Fecha em 5 dias."),
                .structured(.insight(ChatInsight(
                    title: "Quase metade é delivery + mercado",
                    body: "R$ 9.732 nessas duas categorias. As duas tão acima do teu teto.",
                    action: "Abrir cartão",
                    navigateTo: .cartao)))
            ]
        }
        if lower.contains("adicionar") || lower.contains("gasto") {
            return [.finalText("Manda. Eu entendo coisa tipo \"iFood 47\" ou \"Uber 23,50\". Pode ser foto da nota também.")]
        }
        if lower.range(of: #"^(oi|olá|ola|hey|e aí|e ai)"#, options: .regularExpression) != nil {
            return [.finalText("E aí. Tô aqui.")]
        }
        return [
            .finalText("Anotado. Quer que eu olhe algo específico?"),
            .suggestions(["Como tô esse mês?", "Cartão", "Análise de 6 meses"])
        ]
    }

    private func parseExpense(from message: String) -> ExpenseProposal? {
        let pattern = #"(?i)(?:^|\s)(ifood|uber|99|padaria|mercado|drogasil|spotify|netflix|posto)\s+(\d+(?:[.,]\d{1,2})?)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let ns = message as NSString
        guard let m = regex.firstMatch(in: message, range: NSRange(location: 0, length: ns.length)),
              m.numberOfRanges == 3 else { return nil }
        let merchantRaw = ns.substring(with: m.range(at: 1))
        let amountRaw = ns.substring(with: m.range(at: 2)).replacingOccurrences(of: ",", with: ".")
        guard let amount = Double(amountRaw) else { return nil }
        let merchant = merchantRaw.prefix(1).uppercased() + merchantRaw.dropFirst().lowercased()

        let categoryMap: [String: String] = [
            "ifood": "Delivery", "uber": "Mobilidade", "99": "Mobilidade",
            "padaria": "Mercado", "mercado": "Mercado",
            "drogasil": "Saúde", "spotify": "Assinaturas", "netflix": "Assinaturas",
            "posto": "Combustível"
        ]
        let cat = categoryMap[merchantRaw.lowercased()] ?? "Outros"
        let now = Date()
        let timeFormatter = DateFormatter()
        timeFormatter.locale = Locale(identifier: "pt_BR")
        timeFormatter.dateFormat = "HH:mm"

        return ExpenseProposal(
            merchant: merchant,
            amount: amount,
            category: cat,
            date: "Hoje",
            time: timeFormatter.string(from: now)
        )
    }

    private func stats(from start: DispatchTime, tokens: Int, parseSuccess: Bool) -> BackendStats {
        let elapsedMs = Int(Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)
        return BackendStats(firstTokenMs: 0, totalMs: elapsedMs, outputTokens: tokens, parseSuccess: parseSuccess)
    }
}
