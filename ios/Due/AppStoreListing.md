# Du — App Store Listing Assets

## 1. App Identity

| Field | Value |
|-------|-------|
| App Name | Du — Finanças no seu dispositivo |
| Subtitle | Faturas e parcelas, sem login |
| Bundle ID | com.du.app |
| Category (Primary) | Finance |
| Category (Secondary) | Productivity |
| Age Rating | 4+ |
| Price | Free |

---

## 2. App Description — Portuguese (Primary)

**Promotional Text** (170 chars, editable without review):
> Suas finanças, no seu dispositivo. Importe sua fatura, organize parcelas e converse com a Du — sem login, sem servidor, sem anúncio.

**Description:**

Du é uma assistente financeira pessoal que roda **100% no seu iPhone**. Sem conta, sem login, sem servidor. Suas faturas e gastos ficam só no seu aparelho.

Feita pra quem usa cartão de crédito no Brasil: importa a fatura em PDF, separa os parcelamentos, e te ajuda a entender pra onde foi o dinheiro.

TUDO LOCAL, TUDO SEU
• Importe sua fatura PDF do Itaú direto no app — o arquivo é lido no seu próprio iPhone
• Lançamentos categorizados automaticamente pelo que o banco já indicou
• Parcelamentos viram um cronograma mês a mês, com a parcela do mês claramente marcada

CONVERSA COM A DU
• Du é uma coach financeira que conversa em pt-BR direto no chat
• Em iPhones com Apple Intelligence (iOS 26+), usa o modelo da Apple no dispositivo
• Em outros iPhones, usa um modelo pequeno empacotado no app — sempre offline
• "iFood 47" vira um lançamento automaticamente; pergunta sobre seus gastos é respondida sem internet

SEM CONTA, SEM RASTREAMENTO
• Não precisa criar conta, não precisa fazer login
• Nenhum dado é enviado pra servidor nenhum
• Sem anúncios, sem analytics, sem SDKs de terceiros

APARÊNCIA
• Modo claro e escuro, com paleta personalizável
• Design moderno em mono-spaced + glass

Du não substitui aconselhamento financeiro profissional. É uma ferramenta de organização, não um robô-conselheiro.

---

## 3. App Description — English (US)

**Promotional Text:**
> Your finances, on your device. Import your statement, manage installments, and chat with Du — no login, no server, no ads.

**Description:**

Du is a personal finance assistant that runs **100% on your iPhone**. No account, no login, no server. Your statements and spending stay on your device only.

Built for Brazilian credit card users: import your PDF statement, separate installment plans, and understand where your money went.

EVERYTHING LOCAL
• Import your Itaú PDF statement straight in the app — the file is read on your iPhone
• Charges auto-categorized using the bank's existing labels
• Installment plans become a month-by-month timeline, with the current month clearly marked

CHAT WITH DU
• Du is a financial coach you can chat with in pt-BR
• On iPhones with Apple Intelligence (iOS 26+), uses Apple's on-device model
• On other iPhones, uses a small bundled model — always offline
• "iFood 47" becomes a logged expense automatically; questions about your spending are answered without internet

NO ACCOUNT, NO TRACKING
• No account creation, no login required
• No data sent to any server
• No ads, no analytics, no third-party SDKs

APPEARANCE
• Light and dark mode, with a customizable palette
• Modern mono + glass design

Du is not a substitute for professional financial advice. It's an organization tool, not a robo-advisor.

---

## 4. Keywords (100 chars max)

**Portuguese (Brazil):**
```
finanças,fatura,cartão,parcela,gastos,orçamento,IA,offline,local,privacidade,crédito,Itaú
```

**English (US):**
```
finance,budget,expenses,credit card,installments,spending,offline,private,local,bills,money
```

---

## 5. What's New (Version 1.0)

**Portuguese:**
> Primeira versão da Du. Importa fatura PDF do Itaú, organiza parcelamentos e tem um chat com IA — tudo no seu iPhone, sem login.

**English:**
> First version of Du. Imports Itaú PDF statements, organizes installment plans, and includes an AI chat — all on your iPhone, no login.

---

## 6. Privacy Nutrition Labels

### Data Types Collected

**None.** Du does not collect, transmit, or share any data. All information stays on the user's device.

