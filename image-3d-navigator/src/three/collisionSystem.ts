import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated objects to prevent garbage collection overhead during per-frame animation loops
const tempMin = new THREE.Vector3();
const tempMax = new THREE.Vector3();
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Reuse pooled Vector3 and Box3 instances to avoid allocating memory inside the hot path
  tempMin.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  tempMax.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);
  cameraFootprint.set(tempMin, tempMax);

  if (system.obstacles.some((box) => box.intersectsBox(cameraFootprint))) {
    camera.position.copy(previousPosition);
  }
};
