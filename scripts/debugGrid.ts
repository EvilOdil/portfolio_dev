/**
 * Debug helper: prints the layered nav grid as ASCII + step-limited
 * connectivity from zone 1. Run: npx tsx scripts/debugGrid.ts
 */
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  Box3, BufferAttribute, BufferGeometry, DoubleSide, Group, Matrix4,
  Mesh, MeshBasicMaterial, Vector3,
} from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import { buildNavGrid, CELL, HALF, COLS, MAX_STEP } from '../services/pathPlanner.js';
import { PORTFOLIO_DATA } from '../services/portfolioData.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
(Mesh.prototype as any).raycast = acceleratedRaycast;

const io = new NodeIO()
  .registerExtensions(KHRONOS_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
const doc = await io.read(join(__dirname, '../public/models/factory_2_draco.glb'));

const mat = new MeshBasicMaterial({ side: DoubleSide });
const model = new Group();
const wm = new Matrix4();
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  wm.fromArray(node.getWorldMatrix());
  for (const prim of mesh.listPrimitives()) {
    if (prim.getMode() !== 4) continue;
    const pos = prim.getAttribute('POSITION');
    if (!pos) continue;
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos.getArray()!), 3));
    const idx = prim.getIndices();
    if (idx) g.setIndex(new BufferAttribute(idx.getArray()!, 1));
    g.applyMatrix4(wm);
    (g as any).boundsTree = new MeshBVH(g);
    model.add(new Mesh(g, mat));
  }
}
const box = new Box3().setFromObject(model);
const size = box.getSize(new Vector3());
const center = box.getCenter(new Vector3());
const sf = 300 / Math.max(size.x, size.z);
model.scale.setScalar(sf);
model.position.set(-center.x * sf, -box.min.y * sf, -center.z * sf);
// Real geometry only — the runtime y=0 safety plane is not walkable floor
const terrain = new Group();
terrain.add(model);
terrain.updateMatrixWorld(true);

const grid = buildNavGrid(terrain);

const w2c = (wx: number, wz: number): [number, number] => [
  Math.max(0, Math.min(COLS - 1, Math.floor((wx + HALF) / CELL))),
  Math.max(0, Math.min(COLS - 1, Math.floor((wz + HALF) / CELL))),
];

// Step-limited flood fill from zone 1's floor level across (cell, level) nodes
const MAXL = 4;
const reach = new Uint8Array(COLS * COLS * MAXL);
{
  const [c1, r1] = w2c(PORTFOLIO_DATA[0].position[0], PORTFOLIO_DATA[0].position[2]);
  const y1 = PORTFOLIO_DATA[0].position[1];
  const k1 = r1 * COLS + c1;
  let li1 = 0;
  grid.levels[k1].forEach((y, i) => {
    if (Math.abs(y - y1) < Math.abs(grid.levels[k1][li1] - y1)) li1 = i;
  });
  const q: Array<[number, number, number]> = [[c1, r1, li1]];
  while (q.length) {
    const [c, r, li] = q.pop()!;
    if (c < 0 || c >= COLS || r < 0 || r >= COLS) continue;
    const k = r * COLS + c;
    if (li >= grid.levels[k].length) continue;
    const id = k * MAXL + li;
    if (reach[id]) continue;
    reach[id] = 1;
    const h = grid.levels[k][li];
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= COLS) continue;
      const nk = nr * COLS + nc;
      grid.levels[nk].forEach((ny, nli) => {
        if (nli < MAXL && Math.abs(ny - h) <= MAX_STEP) q.push([nc, nr, nli]);
      });
    }
  }
}

const cellReachable = (k: number) =>
  grid.levels[k].some((_, li) => li < MAXL && reach[k * MAXL + li]);

// Zone markers on map
const zoneCells = new Map<number, string>();
PORTFOLIO_DATA.forEach((z, i) => {
  const [c, r] = w2c(z.position[0], z.position[2]);
  zoneCells.set(r * COLS + c, String(i + 1));
});

console.log('Legend: # no-level · . reachable-from-zone-1 · o walkable-isolated · 1-8 zones\n');
for (let r = 0; r < COLS; r++) {
  let line = '';
  for (let c = 0; c < COLS; c++) {
    const k = r * COLS + c;
    line += zoneCells.get(k) ??
      (grid.levels[k].length === 0 ? '#' : cellReachable(k) ? '.' : 'o');
  }
  console.log(line);
}

const report = (label: string, x: number, z: number) => {
  const [c, r] = w2c(x, z);
  const k = r * COLS + c;
  const ls = grid.levels[k].map(v => v.toFixed(1)).join(', ');
  console.log(
    `${label} (${x},${z}): levels [${ls}] — ${grid.levels[k].length === 0 ? 'NO LEVEL' : cellReachable(k) ? 'reachable' : 'NOT reachable'}`
  );
};

PORTFOLIO_DATA.forEach((z, i) => report(`zone ${i + 1}`, z.position[0], z.position[2]));
console.log('\n--- candidate spots ---');
report('orig zone 6', 30, 30);
report('orig zone 7', 0, 40);
report('spawn', 5, -75);
