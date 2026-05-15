import Foundation

struct ItauFaturaParser: FaturaParser {
    let bankId = "itau"

    func detect(rawText: String) -> Bool {
        let hasCardFormat = rawText.range(
            of: #"\d{4}\.\w{4}\.\w{4}\.\d{4}"#,
            options: .regularExpression
        ) != nil
        let hasLancamentos = rawText.contains("compras e saques")
        return hasCardFormat && hasLancamentos
    }

    func parse(rawText: String) throws -> ParsedFatura {
        let billingPeriod = extractBillingPeriod(text: rawText)
        guard billingPeriod != "unknown" else {
            throw FaturaParseError.unknownBillingPeriod
        }

        let cleanedText = removePreviewSections(text: rawText)
        let lines = cleanedText.split(separator: "\n", omittingEmptySubsequences: false)
            .map { String($0) }

        var transactions: [ParsedTransaction] = []
        var skippedInstallments: [SkippedInstallment] = []
        var skippedAdjustments = 0
        var totalLines = 0

        let parts = billingPeriod.split(separator: "-")
        let billingYear = Int(parts[0]) ?? 0
        let billingMonthZero = (Int(parts[1]) ?? 1) - 1

        var inTransactionSection = false

        for i in 0..<lines.count {
            let line = lines[i].trimmingCharacters(in: .whitespaces)

            if line.contains("DATA ESTABELECIMENTO") && line.contains("VALOR EM R$") {
                inTransactionSection = true
                continue
            }
            if line.hasPrefix("Lançamentos no cartão") || line.hasPrefix("Total transações") {
                inTransactionSection = false
                continue
            }
            if line.contains("Lançamentos internacionais")
                || line.contains("Lançamentos: produtos e serviços") {
                inTransactionSection = false
                continue
            }

            guard inTransactionSection else { continue }

            guard let lineMatch = matchTransactionLine(line) else { continue }

            totalLines += 1

            let dateStr = lineMatch.date
            var descPart = lineMatch.description
            let hasNegativeSign = lineMatch.negativeSign
            let amountStr = lineMatch.amount

            guard let rawAmount = parseAmount(raw: amountStr) else {
                skippedAdjustments += 1
                continue
            }
            if hasNegativeSign || rawAmount <= 0 {
                skippedAdjustments += 1
                continue
            }
            let amount = rawAmount

            var installmentNumber = 1
            var installmentsTotal = 1
            if let (number, total, cleanedDesc) = extractInstallment(from: descPart) {
                installmentNumber = number
                installmentsTotal = total
                descPart = cleanedDesc
            }
            let rawDescription = descPart.trimmingCharacters(in: .whitespaces)

            var bankCategory = ""
            var city = ""
            if i + 1 < lines.count {
                let nextLine = lines[i + 1].trimmingCharacters(in: .whitespaces)
                if !nextLine.isEmpty,
                   nextLine.range(of: #"^\d{2}\/\d{2}"#, options: .regularExpression) == nil,
                   let (cat, c) = extractCategoryAndCity(from: nextLine) {
                    bankCategory = cat
                    city = c
                }
            }

            let purchaseDate = resolveDate(
                dateStr: dateStr,
                billingYear: billingYear,
                billingMonthZero: billingMonthZero
            )

            if installmentNumber > 1 {
                let suffix = String(format: "%02d/%02d", installmentNumber, installmentsTotal)
                skippedInstallments.append(SkippedInstallment(
                    description: "\(rawDescription) \(suffix)",
                    amount: amount,
                    installmentNumber: installmentNumber,
                    installmentsTotal: installmentsTotal
                ))
                continue
            }

            let totalAmount: Decimal
            if installmentsTotal > 1 {
                var product = amount * Decimal(installmentsTotal)
                var rounded = Decimal()
                NSDecimalRound(&rounded, &product, 2, .plain)
                totalAmount = rounded
            } else {
                totalAmount = amount
            }

            transactions.append(ParsedTransaction(
                purchaseDate: purchaseDate,
                rawDescription: rawDescription,
                amount: totalAmount,
                installmentsCount: installmentsTotal,
                bankCategory: bankCategory,
                city: city
            ))
        }

        return ParsedFatura(
            bank: bankId,
            billingPeriod: billingPeriod,
            transactions: transactions,
            skippedInstallments: skippedInstallments,
            stats: ParseStats(
                totalLines: totalLines,
                newPurchases: transactions.count,
                skippedOngoing: skippedInstallments.count,
                skippedAdjustments: skippedAdjustments
            )
        )
    }

    // MARK: - Line parsing helpers

    private struct TransactionLineMatch {
        let date: String
        let description: String
        let negativeSign: Bool
        let amount: String
    }

    private func matchTransactionLine(_ line: String) -> TransactionLineMatch? {
        let pattern = #"^(\d{2}\/\d{2})\s+(.+?)\s+(-\s*)?(\d[\d.,]*)\s*$"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let nsRange = NSRange(line.startIndex..<line.endIndex, in: line)
        guard let match = regex.firstMatch(in: line, range: nsRange) else { return nil }

        let date = substring(line, match.range(at: 1))
        let description = substring(line, match.range(at: 2))
        let negSignRange = match.range(at: 3)
        let hasNegativeSign = negSignRange.location != NSNotFound
        let amount = substring(line, match.range(at: 4))

        guard !date.isEmpty, !description.isEmpty, !amount.isEmpty else { return nil }
        return TransactionLineMatch(
            date: date,
            description: description,
            negativeSign: hasNegativeSign,
            amount: amount
        )
    }

    private func extractInstallment(from desc: String) -> (number: Int, total: Int, cleaned: String)? {
        let pattern = #"(\d{2})\/(\d{2})\s*$"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let nsRange = NSRange(desc.startIndex..<desc.endIndex, in: desc)
        guard let match = regex.firstMatch(in: desc, range: nsRange) else { return nil }
        guard let number = Int(substring(desc, match.range(at: 1))),
              let total = Int(substring(desc, match.range(at: 2))) else {
            return nil
        }
        let stripPattern = #"\s*\d{2}\/\d{2}\s*$"#
        guard let stripRegex = try? NSRegularExpression(pattern: stripPattern) else { return nil }
        let cleaned = stripRegex.stringByReplacingMatches(
            in: desc,
            range: nsRange,
            withTemplate: ""
        )
        return (number, total, cleaned)
    }

    private func extractCategoryAndCity(from line: String) -> (category: String, city: String)? {
        let pattern = #"^([A-ZÀ-Ú\s&.]+)\s*\.(.*)$"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let nsRange = NSRange(line.startIndex..<line.endIndex, in: line)
        guard let match = regex.firstMatch(in: line, range: nsRange) else { return nil }
        let cat = substring(line, match.range(at: 1)).trimmingCharacters(in: .whitespaces)
        let city = substring(line, match.range(at: 2)).trimmingCharacters(in: .whitespaces)
        return (cat, city)
    }

    // MARK: - Header & cleanup

    private func extractBillingPeriod(text: String) -> String {
        let closingPattern = #"Fechamento:\s*(\d{2})\/(\d{2})\/(\d{4})"#
        if let regex = try? NSRegularExpression(pattern: closingPattern) {
            let nsRange = NSRange(text.startIndex..<text.endIndex, in: text)
            if let match = regex.firstMatch(in: text, range: nsRange) {
                let nextMonth = Int(substring(text, match.range(at: 2))) ?? 0
                let nextYear = Int(substring(text, match.range(at: 3))) ?? 0
                var month = nextMonth - 1
                var year = nextYear
                if month == 0 {
                    month = 12
                    year -= 1
                }
                return String(format: "%04d-%02d", year, month)
            }
        }

        let emissaoPattern = #"Emissão:\s*(\d{2})\/(\d{2})\/(\d{4})"#
        if let regex = try? NSRegularExpression(pattern: emissaoPattern) {
            let nsRange = NSRange(text.startIndex..<text.endIndex, in: text)
            if let match = regex.firstMatch(in: text, range: nsRange) {
                let m = substring(text, match.range(at: 2))
                let y = substring(text, match.range(at: 3))
                return "\(y)-\(m)"
            }
        }

        return "unknown"
    }

    private func removePreviewSections(text: String) -> String {
        let pattern = #"Compras parceladas - próximas faturas[\s\S]*?(?=Limites de crédito|Novo teto|Encargos cobrados|$)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return text }
        let nsRange = NSRange(text.startIndex..<text.endIndex, in: text)
        return regex.stringByReplacingMatches(in: text, range: nsRange, withTemplate: "")
    }

    private func parseAmount(raw: String) -> Decimal? {
        let cleaned = raw
            .replacingOccurrences(of: ".", with: "")
            .replacingOccurrences(of: ",", with: ".")
        return Decimal(string: cleaned)
    }

    private func resolveDate(dateStr: String, billingYear: Int, billingMonthZero: Int) -> String {
        let parts = dateStr.split(separator: "/")
        guard parts.count == 2,
              let day = Int(parts[0]),
              let monthOne = Int(parts[1]) else {
            return "unknown"
        }
        let monthZero = monthOne - 1
        var year = billingYear
        if monthZero > billingMonthZero {
            year = billingYear - 1
        }
        return String(format: "%04d-%02d-%02d", year, monthZero + 1, day)
    }

    private func substring(_ source: String, _ range: NSRange) -> String {
        guard range.location != NSNotFound,
              let r = Range(range, in: source) else { return "" }
        return String(source[r])
    }
}
