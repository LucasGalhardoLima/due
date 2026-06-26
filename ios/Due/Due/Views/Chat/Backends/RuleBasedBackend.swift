import Foundation

// The original scripted behaviour, lifted from ChatViewModel verbatim so we
// have a baseline to A/B against the local model. Same prompts, same replies.
struct RuleBasedBackend: ChatBackend {
    let kind: ChatBackendKind = .ruleBased

    func prepare() async throws { /* no-op */ }

    func reply(to message: String, history _: [ChatMessage], context: ChatContext) -> AsyncThrowingStream<ChatStreamEvent, Error> {
        AsyncThrowingStream { continuation in
            let start = DispatchTime.now()

            Task {
                // Mimic the prototype's typing pause for parity with the localMLX path.
                try? await Task.sleep(for: .milliseconds(950))

                let lower = message.lowercased()

                // Note: ExpenseQuickParser is NOT called here — ChatViewModel.send()
                // already handles the fast path before the backend is invoked.

                let events: [ChatStreamEvent] = makeReply(for: lower, context: context)
                for event in events {
                    continuation.yield(event)
                }
                continuation.yield(.done(stats(from: start, tokens: 0, parseSuccess: !events.isEmpty)))
                continuation.finish()
            }
        }
    }

    // MARK: -

    private func makeReply(for lower: String, context: ChatContext) -> [ChatStreamEvent] {
        let isAnalysisRequest = lower.contains("6 meses") || lower.contains("análise")
            || lower.contains("relatório") || lower.contains("relatorio")
            || lower.contains("habits") || lower.contains("padrão")
            || lower.contains("padrao") || lower.contains("comportamento")
        if isAnalysisRequest {
            // If we have real pattern signals, lead with them.
            if let p = context.spendingPatterns, p.hasConvergentSignal {
                return makePatternInsights(p)
            }
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
            if context.monthSpent > 0 {
                let spent = "R$ \(context.monthSpent)"
                let netStr = context.monthNet >= 0
                    ? "Ainda tem R$ \(context.monthNet) disponíveis."
                    : "Já estourou em R$ \(abs(context.monthNet))."
                var events: [ChatStreamEvent] = [
                    .finalText("Gastou \(spent) esse mês. \(netStr)")
                ]
                if let card = context.cards.first, card.limit > 0 {
                    let pctRaw = card.currentCycleSpend / card.limit * 100
                    let pct = Int(truncating: pctRaw as NSDecimalNumber)
                    let cardInfo = "\(card.name) em \(pct)% do limite, fecha em \(card.daysToClose) dias."
                    events.append(.finalText(cardInfo))
                }
                events.append(.suggestions(["Ver cartão", "Análise de categorias", "Análise de 6 meses"]))
                return events
            }
            // Fallback to hardcoded when no real data available
            return [
                .finalText("Tá no caminho. R$ 4.983 disponíveis até dia 30. Ritmo de R$ 124/dia."),
                .finalText("Mas atenção: cartão tá em 85% do limite e fecha em 5 dias. Se segurar delivery essa semana, fechamos o mês com R$ 1.180 a mais."),
                .suggestions(["Ver cartão", "Bloquear cartão até fechar"])
            ]
        }
        if lower.contains("cartão") || lower.contains("cartao") || lower.contains("fatura") {
            if let card = context.cards.first, card.currentCycleSpend > 0 {
                return [.finalText("Fatura \(card.name): R$ \(card.currentCycleSpend) de R$ \(card.limit). Fecha em \(card.daysToClose) dias.")]
            }
            // Fallback to hardcoded when no real data available
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
        var events: [ChatStreamEvent] = [.finalText("Anotado. Quer que eu olhe algo específico?")]
        var chips = ["Como tô esse mês?", "Cartão", "Análise de 6 meses"]
        if let p = context.spendingPatterns, p.hasConvergentSignal {
            chips.append("Analisar meus padrões")
        }
        events.append(.suggestions(chips))
        return events
    }

    // MARK: - Pattern insights

    private func makePatternInsights(_ p: SpendingPatterns) -> [ChatStreamEvent] {
        let flagCount = p.activeFlags.count
        var events: [ChatStreamEvent] = [
            .finalText("Olhei seus padrões de compra. \(flagCount == 1 ? "Achei 1 sinal" : "Achei \(flagCount) sinais") nos últimos 30 dias.")
        ]

        // Surface the two strongest flags as insight cards.
        let priority: [PatternFlag] = [.velocitySpike, .lateNight, .categoryFixation, .bursty, .merchantRepeat]
        let flagsToShow = priority.filter { p.activeFlags.contains($0) }.prefix(2)

        for flag in flagsToShow {
            switch flag {
            case .lateNight:
                let pct = Int(p.lateNightRatio * 100)
                events.append(.structured(.insight(ChatInsight(
                    title: "Compras noturnas",
                    body: "\(pct)% das suas compras acontecem depois das 22h. Impulso noturno é real — o cansaço do dia baixa a guarda.",
                    action: nil,
                    navigateTo: nil))))
            case .velocitySpike:
                let pct = Int(min(p.velocityDelta * 100, 999))
                events.append(.structured(.insight(ChatInsight(
                    title: "Ritmo acelerou",
                    body: "Suas compras aumentaram +\(pct)% essa semana vs sua média. Algo mudou no seu mês?",
                    action: nil,
                    navigateTo: nil))))
            case .categoryFixation:
                let pct = Int(p.topCategoryShare * 100)
                events.append(.structured(.insight(ChatInsight(
                    title: "\(p.topCategory) domina",
                    body: "\(pct)% do seu gasto está em \(p.topCategory). Alta concentração pode ser hábito — ou impulso.",
                    action: "Ver categorias",
                    navigateTo: .overview))))
            case .bursty:
                events.append(.structured(.insight(ChatInsight(
                    title: "Compras em rajada",
                    body: "Seus gastos aparecem em grupos: vários num período curto, depois pausa. Padrão típico de compra por impulso.",
                    action: nil,
                    navigateTo: nil))))
            case .merchantRepeat:
                events.append(.structured(.insight(ChatInsight(
                    title: "Mesmos lugares, mais vezes",
                    body: "Você voltou aos mesmos estabelecimentos várias vezes essa semana. Hábito enraizado ou dependência?",
                    action: nil,
                    navigateTo: nil))))
            }
        }

        events.append(.suggestions(["Me conta mais", "Como quebrar esse padrão?", "Ver relatório completo"]))
        return events
    }

    private func stats(from start: DispatchTime, tokens: Int, parseSuccess: Bool) -> BackendStats {
        let elapsedMs = Int(Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)
        return BackendStats(firstTokenMs: 0, totalMs: elapsedMs, outputTokens: tokens, parseSuccess: parseSuccess)
    }
}
