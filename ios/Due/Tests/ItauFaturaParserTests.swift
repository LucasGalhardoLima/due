import Testing
import Foundation
@testable import Du

struct ItauFaturaParserTests {
    private let parser = ItauFaturaParser()

    private static let sampleItauText = """

              Cartão        5536.XXXX.XXXX.6552
              Vencimento: 20/01/2026
              Emissão: 13/01/2026
              Previsão prox. Fechamento: 13/02/2026

                Lançamentos: compras e saques
                LUCAS G LIMA (final 6552)
                DATA ESTABELECIMENTO                                   VALOR EM R$
                13/12   RAIA182 -CT                 77,65
                        SAÚDE .MATO
                13/12   AMORA DOCE K-CT E 01/05     81,38
                        VESTUÁRIO .
                13/12   MC DONALD S -CT            132,80
                        ALIMENTAÇÃO .MATAO
                14/12   AUTO POSTO P-CT VERA       235,52
                        VEÍCULOS .MATAO
                20/12   Carters -CT 01/05           44,03
                        VESTUÁRIO .
                19/12   RAIA3368 -CT 01/03         137,48
                        SAÚDE .
                02/09   LOJAS CEM F1-CT 05/10      189,80
                        VESTUÁRIO .MATAO
                15/11   PBKIDS BRINQ-CT S 02/03    116,64
                        DIVERSOS .ARARAQUARA
                15/11   JIM.COM* JES-CT A02/03     237,90
                        DIVERSOS .MATAO
                15/11   JIM.COM* JES-CT AMAN        - 0,02
                        DIVERSOS .MATAO
                15/11   PBKIDS BRINQ-CT S           - 0,02
                        DIVERSOS .ARARAQUARA
                Lançamentos no cartão (final 6552)       11.363,55

                Compras parceladas - próximas faturas
                DATA    ESTABELECIMENTO                         VALOR EM R$
                25/02   AMAZON PRIME BR 12/12                         13,90
                14/03   QIPU        11/12                            159,00
    """

    // MARK: - Detection

    @Test
    func detectsItauFatura() {
        #expect(parser.detect(rawText: Self.sampleItauText) == true)
    }

    @Test
    func rejectsNonItauText() {
        #expect(parser.detect(rawText: "Some random CSV file content") == false)
    }

    // MARK: - Billing period

