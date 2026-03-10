import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'Tech Debt',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'server/**/*.ts',
    'app/**/*.vue',
    'app/**/*.ts',
    'prisma/schema.prisma',
    'package.json',
    // iOS excluded — app is being rebuilt from scratch
  ],
  promptFile: 'tech-debt.md',
  includePersonas: false,
  diffOnly: true,
}).catch((err) => {
  console.error('❌ Tech Debt agent failed:', err)
  process.exit(1)
})
