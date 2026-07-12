import React, { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from 'three';
import { Text } from '@react-three/drei';
import { NAV_CELL, NAV_HALF, NAV_COLS, NAV_LEVELS } from '../services/bakedNavGrid';
import { BAKED_PATH } from '../services/bakedPath';

/**
 * Debug overlay: projects the baked nav grid onto the factory floor.
 *  - one translucent tile per walkable level, positioned at its real height,
 *    colored by elevation (green = low … blue/purple = high)
 *  - red tiles mark blocked cells (no walkable level)
 *  - "col,row" labels every 5 cells, matching scripts/debugGrid.ts output
 *  - the baked AUTO route drawn as a yellow line (x-ray, always visible)
 *
 * Toggle with the 'G' key or a ?grid URL param (see ThreeScene).
 * Lazy-loaded — costs nothing unless enabled.
 */

interface Tile {
  x: number;
  y: number;
  z: number;
  color: string | number;
}

function cellToWorld(col: number, row: number): [number, number] {
  return [col * NAV_CELL - NAV_HALF + NAV_CELL * 0.5, row * NAV_CELL - NAV_HALF + NAV_CELL * 0.5];
}

/** Elevation → hue: 0 → green, ~5 → cyan, ≥15 → violet. */
function levelColor(y: number): number {
  const t = Math.min(Math.max(y, 0) / 15, 1);
  return new Color().setHSL(0.35 + t * 0.4, 1.0, 0.5).getHex();
}

const GridOverlay: React.FC = () => {
  const tiles = useMemo<Tile[]>(() => {
    const out: Tile[] = [];
    for (let row = 0; row < NAV_COLS; row++) {
      for (let col = 0; col < NAV_COLS; col++) {
        const [x, z] = cellToWorld(col, row);
        const levels = NAV_LEVELS[row * NAV_COLS + col];
        if (levels.length === 0) {
          out.push({ x, y: 0.15, z, color: 0xff3030 });
        } else {
          for (const y of levels) {
            out.push({ x, y: y + 0.12, z, color: levelColor(y) });
          }
        }
      }
    }
    return out;
  }, []);

  const tileMesh = useMemo(() => {
    const geo = new PlaneGeometry(NAV_CELL * 0.88, NAV_CELL * 0.88);
    geo.rotateX(-Math.PI / 2);
    const mat = new MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false });
    const mesh = new InstancedMesh(geo, mat, tiles.length);
    const dummy = new Object3D();
    const color = new Color();
    tiles.forEach((t, i) => {
      dummy.position.set(t.x, t.y, t.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(t.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }, [tiles]);

  const pathLine = useMemo(() => {
    const geo = new BufferGeometry();
    const positions: number[] = [];
    for (const [x, z] of BAKED_PATH) positions.push(x, 1.2, z);
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const mat = new LineBasicMaterial({ color: 0xffe600, depthTest: false, transparent: true });
    const line = new Line(geo, mat);
    line.renderOrder = 999;
    return line;
  }, []);

  useEffect(() => {
    return () => {
      tileMesh.geometry.dispose();
      (tileMesh.material as MeshBasicMaterial).dispose();
      tileMesh.dispose();
      pathLine.geometry.dispose();
      (pathLine.material as LineBasicMaterial).dispose();
    };
  }, [tileMesh, pathLine]);

  // "col,row" labels every 5 cells, lifted to the cell's top walkable level
  const labels = useMemo(() => {
    const out: Array<{ key: string; x: number; y: number; z: number; text: string }> = [];
    for (let row = 0; row < NAV_COLS; row += 5) {
      for (let col = 0; col < NAV_COLS; col += 5) {
        const [x, z] = cellToWorld(col, row);
        const levels = NAV_LEVELS[row * NAV_COLS + col];
        const y = (levels.length > 0 ? levels[levels.length - 1] : 0) + 0.4;
        out.push({ key: `${col},${row}`, x, y, z, text: `${col},${row}` });
      }
    }
    return out;
  }, []);

  return (
    <group>
      <primitive object={tileMesh} />
      <primitive object={pathLine} />
      {labels.map(l => (
        <Text
          key={l.key}
          position={[l.x, l.y, l.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.5}
          color="#ffffff"
          outlineWidth={0.08}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {l.text}
        </Text>
      ))}
    </group>
  );
};

export default GridOverlay;
