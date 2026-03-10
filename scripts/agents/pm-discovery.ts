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
  ],
  promptFile: 'pm-discovery.md',
  includePersonas: true,
}).catch((err) => {
  console.error('❌ PM / Discovery agent failed:', err)
  process.exit(1)
})
