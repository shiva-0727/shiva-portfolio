
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- CONFIG ---
const CONFIG = {
    bloomStrength: 1.2,
    bloomRadius: 0.5,
    bloomThreshold: 0.1
};

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- POST PROCESSING ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = CONFIG.bloomThreshold;
bloomPass.strength = CONFIG.bloomStrength;
bloomPass.radius = CONFIG.bloomRadius;
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// --- LIGHTING ---
// 1. Cyan Rim Light (Left)
const rimLight = new THREE.SpotLight(0x00ffff, 30);
rimLight.position.set(-10, 5, -5);
rimLight.lookAt(0, 0, 0);
scene.add(rimLight);

// 2. Soft Key (Right)
const keyLight = new THREE.SpotLight(0xffffff, 10);
keyLight.position.set(10, 5, 5);
keyLight.lookAt(0, 0, 0);
scene.add(keyLight);

// 3. Moving Light (Animated)
const sweepLight = new THREE.PointLight(0x00ffff, 5, 20);
scene.add(sweepLight);

// --- MATERIALS ---
// High-Tech Glass
const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0,
    transmission: 1,
    thickness: 1.0,
    ior: 1.5,
    clearcoat: 1
});

// Neon Lines
const neonMat = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    linewidth: 2,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8
});

// Dark Tech Body
const darkMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.4,
    metalness: 0.8
});

// --- HERO OBJECT: TECH CORE (Data Science Representation) ---
const heroGroup = new THREE.Group();
scene.add(heroGroup);

function createTechCore() {
    const group = new THREE.Group();

    // Central Data Sphere
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), glassMat);
    group.add(sphere);

    // Inner Core
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), new THREE.MeshBasicMaterial({
        color: 0x00ffff, wireframe: true
    }));
    group.add(core);

    // Rotating Rings
    const ringGeo = new THREE.TorusGeometry(1.8, 0.02, 16, 100);
    const ring1 = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
    const ring2 = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x0088ff }));

    ring1.rotation.x = Math.PI / 1.5;
    ring2.rotation.x = -Math.PI / 1.5;

    group.add(ring1);
    group.add(ring2);

    // Floating data nodes
    const nodeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 8; i++) {
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        const angle = (i / 8) * Math.PI * 2;
        node.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
        group.add(node);
    }

    return { group, ring1, ring2, core };
}

const techCore = createTechCore();
heroGroup.add(techCore.group);


// --- PROJECT OBJECT: DRONE (Hardware Representation) ---
const droneGroup = new THREE.Group();
scene.add(droneGroup);
droneGroup.visible = false; // Initially hidden

function createDrone() {
    const group = new THREE.Group();

    // Central Hub
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 6), darkMat);
    group.add(body);

    // Satellite Dish (Top)
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.2, 16, 1, true), darkMat);
    dish.position.y = 0.3;
    dish.rotation.x = Math.PI; // Point up
    group.add(dish);

    // Arms
    const rotors = [];
    for (let i = 0; i < 6; i++) {
        const armPivot = new THREE.Group();
        const angle = (i / 6) * Math.PI * 2;
        armPivot.rotation.y = angle;

        // Arm bar
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 2.5), darkMat);
        arm.position.z = 1.25;
        armPivot.add(arm);

        // Motor
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16), darkMat);
        motor.position.z = 2.4;
        motor.position.y = 0.1;
        armPivot.add(motor);

        // Propeller
        const propGeo = new THREE.BoxGeometry(2.8, 0.02, 0.15);
        const prop = new THREE.Mesh(propGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 }));
        prop.position.z = 2.4;
        prop.position.y = 0.3;
        rotors.push(prop);
        armPivot.add(prop);

        group.add(armPivot);
    }

    return { group, rotors };
}

const droneModel = createDrone();
droneGroup.add(droneModel.group);
// Initial Position for Drone (Hidden or flying in)
droneGroup.position.set(4, 0, 0);
droneGroup.rotation.x = 0.2;


