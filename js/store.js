/**
 * store.js
 * Lightweight reactive state manager using Proxy.
 */
class Store {
    constructor(initialState) {
        this.listeners = new Set();
        this.state = new Proxy(initialState, {
            set: (target, property, value) => {
                target[property] = value;
                this.notify();
                return true;
            }
        });
    }

    subscribe(listener) {
        this.listeners.add(listener);
        // Call listener immediately with current state
        listener(this.state);
        return () => this.listeners.delete(listener); // Unsubscribe function
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}

// Global application state
export const store = new Store({
    // Shape target: 0:Sphere, 1:Star, 2:Galaxy, 3:Heart
    targetShape: 3.0,
    
    // Hand tracking data (Array for dual hands)
    hands: [
        { attractor: { x: 0, y: 0, z: 0 }, fingers: -1 },
        { attractor: { x: 0, y: 0, z: 0 }, fingers: -1 }
    ],
    
    // Base hand detected flag for simpler logic
    handDetected: false,
    
    // Performance metrics
    fps: 0,
    activeParticles: 65536, 
    targetFPS: 60,

    // Status message for UI
    statusMessage: "Initializing engine..."
});
