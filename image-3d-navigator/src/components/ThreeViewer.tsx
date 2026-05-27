import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { ImageQualityReport } from '../lib/imagePipeline';
import type { EventBrief, EventWorldLayout } from '../types/event';
import { resolveCameraCollision } from '../three/collisionSystem';
import type { ImageWorldOptions, MeshQuality } from '../three/createImageWorld';
import { createImageWorld } from '../three/createImageWorld';

interface Props {
  image: HTMLImageElement;
  depthData: ImageData;
  imageReport: ImageQualityReport | null;
  eventBrief: EventBrief;
  onReset: () => void;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const disposeScene = (scene: THREE.Scene) => {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) value.dispose();
        });
        material.dispose();
      });
    }
  });
};

const createExportableScene = (scene: THREE.Scene) => {
  const exportScene = scene.clone(true);
  const removable: THREE.Object3D[] = [];

  exportScene.traverse((object) => {
    if (
      object instanceof THREE.Sprite ||
      object instanceof THREE.Line ||
      object instanceof THREE.LineSegments ||
      object instanceof THREE.Light
    ) {
      removable.push(object);
    }
  });

  removable.forEach((object) => object.parent?.remove(object));
  return exportScene;
};

export default function ThreeViewer({ image, depthData, imageReport, eventBrief, onReset }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const exporterRef = useRef(new GLTFExporter());
  const [locked, setLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [quality, setQuality] = useState<MeshQuality>('medium');
  const [depthScale, setDepthScale] = useState(10);
  const [wireframe, setWireframe] = useState(false);
  const [roomShell, setRoomShell] = useState(true);
  const [eventMockup, setEventMockup] = useState(true);
  const [renderMode, setRenderMode] = useState<'isometric' | 'walkthrough'>('isometric');
  const [eventLayout, setEventLayout] = useState<EventWorldLayout | null>(null);

  const worldOptions = useMemo<ImageWorldOptions>(() => ({
    depthScale,
    quality,
    roomShell,
    wireframe,
    eventMockup,
    eventBrief,
  }), [depthScale, quality, roomShell, wireframe, eventMockup, eventBrief]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    setIsReady(false);

    const world = createImageWorld(image, depthData, worldOptions);
    setEventLayout(world.eventLayout ?? null);
    const scene = world.scene;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      74,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.55, 2.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const handleLock = () => setLocked(true);
    const handleUnlock = () => setLocked(false);
    const handleCanvasClick = () => {
      if (renderMode === 'walkthrough') controls.lock();
    };
    controls.addEventListener('lock', handleLock);
    controls.addEventListener('unlock', handleUnlock);
    renderer.domElement.addEventListener('click', handleCanvasClick);

    const keys = { w: false, a: false, s: false, d: false, shift: false };
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    let prevTime = performance.now();
    let animationFrame = 0;

    const resetCamera = () => {
      if (eventMockup && world.eventLayout && renderMode === 'isometric') {
        const maxSide = Math.max(world.eventLayout.venue.width_m, world.eventLayout.venue.depth_m);
        camera.position.set(maxSide * 0.48, maxSide * 0.62, maxSide * 0.58);
        camera.lookAt(0, 0, 0);
        return;
      }

      camera.position.set(0, 1.65, eventMockup ? world.eventLayout?.venue.depth_m ? world.eventLayout.venue.depth_m / 2 - 3 : 6 : 2.8);
      camera.lookAt(0, 1.35, eventMockup ? 0 : -5);
    };

    const updateKey = (event: KeyboardEvent, down: boolean) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.w = down;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.a = down;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.s = down;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.d = down;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.shift = down;
          break;
        case 'KeyR':
          if (down) resetCamera();
          break;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => updateKey(event, true);
    const handleKeyUp = (event: KeyboardEvent) => updateKey(event, false);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const time = performance.now();
      const delta = Math.min((time - prevTime) / 1000, 0.05);

      if (controls.isLocked && renderMode === 'walkthrough') {
        const previousPosition = camera.position.clone();
        const speed = keys.shift ? 48 : 28;
        velocity.x -= velocity.x * 10 * delta;
        velocity.z -= velocity.z * 10 * delta;
        direction.z = Number(keys.w) - Number(keys.s);
        direction.x = Number(keys.d) - Number(keys.a);
        direction.normalize();

        if (keys.w || keys.s) velocity.z -= direction.z * speed * delta;
        if (keys.a || keys.d) velocity.x -= direction.x * speed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        const hits = raycaster.intersectObject(world.collisionMesh, false);
        if (hits[0]) {
          camera.position.y += (hits[0].point.y + 1.55 - camera.position.y) * 0.14;
        }

        if (world.collisionSystem) {
          resolveCameraCollision(camera, previousPosition, world.collisionSystem);
        }
      }

      prevTime = time;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    resetCamera();
    animate();
    setIsReady(true);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      controls.removeEventListener('lock', handleLock);
      controls.removeEventListener('unlock', handleUnlock);
      controls.unlock();
      controls.disconnect();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      disposeScene(scene);
      renderer.dispose();
      rendererRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
      setIsReady(false);
    };
  }, [image, depthData, worldOptions, renderMode, eventMockup]);

  const exportGLB = () => {
    const scene = sceneRef.current;
    if (!scene || isExporting) return;

    setIsExporting(true);
    const exportScene = createExportableScene(scene);
    exporterRef.current.parse(
      exportScene,
      (result) => {
        const blob = result instanceof ArrayBuffer
          ? new Blob([result], { type: 'model/gltf-binary' })
          : new Blob([JSON.stringify(result, null, 2)], { type: 'model/gltf+json' });

        downloadBlob(blob, result instanceof ArrayBuffer ? 'image-depth-world.glb' : 'image-depth-world.gltf');
        setIsExporting(false);
      },
      (error) => {
        console.error(error);
        setIsExporting(false);
      },
      { binary: true }
    );
  };

  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.domElement.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'image-depth-world.png');
    }, 'image/png');
  };

  const handleReset = () => {
    controlsRef.current?.unlock();
    onReset();
  };

  return (
    <>
      <div ref={mountRef} className="viewer-canvas" />

      <div className={`crosshair ${locked ? 'is-visible' : ''}`}>
        <div className="crosshair-x" />
        <div className="crosshair-y" />
      </div>

      <aside className="viewer-panel">
        <div>
          <span className="panel-kicker">Mundo 3D gerado</span>
          <h2>Mockup do Evento</h2>
          <p>{renderMode === 'isometric' ? 'Modo planta 3D: visual de apresentacao arquitetonica.' : locked ? 'Navegando: WASD, Shift para correr, ESC para sair.' : 'Clique na cena para andar em primeira pessoa.'}</p>
        </div>

        <label className="control-row">
          <span>Camera</span>
          <select value={renderMode} onChange={(event) => setRenderMode(event.target.value as 'isometric' | 'walkthrough')}>
            <option value="isometric">Planta 3D</option>
            <option value="walkthrough">Entrar no local</option>
          </select>
        </label>

        <label className="control-row">
          <span>Profundidade</span>
          <input
            type="range"
            min="4"
            max="18"
            step="1"
            value={depthScale}
            onChange={(event) => setDepthScale(Number(event.target.value))}
          />
          <strong>{depthScale}</strong>
        </label>

        <label className="control-row">
          <span>Qualidade</span>
          <select value={quality} onChange={(event) => setQuality(event.target.value as MeshQuality)}>
            <option value="low">Leve</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <div className="toggle-grid">
          <label>
            <input type="checkbox" checked={roomShell} onChange={(event) => setRoomShell(event.target.checked)} />
            Sala gerada
          </label>
          <label>
            <input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} />
            Wireframe
          </label>
          <label>
            <input type="checkbox" checked={eventMockup} onChange={(event) => setEventMockup(event.target.checked)} />
            Projeto evento
          </label>
        </div>

        {eventLayout && (
          <div className="layout-summary">
            <strong>{eventBrief.capacity} pessoas</strong>
            <span>{eventLayout.zones.length} zonas</span>
            <span>{eventBrief.width_m}m x {eventBrief.depth_m}m</span>
          </div>
        )}

        {imageReport && (
          <div className="viewer-stats">
            <span>Imagem {imageReport.score}/100</span>
            <span>Luz {imageReport.brightness}%</span>
            <span>Contraste {imageReport.contrast}%</span>
          </div>
        )}

        <div className="viewer-actions">
          <button onClick={handleReset}>Nova imagem</button>
          <button onClick={takeScreenshot} disabled={!isReady}>Screenshot</button>
          <button onClick={exportGLB} disabled={!isReady || isExporting}>
            {isExporting ? 'Exportando...' : 'Exportar GLB'}
          </button>
        </div>
      </aside>
    </>
  );
}