// --- PARTICLES ---
const particleGeo = new THREE.BufferGeometry();
const particleCount = 400;
const pPos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
    pPos[i] = (Math.random() - 0.5) * 30;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particleMat = new THREE.PointsMaterial({
    color: 0x00aaaa,
    size: 0.05,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);


// --- INPUT & SCROLL ---
let scrollY = 0;
let targetScrollY = 0;
const mouse = new THREE.Vector2();

window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
});

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    // Scroll Lerp
    scrollY += (targetScrollY - scrollY) * 0.1;

    // Determine current section roughly based on scroll pixel value
    // Assuming 100vh per 'scene' logical step
    const vh = window.innerHeight;
    const scrollPhase = scrollY / vh; // 0 = Hero, 1 = About, 2 = Edu, 3 = Skills, 4 = Project

    // 1. HERO ANIMATION (Tech Core)
    if (scrollPhase < 1.5) {
        heroGroup.visible = true;

        // Idle Rotation
        techCore.group.rotation.y = time * 0.2;
        techCore.group.rotation.z = Math.sin(time * 0.5) * 0.1;
        techCore.ring1.rotation.z = time * 0.5;
        techCore.ring2.rotation.z = -time * 0.5;
        techCore.core.rotation.y = -time;

        // Transition out
        if (scrollPhase > 0.2) {
            // Move aside and shrink
            const t = Math.min((scrollPhase - 0.2), 1);
            heroGroup.position.x = -t * 5;
            heroGroup.scale.setScalar(1 - t * 0.5);
            heroGroup.position.z = -t * 5;
            camera.position.y = -t * 2;
        } else {
            // Mouse Parallax
            heroGroup.rotation.x = mouse.y * 0.2;
            heroGroup.rotation.y += mouse.x * 0.2;
            heroGroup.position.set(0, 0, 0);
            heroGroup.scale.setScalar(1);
        }
    } else {
        heroGroup.visible = false;
    }

    // 2. DRONE ANIMATION (Appears around Project Section ~4)
    // Adjust based on where Projects are in HTML. They are likely further down.
    // Roughly > 3.0 scrollPhase
    if (scrollPhase > 2.5 && scrollPhase < 5.0) {
        droneGroup.visible = true;

        // Fly in
        const bloomIn = Math.min(Math.max((scrollPhase - 2.8) * 2, 0), 1);
        droneGroup.position.x = 4 - bloomIn * 2; // Slide in from right to x=2
        droneGroup.position.y = -scrollPhase * 1.5 + 4; // Keep mostly centered or follow scroll slightly?
        // Actually let's fix it relative to camera

        // We need to detach drone from scene scroll logic or move it with camera
        // Simpler: Just position it relative to camera view
        // But we are not moving camera much.

        // Let's position it in world space where the scroll will be
        // ~ scrollY of Projects section.

        droneGroup.position.set(3, -15, 0); // Hardcode world pos roughly where 'Projects' text is?
        // No, better to make it fixed on screen like a HUD element when in section?

        // Alternative: Fixed Camera, moving content.
        // Let's stick to world space.

        // Dynamic positioning:
        droneGroup.position.copy(camera.position);
        droneGroup.position.z -= 8;
        droneGroup.position.x += 3;
        droneGroup.position.y -= 1; // Lower right

        // Rotor Spin
        droneModel.rotors.forEach((r, i) => {
            r.rotation.y += 0.5 * (i % 2 === 0 ? 1 : -1);
        });

        // Hover
        droneGroup.position.y += Math.sin(time * 2) * 0.1;
        droneGroup.rotation.z = Math.sin(time) * 0.1;
        droneGroup.rotation.x = 0.2 + Math.cos(time * 0.5) * 0.05;

    } else {
        droneGroup.visible = false;
    }

    // 3. Particles
    particles.rotation.y = time * 0.05;
    particles.position.y = camera.position.y; // Follow camera Y

    // 4. Lights
    sweepLight.position.x = Math.sin(time) * 10;
    sweepLight.position.y = camera.position.y; // Light follows user

    // Render
    composer.render();
}

animate();
