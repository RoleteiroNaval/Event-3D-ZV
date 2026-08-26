import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 instance to prevent per-frame garbage collection overhead during camera movement
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Update pre-allocated camera footprint bounds directly without new Vector3 allocations
  cameraFootprint.min.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  cameraFootprint.max.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);

  // Early-exit for-loop eliminates array iterator overhead and short-circuits on first collision
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
