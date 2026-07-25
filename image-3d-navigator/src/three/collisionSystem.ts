import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocate Box3 object to avoid allocating new THREE.Box3 and THREE.Vector3
// instances on every single frame inside the hot animation/walkthrough render loop.
// This prevents GC (garbage collection) churn/stutter, keeping rendering butter-smooth (60+ FPS).
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Directly set coords on the pre-allocated Box3 min/max Vector3 objects
  cameraFootprint.min.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  cameraFootprint.max.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);

  if (system.obstacles.some((box) => box.intersectsBox(cameraFootprint))) {
    camera.position.copy(previousPosition);
  }
};
