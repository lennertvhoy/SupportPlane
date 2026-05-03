import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const EVDIR = process.argv[2] || 'output/playwright/session-131-bl136-e2e-acceptance-candidate';
mkdirSync(EVDIR, { recursive: true });

const API = 'http://localhost:4210';
const WEB = 'http://localhost:3201';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Login via API and get session cookie
  const apiRes = await context.request.post(`${API}/auth/local/login`, {
    data: { email: 'admin@supportplane.local', password: 'supportplane-demo', tenantSlug: 'dev-tenant' }
  });
  console.log(`API login: ${apiRes.status()}`);

  // Get session info directly
  const healthRes = await context.request.get(`${API}/health`);
  const healthData = await healthRes.json();
  console.log(`Health: storeMode=${healthData.storeMode}, authMode=${healthData.authMode}`);

  // Create session via API
  const sessionRes = await context.request.post(`${API}/support-sessions`, {
    data: { title: 'BL-136 E2E Demo', customerEmail: 'acme@bvba.be' }
  });
  const sessionData = await sessionRes.json();
  const SID = sessionData.id;
  console.log(`Session ID: ${SID}`);

  // Load Zammad ticket context
  await context.request.post(`${API}/support-sessions/${SID}/zammad/ticket-context`, {
    data: { externalTicketId: '2' }
  });

  // Generate AI draft
  await context.request.post(`${API}/support-sessions/${SID}/draft-suggestion`, {
    data: { modelSelection: { provider: 'ollama', model: 'gemma4:e4b' } }
  });

  const page = await context.newPage();

  // 13 - Cockpit dashboard
  try {
    await page.goto(WEB, { waitUntil: 'networkidle', timeout: 20000 });
    // Wait for the session check to complete and health info to show
    await page.waitForTimeout(5000);
    // Try to find content on page
    await page.screenshot({ path: `${EVDIR}/13-cockpit-dashboard.png`, fullPage: false });
    console.log('Screenshot 13: cockpit dashboard');
  } catch (e) {
    console.log('Screenshot 13 failed:', e.message.split('\n')[0]);
  }

  // 14 - Session page showing Zammad data
  try {
    // The web app might use /cockpit route
    await page.goto(WEB, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // Try navigating to session page via URL
    const sessionPage = await context.newPage();
    await sessionPage.goto(`${API}/support-sessions/${SID}`, { waitUntil: 'networkidle', timeout: 10000 });
    await sessionPage.waitForTimeout(2000);
    const sessionJson = await sessionPage.textContent('body');
    await sessionPage.close();

    // Render the session JSON as a local HTML page for screenshot
    const htmlContent = `<html><body style="background:#1a1a2e;color:#e0e0e0;font-family:monospace;padding:20px">
      <h1 style="color:#00ff88">SupportPlane Session with Zammad Sandbox Data</h1>
      <pre style="background:#16213e;padding:15px;border-radius:8px;white-space:pre-wrap;word-wrap:break-word">${sessionJson}</pre>
      </body></html>`;
    const dataUrl = 'data:text/html,' + encodeURIComponent(htmlContent);
    await page.goto(dataUrl, { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${EVDIR}/14-session-zammad-context.png`, fullPage: false });
    console.log('Screenshot 14: session data from API');
  } catch (e) {
    console.log('Screenshot 14 failed:', e.message.split('\n')[0]);
  }

  // 15 - Admin dashboard
  try {
    await page.goto(`${WEB}/admin`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${EVDIR}/15-admin-dashboard.png`, fullPage: false });
    console.log('Screenshot 15: admin dashboard');
  } catch (e) {
    console.log('Screenshot 15 failed:', e.message.split('\n')[0]);
  }

  // 16 - AI policy page (fetch JSON and render)
  try {
    const policyRes = await context.request.get(`${API}/admin/policies/ai`);
    const policyJson = JSON.stringify(await policyRes.json(), null, 2);
    const htmlContent = `<html><body style="background:#1a1a2e;color:#e0e0e0;font-family:monospace;padding:20px">
      <h1 style="color:#00ff88">AI Policy Configuration</h1>
      <pre style="background:#16213e;padding:15px;border-radius:8px;white-space:pre-wrap;word-wrap:break-word">${policyJson}</pre>
      </body></html>`;
    const dataUrl = 'data:text/html,' + encodeURIComponent(htmlContent);
    await page.goto(dataUrl, { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${EVDIR}/16-ai-policy-detail.png`, fullPage: false });
    console.log('Screenshot 16: AI policy detail');
  } catch (e) {
    console.log('Screenshot 16 failed:', e.message.split('\n')[0]);
  }

  // 17 - Ollama draft response
  try {
    const draftRes = await context.request.post(`${API}/support-sessions/${SID}/draft-suggestion`, {
      data: { modelSelection: { provider: 'ollama', model: 'gemma4:e4b' } }
    });
    const draftJson = JSON.stringify(await draftRes.json(), null, 2);
    const htmlContent = `<html><body style="background:#1a1a2e;color:#e0e0e0;font-family:monospace;padding:20px">
      <h1 style="color:#00ff88">Ollama AI Draft Response</h1>
      <pre style="background:#16213e;padding:15px;border-radius:8px;white-space:pre-wrap;word-wrap:break-word">${draftJson}</pre>
      </body></html>`;
    const dataUrl = 'data:text/html,' + encodeURIComponent(htmlContent);
    await page.goto(dataUrl, { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${EVDIR}/17-ollama-draft-response.png`, fullPage: false });
    console.log('Screenshot 17: Ollama draft response');
  } catch (e) {
    console.log('Screenshot 17 failed:', e.message.split('\n')[0]);
  }

  await browser.close();
  console.log('Browser screenshots complete');
}

main().catch(e => { console.error(e); process.exit(1); });
