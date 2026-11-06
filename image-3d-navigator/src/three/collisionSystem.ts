import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to avoid per-frame allocations in the animation loop (prevents GC pauses)
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  const maxBoundX = system.bounds.halfWidth - margin;
  const maxBoundZ = system.bounds.halfDepth - margin;
  camera.position.x = Math.max(-maxBoundX, Math.min(maxBoundX, camera.position.x));
  camera.position.z = Math.max(-maxBoundZ, Math.min(maxBoundZ, camera.position.z));

  // Update bounds directly without creating intermediate Vector3 or Box3 instances
  const posX = camera.position.x;
  const posZ = camera.position.z;
  cameraFootprint.min.set(posX - 0.32, 0, posZ - 0.32);
  cameraFootprint.max.set(posX + 0.32, 1.9, posZ + 0.32);

  // Early-exit for loop avoids closure allocation from Array.prototype.some
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i += 1) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      return;
    }
  }
};
