import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Transformers.js será carregado dinamicamente
let pipeline, env;

let scene, camera, renderer, controls;
let depthEstimator = null;
let worldGroup = new THREE.Group();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let raycaster = new THREE.Raycaster();

const uploadUI = document.getElementById('uploadUI');
const hud = document.getElementById('hud');
const crosshair = document.getElementById('crosshair');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const progress = document.getElementById('progress');
const backBtn = document.getElementById('backBtn');
const imageNameEl = document.getElementById('imageName');

// Init Three.js
initThree();
animate();

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Luzes
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Controls FPS
    controls = new PointerLockControls(camera, renderer.domElement);
    controls.addEventListener('lock', () => {
        crosshair.classList.remove('hidden');
    });
    controls.addEventListener('unlock', () => {
        crosshair.classList.add('hidden');
    });

    renderer.domElement.addEventListener('click', () => {
        if (!controls.isLocked && !uploadUI.classList.contains('hidden')) return;
        if (!controls.isLocked) controls.lock();
    });

    scene.add(worldGroup);

    // Controles teclado
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
}

function onKeyDown(e) {
    switch(e.code) {
        case 'KeyW': case 'ArrowUp': moveForward = true; break;
        case 'KeyS': case 'ArrowDown': moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': moveRight = true; break;
    }
}
function onKeyUp(e) {
    switch(e.code) {
        case 'KeyW': case 'ArrowUp': moveForward = false; break;
        case 'KeyS': case 'ArrowDown': moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': moveRight = false; break;
    }
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // Colisão simples com o chão (raycast para baixo)
        raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObjects(worldGroup.children, true);
        if (intersects.length > 0) {
            const targetY = intersects[0].point.y + 1.6;
            camera.position.y += (targetY - camera.position.y) * 0.2;
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}

// Upload handlers
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-violet-500'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-violet-500'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-violet-500');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
});
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

backBtn.addEventListener('click', () => {
    controls.unlock();
    uploadUI.classList.remove('hidden');
    hud.classList.add('hidden');
    crosshair.classList.add('hidden');
    worldGroup.clear();
    camera.position.set(0, 1.6, 3);
});

async function handleFile(file) {
    imageNameEl.textContent = file.name;
    loading.classList.remove('hidden');
    loadingText.textContent = 'Carregando modelo de IA...';
    progress.style.width = '10%';
    
    try {
        // Carregar transformers dinamicamente
        if (!pipeline) {
            const transformers = await import('@xenova/transformers');
            pipeline = transformers.pipeline;
            env = transformers.env;
            env.allowLocalModels = false;
            env.useBrowserCache = true;
        }

        if (!depthEstimator) {
            depthEstimator = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
                progress_callback: (p) => {
                    if (p.status === 'progress') {
                        const pct = Math.round(p.progress);
                        progress.style.width = `${10 + pct * 0.6}%`;
                        loadingText.textContent = `Baixando modelo: ${p.file} (${pct}%)`;
                    } else if (p.status === 'ready') {
                        loadingText.textContent = 'Modelo pronto! Analisando imagem...';
                        progress.style.width = '70%';
                    }
                }
            });
        }

        loadingText.textContent = 'Lendo imagem...';
        progress.style.width = '75%';
        const img = await createImageBitmap(file);
        
        loadingText.textContent = 'Gerando mapa de profundidade (IA)...';
        progress.style.width = '80%';
        
        // Criar elemento img para o pipeline
        const imgEl = document.createElement('img');
        imgEl.src = URL.createObjectURL(file);
        await imgEl.decode();
        
        const result = await depthEstimator(imgEl);
        
        loadingText.textContent = 'Construindo mundo 3D...';
        progress.style.width = '90%';
        
        await buildWorld(imgEl, result.depth);
        
        progress.style.width = '100%';
        loadingText.textContent = 'Pronto!';
        
        setTimeout(() => {
            uploadUI.classList.add('hidden');
            hud.classList.remove('hidden');
            loading.classList.add('hidden');
            progress.style.width = '0%';
        }, 500);
        
    } catch (err) {
        console.error(err);
        alert('Erro: ' + err.message);
        loading.classList.add('hidden');
    }
}

