/* eslint-disable no-console */

import * as fs from 'fs';
import * as path from 'path';

interface GasReport {
  [key: string]: {
    gasUsed: number;
    deployments?: string[];
  };
}

/**
 * Reads a JSON gas report and prints the top N most expensive functions.
 * Usage: ts-node scripts/gas_report_summary.ts report.json 5
 */
function main() {
  const [reportPath, countStr] = process.argv.slice(2);
  if (!reportPath) {
    console.error('Usage: gas_report_summary.ts <report.json> [topN]');
    process.exit(1);
  }
  const topN = Number(countStr || '10');

  const data = fs.readFileSync(path.resolve(reportPath), 'utf-8');
  const report: GasReport = JSON.parse(data);

  const entries = Object.entries(report).sort((a, b) => b[1].gasUsed - a[1].gasUsed);
  console.log(`Top ${topN} gas consumers:`);
  entries.slice(0, topN).forEach(([name, info], idx) => {
    console.log(`${idx + 1}. ${name.padEnd(40)} ${info.gasUsed}`);
  });
}

main();
