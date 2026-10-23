import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to eliminate per-frame object instantiations and reduce GC pressure during walkthrough navigation.
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

  // Update pre-allocated bounding box bounds directly without allocating Vector3 objects
  cameraFootprint.min.set(px - 0.32, 0, pz - 0.32);
  cameraFootprint.max.set(px + 0.32, 1.9, pz + 0.32);

  // Use early-exiting for-loop instead of Array.prototype.some to prevent per-frame closure allocations
  const obstacles = system.obstacles;
  const count = obstacles.length;
  for (let i = 0; i < count; i += 1) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
