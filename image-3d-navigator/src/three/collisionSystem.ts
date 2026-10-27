import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Reuse a single Box3 instance at module scope to avoid per-frame GC allocations in the hot collision loop.
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Update bounds directly without instantiating new Vector3 or Box3 instances
  cameraFootprint.min.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  cameraFootprint.max.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);

  // Use early-exiting indexed loop to avoid per-frame array closure creation
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i += 1) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
