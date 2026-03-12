import { chromium, type Browser, type Page } from 'playwright'
import type { ScreenshotPage } from './types.js'

const DESKTOP = { width: 1280, height: 800 }
const MOBILE = { width: 390, height: 844 }

export interface CapturedScreenshot {
  label: string
  viewport: 'desktop' | 'mobile'
  base64: string
}

export interface CaptureResult {
  screenshots: CapturedScreenshot[]
  a11yTrees: Array<{ label: string; tree: string }>
}

export async function captureScreenshots(
  pages: ScreenshotPage[],
  options: { includeA11y?: boolean } = {}
): Promise<CaptureResult> {
  const appUrl = process.env.DU_APP_URL || 'https://du.app'
  const email = process.env.SCREENSHOT_EMAIL
  const password = process.env.SCREENSHOT_PASSWORD

  const result: CaptureResult = { screenshots: [], a11yTrees: [] }

  let browser: Browser | null = null
  try {
    browser = await chromium.launch()
    const context = await browser.newContext({ viewport: DESKTOP })
    const page = await context.newPage()

    // Authenticate if credentials are available
    const authed = email && password
      ? await authenticate(page, appUrl, email, password)
      : false

    if (!authed) {
      console.log('  ⚠️  Could not authenticate for screenshots, capturing public pages only')
    }

    for (const target of pages) {
      // Skip auth-required pages if not authenticated
      if (!authed && target.path !== '/' && target.path !== '/sign-in') {
        console.log(`  ⚠️  Skipping ${target.label} (requires auth)`)
        continue
      }

      // Capture at both viewports
      for (const [vpName, vpSize] of [['desktop', DESKTOP], ['mobile', MOBILE]] as const) {
        try {
          await page.setViewportSize(vpSize)
          await page.goto(`${appUrl}${target.path}`, { waitUntil: 'networkidle', timeout: 15000 })

          if (target.waitFor) {
            await page.waitForSelector(target.waitFor, { timeout: 5000 }).catch(() => {})
          }

          // Small delay for animations/renders to settle
          await page.waitForTimeout(1000)

          const buffer = await page.screenshot({ fullPage: false })
          result.screenshots.push({
            label: `${target.label} (${vpName})`,
            viewport: vpName,
            base64: buffer.toString('base64'),
          })
        } catch (err) {
          console.log(`  ⚠️  Screenshot failed for ${target.label} (${vpName}): ${err instanceof Error ? err.message : err}`)
        }
      }

      // Accessibility tree (desktop viewport only, uses modern ariaSnapshot API)
      if (options.includeA11y) {
        try {
          await page.setViewportSize(DESKTOP)
          await page.goto(`${appUrl}${target.path}`, { waitUntil: 'networkidle', timeout: 15000 })
          const snapshot = await page.locator('body').ariaSnapshot()
          if (snapshot) {
            result.a11yTrees.push({
              label: target.label,
              tree: snapshot,
            })
          }
        } catch (err) {
          console.log(`  ⚠️  A11y tree failed for ${target.label}: ${err instanceof Error ? err.message : err}`)
        }
      }
    }
  } catch (err) {
    console.log(`  ⚠️  Screenshot capture failed: ${err instanceof Error ? err.message : err}`)
  } finally {
    await browser?.close()
  }

  return result
}

async function authenticate(
  page: Page,
  appUrl: string,
  email: string,
  password: string
): Promise<boolean> {
  try {
    await page.goto(`${appUrl}/sign-in`, { waitUntil: 'networkidle', timeout: 15000 })

    // Clerk sign-in form
    await page.fill('input[name="identifier"]', email)
    await page.click('button:has-text("Continue")')
    await page.waitForTimeout(1000)

    await page.fill('input[name="password"]', password)
    await page.click('button:has-text("Continue")')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    return true
  } catch {
    return false
  }
}
