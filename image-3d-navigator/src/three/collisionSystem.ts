import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated Box3 to eliminate garbage collection overhead in the collision check hot path.
// This prevents creating new THREE.Vector3 and THREE.Box3 objects on every single frame.
const cachedCameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  cachedCameraFootprint.min.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  cachedCameraFootprint.max.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);

  if (system.obstacles.some((box) => box.intersectsBox(cachedCameraFootprint))) {
    camera.position.copy(previousPosition);
  }
};
