const APP_URL = process.env.DU_APP_URL || 'https://du.app'
const AGENT_API_KEY = process.env.AGENT_API_KEY

export async function fetchProductContext(endpoints: string[]): Promise<string> {
  if (!AGENT_API_KEY) {
    console.log('⚠️  AGENT_API_KEY not set, skipping live product context')
    return ''
  }

  const results: string[] = []

  for (const endpoint of endpoints) {
    try {
      const url = `${APP_URL}${endpoint}`
      const res = await fetch(url, {
        headers: {
          'x-agent-api-key': AGENT_API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        console.log(`  ⚠️  ${endpoint} → ${res.status} ${res.statusText}`)
        continue
      }

      const data = await res.json()
      results.push(`### ${endpoint}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``)
    } catch (err) {
      console.log(`  ⚠️  ${endpoint} → ${err instanceof Error ? err.message : err}`)
    }
  }

  return results.length > 0
    ? '## Live Product Data\n\n' + results.join('\n\n')
    : ''
}
