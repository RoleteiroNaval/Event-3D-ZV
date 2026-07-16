import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocated math objects to avoid per-frame allocations and reduce garbage collection (GC) pauses/overhead.
const tempBox = new THREE.Box3();
const tempMin = new THREE.Vector3();
const tempMax = new THREE.Vector3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  // Re-use pre-allocated tempMin, tempMax, and tempBox to completely avoid object allocations on every frame.
  tempMin.set(camera.position.x - 0.32, 0, camera.position.z - 0.32);
  tempMax.set(camera.position.x + 0.32, 1.9, camera.position.z + 0.32);
  tempBox.set(tempMin, tempMax);

  if (system.obstacles.some((box) => box.intersectsBox(tempBox))) {
    camera.position.copy(previousPosition);
  }
};
