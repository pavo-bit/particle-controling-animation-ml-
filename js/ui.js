import { store } from './store.js';

export class UIController {
    constructor() {
        this.fpsCounter = document.getElementById('fps-counter');
        this.particleCounter = document.getElementById('particle-counter');
        this.statusMessage = document.getElementById('status-message');
        this.shapeBtns = document.querySelectorAll('.shape-btn');

        this.setupEvents();
        this.subscribeToStore();
    }

    setupEvents() {
        this.shapeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shape = e.target.dataset.shape;
                store.state.currentShape = shape;
                
                this.shapeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    subscribeToStore() {
        store.subscribe((state) => {
            this.fpsCounter.innerText = `${Math.round(state.fps)} FPS`;
            
            const kStr = (state.activeParticles / 1000).toFixed(0);
            this.particleCounter.innerText = `${kStr}k`;

            this.statusMessage.innerText = state.statusMessage;

            if (state.fps < 30) {
                this.fpsCounter.style.color = "var(--danger)";
            } else if (state.fps < 55) {
                this.fpsCounter.style.color = "#ffdd33";
            } else {
                this.fpsCounter.style.color = "var(--accent)";
            }
        });
    }
}
