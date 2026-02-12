
import * as THREE from 'three';

// --- CONFIG ---
const CONFIG = {
    bgColor: 0x0B0F14,
    accentColor: 0x3A86FF
};

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.bgColor);
scene.fog = new THREE.FogExp2(CONFIG.bgColor, 0.03);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Simple Tone Mapping
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

document.getElementById('canvas-container').appendChild(renderer.domElement);


// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const blueRim = new THREE.SpotLight(CONFIG.accentColor, 30);
blueRim.position.set(-5, 0, 2);
blueRim.lookAt(0, 0, 0);
scene.add(blueRim);


// --- CIRCUIT BOARD BACKGROUND (Animated) ---
const circuitGroup = new THREE.Group();
scene.add(circuitGroup);

// Create grid of lines (The 'Wiring')
const lineCount = 80;
const lineGeo = new THREE.BufferGeometry();
const linePos = [];

// Store paths for pulses to travel along
const paths = [];

for (let i = 0; i < lineCount; i++) {
    // Generate random path segments
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 40;
    const z = -5 - Math.random() * 10;

    // Simple vertical or horizontal lines logic
    const isVertical = Math.random() > 0.5;
    const length = 5 + Math.random() * 10;

    let endX = x;
    let endY = y;

    if (isVertical) {
        endY = y + length;
        linePos.push(x, y, z);
        linePos.push(x, endY, z);
    } else {
        endX = x + length;
        linePos.push(x, y, z);
        linePos.push(endX, y, z);
    }

    // Save path data for pulses
    paths.push({
        start: new THREE.Vector3(x, y, z),
        end: new THREE.Vector3(endX, endY, z),
        length: length,
        axis: isVertical ? 'y' : 'x'
    });
}

lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
const lineMat = new THREE.LineBasicMaterial({
    color: 0x303540, // Dark grey wire traces
    transparent: true,
    opacity: 0.2
});
const baseCircuitLines = new THREE.LineSegments(lineGeo, lineMat);
circuitGroup.add(baseCircuitLines);


// --- PULSE ANIMATION (Light traveling along wires) ---
// We use InstancedMesh for performance with many pulses
const pulseCount = 50;
const pulseGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
const pulseMat = new THREE.MeshBasicMaterial({ color: CONFIG.accentColor });
const pulses = new THREE.InstancedMesh(pulseGeo, pulseMat, pulseCount);
circuitGroup.add(pulses);

// Pulse data structure to track movement
const pulseData = [];
for (let i = 0; i < pulseCount; i++) {
    pulseData.push({
        pathIndex: Math.floor(Math.random() * paths.length),
        progress: Math.random(), // 0 to 1
        speed: 0.005 + Math.random() * 0.01
    });
}

// Dummy object for matrix calculations
const dummy = new THREE.Object3D();


// --- INPUT & INTERACTION ---
const mouse = new THREE.Vector2();
const targetMouse = new THREE.Vector2();

window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('scroll', () => {
    // Update scroll progress bar
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) progressBar.style.width = scrolled + "%";
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // 1. Mouse Lerp
    mouse.lerp(targetMouse, 0.05);

    // 2. Background Parallax
    circuitGroup.rotation.z = mouse.x * 0.02;
    circuitGroup.position.x = mouse.x * -0.5;
    circuitGroup.position.y = mouse.y * -0.5;

    // 3. Update Pulses
    for (let i = 0; i < pulseCount; i++) {
        const pd = pulseData[i];
        pd.progress += pd.speed;

        // Reset if reached end
        if (pd.progress > 1) {
            pd.progress = 0;
            pd.pathIndex = Math.floor(Math.random() * paths.length);
            pd.speed = 0.005 + Math.random() * 0.01;
        }

        const path = paths[pd.pathIndex];
        const currentPos = new THREE.Vector3().lerpVectors(path.start, path.end, pd.progress);

        dummy.position.copy(currentPos);

        // Scale pulse based on progress (fade in/out effect visual)
        const scale = Math.sin(pd.progress * Math.PI) * 1.5;
        dummy.scale.setScalar(scale);

        dummy.updateMatrix();
        pulses.setMatrixAt(i, dummy.matrix);
    }
    pulses.instanceMatrix.needsUpdate = true;

    // 4. Render
    renderer.render(scene, camera);
}

animate();
