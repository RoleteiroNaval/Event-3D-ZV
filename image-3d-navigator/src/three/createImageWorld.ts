import * as THREE from 'three';
import type { EventBrief, EventWorldLayout } from '../types/event';
import type { CollisionSystem } from './collisionSystem';
import { createCollisionSystem } from './collisionSystem';
import { createEventMockup } from './createEventMockup';

export type MeshQuality = 'low' | 'medium' | 'high';

export type ImageWorldOptions = {
  depthScale: number;
  quality: MeshQuality;
  roomShell: boolean;
  wireframe: boolean;
  eventMockup: boolean;
  eventBrief: EventBrief;
};

export type ImageWorld = {
  scene: THREE.Scene;
  collisionMesh: THREE.Mesh;
  stats: {
    vertices: number;
    triangles: number;
    worldWidth: number;
    worldHeight: number;
  };
  eventLayout?: EventWorldLayout;
  collisionSystem?: CollisionSystem;
};

const segmentMap: Record<MeshQuality, number> = {
  low: 96,
  medium: 160,
  high: 256,
};

// Singleton canvas and context for color sampling to avoid GC pressure and DOM overhead.
let _sampleCanvas: HTMLCanvasElement | null = null;
let _sampleCtx: CanvasRenderingContext2D | null = null;

const sampleAverageColor = (
  image: HTMLImageElement,
  region: { x: number; y: number; width: number; height: number }
) => {
  if (!_sampleCanvas) {
    _sampleCanvas = document.createElement('canvas');
    _sampleCanvas.width = 1;
    _sampleCanvas.height = 1;
    _sampleCtx = _sampleCanvas.getContext('2d', { willReadFrequently: true });
  }

  if (!_sampleCtx) return new THREE.Color(0x111111);

  // Using 1x1 drawImage for hardware-accelerated averaging instead of manual pixel loops.
  _sampleCtx.globalCompositeOperation = 'copy';
  _sampleCtx.drawImage(
    image,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    1,
    1
  );

  const [r, g, b] = _sampleCtx.getImageData(0, 0, 1, 1).data;
  return new THREE.Color(r / 255, g / 255, b / 255);
};

const createDepthMesh = (
  image: HTMLImageElement,
  depthData: ImageData,
  texture: THREE.Texture,
  options: ImageWorldOptions
) => {
  const aspect = image.naturalWidth / image.naturalHeight;
  const worldWidth = 24;
  const worldHeight = worldWidth / aspect;
  const segments = segmentMap[options.quality];
  const geometry = new THREE.PlaneGeometry(worldWidth, worldHeight, segments, segments);
  const positionAttr = geometry.attributes.position;
  const positions = positionAttr.array as Float32Array;
  const depthPixels = depthData.data;
  const { width: dw, height: dh } = depthData;

  // Optimized loop: accessing Float32Array directly and inlining depth sampling
  // to avoid thousands of function calls (getX, getY, setZ, depthAt).
  for (let i = 0; i < positionAttr.count; i += 1) {
    const idx = i * 3;
    const x = positions[idx];
    const y = positions[idx + 1];

    const u = x / worldWidth + 0.5;
    const v = 1 - (y / worldHeight + 0.5);

    // Inlined depthAt
    const dx = Math.max(0, Math.min(dw - 1, Math.floor(u * (dw - 1))));
    const dy = Math.max(0, Math.min(dh - 1, Math.floor(v * (dh - 1))));
    const depth = depthPixels[(dy * dw + dx) * 4] / 255;

    const centeredDepth = 1 - depth;
    const edgeFade = Math.min(u, v, 1 - u, 1 - v) < 0.035 ? 0.68 : 1;

    positions[idx + 2] = -centeredDepth * options.depthScale * edgeFade;
  }

  positionAttr.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.88,
    metalness: 0,
    side: THREE.DoubleSide,
    wireframe: options.wireframe,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'image-depth-world-mesh';
  mesh.position.z = -5;

  return { mesh, worldWidth, worldHeight };
};

