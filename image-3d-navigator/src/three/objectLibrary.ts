import * as THREE from 'three';
import type { Object3D, Zone } from '../types/event';

const materialCache = new Map<string, THREE.Material>();

export const mat = (color: string, options: { roughness?: number; metalness?: number; opacity?: number; emissive?: string } = {}) => {
  const key = `${color}-${options.roughness ?? 0.8}-${options.metalness ?? 0}-${options.opacity ?? 1}-${options.emissive ?? 'none'}`;
  const cached = materialCache.get(key);
  if (cached) return cached;

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.8,
    metalness: options.metalness ?? 0,
    transparent: (options.opacity ?? 1) < 1,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: options.emissive ? 0.75 : 0,
  });
  materialCache.set(key, material);
  return material;
};

const box = (name: string, size: [number, number, number], color: string, position: [number, number, number], options?: Parameters<typeof mat>[1]) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color, options));
  mesh.name = name;
  mesh.position.set(...position);
  return mesh;
};

const cylinder = (name: string, radius: number, height: number, color: string, position: [number, number, number], options?: Parameters<typeof mat>[1]) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), mat(color, options));
  mesh.name = name;
  mesh.position.set(...position);
  return mesh;
};

export const createTextLabel = (text: string, color = '#ffffff', width = 512, height = 160) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.Object3D();

  ctx.fillStyle = 'rgba(5, 5, 8, 0.78)';
  ctx.roundRect(10, 22, width - 20, height - 44, 18);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2, width - 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(4.8, 1.5, 1);
  sprite.name = `label-${text}`;
  return sprite;
};

export const createArrow = (name: string, color: string, length: number) => {
  const group = new THREE.Group();
  group.name = name;
  const shaft = box(`${name}-shaft`, [0.12, 0.035, length], color, [0, 0.03, 0], { emissive: color, opacity: 0.72 });
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.75, 3), mat(color, { emissive: color, opacity: 0.82 }));
  head.rotation.x = Math.PI / 2;
  head.position.z = -length / 2 - 0.32;
  group.add(shaft, head);
  return group;
};

export const createLowWall = (width: number, depth: number, height: number, color = '#1f2937') => {
  const group = new THREE.Group();
  const t = 0.18;
  group.add(box('wall-back', [width, height, t], color, [0, height / 2, -depth / 2]));
  group.add(box('wall-left', [t, height, depth], color, [-width / 2, height / 2, 0]));
  group.add(box('wall-right', [t, height, depth], color, [width / 2, height / 2, 0]));
  return group;
};

