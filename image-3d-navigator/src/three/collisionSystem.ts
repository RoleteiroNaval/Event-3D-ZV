import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to prevent per-frame object allocation and GC pressure in the animation loop
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  const cx = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  const cz = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));
  camera.position.x = cx;
  camera.position.z = cz;

  // Set box bounds directly on pre-allocated Box3 to avoid Vector3 allocations
  cameraFootprint.min.set(cx - 0.32, 0, cz - 0.32);
  cameraFootprint.max.set(cx + 0.32, 1.9, cz + 0.32);

  // Use early-exiting for-loop instead of Array.prototype.some to avoid closure allocations
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
