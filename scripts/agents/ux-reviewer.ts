import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'UX Reviewer',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'app/components/**/*.vue',
    'app/pages/**/*.vue',
    'app/assets/**/*.css',
    'tailwind.config.js',
  ],
  promptFile: 'ux-reviewer.md',
  includePersonas: true,
  agentLabel: 'Agent: UX',
}).catch((err) => {
  console.error('❌ UX Reviewer agent failed:', err)
  process.exit(1)
})
