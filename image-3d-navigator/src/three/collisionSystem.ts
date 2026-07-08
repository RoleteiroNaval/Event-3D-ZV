import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated objects for collision detection to avoid per-frame allocations and GC pressure
const _cameraFootprint = new THREE.Box3();
const _boxMin = new THREE.Vector3();
const _boxMax = new THREE.Vector3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Update pre-allocated footprint box
  _boxMin.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  _boxMax.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);
  _cameraFootprint.set(_boxMin, _boxMax);

  if (system.obstacles.some((box) => box.intersectsBox(_cameraFootprint))) {
    camera.position.copy(previousPosition);
  }
};
