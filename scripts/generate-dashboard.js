const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '..', 'playwright-report');
const assetsDir = path.join(reportDir, 'dashboard-assets');
const resultsPath = path.join(reportDir, 'results.json');
const dashboardPath = path.join(reportDir, 'dashboard.html');

if (!fs.existsSync(resultsPath)) {
  console.error(`Results file not found: ${resultsPath}`);
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });

const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const collectedTests = [];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeStepName(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'step';
}

function normalizeStatus(status = 'unknown') {
  if (status === 'expected' || status === 'passed') return 'passed';
  if (status === 'unexpected' || status === 'failed') return 'failed';
  if (status === 'timedOut') return 'timedOut';
  if (status === 'skipped') return 'skipped';
  return status;
}

function getModuleName(parents, file) {
  const namedParent = [...parents].reverse().find((value) => value && !value.endsWith('.spec.ts'));
  if (namedParent) return namedParent;
  return path.basename(file || 'General').replace(/\.spec\.ts$/i, '').replace(/\.[^.]+$/i, '');
}

function readAttachmentText(attachment) {
  if (!attachment || !attachment.body) {
    return '';
  }

  return Buffer.from(attachment.body, 'base64').toString('utf8');
}

function cleanErrorText(value = '') {
  return String(value)
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStepError(step) {
  if (step?.error?.message) {
    return cleanErrorText(step.error.message);
  }

  for (const nestedStep of step?.steps || []) {
    const nestedError = getStepError(nestedStep);
    if (nestedError) {
      return nestedError;
    }
  }

  return '';
}

function getStepStatus(step, testStatus = 'unknown') {
  if (getStepError(step)) return 'failed';
  if (testStatus === 'skipped') return 'skipped';
  if (testStatus === 'timedOut') return 'timedOut';
  if (testStatus === 'interrupted') return 'interrupted';
  return 'passed';
}

function writeAttachmentFile(attachment, preferredName) {
  if (!attachment) {
    return '';
  }

  if (attachment.path && fs.existsSync(attachment.path)) {
    return path.relative(reportDir, attachment.path).replace(/\\/g, '/');
  }

  if (!attachment.body) {
    return '';
  }

  const extension = path.extname(attachment.name || '') || (attachment.contentType === 'image/png' ? '.png' : '.dat');
  const fileName = `${preferredName}${extension}`;
  const filePath = path.join(assetsDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(attachment.body, 'base64'));
  return path.relative(reportDir, filePath).replace(/\\/g, '/');
}

function filterDisplaySteps(steps = []) {
  return steps.filter((step) => step.title && !/before hooks|after hooks|expect\./i.test(step.title));
}

function walkSuites(suites = [], parents = []) {
  for (const suite of suites) {
    const nextParents = suite.title ? [...parents, suite.title] : parents;

    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const lastResult = [...(test.results || [])].reverse().find((result) => result.status) || {};
        const status = normalizeStatus(lastResult.status || test.outcome || 'unknown');
        const duration = (test.results || []).reduce((sum, result) => sum + (result.duration || 0), 0);
        const attachments = lastResult.attachments || [];
        const testLevelExpected = (test.annotations || []).find((annotation) => /expected result/i.test(annotation.type || ''))?.description || 'Expected result not provided';
        const videoAttachment = attachments.find((attachment) => attachment.name === 'video');
        const traceAttachment = attachments.find((attachment) => attachment.name === 'trace');
        const videoLink = writeAttachmentFile(videoAttachment, `${sanitizeStepName(spec.title)}-video`);
        const traceLink = writeAttachmentFile(traceAttachment, `${sanitizeStepName(spec.title)}-trace`);

        const steps = filterDisplaySteps(lastResult.steps || []).map((step, index) => {
          const stepKey = sanitizeStepName(step.title);
          const expectedAttachment = attachments.find((attachment) => attachment.name === `${stepKey}-expected.txt`);
          const screenshotAttachment = attachments.find((attachment) => attachment.name === `${stepKey}.png`);
          const failureDetails = getStepError(step);

          return {
            title: step.title,
            expectedResult: expectedAttachment ? readAttachmentText(expectedAttachment) : testLevelExpected,
            status: getStepStatus(step, status),
            failureDetails,
            duration: step.duration || 0,
            screenshotLink: writeAttachmentFile(screenshotAttachment, `${sanitizeStepName(spec.title)}-${index + 1}`),
            videoLink,
            traceLink,
          };
        });

        collectedTests.push({
          module: getModuleName(nextParents, spec.file),
          title: spec.title,
          file: spec.file || '',
          status,
          duration,
          steps: steps.length
            ? steps
            : [
                {
                  title: 'No named test step recorded',
                  expectedResult: testLevelExpected,
                  status,
                  failureDetails: '',
                  duration,
                  screenshotLink: '',
                  videoLink,
                  traceLink,
                },
              ],
        });
      }
    }

    walkSuites(suite.suites || [], nextParents);
  }
}

walkSuites(report.suites || []);

