<script setup lang="ts">
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const links = {
  product: [
    { name: 'Como funciona', href: '#how-it-works' },
    { name: 'Recursos', href: '#features' },
    { name: 'Segurança', href: '#security' },
    { name: 'Preços', href: '#precos' }
  ],
  company: [
    { name: 'Sobre o Du', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contato', href: '/contact' }
  ],
  legal: [
    { name: 'Privacidade', href: '/privacy' },
    { name: 'Termos', href: '/terms' }
  ]
}

const social = [
  { name: 'GitHub', icon: Github, href: 'https://github.com' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  { name: 'Email', icon: Mail, href: 'mailto:oi@du.app' }
]
</script>

<template>
  <footer class="bg-card border-t border-border">
    <div class="container mx-auto px-6 py-16">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        <!-- Brand -->
        <div class="col-span-2">
          <NuxtLink to="/" class="font-black text-2xl flex items-center gap-2 mb-4">
            <div class="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/25">
              Du
            </div>
            Du
          </NuxtLink>
          <p class="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
            Oi! Eu sou o Du, seu assistente financeiro pessoal. Tô aqui pra te ajudar a organizar
            seus gastos, controlar parcelas, planejar metas e conquistar sua liberdade financeira. 💚
          </p>
          <!-- Social links -->
          <div class="flex items-center gap-3">
            <a
              v-for="item in social"
              :key="item.name"
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
              class="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary-accent hover:bg-primary/10 transition-all duration-200"
              :aria-label="item.name"
            >
              <component :is="item.icon" class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Product -->
        <div>
          <h4 class="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Produto</h4>
          <ul class="space-y-3">
            <li v-for="link in links.product" :key="link.name">
              <a :href="link.href" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Company -->
        <div>
          <h4 class="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Empresa</h4>
          <ul class="space-y-3">
            <li v-for="link in links.company" :key="link.name">
              <a :href="link.href" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h4 class="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
          <ul class="space-y-3">
            <li v-for="link in links.legal" :key="link.name">
              <a :href="link.href" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-muted-foreground">
          © {{ currentYear }} Du. Todos os direitos reservados.
        </p>
        <p class="text-sm text-muted-foreground flex items-center gap-1">
          Feito com <Heart class="w-4 h-4 text-danger inline" /> no Brasil 🇧🇷
        </p>
      </div>
    </div>
  </footer>
</template>
