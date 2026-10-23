export const particleVertexShader = `
uniform sampler2D tPosition;
uniform sampler2D tVelocity;
uniform float uActiveParticles;
uniform float uTotalParticles;
uniform float uPointSize;

attribute vec2 reference; // x,y uv coords for FBO lookup

varying vec3 vVelocity;
varying float vVisibility;
varying vec2 vUv;
varying vec3 vViewVel;


void main() {
    float W = sqrt(uTotalParticles);
    float particleIndex = reference.x * W + reference.y * W * W;

    if (particleIndex > uActiveParticles) {
        vVisibility = 0.0;
        gl_Position = vec4(0.0);
        gl_PointSize = 0.0;
        return;
    }
    vVisibility = 1.0;
    vUv = reference;
    
    vec4 pos = texture2D(tPosition, reference);
    vec4 vel = texture2D(tVelocity, reference);
    
    vVelocity = vel.xyz;
    vViewVel = (modelViewMatrix * vec4(vel.xyz, 0.0)).xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (1.5 + length(vel.xyz) * 0.3) * (80.0 / -mvPosition.z);
}
`;
