import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 instance to prevent GC churn during frame-by-frame collision checks in the walkthrough loop
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  const px = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  const pz = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));
  camera.position.x = px;
  camera.position.z = pz;

  // Set footprint bounds directly without creating intermediate Vector3 or Box3 instances
  cameraFootprint.min.set(px - 0.32, 0, pz - 0.32);
  cameraFootprint.max.set(px + 0.32, 1.9, pz + 0.32);

  // Use a simple for loop instead of Array.prototype.some to avoid closure allocations and enable immediate early exit
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