export const OBJECT_LIBRARY = {
  palco: (zone: Zone) => {
    const g = new THREE.Group();
    g.name = `${zone.id}-palco-realista`;
    const w = zone.size.width;
    const d = zone.size.depth;

    g.add(box('stage-platform', [w, zone.size.height, d], '#111827', [0, zone.size.height / 2, 0], { roughness: 0.55 }));
    g.add(box('stage-front-lip', [w, 0.28, 0.25], '#020617', [0, zone.size.height + 0.12, d / 2], { metalness: 0.2 }));
    g.add(box('led-backdrop', [w * 0.82, 3.1, 0.18], '#0f172a', [0, zone.size.height + 1.55, -d / 2 - 0.08], { emissive: '#0b1b45' }));

    const trussColor = '#9ca3af';
    const trussHeight = zone.size.height + 3.2;
    for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) {
      const pole = cylinder('truss-pillar', 0.08, trussHeight, trussColor, [x, trussHeight / 2, -d / 2]);
      g.add(pole);
    }
    const topTruss = cylinder('top-truss', 0.08, w, trussColor, [0, trussHeight, -d / 2]);
    topTruss.rotation.z = Math.PI / 2;
    g.add(topTruss);

    for (const x of [-0.36, -0.12, 0.12, 0.36]) {
      const spot = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 18), mat('#60a5fa', { emissive: '#2563eb' }));
      spot.name = 'moving-head';
      spot.rotation.x = Math.PI;
      spot.position.set(w * x, trussHeight - 0.35, -d / 2 + 0.35);
      g.add(spot);
    }

    for (const side of [-1, 1]) {
      const speakers = new THREE.Group();
      speakers.name = 'line-array';
      for (let i = 0; i < 5; i += 1) {
        speakers.add(box('speaker-box', [0.52, 0.38, 0.42], '#050505', [0, -i * 0.34, 0], { roughness: 0.4 }));
      }
      speakers.position.set(side * (w / 2 + 0.45), zone.size.height + 2.35, -d * 0.1);
      g.add(speakers);
    }

    const barricade = OBJECT_LIBRARY.grade({ type: 'grade', position: { x: 0, y: 0, z: d / 2 + 0.85 }, scale: w / 6 });
    g.add(barricade);
    return g;
  },

  sofa: (object: Object3D) => {
    const g = new THREE.Group();
    g.name = 'sofa-vip';
    const s = object.scale;
    g.add(box('sofa-seat', [1.9 * s, 0.32 * s, 0.72 * s], '#6d28d9', [0, 0.32 * s, 0], { roughness: 0.65 }));
    g.add(box('sofa-back', [1.9 * s, 0.7 * s, 0.22 * s], '#581c87', [0, 0.68 * s, 0.36 * s]));
    g.add(box('sofa-left', [0.2 * s, 0.48 * s, 0.72 * s], '#581c87', [-1.05 * s, 0.5 * s, 0]));
    g.add(box('sofa-right', [0.2 * s, 0.48 * s, 0.72 * s], '#581c87', [1.05 * s, 0.5 * s, 0]));
    return g;
  },

  mesa: (object: Object3D) => {
    const g = new THREE.Group();
    const s = object.scale;
    g.name = 'mesa-vip';
    g.add(cylinder('table-top', 0.52 * s, 0.08 * s, '#111827', [0, 0.55 * s, 0], { metalness: 0.2 }));
    g.add(cylinder('table-leg', 0.08 * s, 0.55 * s, '#71717a', [0, 0.28 * s, 0], { metalness: 0.55 }));
    return g;
  },

  balcao: (object: Object3D) => {
    const g = new THREE.Group();
    const s = object.scale;
    g.name = 'balcao-bar';
    g.add(box('counter-body', [3.4 * s, 0.9, 0.75], '#3f2617', [0, 0.45, 0], { roughness: 0.5 }));
    g.add(box('counter-top', [3.7 * s, 0.12, 0.9], '#b45309', [0, 0.96, 0], { roughness: 0.35 }));
    for (const x of [-1.1, 0, 1.1]) {
      g.add(cylinder('bottle-glow', 0.08, 0.45, '#fbbf24', [x * s, 1.28, -0.18], { emissive: '#f59e0b' }));
    }
    return g;
  },

  caixa_som: (object: Object3D) => {
    const s = object.scale;
    const g = new THREE.Group();
    g.name = 'caixa-som';
    g.add(box('speaker-main', [0.7 * s, 1.5 * s, 0.55 * s], '#030712', [0, 0.75 * s, 0], { roughness: 0.35 }));
    g.add(cylinder('speaker-cone-a', 0.18 * s, 0.04 * s, '#18181b', [0, 0.48 * s, -0.29 * s]));
    g.add(cylinder('speaker-cone-b', 0.22 * s, 0.04 * s, '#18181b', [0, 0.98 * s, -0.29 * s]));
    return g;
  },

  luz: (object: Object3D) => {
    const s = object.scale;
    const g = new THREE.Group();
    g.name = 'luz-evento';
    g.add(cylinder('light-body', 0.16 * s, 0.38 * s, '#111827', [0, 0, 0], { metalness: 0.5 }));
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.45 * s, 2.3 * s, 24, 1, true), mat('#38bdf8', { opacity: 0.18, emissive: '#38bdf8' }));
    beam.name = 'light-beam';
    beam.rotation.x = Math.PI;
    beam.position.y = -1.1 * s;
    g.add(beam);
    return g;
  },

  grade: (object: Object3D) => {
    const g = new THREE.Group();
    const count = Math.max(3, Math.round(6 * object.scale));
    g.name = 'grade-metalica';
    for (let i = 0; i < count; i += 1) {
      const x = (i - (count - 1) / 2) * 0.55;
      g.add(cylinder('fence-post', 0.035, 1.05, '#9ca3af', [x, 0.52, 0], { metalness: 0.65 }));
    }
    const railA = cylinder('fence-rail-a', 0.035, count * 0.55, '#9ca3af', [0, 0.85, 0], { metalness: 0.65 });
    railA.rotation.z = Math.PI / 2;
    const railB = cylinder('fence-rail-b', 0.035, count * 0.55, '#9ca3af', [0, 0.35, 0], { metalness: 0.65 });
    railB.rotation.z = Math.PI / 2;
    g.add(railA, railB);
    return g;
  },

  planta: (object: Object3D) => {
    const s = object.scale;
    const g = new THREE.Group();
    g.name = 'planta-decorativa';
    g.add(cylinder('plant-pot', 0.22 * s, 0.42 * s, '#292524', [0, 0.2 * s, 0]));
    for (let i = 0; i < 7; i += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.7 * s, 8), mat('#16a34a', { roughness: 0.9 }));
      leaf.position.set(Math.cos(i) * 0.15 * s, 0.68 * s, Math.sin(i) * 0.15 * s);
      leaf.rotation.z = Math.cos(i) * 0.55;
      leaf.rotation.x = Math.sin(i) * 0.55;
      g.add(leaf);
    }
    return g;
  },
};

export const createObjectFromSpec = (object: Object3D) => {
  const factory = OBJECT_LIBRARY[object.type];
  const group = factory(object);
  group.position.set(object.position.x, object.position.y, object.position.z);
  group.scale.multiplyScalar(object.scale === 0 ? 1 : 1);
  return group;
};
