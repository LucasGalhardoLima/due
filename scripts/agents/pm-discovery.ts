import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'PM / Discovery',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'app/pages/**/*.vue',
    'app/components/**/*.vue',
    'server/api/**/*.ts',
    'prisma/schema.prisma',
    'docs/plans/**/*.md',
    // Demo user data (understand what a real user sees)
    'prisma/seed-demo.ts',
    // iOS context for platform strategy
    'ios/Due/Due/Views/**/*.swift',
    'ios/Due/Due/Models/**/*.swift',
    'ios/Due/Due/ViewModels/**/*.swift',
    'ios/.specify/memory/constitution.md',
  ],
  promptFile: 'pm-discovery.md',
  includePersonas: true,
  apiEndpoints: [
    '/api/dashboard/current-invoice',
    '/api/dashboard/du-score',
    '/api/dashboard/upcoming-bills',
    '/api/dashboard/future-projection',
    '/api/cards',
    '/api/budget/summary',
    '/api/installments/timeline',
    '/api/reports/category-spending',
    '/api/reports/subscriptions',
  ],
}).catch((err) => {
  console.error('❌ PM / Discovery agent failed:', err)
  process.exit(1)
})
