import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { GalaxyParticleSystem } from './particle-system.js';
import { store } from './store.js';

export class SceneManager {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock     = new THREE.Clock();

        this.frameCount = 0;
        this.lastTime   = performance.now();

        this.init();
    }

    init() {
        // ── Scene & Fog ──────────────────────────────────
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x010005); // deep space purple-black
        this.scene.fog = new THREE.FogExp2(0x010005, 0.005);

        // ── Camera ───────────────────────────────────────
        this.camera = new THREE.PerspectiveCamera(
            65, window.innerWidth / window.innerHeight, 0.01, 1000
        );
        this.camera.position.set(0, 8, 28);

        // ── Renderer ─────────────────────────────────────
        this.renderer = new THREE.WebGLRenderer({
            antialias:       false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Auto-rotate camera for cinematic feel
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping  = true;
        this.controls.dampingFactor  = 0.04;
        this.controls.autoRotate     = true;
        this.controls.autoRotateSpeed = 0.25;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 60;

        // ── Post-Processing ───────────────────────────────
        const renderPass  = new RenderPass(this.scene, this.camera);
        const bloomPass   = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6,   // strength (Medium)
            0.4,   // radius
            0.85   // threshold
        );



        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(bloomPass);

        // ── Nebula background plane ───────────────────────
        this.buildNebula();

        // ── Galaxy particle system ────────────────────────
        this.galaxy = new GalaxyParticleSystem(this.scene);

        store.state.statusMessage = 'Galaxy Ready — show your hand!';

        window.addEventListener('resize', this.onResize.bind(this));
        this.animate();
    }

    buildNebula() {
        // Large plane behind the galaxy with a softly glowing gradient
        const geo = new THREE.PlaneGeometry(200, 200);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x0d0025,
            side:  THREE.DoubleSide,
            transparent: true,
            opacity: 0.95,
        });
        const plane = new THREE.Mesh(geo, mat);
        plane.position.z = -50;
        this.scene.add(plane);

        // Ambient nebula glow: a few coloured point-light sprites
        const nebulaColors = [0x2200ff, 0xff0066, 0x0044ff, 0x00ccff];
        nebulaColors.forEach((c, i) => {
            const angle = (i / nebulaColors.length) * Math.PI * 2;
            const r     = 12 + Math.random() * 5;
            const sg    = new THREE.Mesh(
                new THREE.PlaneGeometry(30, 30),
                new THREE.MeshBasicMaterial({
                    color:       c,
                    transparent: true,
                    opacity:     0.04,
                    side:        THREE.DoubleSide,
                    depthWrite:  false,
                    blending:    THREE.AdditiveBlending,
                })
            );
            sg.position.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.5, -5);
            this.scene.add(sg);
        });
    }

    onResize() {
        const w = window.innerWidth, h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
    }

    adaptPerformance(fps) {
        // Throttle bloom quality if FPS drops
        // (particle count is fixed — galaxy always full)
        store.state.fps = fps;
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();

        // FPS tracking
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 500) {
            const fps = this.frameCount * 1000 / (now - this.lastTime);
            store.state.fps = fps;
            this.frameCount = 0;
            this.lastTime   = now;
        }

        this.controls.update();
        this.galaxy.update(delta, this.renderer);
        this.composer.render();
    }
}
