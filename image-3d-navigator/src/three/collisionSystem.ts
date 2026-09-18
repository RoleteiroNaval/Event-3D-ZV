import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to eliminate per-frame allocations during camera collision detection
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  const pos = camera.position;

  pos.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, pos.x));
  pos.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, pos.z));

  cameraFootprint.min.set(pos.x - 0.32, 0, pos.z - 0.32);
  cameraFootprint.max.set(pos.x + 0.32, 1.9, pos.z + 0.32);

  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      pos.copy(previousPosition);
      break;
    }
  }
};
