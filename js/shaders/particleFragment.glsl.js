export const particleFragmentShader = `
varying vec3 vVelocity;
varying float vVisibility;
varying vec2 vUv;
varying vec3 vViewVel;


float hash12(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    if (vVisibility < 0.5) discard;
    
    // Vector Effect: Stretch coordinate based on motion
    vec2 pc = gl_PointCoord - vec2(0.5);
    
    // Align streak with velocity
    vec2 velDir = normalize(vViewVel.xy + 0.001);
    float perpendicular = length(pc - velDir * dot(pc, velDir));
    
    // Draw a sharp line-streak (Vector style)
    float streak = smoothstep(0.1, 0.0, perpendicular) * smoothstep(0.5, 0.3, length(pc));
    if (streak < 0.1) discard;

    float rnd = hash12(vUv);
    
    // Yellow and Cyan color mix
    vec3 colCyan = vec3(0.1, 0.8, 1.0);
    vec3 colYellow = vec3(1.0, 0.9, 0.1);
    vec3 color = mix(colCyan, colYellow, step(0.5, rnd));

    // Brightness variation
    color += vec3(0.2) * length(vVelocity) * 0.1;

    gl_FragColor = vec4(color, streak * 0.9);
}
`;
