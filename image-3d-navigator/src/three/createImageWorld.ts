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

const sampleAverageColor = (
  image: HTMLImageElement,
  region: { x: number; y: number; width: number; height: number }
) => {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) return new THREE.Color(0x111111);

  ctx.drawImage(
    image,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let r = 0;
  let g = 0;
  let b = 0;
  const count = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  return new THREE.Color(r / count / 255, g / count / 255, b / count / 255);
};

const depthAt = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  u: number,
  v: number
) => {
  const x = Math.max(0, Math.min(width - 1, Math.floor(u * (width - 1))));
  const y = Math.max(0, Math.min(height - 1, Math.floor(v * (height - 1))));
  return pixels[(y * width + x) * 4] / 255;
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
  const positions = geometry.attributes.position;
  const depthPixels = depthData.data;

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const u = x / worldWidth + 0.5;
    const v = 1 - (y / worldHeight + 0.5);
    const depth = depthAt(depthPixels, depthData.width, depthData.height, u, v);
    const centeredDepth = 1 - depth;
    const edgeFade = Math.min(u, v, 1 - u, 1 - v) < 0.035 ? 0.68 : 1;
    positions.setZ(i, -centeredDepth * options.depthScale * edgeFade);
  }

  positions.needsUpdate = true;
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
