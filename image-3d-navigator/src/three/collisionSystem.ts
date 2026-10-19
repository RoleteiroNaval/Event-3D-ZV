import * as THREE from 'three';

export type CollisionSystem = {
  bounds: { halfWidth: number; halfDepth: number };
  obstacles: THREE.Box3[];
};

export const createCollisionSystem = (
  bounds: CollisionSystem['bounds'],
  obstacles: THREE.Box3[]
): CollisionSystem => ({ bounds, obstacles });

// Pre-allocate Box3 to avoid per-frame allocations during camera collision detection
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

  // Re-use module-level Box3 instead of instantiating new Box3/Vector3 objects every frame
  cameraFootprint.min.set(px - 0.32, 0, pz - 0.32);
  cameraFootprint.max.set(px + 0.32, 1.9, pz + 0.32);

  // Replaced Array.prototype.some with early-exiting for loop to prevent closure allocations
  const obstacles = system.obstacles;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].intersectsBox(cameraFootprint)) {
      camera.position.copy(previousPosition);
      return;
    }
  }
};
