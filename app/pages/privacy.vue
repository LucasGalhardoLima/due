<script setup lang="ts">
import { Shield, Lock, EyeOff, Database, ChevronLeft, Moon, Sun } from 'lucide-vue-next'

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
    <!-- Simple Header -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div class="container mx-auto px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
          <ChevronLeft class="w-4 h-4" />
          Voltar
        </NuxtLink>
        <div class="flex items-center gap-4">
          <button class="p-2 rounded-full hover:bg-muted transition-colors" @click="toggleTheme">
            <Moon v-if="colorMode.value === 'light'" class="w-5 h-5" />
            <Sun v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>

    <main class="pt-32 pb-16 container mx-auto px-16 max-w-4xl">
      <div class="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <!-- Header Section -->
        <div class="space-y-4 text-center">
          <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Shield class="w-8 h-8" />
          </div>
          <h1 class="text-4xl md:text-6xl font-black tracking-tight">Política de Privacidade</h1>
          <p class="text-xl text-muted-foreground font-medium">Seus dados são sagrados. Aqui explicamos como os tratamos.</p>
        </div>

        <!-- Content Grid -->
        <div class="grid gap-8">
          <section class="p-8 rounded-3xl bg-secondary/20 border border-border/50 space-y-4">
            <div class="flex items-center gap-3 text-primary">
              <Database class="w-6 h-6" />
              <h2 class="text-2xl font-bold">Armazenamento Isolado</h2>
            </div>
            <p class="text-muted-foreground leading-relaxed">
              O Due utiliza o <span class="text-foreground font-semibold">Supabase</span> como provedor de banco de dados. Cada usuário tem seus dados isolados através de políticas de <span class="italic">Row Level Security (RLS)</span>. Isso significa que, a nível de banco de dados, é impossível que um usuário acesse dados de outro.
            </p>
          </section>

          <section class="p-8 rounded-3xl bg-secondary/20 border border-border/50 space-y-4">
            <div class="flex items-center gap-3 text-primary">
              <Lock class="w-6 h-6" />
              <h2 class="text-2xl font-bold">Autenticação</h2>
            </div>
            <p class="text-muted-foreground leading-relaxed">
              A autenticação é gerenciada pelo <span class="text-foreground font-semibold">Clerk</span>, líder em segurança de identidade. Nós não armazenamos suas senhas. O Clerk garante padrões enterprise de segurança para o seu acesso.
            </p>
          </section>

          <section class="p-8 rounded-3xl bg-secondary/20 border border-border/50 space-y-4">
            <div class="flex items-center gap-3 text-primary">
              <EyeOff class="w-6 h-6" />
              <h2 class="text-2xl font-bold">Uso da Inteligência Artificial</h2>
            </div>
            <p class="text-muted-foreground leading-relaxed">
              Quando você utiliza o Advisor AI, enviamos apenas os dados necessários das suas transações para o modelo <span class="text-foreground font-semibold">GPT-4o da OpenAI</span>. 
              <br><br>
              <span class="font-bold underline">Importante:</span> A OpenAI não utiliza dados enviados via API para treinar seus modelos. Além disso, o Due não envia dados que possam te identificar pessoalmente (como nome completo ou CPF) para a IA.
            </p>
          </section>

          <section class="prose prose-zinc dark:prose-invert max-w-none px-4">
            <h3>Coleta de Dados</h3>
            <p>Coletamos apenas o estritamente necessário para o funcionamento do app:</p>
            <ul>
              <li>E-mail (via Clerk) para identificação da conta.</li>
              <li>Dados de transações que você mesmo insere ou importa via CSV.</li>
              <li>Nomes de cartões e categorias criados por você.</li>
            </ul>

            <h3>Cookies e Rastreamento</h3>
            <p>O Due utiliza cookies apenas para manter sua sessão ativa. Não utilizamos trackers de terceiros para fins de marketing ou publicidade. Nossa análise de uso (via Vercel Analytics) é anônima e focada apenas em performance técnica.</p>

            <h3>Seus Direitos</h3>
            <p>Você pode excluir sua conta e todos os seus dados a qualquer momento diretamente nas configurações do perfil (em breve) ou solicitando via suporte. A exclusão é imediata e definitiva.</p>
          </section>
        </div>

        <div class="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          Última atualização: 16 de Janeiro de 2026
        </div>
      </div>
    </main>

    <footer class="py-12 border-t border-border/40">
      <div class="container mx-auto px-6 text-center text-sm opacity-60">
        &copy; 2026 Due Finance. Privacidade em primeiro lugar.
      </div>
    </footer>
  </div>
</template>

<style scoped>
.prose {
  line-height: 1.8;
}
</style>
