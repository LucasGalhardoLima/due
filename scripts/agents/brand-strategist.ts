import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'Brand Strategist',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    // Landing page and web UI
    'app/pages/index.vue',
    'app/assets/**/*.css',
    'app/components/ui/**/*.vue',
    'public/**',
    // iOS brand expression
    'ios/Due/Due/Theme/**/*.swift',
    'ios/Due/Due/Helpers/Color+Du.swift',
    'ios/Due/Due/Views/Onboarding/**/*.swift',
    'ios/Due/Due/Views/Dashboard/DashboardView.swift',
    // Demo data (understand what users see in the product)
    'prisma/seed-demo.ts',
  ],
  promptFile: 'brand-strategist.md',
  includePersonas: true,
  agentLabel: 'Agent: Brand',
  apiEndpoints: [
    '/api/dashboard/current-invoice',
    '/api/dashboard/du-score',
    '/api/cards',
  ],
}).catch((err) => {
  console.error('❌ Brand Strategist agent failed:', err)
  process.exit(1)
})