| Category | Status |
|----------|--------|
| Contact Info | Not Collected |
| Health & Fitness | Not Collected |
| Financial Info | Not Collected (stored locally on device only) |
| Location | Not Collected |
| Sensitive Info | Not Collected |
| Contacts | Not Collected |
| User Content | Not Collected |
| Browsing History | Not Collected |
| Search History | Not Collected |
| Identifiers | Not Collected |
| Purchases | Not Collected (stored locally on device only) |
| Usage Data | Not Collected |
| Diagnostics | Not Collected |
| Other Data | Not Collected |

### Data Usage Purposes
None. The app makes no network calls. All financial data entered by the user is persisted to local SwiftData storage on the device and never leaves it.

### Tracking
No tracking. `NSPrivacyTracking = false` in the bundled privacy manifest.

### Third-Party SDKs
- `LocalLLMClient` (open-source, on-device LLM runner — no network)
- `LocalLLMClientLlama` (llama.cpp binding — no network)
- `LocalLLMClientFoundationModels` (Apple FoundationModels wrapper — no network)

No analytics, attribution, advertising, or crash-reporting SDKs.

---

## 7. URLs

| Field | URL |
|-------|-----|
| Support URL | https://due-rosy.vercel.app/support |
| Privacy Policy URL | https://due-rosy.vercel.app/privacy |
| Marketing URL | *(optional — e.g., https://du.app)* |

> **Action item before submission:** verify both URLs are live, reflect the local-first reality (no PII collection), and mention LGPD/§13.709 compliance for the Brazilian market.

---

## 8. Screenshot Specifications

### Required Sizes

| Device | Display Size | Resolution (portrait) |
|--------|-------------|----------------------|
| iPhone 16 Pro Max | 6.7" | 1320 × 2868 px |
| iPhone 16 Pro | 6.3" | 1206 × 2622 px |
| iPhone 16 | 6.1" | 1179 × 2556 px |

*Minimum: 6.7" and 6.1" screenshots required.*

### Screenshot Set (5–7 screenshots, recommended order)

| # | Screen | Caption (PT-BR) | Caption (EN) |
|---|--------|-----------------|--------------|
| 1 | Onboarding (greeting) | Sem login, sem nuvem | No login, no cloud |
| 2 | Onboarding (import choice) | Importa sua fatura ou começa do zero | Import your statement or start fresh |
| 3 | Home (with data) | Suas finanças num só lugar | Your finances in one place |
| 4 | Cartão (installments timeline) | Parcelamentos mês a mês | Installments month by month |
| 5 | Chat | Du responde no seu dispositivo | Du replies on your device |
| 6 | Settings (dark mode + palette) | Sua aparência, seu controle | Your look, your call |

### Screenshot Design Guidelines
- Background: app gradient background (mint → deep purple)
- Frame: device mockup frame (iPhone 16 Pro)
- Caption: bold sans-serif top 18% of image
- Layout: device centered, mono caption above

---

## 9. App Review Notes

**Demo Account:** Not applicable. Du has no account creation, no login, no server. All flows are reachable on a fresh install.

**Sample Itaú fatura PDF for testing:**
Upload a sanitized Itaú PDF (no real card number, no real transactions) to App Store Connect's "App Review > Attachments" field. Password for the sample: `00000`.

**Notes for reviewer:**

```
Du is a 100% on-device personal finance app for the Brazilian market.

ACCOUNTS
Du does not have any account creation, login, or remote server. All
data stays on the user's device in SwiftData. No demo account is needed.

FIRST RUN
1. Tap "Continuar" through the name screen (any name works).
2. Choose one of three options:
   a) "Subir fatura do cartão" — recommended. We've attached a
      sanitized Itaú fatura PDF (no real card number, no real
      transactions; password: "00000"). Pick this file, enter the
      password, fill in the card setup (any limit, e.g. 5000; closing
      day 13; due day 20), confirm.
   b) "Importar planilha" — intentionally shows an "Em breve" state
      in this release. CSV import will land in a future version.
   c) "Começar do zero" — proceed to Home with an empty Du.

AI / CHAT
"Du" is a financial coach chatbot powered by:
- Apple FoundationModels (iOS 26 + Apple Intelligence devices), OR
- A bundled Qwen 3 0.6B model running locally via llama.cpp, OR
- A deterministic rule-based fallback.
No prompts are sent to any server. There is no network call in the app.

A "Du não substitui aconselhamento financeiro profissional"
disclaimer is shown on every chat session.

PERMISSIONS
The app requests no permissions. Document picker access for the PDF
import is handled by the system file provider.

CONTACT
Issues during review: lima.galhardo@gmail.com
```
