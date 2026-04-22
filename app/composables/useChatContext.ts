import { useRoute } from '#app'
import type { ContextualSuggestion } from '~/types/chat'

const SUGGESTIONS: Record<string, ContextualSuggestion[]> = {
  cartao: [
    { label: 'Adicionar despesa', message: 'quero adicionar uma despesa' },
    { label: 'Por que minha fatura está alta?', message: 'por que minha fatura está alta?' },
    { label: 'Comparar com o mês passado', message: 'compare meus gastos com o mês passado' },
    { label: 'Análise profunda (6 meses)', message: 'faça uma análise profunda dos meus gastos de 6 meses' },
    { label: 'Projeção desta fatura', message: 'qual é a projeção da minha fatura este mês?' },
  ],
  fluxo: [
    { label: 'Como está meu orçamento?', message: 'como está meu orçamento este mês?' },
    { label: 'Quanto tenho livre?', message: 'quanto tenho livre para gastar?' },
    { label: 'Meta de economia', message: 'quero definir uma meta de economia' },
    { label: 'Análise de categorias', message: 'analisa meus gastos por categoria' },
    { label: 'O que vem essa semana?', message: 'o que vem pela frente essa semana?' },
  ],
  parcelamentos: [
    { label: 'Qual quitar primeiro?', message: 'qual parcelamento devo quitar primeiro?' },
    { label: 'Simular quitação', message: 'quanto economizo quitando meus parcelamentos?' },
    { label: 'Resumo de parcelas', message: 'me dá um resumo de todos os meus parcelamentos' },
    { label: 'Parcelas do próximo mês', message: 'quais parcelas vencem no próximo mês?' },
    { label: 'Adicionar despesa', message: 'quero adicionar uma despesa parcelada' },
  ],
  default: [
    { label: 'Adicionar despesa', message: 'quero adicionar uma despesa' },
    { label: 'Como está meu orçamento?', message: 'como está meu orçamento este mês?' },
    { label: 'Ver gastos de hoje', message: 'quais foram meus gastos de hoje?' },
    { label: 'Análise de categorias', message: 'analisa meus gastos por categoria' },
    { label: 'Dica financeira', message: 'me dá uma dica financeira personalizada' },
  ],
}

const GREETINGS: Record<string, string> = {
  cartao: 'Estou vendo seu Cartão de Crédito',
  fluxo: 'Estou vendo seu Fluxo de Caixa',
  parcelamentos: 'Estou vendo seus Parcelamentos',
  default: 'Como posso ajudar?',
}

export function useChatContext() {
  const route = useRoute()

  const contextKey = computed(() => {
    if (route.path === '/parcelamentos') return 'parcelamentos'
    const tab = String(route.query?.tab ?? '')
    if (tab === 'cartao' || tab === '') return 'cartao' // dashboard default = cartao
    if (tab === 'fluxo') return 'fluxo'
    return 'default'
  })

  const suggestions = computed<ContextualSuggestion[]>(
    () => SUGGESTIONS[contextKey.value] ?? SUGGESTIONS.default
  )

  const greeting = computed(() => GREETINGS[contextKey.value] ?? GREETINGS.default)

  return { suggestions, greeting, contextKey }
}
