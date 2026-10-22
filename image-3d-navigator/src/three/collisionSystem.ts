import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Reuse a pre-allocated Box3 to avoid object creation (THREE.Box3, THREE.Vector3) and GC churn on every frame
const cameraFootprint = new THREE.Box3();

export const resolveCameraCollision = (
  camera: THREE.PerspectiveCamera,
  previousPosition: THREE.Vector3,
  system: CollisionSystem
) => {
  const margin = 0.55;
  camera.position.x = Math.max(-system.bounds.halfWidth + margin, Math.min(system.bounds.halfWidth - margin, camera.position.x));
  camera.position.z = Math.max(-system.bounds.halfDepth + margin, Math.min(system.bounds.halfDepth - margin, camera.position.z));

  const cx = camera.position.x;
  const cz = camera.position.z;
  cameraFootprint.min.set(cx - 0.32, 0, cz - 0.32);
  cameraFootprint.max.set(cx + 0.32, 1.9, cz + 0.32);

  // Use an early-exiting loop to avoid closure creation from Array.prototype.some
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i += 1) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      break;
    }
  }
};
