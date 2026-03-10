import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'Product Designer',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    // Web UI structure
    'app/pages/**/*.vue',
    'app/components/**/*.vue',
    'app/layouts/**/*.vue',
    // iOS UI structure
    'ios/Due/Due/Views/**/*.swift',
    'ios/Due/Due/Models/**/*.swift',
    'ios/Due/Due/ViewModels/**/*.swift',
    'ios/Due/Due/Theme/**/*.swift',
    'ios/Due/Due/Helpers/View+*.swift',
    'ios/.specify/memory/constitution.md',
    // Data model and demo data (informs IA decisions)
    'prisma/schema.prisma',
    'prisma/seed-demo.ts',
  ],
  promptFile: 'product-designer.md',
  includePersonas: true,
  agentLabel: 'Agent: Product Designer',
  apiEndpoints: [
    '/api/dashboard/current-invoice',
    '/api/dashboard/upcoming-bills',
    '/api/cards',
    '/api/budget/summary',
    '/api/installments/timeline',
    '/api/categories',
  ],
}).catch((err) => {
  console.error('❌ Product Designer agent failed:', err)
  process.exit(1)
})
