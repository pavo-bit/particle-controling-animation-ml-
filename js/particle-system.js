import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { store } from './store.js';

import { simulationPositionShader } from './shaders/simulationPosition.glsl.js';
import { simulationVelocityShader } from './shaders/simulationVelocity.glsl.js';
import { particleVertexShader } from './shaders/particleVertex.glsl.js';
import { particleFragmentShader } from './shaders/particleFragment.glsl.js';

export class GalaxyParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.renderer = null; // Will be set in update() when available
        
        // 256x256 = 65,536 particles
        this.WIDTH = 256;
        this.PARTICLES = this.WIDTH * this.WIDTH;

        this.initGPGPU();
        this.initParticles();
    }

    // Must be called once we have the WebGLRenderer
    initGPGPU() {
        // We will initialize the GPUComputationRenderer in the first update step
        // once we have access to the renderer from the scene manager
        this.gpuCompute = null;
    }

    setupCompute(renderer) {
        this.gpuCompute = new GPUComputationRenderer(this.WIDTH, this.WIDTH, renderer);
        
        const dtPosition = this.gpuCompute.createTexture();
        const dtVelocity = this.gpuCompute.createTexture();
        const dtSphere = this.gpuCompute.createTexture();
        const dtStar = this.gpuCompute.createTexture();
        const dtGalaxy = this.gpuCompute.createTexture();
        const dtHeart = this.gpuCompute.createTexture();
        
        this.fillTextures(dtPosition, dtVelocity, dtSphere, dtStar, dtGalaxy, dtHeart);
        
        this.velocityVariable = this.gpuCompute.addVariable("textureVelocity", simulationVelocityShader, dtVelocity);
        this.positionVariable = this.gpuCompute.addVariable("texturePosition", simulationPositionShader, dtPosition);
        
        this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
        this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);
        
        this.velocityUniforms = this.velocityVariable.material.uniforms;
        this.positionUniforms = this.positionVariable.material.uniforms;
        
        this.velocityUniforms["uTime"] = { value: 0.0 };
        this.velocityUniforms["uDelta"] = { value: 0.0 };
        this.velocityUniforms["uAttractor"] = { value: new THREE.Vector3() };
        this.velocityUniforms["uAttractor2"] = { value: new THREE.Vector3() };
        this.velocityUniforms["uTargetShape"] = { value: 3.0 }; // Default: Heart
        this.velocityUniforms["uFingers"] = { value: -1.0 };
        this.velocityUniforms["uFingers2"] = { value: -1.0 };
        
        this.velocityUniforms["tSphere"] = { value: dtSphere };
        this.velocityUniforms["tStar"] = { value: dtStar };
        this.velocityUniforms["tGalaxy"] = { value: dtGalaxy };
        this.velocityUniforms["tHeart"] = { value: dtHeart };
        
        this.positionUniforms["uDelta"] = { value: 0.0 };
        
        const error = this.gpuCompute.init();
        if (error !== null) {
            console.error(error);
        }
    }

    fillTextures(pos, vel, sphere, star, galaxy, heart) {
        const pArray = pos.image.data;
        const vArray = vel.image.data;
        const sphArr = sphere.image.data;
        const strArr = star.image.data;
        const glxArr = galaxy.image.data;
        const hrtArr = heart.image.data;

        for (let i = 0; i < this.PARTICLES; i++) {
            const k = i * 4;

            // Sphere
            const phi = Math.acos(-1 + (2 * i) / this.PARTICLES);
            const theta = Math.sqrt(this.PARTICLES * Math.PI) * phi;
            const rSph = 6.0 + (Math.random() - 0.5)*0.5;
            sphArr[k+0] = rSph * Math.cos(theta) * Math.sin(phi);
            sphArr[k+1] = rSph * Math.sin(theta) * Math.sin(phi);
            sphArr[k+2] = rSph * Math.cos(phi);
            sphArr[k+3] = 1;

            // Star
            const stAng1 = Math.random() * Math.PI * 2;
            const stAng2 = Math.random() * Math.PI * 2;
            const points = 5.0;
            const rStar = 4.0 + 8.0 * Math.pow(Math.abs(Math.sin((stAng1 * points)/2.0)), 4.0);
            strArr[k+0] = rStar * Math.cos(stAng1) * Math.cos(stAng2);
            strArr[k+1] = rStar * Math.sin(stAng1) * Math.cos(stAng2);
            strArr[k+2] = (rStar*0.3) * Math.sin(stAng2); 
            strArr[k+3] = 1;

            // Galaxy
            const arms = 3;
            const arm = Math.floor(Math.random() * arms);
            const rGal = Math.pow(Math.random(), 0.5) * 14.0;
            const spread = (Math.random() - 0.5) * 1.5 * (rGal / 14.0);
            const gAngle = (arm / arms) * Math.PI * 2 + rGal * 0.4 + spread * 0.2;
            glxArr[k+0] = Math.cos(gAngle) * rGal + (Math.random()-0.5)*spread;
            glxArr[k+1] = (Math.random() - 0.5) * 1.5 * Math.exp(-rGal * 0.1);
            glxArr[k+2] = Math.sin(gAngle) * rGal + (Math.random()-0.5)*spread;
            glxArr[k+3] = 1;

            // ── Infinity Core (Smooth Trefoil Knot)
            const t = Math.random() * Math.PI * 2.0;
            const tAngle = Math.random() * Math.PI * 2.0;
            const rCore = Math.random() * 2.0; // Volume
            
            const pX = (Math.sin(t) + 2.0 * Math.sin(2.0 * t)) * 3.0;
            const pY = (Math.cos(t) - 2.0 * Math.cos(2.0 * t)) * 3.0;
            const pZ = -Math.sin(3.0 * t) * 3.0;

            hrtArr[k+0] = pX + rCore * Math.cos(tAngle);
            hrtArr[k+1] = pY + rCore * Math.sin(tAngle);
            hrtArr[k+2] = pZ + (Math.random() - 0.5) * rCore;
            hrtArr[k+3] = 1;

            // Start off as Heart
            pArray[k+0] = hrtArr[k+0];
            pArray[k+1] = hrtArr[k+1];
            pArray[k+2] = hrtArr[k+2];
            pArray[k+3] = 1.0;
        }
    }

    initParticles() {
        this.geometry = new THREE.BufferGeometry();
        const references = new Float32Array(this.PARTICLES * 2);
        for (let i = 0; i < this.PARTICLES; i++) {
            references[i * 2 + 0] = (i % this.WIDTH) / this.WIDTH;
            references[i * 2 + 1] = Math.floor(i / this.WIDTH) / this.WIDTH;
        }
        this.geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                tPosition: { value: null },
                tVelocity: { value: null },
                uActiveParticles: { value: this.PARTICLES },
                uTotalParticles: { value: this.PARTICLES },
                uPointSize: { value: 1.0 }
            },
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        this.particleMesh = new THREE.Points(this.geometry, this.material);
        this.particleMesh.frustumCulled = false;
        this.scene.add(this.particleMesh);
    }

    update(delta, renderer) {
        if (!this.gpuCompute) {
            this.setupCompute(renderer);
            return;
        }

        const state = store.state;
        const dt = Math.min(delta, 0.03);

        this.velocityUniforms["uTime"].value += dt;
        this.velocityUniforms["uDelta"].value = dt;
        this.positionUniforms["uDelta"].value = dt;

        // Attractors (Support for dual hands)
        if (state.hands && state.hands.length > 0) {
            this.velocityUniforms["uAttractor"].value.copy(state.hands[0].attractor);
            this.velocityUniforms["uFingers"].value = state.hands[0].fingers;
            
            if (state.hands.length > 1) {
                this.velocityUniforms["uAttractor2"].value.copy(state.hands[1].attractor);
                this.velocityUniforms["uFingers2"].value = state.hands[1].fingers;
            } else {
                this.velocityUniforms["uFingers2"].value = -1.0;
            }
        } else {
            this.velocityUniforms["uFingers"].value = -1.0;
            this.velocityUniforms["uFingers2"].value = -1.0;
        }
        
        // Shape targeting smoothly
        const tsUniform = this.velocityUniforms["uTargetShape"];
        tsUniform.value += (state.targetShape - tsUniform.value) * dt * 2.0;

        this.gpuCompute.compute();

        this.material.uniforms.tPosition.value = this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
        this.material.uniforms.tVelocity.value = this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
        this.material.uniforms.uActiveParticles.value = state.activeParticles || this.PARTICLES;
        
        this.particleMesh.rotation.y += 0.15 * dt;
        this.particleMesh.rotation.x += (0 - this.particleMesh.rotation.x) * dt;
    }
}
