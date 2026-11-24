// Prints the measured numbers behind the Lighthouse budgets as a Markdown table:
// the first-visit page's JavaScript (transfer size) and its LCP on Lighthouse's phone
// profile, median of the runs. CI appends it to the job summary; pull requests quote it.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = '.lighthouseci/reports';
// The budgets themselves live in one place: lighthouserc.json, which is what fails the build.
const assertions = JSON.parse(readFileSync('lighthouserc.json', 'utf8')).ci.assert.assertions;
const jsBudget = assertions['resource-summary:script:size'][1].maxNumericValue;
const lcpBudget = assertions['largest-contentful-paint'][1].maxNumericValue;
const runs = readdirSync(dir)
  .filter((name) => name.endsWith('.report.json'))
  .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')));

if (runs.length === 0) {
  console.log('No Lighthouse reports found.');
  process.exit(0);
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const scriptBytes = (run) => run.audits['resource-summary'].details.items.find((item) => item.resourceType === 'script').transferSize;
const js = median(runs.map(scriptBytes));
const lcp = median(runs.map((run) => run.audits['largest-contentful-paint'].numericValue));
const tbt = median(runs.map((run) => run.audits['total-blocking-time'].numericValue));
const ok = (pass) => (pass ? 'within' : 'over');

console.log(`| Measure (${runs[0].finalDisplayedUrl ?? runs[0].finalUrl}, median of ${runs.length}) | Value | Budget | |`);
console.log('|---|---|---|---|');
console.log(`| Initial JavaScript, gzipped | ${(js / 1024).toFixed(1)} KB | ${Math.round(jsBudget / 1024)} KB | ${ok(js <= jsBudget)} |`);
console.log(`| Mobile LCP (slow 4G, 4× CPU slowdown) | ${(lcp / 1000).toFixed(2)} s | ${(lcpBudget / 1000).toFixed(2)} s | ${ok(lcp <= lcpBudget)} |`);
console.log(`| Total blocking time, same profile | ${Math.round(tbt)} ms | none yet | |`);
