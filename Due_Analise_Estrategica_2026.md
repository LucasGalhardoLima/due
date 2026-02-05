# DUE
## Finanças Reimaginadas

---

# ANÁLISE ESTRATÉGICA
### Produto, Mercado, Design & Futuro

**Fevereiro 2026**

---

## Sumário

1. [Sumário Executivo](#1-sumário-executivo)
2. [Estado Atual do Due](#2-estado-atual-do-due)
3. [Análise de Mercado](#3-análise-de-mercado)
4. [Posicionamento Estratégico](#4-posicionamento-estratégico)
5. [Recomendações de Design](#5-recomendações-de-design)
6. [Landing Page](#6-landing-page)
7. [Visão de Futuro](#7-visão-de-futuro)
8. [Roadmap Sugerido](#8-roadmap-sugerido)
9. [Conclusão](#9-conclusão)

---

## 1. Sumário Executivo

O Due é um aplicativo de gestão financeira pessoal focado em cartões de crédito, com diferenciais em IA e projeção de faturas. Este documento apresenta uma análise completa do estado atual, posicionamento de mercado, tendências de design e recomendações estratégicas para transformar o produto em uma solução premium e escalável.

### Principais Descobertas

- O mercado brasileiro de fintech deve crescer de **US$4.73B (2024)** para **US$17.58B (2033)** — CAGR de 15.7%
- Há uma lacuna clara: soluções de crédito para classe C/D que são inteligentes mas não predatórias
- Tendência 2025-2026: IA como diferencial competitivo, Glassmorphism evoluindo para "Liquid Glass"
- O nome **"Due"** é forte — significa "vencimento" em inglês, perfeito para o posicionamento
- Sua visão de futuro (crédito inteligente → empréstimos) é viável e alinhada com tendências de embedded finance

### Recomendação Central

> **Posicionar o Due como "O coach financeiro para quem vive no crédito"** — não um app de planilha, mas um aliado inteligente que entende a realidade do brasileiro endividado e oferece caminhos práticos para a saúde financeira.

---

## 2. Estado Atual do Due

### Stack Tecnológico

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | Nuxt 4.2.2 + Vue 3.5 + TypeScript + TailwindCSS |
| **Backend** | Nuxt Server Routes (H3) + Prisma 6.2 + PostgreSQL (Neon) |
| **IA** | Vercel AI SDK + OpenAI (GPT-4o) |
| **Autenticação** | Clerk (Enterprise-grade) |
| **Componentes** | 103 componentes Vue (80+ UI primitivos) |

### Features Implementadas

O Due já possui um conjunto robusto de funcionalidades:

1. Gestão multi-cartões com limites, datas de fechamento e vencimento
2. Fatura inteligente com projeção automática de parcelas futuras
3. Simulador de compras com IA preditiva
4. Parser de despesas via linguagem natural
5. AI Advisor com diagnóstico de saúde financeira
6. Importação de CSV (Nubank, Inter) com categorização automática
7. Alertas de crise e análise de Pareto
8. Detecção de assinaturas recorrentes
9. Modo Demo para demonstração imediata

### Design System Atual

O design atual utiliza:

- **Cor primária:** Pearl Aqua (#75DDDD) — HSL(180 70% 45%)
- **Estilo:** Glassmorphism com backdrop blur e transparências
- **Sistema de elevação:** elevation-1 a elevation-5
- **Temas:** Dark/Light mode completo
- **Logo:** Letra "D" em squircle com fundo aqua

---

## 3. Análise de Mercado

### 3.1 Panorama Brasil

O Brasil é um dos mercados de fintech mais promissores do mundo. Números-chave:

- **Mercado fintech:** US$4.73B (2024) → US$17.58B (2033) — CAGR 15.7%
- **Adoção digital:** 70%+ dos brasileiros usam banking digital
- **Open Finance:** 53.7M de usuários (25% da população adulta)
- **PIX:** 60%+ de adoção — remoção de fricção em pagamentos
- **Crédito:** representa 20% das startups de fintech

### 3.2 Concorrentes Brasileiros

#### Mobills
12 milhões de usuários. Modelo freemium. Foco em iniciantes. Premium ~R$8-20/mês. Parte do Grupo Toro.

| Forças | Fraquezas |
|--------|-----------|
| Base massiva, conversão freemium eficiente | Interface genérica, sem diferenciação em IA |

#### Organizze
1 milhão de usuários ativos. Conhecido como "mais simples, bonito e divertido".

| Forças | Fraquezas |
|--------|-----------|
| UX excepcional, funciona offline, foco em simplicidade | Funcionalidades limitadas, sem IA, sem projeções |

#### Guiabolso (PicPay)
2.5M+ usuários. Adquirido pelo PicPay em 2021. Modelo de agregação automática de contas.

| Forças | Fraquezas |
|--------|-----------|
| Pioneiro em agregação automática (estilo Mint) | Perdeu independência, agora parte de ecossistema maior |

#### Olivia AI (Nubank)
Adquirida pelo Nubank em 2021. IA/ML para análise de padrões de gastos.

| Forças | Fraquezas |
|--------|-----------|
| Tecnologia de IA de ponta, integrada ao Nubank (60M+ usuários) | Não é mais produto independente |

#### Nubank
118.6M de clientes (60% da população adulta brasileira). Referência em UX.

| Forças | Aprendizado |
|--------|-------------|
| Design system excepcional (NuDS), 80-90% aquisição via boca-a-boca | UX premium gera crescimento orgânico exponencial |

### 3.3 Players Internacionais

#### Brex
Plataforma de operações financeiras para empresas high-growth. AI compliance agents.

- **Foco:** B2B, startups venture-backed e enterprise
- **Aprendizado:** Design "customer-centric", detail-obsessed

#### Ramp
50.000+ empresas. Design system "Bento Box". Valuation US$32B.

- **Foco:** SMB a Enterprise, automação de despesas via IA
- **Aprendizado:** "Tactile minimalism" — motion com significado, não decoração

#### Pliant
Infraestrutura API-first para pagamentos B2B. 3.500 empresas na Europa.

- **Foco:** Embedded finance, travel industry, white-label
- **Aprendizado:** Progressive disclosure para reduzir complexidade

---

## 4. Posicionamento Estratégico

### 4.1 A Lacuna no Mercado

| Segmento | Players Atuais | Oportunidade Due |
|----------|----------------|------------------|
| Corporativo (B2B) | Brex, Ramp, Pliant | ⚠️ Não no curto prazo |
| PFM Genérico | Mobills, Organizze | ⚠️ Saturado |
| Investimentos | Kinvo, Rico, XP | ⚠️ Fora do escopo |
| **Crédito Inteligente (B2C)** | **Nenhum player focado** | ✅ **OPORTUNIDADE!** |

### 4.2 Proposta de Posicionamento

> **"O Due é o coach financeiro para quem vive no crédito — entende sua realidade, projeta seu futuro e te guia para a liberdade financeira."**

#### Por que este posicionamento?

- Não compete com Nubank (banco digital) — é complementar
- Não é planilha glorificada como Mobills — é inteligência
- Foca na **DOR REAL:** fatura alta, parcelas intermináveis, sensação de descontrole
- Abre caminho para monetização futura (crédito, empréstimos)

### 4.3 Persona Principal

**Fernanda, 32 anos**, analista de marketing em São Paulo. Renda de R$5.500/mês. Usa 2 cartões de crédito. Fatura média de R$3.200/mês. Parcela tudo em 10x ou mais. Sente que está "sempre devendo". Já tentou planilhas mas abandona em 2 semanas. Quer controle mas não quer gastar horas gerenciando.

---

## 5. Recomendações de Design

### 5.1 Paleta de Cores

Recomendamos evoluir o Pearl Aqua atual para um Teal mais sofisticado, alinhado com tendências 2025-2026:

| Nome | Hex | Amostra | Uso |
|------|-----|---------|-----|
| **Teal 600** | `#0D9488` | 🟢 | Primária — CTAs, elementos interativos |
| **Teal 500** | `#14B8A6` | 🟢 | Hover states, gradientes |
| **Violet 500** | `#8B5CF6` | 🟣 | Acento — IA, features premium (340% trend) |
| **Gray 800** | `#1F2937` | ⬛ | Textos, dark mode background |
| **Slate 50** | `#F8FAFC` | ⬜ | Background principal light mode |

### 5.2 Tipografia

Recomendamos um sistema tipográfico que transmita modernidade e confiança:

- **Headings:** Inter (Variable) — moderna, clean, excelente legibilidade
- **Body:** Inter — consistência em toda interface
- **Números:** Inter com `tabular-nums` — alinhamento perfeito em tabelas financeiras
- **Alternativa premium:** Geist (Vercel) — design system reference

### 5.3 Estilo Visual

Evolução do Glassmorphism para **"Quietly Bold Minimalism":**

- **Glassmorphism seletivo:** usar apenas em overlays e modais, não em cards
- **Borders arredondadas** mas não excessivas (`border-radius: 12-16px`)
- **Sombras sutis** (elevation-2 no máximo para cards)
- **Espaçamento generoso** — criar "breathing room"
- **Micro-interações com propósito:** feedback imediato, não decoração

### 5.4 Logo

O logo atual (D em squircle) é sólido. Sugestões de refinamento:

- **Manter o conceito** — "D" é forte e memorável
- **Considerar gradiente sutil** (Teal 600 → Teal 500)
- **Versão wordmark:** "Due" em Inter Black com tracking tight
- **Criar versão monochrome** para dark mode e contexts limitados

### 5.5 Mobile First

**Recomendação:** Mobile-first como filosofia, web responsiva como produto inicial.

- 70%+ dos brasileiros acessam fintechs via mobile
- PWA bem executado pode substituir app nativo na fase inicial
- Design mobile-first, depois escalar para desktop
- App nativo (React Native/Flutter) apenas quando PMF validado

---

## 6. Landing Page

### 6.1 Princípios

- **Storytelling > Features** — contar a história de transformação
- **Hero impactante** — headline que ressoa emocionalmente
- **Social proof** — mesmo que inicial, mostrar confiança
- **CTA claro e único** — não confundir o visitante
- **Performance** — load time < 2s, LCP < 2.5s

### 6.2 Copy Sugerido

#### Português 🇧🇷

**Hero:**
> "Pare de ser refém da sua fatura."

**Subheadline:**
> "O Due entende suas parcelas, projeta seu futuro e mostra o caminho para você respirar financeiramente."

**CTA:**
> "Começar agora — é grátis"

#### English 🇺🇸

**Hero:**
> "Stop drowning in credit card debt."

**Subheadline:**
> "Due understands your installments, forecasts your future, and guides you to financial freedom."

**CTA:**
> "Start free today"

### 6.3 Seções Sugeridas

1. **Hero** — Headline impactante + demo interativo ou screenshot animado
2. **Problema** — "Você sabe quanto vai pagar de fatura daqui 3 meses?"
3. **Solução** — Como o Due resolve (projeção, IA, simplicidade)
4. **Features** — Bento grid com 4-6 features principais (não 12)
5. **Social Proof** — Testimonials ou métricas (quando disponíveis)
6. **CTA Final** — Repetir call-to-action com urgência suave
7. **Footer** — Links úteis, redes sociais, legal

---

## 7. Visão de Futuro

### 7.1 Jornada do Produto

Sua visão de longo prazo (organização → cartão inteligente → empréstimos) é estrategicamente sólida. Sugerimos a seguinte evolução:

| Fase | Foco | Entregáveis |
|------|------|-------------|
| **1** | Organização | Gestão de faturas, projeções, IA advisor — **ATUAL** |
| **2** | Insights Premium | Score de saúde financeira, comparativo com pares, open finance, **orçamento mensal** |
| **3** | Embedded Finance | Cartão de crédito Due (white-label), limites inteligentes, **orçamento familiar compartilhado** |
| **4** | Crédito Inteligente | Empréstimos para quitação de parcelas, consolidação de dívidas |

### 7.2 Modelo de Monetização

1. **Fase 1 (Atual):** Gratuito para crescimento de base
2. **Fase 2:** Freemium (insights avançados, relatórios, sync ilimitado)
3. **Fase 3:** Comissões sobre produtos financeiros (cartão, seguros)
4. **Fase 4:** Spread em empréstimos + juros

---

## 8. Roadmap Sugerido

### Q1 2026 (Agora → Março)

- [ ] Redesign do Design System (paleta, tipografia, componentes)
- [ ] Nova Landing Page com copy focado em DOR
- [ ] PWA otimizado para mobile
- [ ] Onboarding guiado com sample data

### Q2 2026 (Abril → Junho)

- [ ] Open Banking integration (Belvo ou similar)
- [ ] Score de Saúde Financeira Due
- [ ] **Orçamento Mensal** (gestão de receitas vs despesas, metas de gastos por categoria)
- [ ] Exportação de relatórios (PDF)
- [ ] Início de testes com early adopters

### Q3 2026 (Julho → Setembro)

- [ ] Due Premium (subscription)
- [ ] Compartilhamento familiar com **orçamento colaborativo** (metas compartilhadas, visibilidade de gastos)
- [ ] Notificações push inteligentes
- [ ] App mobile (React Native)

### Q4 2026 (Outubro → Dezembro)

- [ ] Parcerias financeiras para embedded products
- [ ] POC de cartão Due (white-label)
- [ ] Preparação para Series Seed (se aplicável)

---

## 9. Conclusão

O Due está bem posicionado para capturar uma oportunidade significativa no mercado brasileiro de fintech pessoal. Com uma base tecnológica sólida, features diferenciadas de IA e uma visão clara de evolução para embedded finance, o produto tem potencial para se tornar referência em gestão de crédito pessoal.

### Principais Ações Recomendadas

1. **Refinamento do posicionamento:** de "app de finanças" para "coach de crédito"
2. **Upgrade do design system:** paleta Teal + Violet, minimalismo intencional
3. **Landing page com storytelling:** foco na dor, não nas features
4. **Mobile-first como filosofia:** PWA agora, app nativo depois
5. **Validação de PMF antes de escalar:** early adopters → feedback → iteração

---

> ### O futuro do Due é promissor. Agora é hora de executar.

---

*Documento gerado em Fevereiro de 2026*
