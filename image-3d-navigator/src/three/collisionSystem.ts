import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Reusable Box3 instance to prevent per-frame allocations during walkthrough navigation.
// Reusing a single box and mutating min/max avoids creating Vector3 and Box3 objects at 60 FPS.
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

  // Update bounds directly without creating intermediate Vector3 or Box3 instances
  cameraFootprint.min.set(cx - 0.32, 0, cz - 0.32);
  cameraFootprint.max.set(cx + 0.32, 1.9, cz + 0.32);

  // Early-exit for loop avoids closure allocation from Array.prototype.some and terminates on first hit
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i += 1) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
