export const simulationVelocityShader = `
uniform float uTime;
uniform float uDelta;
uniform vec3 uAttractor;
uniform vec3 uAttractor2;
uniform float uTargetShape; // 0:Sphere, 1:Star, 2:Galaxy, 3:Heart
uniform float uFingers;     // Hand 1
uniform float uFingers2;    // Hand 2

uniform sampler2D tSphere;
uniform sampler2D tStar;
uniform sampler2D tGalaxy;
uniform sampler2D tHeart;

float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 pos = texture2D(texturePosition, uv).xyz;
    vec3 vel = texture2D(textureVelocity, uv).xyz;
    
    vec3 posSphere = texture2D(tSphere, uv).xyz;
    vec3 posStar   = texture2D(tStar, uv).xyz;
    vec3 posGalaxy = texture2D(tGalaxy, uv).xyz;
    vec3 posHeart  = texture2D(tHeart, uv).xyz;
    
    // Smoothly blend between shapes based on uTargetShape
    float tSph  = clamp(1.0 - abs(uTargetShape - 0.0), 0.0, 1.0);
    float tStar = clamp(1.0 - abs(uTargetShape - 1.0), 0.0, 1.0);
    float tGal  = clamp(1.0 - abs(uTargetShape - 2.0), 0.0, 1.0);
    float tHrt  = clamp(1.0 - abs(uTargetShape - 3.0), 0.0, 1.0);
    
    vec3 target = posSphere;
    float totalW = tSph + tStar + tGal + tHrt;
    if(totalW > 0.0) {
        target = (posSphere * tSph + posStar * tStar + posGalaxy * tGal + posHeart * tHrt) / totalW;
    }

    float mass = 1.0 + hash(pos) * 2.0;
    vec3 force = vec3(0.0);
    float friction = 0.94;

    vec3 noise = vec3(
        sin(pos.y * 2.0 + uTime),
        cos(pos.x * 2.0 + uTime),
        sin(pos.z * 2.0 + uTime)
    ) * 0.3;

    // Hand 1 Logic
    if (uFingers >= 0.0) { 
        vec3 dir = uAttractor - pos;
        float dist = length(dir);
        if (uFingers == 1.0) {
            force += normalize(-dir) * 25.0 / (dist + 0.1);
            friction = 0.85;
        } else if (uFingers == 5.0) {
            force += normalize(-dir) * 40.0 / (dist + 0.2);
            friction = 0.80;
        } else {
            force += (target - pos) * 1.5;
        }
    }

    // Hand 2 Logic
    if (uFingers2 >= 0.0) { 
        vec3 dir = uAttractor2 - pos;
        float dist = length(dir);
        if (uFingers2 == 1.0) {
            force += normalize(-dir) * 25.0 / (dist + 0.1);
            friction *= 0.85;
        } else if (uFingers2 == 5.0) {
            force += normalize(-dir) * 40.0 / (dist + 0.2);
            friction *= 0.80;
        } else {
            force += (target - pos) * 1.5;
        }
    }

    // Return to shape smoothly
    vec3 finalTargetDir = target - pos;
    force += finalTargetDir * 2.0;
    force += noise * (length(finalTargetDir) * 0.2 + 0.5);
    
    vec3 acc = force / mass;
    vel += acc * uDelta;
    vel *= friction;

    if(length(vel) > 15.0) vel = normalize(vel) * 15.0;

    gl_FragColor = vec4(vel, 1.0);
}
`;