async function buildWorld(imgEl, depthRaw) {
    worldGroup.clear();
    
    const imgWidth = imgEl.naturalWidth;
    const imgHeight = imgEl.naturalHeight;
    const aspect = imgWidth / imgHeight;
    
    // Textura da imagem
    const texture = new THREE.Texture(imgEl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    
    // Canvas de profundidade
    const depthCanvas = depthRaw.toCanvas();
    const depthCtx = depthCanvas.getContext('2d');
    const depthData = depthCtx.getImageData(0, 0, depthCanvas.width, depthCanvas.height).data;
    
    // Geometria principal - plano com deslocamento
    const WORLD_WIDTH = 20;
    const WORLD_HEIGHT = WORLD_WIDTH / aspect;
    const SEGMENTS = 256;
    
    const geometry = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT, SEGMENTS, SEGMENTS);
    const positions = geometry.attributes.position;
    
    // Deslocar vértices baseado na profundidade
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        // UV coordinates
        const u = (x / WORLD_WIDTH + 0.5);
        const v = 1 - (y / WORLD_HEIGHT + 0.5);
        
        // Sample depth (depthCanvas pode ter resolução diferente)
        const dx = Math.floor(u * (depthCanvas.width - 1));
        const dy = Math.floor(v * (depthCanvas.height - 1));
        const idx = (dy * depthCanvas.width + dx) * 4;
        const depth = depthData[idx] / 255; // 0-1
        
        // Inverter: objetos próximos = maior profundidade = menos deslocamento para trás
        // Depth Anything: branco = perto, preto = longe
        const z = -(1 - depth) * 8; // até 8 metros de profundidade
        
        positions.setZ(i, z);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Material com textura
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0.0,
    });
    
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.position.z = -4; // colocar à frente da câmera
    worldGroup.add(mainMesh);
    
    // Criar "caixa" para imersão - estender bordas
    createExtensions(texture, WORLD_WIDTH, WORLD_HEIGHT, mainMesh);
    
    // Chão
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 1,
        metalness: 0
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    worldGroup.add(floor);
    
    // Reset câmera
    camera.position.set(0, 1.6, 2);
    camera.lookAt(0, 1.6, -4);
    controls.getObject().position.copy(camera.position);
}

function createExtensions(texture, w, h, mainMesh) {
    // Pega as cores das bordas da imagem para estender
    const edgeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        fog: true
    });
    
    // Teto
    const ceilGeo = new THREE.PlaneGeometry(w * 3, 20);
    const ceiling = new THREE.Mesh(ceilGeo, edgeMaterial.clone());
    ceiling.material.map.offset.set(0, 0.9);
    ceiling.material.map.repeat.set(1, 0.1);
    ceiling.position.set(0, h/2 + 5, -4);
    ceiling.rotation.x = Math.PI / 2;
    worldGroup.add(ceiling);
    
    // Paredes laterais
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, h*2), edgeMaterial.clone());
    leftWall.material.map.offset.set(0, 0);
    leftWall.material.map.repeat.set(0.1, 1);
    leftWall.position.set(-w/2 - 5, 0, -4);
    leftWall.rotation.y = Math.PI / 2;
    worldGroup.add(leftWall);
    
    const rightWall = leftWall.clone();
    rightWall.position.x = w/2 + 5;
    rightWall.rotation.y = -Math.PI / 2;
    worldGroup.add(rightWall);
    
    // Fundo distante (para evitar ver o vazio)
    const backGeo = new THREE.PlaneGeometry(w*4, h*4);
    const backMat = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        side: THREE.BackSide,
        fog: true
    });
    const backdrop = new THREE.Mesh(backGeo, backMat);
    backdrop.position.z = -15;
    worldGroup.add(backdrop);
}

// Dica inicial
console.log('%c🎮 CONTROLES:', 'color: #8b5cf6; font-size: 16px; font-weight: bold');
console.log('WASD - mover\nMouse - olhar\nClique - travar mouse\nESC - liberar');