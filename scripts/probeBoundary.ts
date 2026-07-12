/**
 * Debug helper: dumps per-cell walkable levels in a window so region
 * boundaries can be diagnosed. Run: npx tsx scripts/probeBoundary.ts
 */
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  Box3, BufferAttribute, BufferGeometry, DoubleSide, Group, Matrix4,
  Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, Vector3,
} from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import { buildNavGrid, CELL, HALF, COLS } from '../services/pathPlanner.js';

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
const plane = new Mesh(new PlaneGeometry(1000, 1000), mat);
plane.rotation.x = -Math.PI / 2;
(plane.geometry as any).boundsTree = new MeshBVH(plane.geometry);
const terrain = new Group();
terrain.add(model, plane);
terrain.updateMatrixWorld(true);

const grid = buildNavGrid(terrain);

// Also raw surface stacks (pre-filter) for comparison
const ray = new Raycaster();
const down = new Vector3(0, -1, 0);
const origin = new Vector3();
function rawLayers(wx: number, wz: number): number[] {
  origin.set(wx, 60, wz);
  ray.set(origin, down);
  ray.far = 120;
  const out: number[] = [];
  for (const h of ray.intersectObject(terrain, true)) {
    const y = Math.round(h.point.y * 10) / 10;
    if (!out.some(v => Math.abs(v - y) < 0.2)) out.push(y);
  }
  return out;
}

// Window across the passage→left-apron boundary (cols 14..27 ≈ x -48..-9)
for (const row of [4, 8, 12, 16, 19, 22, 26, 30]) {
  const wz = row * CELL - HALF + CELL * 0.5;
  console.log(`\n=== row ${row} (z=${wz}) ===`);
  for (let col = 14; col <= 27; col++) {
    const wx = col * CELL - HALF + CELL * 0.5;
    const k = row * COLS + col;
    console.log(
      `  col ${col} (x=${String(wx).padStart(5)}): walkable [${grid.levels[k].map(v => v.toFixed(1)).join(', ')}]` +
      `  raw [${rawLayers(wx, wz).join(', ')}]`
    );
  }
}
