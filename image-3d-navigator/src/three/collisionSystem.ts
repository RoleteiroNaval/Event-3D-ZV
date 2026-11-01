import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to avoid per-frame allocations during walkthrough navigation
const sharedCameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Reuse shared Box3 footprint and set bounds directly to prevent Vector3 instantiations
  sharedCameraFootprint.min.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  sharedCameraFootprint.max.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);

  // Early-exiting loop eliminates closure allocation from Array.prototype.some
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i += 1) {
    if (obstacles[i].intersectsBox(sharedCameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