const addRoomShell = (
  scene: THREE.Scene,
  image: HTMLImageElement,
  worldWidth: number,
  worldHeight: number
) => {
  const floorColor = sampleAverageColor(image, {
    x: 0,
    y: image.naturalHeight * 0.72,
    width: image.naturalWidth,
    height: image.naturalHeight * 0.28,
  }).multiplyScalar(0.42);
  const ceilingColor = sampleAverageColor(image, {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight * 0.22,
  }).multiplyScalar(0.34);
  const sideColor = sampleAverageColor(image, {
    x: 0,
    y: image.naturalHeight * 0.2,
    width: image.naturalWidth,
    height: image.naturalHeight * 0.6,
  }).multiplyScalar(0.28);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 72),
    new THREE.MeshStandardMaterial({ color: floorColor, roughness: 1 })
  );
  floor.name = 'generated-floor';
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -worldHeight * 0.48, -12);
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 32),
    new THREE.MeshStandardMaterial({ color: ceilingColor, roughness: 1, side: THREE.DoubleSide })
  );
  ceiling.name = 'generated-ceiling';
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, worldHeight * 0.52, -12);
  scene.add(ceiling);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: sideColor,
    roughness: 1,
    side: THREE.DoubleSide,
  });

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(36, Math.max(worldHeight * 1.25, 14)), wallMaterial.clone());
  leftWall.name = 'generated-left-wall';
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-worldWidth * 0.58, 0, -13);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(36, Math.max(worldHeight * 1.25, 14)), wallMaterial.clone());
  rightWall.name = 'generated-right-wall';
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(worldWidth * 0.58, 0, -13);
  scene.add(rightWall);
};

const createStyleReferencePanel = (
  image: HTMLImageElement,
  venueWidth: number,
  venueDepth: number
) => {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(venueWidth * 0.28, 7), Math.min(venueDepth * 0.18, 4.5)),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.82 })
  );
  panel.name = 'style-reference-image-panel';
  panel.position.set(-venueWidth / 2 + 3.8, 2.2, -venueDepth / 2 + 0.18);
  return panel;
};

export const createImageWorld = (
  image: HTMLImageElement,
  depthData: ImageData,
  options: ImageWorldOptions
): ImageWorld => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080b10);
  scene.fog = new THREE.FogExp2(0x080b10, 0.015);

  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const { mesh, worldWidth, worldHeight } = createDepthMesh(image, depthData, texture, options);

  if (!options.eventMockup) {
    scene.add(mesh);
  }

  scene.add(new THREE.AmbientLight(0xbdefff, options.eventMockup ? 0.55 : 0.95));
  const keyLight = new THREE.DirectionalLight(0xffffff, options.eventMockup ? 1.35 : 1.8);
  keyLight.position.set(8, 12, 8);
  keyLight.target.position.set(0, 0, -1);
  scene.add(keyLight);
  scene.add(keyLight.target);

  if (options.roomShell) {
    addRoomShell(scene, image, worldWidth, worldHeight);
  }

  let eventLayout: EventWorldLayout | undefined;
  let collisionSystem: CollisionSystem | undefined;
  let collisionMesh: THREE.Mesh = mesh;
  if (options.eventMockup) {
    const mockup = createEventMockup(options.eventBrief);
    eventLayout = mockup.layout;
    scene.add(mockup.group);
    scene.add(createStyleReferencePanel(image, mockup.layout.venue.width_m, mockup.layout.venue.depth_m));
    collisionSystem = createCollisionSystem(mockup.bounds, mockup.colliders);

    collisionMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(mockup.layout.venue.width_m, mockup.layout.venue.depth_m),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    collisionMesh.name = 'event-floor-collision';
    collisionMesh.rotation.x = -Math.PI / 2;
    scene.add(collisionMesh);
  }

  const positionAttr = mesh.geometry.attributes.position;

  return {
    scene,
    collisionMesh,
    stats: {
      vertices: positionAttr.count,
      triangles: Math.round(positionAttr.count * 2),
      worldWidth,
      worldHeight,
    },
    eventLayout,
    collisionSystem,
  };
};
