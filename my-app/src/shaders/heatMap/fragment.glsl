uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  float density = texture2D(uTexture, vUv).r;
  vec3 color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), density); // Blue → Red
  gl_FragColor = vec4(color, density * 0.75); // Visibility via alpha
}
