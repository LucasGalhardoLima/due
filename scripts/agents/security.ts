import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'Security Auditor',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'server/**/*.ts',
    'app/middleware/**/*.ts',
    'nuxt.config.ts',
    'prisma/schema.prisma',
    '.env.example',
  ],
  promptFile: 'security.md',
  includePersonas: false,
  agentLabel: 'Agent: Security',
}).catch((err) => {
  console.error('❌ Security Auditor agent failed:', err)
  process.exit(1)
})
