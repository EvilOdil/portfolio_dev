/**
 * Debug helper: prints surface-height profiles across the factory so
 * elevated floors / ramps / steps are visible. Run: npx tsx scripts/probeHeights.ts
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

const ray = new Raycaster();
const down = new Vector3(0, -1, 0);
const origin = new Vector3();

/** All downward-hit surface heights at (x,z), highest first, deduped. */
function layers(x: number, z: number): number[] {
  origin.set(x, 60, z);
  ray.set(origin, down);
  ray.far = 120;
  const hits = ray.intersectObject(terrain, true);
  const ys: number[] = [];
  for (const h of hits) {
    const y = Math.round(h.point.y * 10) / 10;
    if (!ys.some(v => Math.abs(v - y) < 0.3)) ys.push(y);
  }
  return ys;
}

// Cross-sections perpendicular to the main passage (which runs along z in
// the north half, x∈[-20,20]); step x by 2 from -70 to 70.
for (const z of [-70, -55, -40, -20, 20, 45]) {
  console.log(`\n=== cross-section z=${z} (x from -70 to 70, step 2) ===`);
  let line = '';
  for (let x = -70; x <= 70; x += 2) {
    const ls = layers(x, z);
    // First layer at or below 20 (skip roofs) — the "walkable candidate"
    const surf = ls.find(y => y <= 20);
    line += (surf === undefined ? '  ?' : String(surf.toFixed(0)).padStart(3));
  }
  console.log(`x:   ${Array.from({ length: 71 }, (_, i) => -70 + i * 2).filter((_, i) => i % 5 === 0).map(v => String(v).padStart(3)).join('             ')}`);
  console.log(`h: ${line}`);
  // Detail: full layer stack every 10 units
  for (let x = -70; x <= 70; x += 10) {
    console.log(`   x=${String(x).padStart(4)}: [${layers(x, z).join(', ')}]`);
  }
}
