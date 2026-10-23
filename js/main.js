import { UIController } from './ui.js';
import { MediaPipeController } from './mediapipe-controller.js';
import { SceneManager } from './scene-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
    const mediapipe = new MediaPipeController();
    const engine = new SceneManager();
});
