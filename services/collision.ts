import { BufferGeometry, DoubleSide, Matrix4, Mesh, Object3D, Ray, Vector3 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';

interface CollisionEntry {
  mesh: Mesh;
  bvh: MeshBVH;
  inverseMatrixWorld: Matrix4;
}

let entries: CollisionEntry[] = [];

// Scratch objects reused across queries (no per-frame allocations)
const _ray = new Ray();
const _hitPoint = new Vector3();
const _down = new Vector3(0, -1, 0);
const _groundOrigin = new Vector3();
const _groundPoint = new Vector3();

/**
 * Build a BVH for every mesh under `root` and cache it for collision queries.
 * The world is static, so each mesh's world matrix is inverted once here —
 * call this only after the root's final scale/position have been applied.
 */
export function registerCollisionRoot(root: Object3D): void {
  clearCollisionMeshes();
  root.updateWorldMatrix(true, true);
  const bvhCache = new Map<BufferGeometry, MeshBVH>();
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    let bvh = bvhCache.get(mesh.geometry);
    if (!bvh) {
      bvh = new MeshBVH(mesh.geometry);
      bvhCache.set(mesh.geometry, bvh);
    }
    entries.push({ mesh, bvh, inverseMatrixWorld: mesh.matrixWorld.clone().invert() });
  });
}

export function clearCollisionMeshes(): void {
  entries = [];
}

export function isCollisionReady(): boolean {
  return entries.length > 0;
}

/**
 * Nearest hit within `far` world units across all collision meshes, or null.
 * Triangles are tested double-sided: render materials use FrontSide (the
 * z-fighting fix in FactoryWorld), which would otherwise make any wall whose
 * normal faces away from the ray invisible to collision.
 */
export function raycastCollision(
  origin: Vector3,
  direction: Vector3,
  far: number,
  outPoint?: Vector3
): number | null {
  let best: number | null = null;
  for (const entry of entries) {
    _ray.origin.copy(origin);
    _ray.direction.copy(direction);
    _ray.applyMatrix4(entry.inverseMatrixWorld);
    const hit = entry.bvh.raycastFirst(_ray, DoubleSide);
    if (!hit) continue;
    // hit.point is in the geometry's local frame; distances must be compared
    // in world units because meshes carry different scales.
    _hitPoint.copy(hit.point).applyMatrix4(entry.mesh.matrixWorld);
    const dist = _hitPoint.distanceTo(origin);
    if (dist <= far && (best === null || dist < best)) {
      best = dist;
      if (outPoint) outPoint.copy(_hitPoint);
    }
  }
  return best;
}

/**
 * Height of the walkable floor at (x, z), cast downward from `clearance`
 * above `fromY`. Keeping the origin just above step height means it sits
 * below any roof/catwalk overhead, so the first hit is always the real
 * floor. Returns null when there is nothing underneath within `maxDrop`.
 */
export function groundHeightAt(
  x: number,
  fromY: number,
  z: number,
  clearance: number,
  maxDrop = 80
): number | null {
  _groundOrigin.set(x, fromY + clearance, z);
  const dist = raycastCollision(_groundOrigin, _down, clearance + maxDrop, _groundPoint);
  return dist === null ? null : _groundPoint.y;
}