    @Test
    func extractsBillingPeriodFromHeader() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        #expect(result.billingPeriod == "2026-01")
    }

    @Test
    func throwsWhenBillingPeriodMissing() {
        let text = """
            Cartão 5536.XXXX.XXXX.6552
            Lançamentos: compras e saques
            DATA ESTABELECIMENTO  VALOR EM R$
            13/12 RAIA -CT 77,65
        """
        #expect(throws: FaturaParseError.unknownBillingPeriod) {
            _ = try parser.parse(rawText: text)
        }
    }

    // MARK: - Single-payment transactions

    @Test
    func parsesSinglePaymentTransaction() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        let raia = try #require(result.transactions.first(where: { $0.rawDescription.contains("RAIA182") }))
        #expect(raia.amount == Decimal(string: "77.65"))
        #expect(raia.installmentsCount == 1)
        #expect(raia.bankCategory == "SAÚDE")
        #expect(raia.purchaseDate == "2025-12-13")
    }

    // MARK: - First-installment transactions

    @Test
    func parsesFirstInstallmentWithTotalAmount() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        let amora = try #require(result.transactions.first(where: { $0.rawDescription.contains("AMORA DOCE") }))
        // Total = perInstallment × count = 81.38 × 5 = 406.90
        #expect(amora.amount == Decimal(string: "406.90"))
        #expect(amora.installmentsCount == 5)
    }

    // MARK: - Skipping behavior

    @Test
    func skipsOngoingInstallments() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        // LOJAS CEM 05/10 should be in skippedInstallments, not transactions
        #expect(result.transactions.first(where: { $0.rawDescription.contains("LOJAS CEM") }) == nil)
        let skipped = try #require(result.skippedInstallments.first(where: { $0.description.contains("LOJAS CEM") }))
        #expect(skipped.installmentNumber == 5)
        #expect(skipped.installmentsTotal == 10)
    }

    @Test
    func skipsRoundingAdjustments() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        // No negative-amount rows should leak into transactions
        #expect(result.transactions.allSatisfy { $0.amount > 0 })
        #expect(result.stats.skippedAdjustments == 2)
    }

    @Test
    func skipsPreviewParceladasSection() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        // AMAZON PRIME 12/12 and QIPU 11/12 from the preview section should not appear
        #expect(result.transactions.first(where: { $0.rawDescription.contains("AMAZON PRIME") }) == nil)
        #expect(result.transactions.first(where: { $0.rawDescription.contains("QIPU") }) == nil)
    }

    // MARK: - Category & city extraction

    @Test
    func extractsCityFromCategoryLine() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        let mc = try #require(result.transactions.first(where: { $0.rawDescription.contains("MC DONALD") }))
        #expect(mc.city == "MATAO")
        #expect(mc.bankCategory == "ALIMENTAÇÃO")
    }

    @Test
    func handlesEmptyCity() throws {
        let text = """

              Cartão 5536.XXXX.XXXX.6552
              Previsão prox. Fechamento: 13/02/2026

              Lançamentos: compras e saques
              LUCAS G LIMA (final 6552)
              DATA ESTABELECIMENTO                                   VALOR EM R$
              19/12   RAIA3368 -CT 01/03         137,48
                      SAÚDE .
        """
        let result = try parser.parse(rawText: text)
        #expect(result.transactions.count == 1)
        let tx = try #require(result.transactions.first)
        #expect(tx.city == "")
        #expect(tx.bankCategory == "SAÚDE")
    }

    // MARK: - International section

    @Test
    func skipsInternationalTransactionsSection() throws {
        let text = """

              Cartão 5536.XXXX.XXXX.6552
              Previsão prox. Fechamento: 13/02/2026

              Lançamentos: compras e saques
              LUCAS G LIMA (final 6552)
              DATA ESTABELECIMENTO                                   VALOR EM R$
              13/12   RAIA182 -CT                 77,65
                      SAÚDE .MATO

              Lançamentos internacionais
              LUCAS G LIMA (final 6552)
              DATA ESTABELECIMENTO                             US$         R$
              26/12 TUYA (HK) LIMITED                        39,22
                       KOWLOON           36,90 BRL   6,67
              Total transações inter. em R$                 39,22
        """
        let result = try parser.parse(rawText: text)
        #expect(result.transactions.count == 1)
        let tx = try #require(result.transactions.first)
        #expect(tx.rawDescription.contains("RAIA182"))
    }

    // MARK: - Stats

    @Test
    func reportsCorrectStats() throws {
        let result = try parser.parse(rawText: Self.sampleItauText)
        #expect(result.stats.newPurchases == 6)
        #expect(result.stats.skippedOngoing == 3)
        #expect(result.stats.skippedAdjustments == 2)
    }

    // MARK: - Date resolution (year rollover)

    @Test
    func resolvesYearRolloverForDecemberTransactions() throws {
        // Billing period is 2026-01, so Dec transactions belong to 2025
        let result = try parser.parse(rawText: Self.sampleItauText)
        let dec = try #require(result.transactions.first(where: { $0.rawDescription.contains("RAIA182") }))
        #expect(dec.purchaseDate == "2025-12-13")
    }

    // MARK: - Bank detector dispatch

    @Test
    func detectorReturnsItauParser() {
        let found = FaturaDetector.detectBank(rawText: Self.sampleItauText)
        #expect(found?.bankId == "itau")
    }

    @Test
    func detectorReturnsNilForUnknownBank() {
        let found = FaturaDetector.detectBank(rawText: "random")
        #expect(found == nil)
    }
}
