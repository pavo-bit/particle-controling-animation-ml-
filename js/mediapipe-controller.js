import { store } from './store.js';
import { HandLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs';

export class MediaPipeController {
    constructor() {
        this.video = document.getElementById('webcam-video');
        this.canvas = document.getElementById('mediapipe-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.statusEl = document.getElementById('tracking-status');
        
        this.handLandmarker = null;
        this.runningMode = "VIDEO";
        this.lastVideoTime = -1;
        this.isReady = false;

        this.init();
    }

    async init() {
        try {
            store.state.statusMessage = "Loading MediaPipe models...";
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );

            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: this.runningMode,
                numHands: 1,
                minHandDetectionConfidence: 0.5,
                minHandPresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            await this.setupCamera();
            this.isReady = true;
            this.statusEl.innerText = "Tracking Active";
            this.statusEl.classList.remove('error');
            store.state.statusMessage = "Engine Ready";

            this.detect();

        } catch (error) {
            console.error("MediaPipe Initialization Error:", error);
            this.statusEl.innerText = "Camera/Tracker Error";
            this.statusEl.classList.add('error');
            store.state.statusMessage = "Failed to load MediaPipe";
        }
    }

    async setupCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Browser doesn't support getUserMedia");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" }
        });

        this.video.srcObject = stream;

        return new Promise((resolve) => {
            this.video.onloadedmetadata = () => {
                this.video.play();
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                resolve();
            };
        });
    }

    detect = () => {
        if (!this.handLandmarker || !this.video || this.video.readyState < 2) {
            requestAnimationFrame(this.detect);
            return;
        }

        const startTimeMs = performance.now();
        if (this.lastVideoTime !== this.video.currentTime) {
            this.lastVideoTime = this.video.currentTime;
            
            const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
            this.processResults(results);
        }

        requestAnimationFrame(this.detect);
    }

    processResults(results) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
            store.state.handDetected = true;
            this.statusEl.innerText = "Hand Detected";
            this.statusEl.style.color = "var(--accent)";

            const landmarks = results.landmarks[0]; 

            this.drawLandmarks(landmarks);

            // === Attractor: Palm Center (wrist + 5 base knuckles avg) ===
            const palmIndices = [0, 5, 9, 13, 17]; // Wrist + knuckles
            let px = 0, py = 0, pz = 0;
            for (const idx of palmIndices) {
                px += landmarks[idx].x;
                py += landmarks[idx].y;
                pz += landmarks[idx].z;
            }
            px /= palmIndices.length;
            py /= palmIndices.length;
            pz /= palmIndices.length;

            const x3d = (0.5 - px) * 5.0;
            const y3d = -(py - 0.5) * 5.0;
            const z3d = Math.max(0, (0.05 - pz) * 10.0);

            store.state.attractorPosition = { x: x3d, y: y3d, z: z3d };

            // === Pinch: Thumb tip (4) to Index tip (8) ===
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const dx = thumbTip.x - indexTip.x;
            const dy = thumbTip.y - indexTip.y;
            const dz = thumbTip.z - indexTip.z;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            const normalizedPinch = Math.max(0, Math.min(1, (distance - 0.02) / 0.15));
            store.state.pinchDistance = normalizedPinch;

        } else {
            store.state.handDetected = false;
            store.state.pinchDistance = 1.0; 
            this.statusEl.innerText = "Tracking Active...";
            this.statusEl.style.color = "#888";
        }
    }

    drawLandmarks(landmarks) {
        const W = this.canvas.width;
        const H = this.canvas.height;

        // Standard MediaPipe Hand Connections
        const CONNECTIONS = [
            // Palm
            [0,1],[1,2],[2,3],[3,4],      // Thumb
            [0,5],[5,6],[6,7],[7,8],      // Index
            [0,9],[9,10],[10,11],[11,12], // Middle
            [0,13],[13,14],[14,15],[15,16],// Ring
            [0,17],[17,18],[18,19],[19,20],// Pinky
            [5,9],[9,13],[13,17]           // Knuckle bar
        ];

        // Finger tip indices for special highlight
        const TIPS = [4, 8, 12, 16, 20];

        this.ctx.save();
        this.ctx.scale(-1, 1); 
        this.ctx.translate(-W, 0);

        // ---- Draw Bones ----
        for (const [a, b] of CONNECTIONS) {
            const lmA = landmarks[a];
            const lmB = landmarks[b];

            // Gradient color from wrist (cyan) to tip (white)
            const t = b / 20;
            const r = Math.round(0 + t * 255);
            const g = 255;
            const bl = Math.round(204 - t * 100);

            this.ctx.beginPath();
            this.ctx.moveTo(lmA.x * W, lmA.y * H);
            this.ctx.lineTo(lmB.x * W, lmB.y * H);
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, 0.75)`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }

        // ---- Draw All Landmark Dots ----
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            const isTip = TIPS.includes(i);

            this.ctx.beginPath();
            this.ctx.arc(lm.x * W, lm.y * H, isTip ? 5 : 3, 0, Math.PI * 2);
            this.ctx.fillStyle = isTip ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 255, 204, 0.9)';
            this.ctx.fill();

            // Outer glow ring on tips
            if (isTip) {
                this.ctx.beginPath();
                this.ctx.arc(lm.x * W, lm.y * H, 8, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.35)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }
}
