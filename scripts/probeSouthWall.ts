/**
 * Debug helper: identifies which GLB meshes block movement in the south
 * region (the "imaginary wall"). Run: npx tsx scripts/probeSouthWall.ts
 */
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  Box3, BufferAttribute, BufferGeometry, DoubleSide, Group, Matrix4,
  Mesh, MeshBasicMaterial, Raycaster, Vector3,
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
    const m = new Mesh(g, mat);
    m.name = node.getName() || mesh.getName() || '(unnamed)';
    model.add(m);
  }
}
const box = new Box3().setFromObject(model);
const size = box.getSize(new Vector3());
const center = box.getCenter(new Vector3());
const sf = 300 / Math.max(size.x, size.z);
model.scale.setScalar(sf);
model.position.set(-center.x * sf, -box.min.y * sf, -center.z * sf);
model.updateMatrixWorld(true);

// 1. Horizontal rays heading south (+z) from the dog's area at body heights
const ray = new Raycaster();
const dir = new Vector3(0, 0, 1);
const origin = new Vector3();
console.log('=== southward rays (first hit) ===');
for (const x of [10, 20, 30, 40]) {
  for (const y of [1.5, 3, 5]) {
    origin.set(x, y, 65);
    ray.set(origin, dir);
    ray.far = 30;
    const hits = ray.intersectObject(model, true);
    if (hits.length > 0) {
      const h = hits[0];
      console.log(`  from (${x}, ${y}, 65): hit "${h.object.name}" at z=${h.point.z.toFixed(1)} dist=${h.distance.toFixed(1)}`);
    } else {
      console.log(`  from (${x}, ${y}, 65): no hit within 30`);
    }
  }
}

// 2. All meshes whose world bounds intersect the south strip
console.log('\n=== meshes intersecting z∈[65,92], y∈[0,12] ===');
const region = new Box3(new Vector3(-90, 0, 65), new Vector3(90, 12, 92));
const b = new Box3();
for (const child of model.children) {
  b.setFromObject(child);
  if (b.intersectsBox(region)) {
    const s = b.getSize(new Vector3());
    console.log(
      `  "${child.name}"  size ${s.x.toFixed(1)}×${s.y.toFixed(1)}×${s.z.toFixed(1)}` +
      `  x[${b.min.x.toFixed(0)},${b.max.x.toFixed(0)}] y[${b.min.y.toFixed(1)},${b.max.y.toFixed(1)}] z[${b.min.z.toFixed(0)},${b.max.z.toFixed(0)}]`
    );
  }
}
