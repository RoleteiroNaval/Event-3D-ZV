import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to prevent object instantiation and GC overhead per animation frame
const cameraFootprint = new THREE.Box3();

/**
 * Resolves camera collisions against world boundaries and obstacles.
 * Optimized for 60fps walkthrough navigation with zero per-frame heap allocations.
 */
export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  const pos = camera.position;

  // Clamp camera position within venue boundary margins
  pos.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, pos.x));
  pos.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, pos.z));

  // Update pre-allocated bounding box directly without instantiating new Vector3/Box3 objects
  cameraFootprint.min.set(pos.x - 0.32, 0, pos.z - 0.32);
  cameraFootprint.max.set(pos.x + 0.32, 1.9, pos.z + 0.32);

  // Early-exiting loop to avoid closure allocations from Array.prototype.some
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
