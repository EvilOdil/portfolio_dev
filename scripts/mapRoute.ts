/**
 * Debug helper: prints the baked nav grid with the baked route overlaid.
 * Uses the baked snapshots only — instant. Run: npx tsx scripts/mapRoute.ts
 */
import { NAV_CELL, NAV_HALF, NAV_COLS, NAV_LEVELS } from '../services/bakedNavGrid.js';
import { BAKED_PATH } from '../services/bakedPath.js';
import { PORTFOLIO_DATA } from '../services/portfolioData.js';

const w2c = (wx: number, wz: number): [number, number] => [
  Math.max(0, Math.min(NAV_COLS - 1, Math.floor((wx + NAV_HALF) / NAV_CELL))),
  Math.max(0, Math.min(NAV_COLS - 1, Math.floor((wz + NAV_HALF) / NAV_CELL))),
];

const routeCells = new Set<number>();
for (const [x, z] of BAKED_PATH) {
  const [c, r] = w2c(x, z);
  routeCells.add(r * NAV_COLS + c);
}

const zoneCells = new Map<number, string>();
PORTFOLIO_DATA.forEach((z, i) => {
  const [c, r] = w2c(z.position[0], z.position[2]);
  zoneCells.set(r * NAV_COLS + c, String(i + 1));
});

console.log('Legend: # blocked · * route · . walkable · 1-8 zones · cols 0-59 →, rows 0-59 ↓\n');
const header = '    ' + Array.from({ length: NAV_COLS }, (_, c) => (c % 10 === 0 ? String(c / 10) : c % 5 === 0 ? '+' : ' ')).join('');
console.log(header);
for (let r = 0; r < NAV_COLS; r++) {
  let line = '';
  for (let c = 0; c < NAV_COLS; c++) {
    const k = r * NAV_COLS + c;
    line += zoneCells.get(k) ??
      (routeCells.has(k) ? '*' : NAV_LEVELS[k].length === 0 ? '#' : '.');
  }
  console.log(String(r).padStart(2) + '  ' + line);
}