function buildCounts(items) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      summary[item.status] = (summary[item.status] || 0) + 1;
      return summary;
    },
    { total: 0, passed: 0, failed: 0, skipped: 0, timedOut: 0, interrupted: 0, unknown: 0 },
  );
}

const overall = buildCounts(collectedTests);
const modules = [...collectedTests.reduce((map, item) => {
  const entry = map.get(item.module) || { name: item.module, tests: [] };
  entry.tests.push(item);
  map.set(item.module, entry);
  return map;
}, new Map()).values()].map((module) => ({
  ...module,
  counts: buildCounts(module.tests),
}));

const statusClass = (status) => `status ${status}`;
const fmtDuration = (ms) => `${(ms / 1000).toFixed(1)}s`;
const asHref = (value) => encodeURI(value || '');
const renderLink = (label, link) => (link ? `<a href="${asHref(link)}" target="_blank">${label}</a>` : '—');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QRS Test Dashboard</title>
  <style>
    :root {
      --bg: #f4f7fb;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --passed: #16a34a;
      --failed: #dc2626;
      --skipped: #ca8a04;
      --timedOut: #9333ea;
      --accent: #2563eb;
      --border: #e5e7eb;
    }
    body { font-family: Segoe UI, Arial, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px; }
    h1, h2 { margin: 0 0 12px; }
    .subtle { color: var(--muted); margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08); }
    .metric { font-size: 28px; font-weight: 700; margin-top: 8px; }
    .actions { margin: 16px 0 24px; }
    .actions a { display: inline-block; margin-right: 12px; padding: 10px 14px; border-radius: 8px; background: var(--accent); color: #fff; text-decoration: none; }
    table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
    th { background: #eff6ff; }
    .module { margin-top: 24px; }
    .status { display: inline-block; padding: 4px 10px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 600; text-transform: capitalize; }
    .status.passed { background: var(--passed); }
    .status.failed, .status.unknown { background: var(--failed); }
    .status.skipped { background: var(--skipped); }
    .status.timedOut, .status.interrupted { background: var(--timedOut); }
    .test-name { font-weight: 600; min-width: 220px; }
    .step-name { min-width: 220px; }
    .links a { margin-right: 8px; }
    .note { background: #eefbf3; border: 1px solid #bbf7d0; padding: 12px 14px; border-radius: 10px; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>QRS Automation Dashboard</h1>
  <div class="subtle">Last updated: ${new Date().toLocaleString()}</div>

  <div class="grid">
    <div class="card"><div>Total tests</div><div class="metric">${overall.total}</div></div>
    <div class="card"><div>Passed</div><div class="metric" style="color: var(--passed)">${overall.passed}</div></div>
    <div class="card"><div>Failed</div><div class="metric" style="color: var(--failed)">${overall.failed}</div></div>
    <div class="card"><div>Skipped</div><div class="metric" style="color: var(--skipped)">${overall.skipped}</div></div>
    <div class="card"><div>Timed out</div><div class="metric" style="color: var(--timedOut)">${overall.timedOut}</div></div>
    <div class="card"><div>Modules</div><div class="metric">${modules.length}</div></div>
  </div>

  <div class="actions">
    <a href="./index.html">Open full Playwright report</a>
  </div>

  <h2>Module summary</h2>
  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th>Total</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
      </tr>
    </thead>
    <tbody>
      ${modules.map((module) => `
        <tr>
          <td>${escapeHtml(module.name)}</td>
          <td>${module.counts.total}</td>
          <td>${module.counts.passed}</td>
          <td>${module.counts.failed}</td>
          <td>${module.counts.skipped}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${modules.map((module) => `
    <div class="module">
      <h2>${escapeHtml(module.name)}</h2>
      <table>
        <thead>
          <tr>
            <th>Test case</th>
            <th>Step</th>
            <th>Expected result</th>
            <th>Status</th>
            <th>Failure details</th>
            <th>Step duration</th>
            <th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          ${module.tests.map((item) => item.steps.map((step) => `
            <tr>
              <td class="test-name">${escapeHtml(item.title)}<br /><span class="subtle">${escapeHtml(item.file)}</span></td>
              <td class="step-name">${escapeHtml(step.title)}</td>
              <td>${escapeHtml(step.expectedResult)}</td>
              <td><span class="${statusClass(step.status)}">${step.status}</span></td>
              <td>${escapeHtml(step.failureDetails)}</td>
              <td>${fmtDuration(step.duration)}</td>
              <td class="links">${renderLink('Screenshot', step.screenshotLink)} ${renderLink('Video', step.videoLink)} ${renderLink('Trace', step.traceLink)}</td>
            </tr>
          `).join('')).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

  <div class="note">
    Each row represents a single test step with its matching expected result. Precondition rows intentionally keep the expected-result cell blank, and the status now reflects the actual step outcome so only real failures stay marked failed.
  </div>
</body>
</html>`;

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(dashboardPath, html, 'utf8');
console.log(`Dashboard created at ${dashboardPath}`);
