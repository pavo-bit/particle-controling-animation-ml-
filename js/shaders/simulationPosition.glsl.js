export const simulationPositionShader = `
uniform float uDelta;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Read current position and velocity from the computation textures
    vec4 tmpPos = texture2D(texturePosition, uv);
    vec3 position = tmpPos.xyz;
    
    vec4 tmpVel = texture2D(textureVelocity, uv);
    vec3 velocity = tmpVel.xyz;
    
    // Integrate: Position = Position + Velocity * deltaTime
    position += velocity * uDelta;
    
    gl_FragColor = vec4(position, 1.0);
}
`;
