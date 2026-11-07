import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to avoid per-frame allocations of Box3 and Vector3 objects in the render loop.
const cachedCameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  const x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  const z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));
  camera.position.x = x;
  camera.position.z = z;

  // Re-use pre-allocated bounding box without creating intermediate Vector3 instances
  cachedCameraFootprint.min.set(x - 0.32, 0, z - 0.32);
  cachedCameraFootprint.max.set(x + 0.32, 1.9, z + 0.32);

  // Early-exiting for-loop avoids closure allocation from Array.prototype.some every frame
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i += 1) {
    if (obstacles[i].intersectsBox(cachedCameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
