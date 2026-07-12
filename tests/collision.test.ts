/**
 * Unit tests for the BVH collision module (services/collision.ts).
 *
 * Builds a synthetic scene reproducing the two production failure cases:
 *  - a roof over the floor (old ground ray hit the roof top from +15 and the
 *    dog sank through the real floor)
 *  - a wall whose front faces AWAY from the ray (FrontSide render materials
 *    made it invisible to side-respecting raycasts → walk-through walls)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  BoxGeometry,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import {
  registerCollisionRoot,
  clearCollisionMeshes,
  isCollisionReady,
  groundHeightAt,
  raycastCollision,
} from '../services/collision';

beforeAll(() => {
  const root = new Group();

  // Floor: plane rotated flat at y=0, inside a group scaled by 3 — mimics the
  // auto-scaled factory scene, so world/local matrix handling is exercised.
  const scaled = new Group();
  scaled.scale.setScalar(3);
  const floor = new Mesh(new PlaneGeometry(100, 100), new MeshBasicMaterial({ side: FrontSide }));
  floor.rotation.x = -Math.PI / 2;
  scaled.add(floor);
  root.add(scaled);

  // Roof: flat plane at y=8 covering the same area.
  const roof = new Mesh(new PlaneGeometry(100, 100), new MeshBasicMaterial());
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = 8;
  root.add(roof);

  // Wall at x=10, rotated 180° so its front faces away from rays cast from
  // the origin — the back-face culling failure case.
  const wall = new Mesh(new BoxGeometry(1, 10, 20), new MeshBasicMaterial({ side: FrontSide }));
  wall.position.set(10, 5, 0);
  wall.rotation.y = Math.PI;
  root.add(wall);

  registerCollisionRoot(root);
});

afterAll(() => clearCollisionMeshes());

describe('collision registry', () => {
  it('reports ready after registration', () => {
    expect(isCollisionReady()).toBe(true);
  });
});

describe('groundHeightAt', () => {
  it('finds the scaled floor at y=0 under open sky', () => {
    const g = groundHeightAt(0, 0.2, 30, 1.6);
    expect(g).not.toBeNull();
    expect(Math.abs(g!)).toBeLessThan(1e-6);
  });

  it('returns the floor, not the roof, when standing under the roof', () => {
    // Ray origin 0.2 + 1.6 = 1.8 sits below the roof at 8, so the roof can
    // no longer shadow the floor (the falling-through-floor bug).
    const g = groundHeightAt(0, 0.2, 0, 1.6);
    expect(g).not.toBeNull();
    expect(Math.abs(g!)).toBeLessThan(1e-6);
  });

  it('lands on the roof when falling from above it', () => {
    const g = groundHeightAt(0, 10, 0, 1.6);
    expect(g).not.toBeNull();
    expect(Math.abs(g! - 8)).toBeLessThan(1e-6);
  });

  it('returns null when nothing is underneath within maxDrop', () => {
    const g = groundHeightAt(500, 0.2, 500, 1.6);
    expect(g).toBeNull();
  });
});

describe('raycastCollision', () => {
  it('hits a wall whose front face points away from the ray', () => {
    const d = raycastCollision(new Vector3(0, 5, 0), new Vector3(1, 0, 0), 50);
    expect(d).not.toBeNull();
    expect(Math.abs(d! - 9.5)).toBeLessThan(1e-6);
  });

  it('respects the far limit', () => {
    const d = raycastCollision(new Vector3(0, 5, 0), new Vector3(1, 0, 0), 5);
    expect(d).toBeNull();
  });

  it('ignores geometry behind the ray', () => {
    const d = raycastCollision(new Vector3(0, 5, 0), new Vector3(-1, 0, 0), 50);
    expect(d).toBeNull();
  });
});
