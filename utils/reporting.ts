import { Page, test } from '@playwright/test';

export function sanitizeStepName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'step';
}

export async function setExpectedResult(expectedResult: string) {
  test.info().annotations.push({
    type: 'Expected Result',
    description: expectedResult,
  });

  await test.info().attach('expected-result.txt', {
    body: Buffer.from(expectedResult, 'utf8'),
    contentType: 'text/plain',
  });
}

export async function reportStep(
  page: Page,
  title: string,
  expectedResult: string,
  action: () => Promise<void> | void,
) {
  await test.step(title, async () => {
    await test.info().attach(`${sanitizeStepName(title)}-expected.txt`, {
      body: Buffer.from(expectedResult, 'utf8'),
      contentType: 'text/plain',
    });

    try {
      await action();
    } finally {
      if (!page.isClosed()) {
        try {
          const screenshot = await page.screenshot({ fullPage: true });
          await test.info().attach(`${sanitizeStepName(title)}.png`, {
            body: screenshot,
            contentType: 'image/png',
          });
        } catch {
          // Ignore evidence-capture issues so only the real assertion result decides the step status.
        }
      }
    }
  });
}
