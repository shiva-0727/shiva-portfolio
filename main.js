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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const container = document.getElementById('particles-bg');
if (container) {
    container.appendChild(renderer.domElement);
} else {
    document.getElementById('canvas-container').appendChild(renderer.domElement);
}

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

const lineCount = 60; // Reduced for minimalism
const lineGeo = new THREE.BufferGeometry();
const linePos = [];
const paths = [];

for (let i = 0; i < lineCount; i++) {
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 40;
    const z = -5 - Math.random() * 10;

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

    paths.push({
        start: new THREE.Vector3(x, y, z),
        end: new THREE.Vector3(endX, endY, z),
        length: length,
        axis: isVertical ? 'y' : 'x'
    });
}

lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
const lineMat = new THREE.LineBasicMaterial({
    color: 0x303540,
    transparent: true,
    opacity: 0.1 // Made more subtle
});
const baseCircuitLines = new THREE.LineSegments(lineGeo, lineMat);
circuitGroup.add(baseCircuitLines);

const pulseCount = 30; // Reduced pulse count
const pulseGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
const pulseMat = new THREE.MeshBasicMaterial({ color: CONFIG.accentColor });
const pulses = new THREE.InstancedMesh(pulseGeo, pulseMat, pulseCount);
circuitGroup.add(pulses);

const pulseData = [];
for (let i = 0; i < pulseCount; i++) {
    pulseData.push({
        pathIndex: Math.floor(Math.random() * paths.length),
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.008
    });
}

// --- PARTICLES BACKGROUND ---
const particlesGeo = new THREE.BufferGeometry();
const particlesCount = 200;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 30;
}

particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x8338EC,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

const dummy = new THREE.Object3D();

// --- INPUT & INTERACTION ---
const mouse = new THREE.Vector2();
const targetMouse = new THREE.Vector2();

window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('scroll', () => {
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

    mouse.lerp(targetMouse, 0.05);

    circuitGroup.rotation.z = mouse.x * 0.01;
    circuitGroup.position.x = mouse.x * -0.2;
    circuitGroup.position.y = mouse.y * -0.2;

    for (let i = 0; i < pulseCount; i++) {
        const pd = pulseData[i];
        pd.progress += pd.speed;

        if (pd.progress > 1) {
            pd.progress = 0;
            pd.pathIndex = Math.floor(Math.random() * paths.length);
            pd.speed = 0.003 + Math.random() * 0.008;
        }

        const path = paths[pd.pathIndex];
        const currentPos = new THREE.Vector3().lerpVectors(path.start, path.end, pd.progress);

        dummy.position.copy(currentPos);
        const scale = Math.sin(pd.progress * Math.PI) * 1.5;
        dummy.scale.setScalar(scale);

        dummy.updateMatrix();
        pulses.setMatrixAt(i, dummy.matrix);
    }
    pulses.instanceMatrix.needsUpdate = true;

    // Animate particles
    particlesMesh.rotation.y = time * 0.03;
    particlesMesh.rotation.x = time * 0.01;

    renderer.render(scene, camera);
}

animate();
