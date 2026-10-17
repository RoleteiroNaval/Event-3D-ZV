import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Reusable pre-allocated Box3 to prevent per-frame garbage collection pauses during collision detection
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Reuse static cameraFootprint Box3 to avoid allocations inside the animation loop
  cameraFootprint.min.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  cameraFootprint.max.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);

  // Early-exit loop avoids per-frame array closure allocation and terminates on first obstacle collision
  for (let i = 0; i < system.obstacles.length; i++) {
    if (system.obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
