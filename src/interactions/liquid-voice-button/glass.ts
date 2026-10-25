// WebGL renderer for the glass rings and the color blobs flowing through them.
//
// Every ring is a pill shape grown out from the button by some distance, so the
// shader only needs the button's size and one offset per ring. It measures how far
// each pixel is from the button's edge (a signed distance field) and from that:
//   - picks which glass band the pixel is in,
//   - bends the blob field along the edge like a curved lens (refraction),
//   - darkens toward each band's outer edge for depth, and
//   - draws thin lit rims where the bands meet.
// All lengths are in "design units": the component's 560 × 400 layout before scaling.

export type GlassFrame = {
  time: number;
  btnHalf: [number, number];
  offsets: [number, number, number];
  alphas: [number, number, number];
  amount: number; // 0 = idle glass, 1 = listening with color
  amp: number; // simulated voice level, 0..1
};

export type GlassColors = { deep: string; mid: string; light: string };

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uScale;
uniform float uTime;
uniform vec2 uBtn;
uniform vec3 uD;
uniform vec3 uA;
uniform float uAmt;
uniform float uAmp;
uniform float uRefr;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

float sdStadium(vec2 p, vec2 h) {
  float r = h.y;
  vec2 q = abs(p) - vec2(h.x - r, 0.0);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 nStadium(vec2 p, vec2 h) {
  float r = h.y;
  vec2 q = abs(p) - vec2(h.x - r, 0.0);
  vec2 m = max(q, 0.0);
  vec2 n = length(m) > 1e-4 ? m / length(m) : vec2(0.0, 1.0);
  return n * vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

// Soft blobs orbiting the button, with a slow noise warp so their edges wobble like liquid.
float blobs(vec2 q, float t) {
  q += 26.0 * vec2(noise(q * 0.008 + t * 0.21), noise(q * 0.008 - t * 0.17 + 7.0)) - 13.0;
  float g = 0.0;
  for (int k = 0; k < 7; k++) {
    float fk = float(k);
    float sp = (0.22 + 0.06 * fk) * (mod(fk, 2.0) < 0.5 ? 1.0 : -1.0);
    float ph = fk * 1.71;
    vec2 c = vec2(cos(t * sp + ph) * (175.0 + 35.0 * sin(t * 0.31 + fk)),
                  sin(t * sp + ph) * (112.0 + 22.0 * cos(t * 0.27 + fk * 1.3)));
    float s = 34.0 + 12.0 * sin(t * 0.73 + fk * 2.1) + 14.0 * uAmp;
    g += exp(-dot(q - c, q - c) / (s * s));
  }
  return g;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uScale;
  float px = 1.0 / uScale;
  float s = sdStadium(p, uBtn);

  float d1 = uD.x;
  float d2 = mix(d1, uD.y, step(0.001, uA.y));
  float d3 = mix(d2, uD.z, step(0.001, uA.z));
  float outer = d3;

  if (s < -2.0 * px || s > outer + 3.0 * px) { gl_FragColor = vec4(0.0); return; }

  vec2 n = nStadium(p, uBtn);

  // Which band, and how far across it (0 = inner edge, 1 = outer edge).
  float e0 = 0.0, e1 = d1, band = 0.0;
  if (s > d1) { e0 = d1; e1 = d2; band = 1.0; }
  if (s > d2) { e0 = d2; e1 = d3; band = 2.0; }
  float bw = max(e1 - e0, 1.0);
  float t = clamp((s - e0) / bw, 0.0, 1.0);

  // Lens: content shifts toward the band's middle near both edges.
  float lens = 2.0 * t - 1.0;
  lens = lens * lens * lens;
  vec2 q = p - n * uRefr * lens * bw * 0.55;

  float g = blobs(q, uTime);
  // The inner band is frosted: same blobs, softer transitions.
  // Outer bands are clearer glass, so their blob edges stay crisper.
  float soft = band < 0.5 ? 3.0 : 0.7;
  vec3 col = vec3(0.0);
  col = mix(col, uC1, smoothstep(0.2, 0.2 + 0.3 * soft, g));
  col = mix(col, uC2, smoothstep(0.66, 0.66 + 0.25 * soft, g));
  col = mix(col, uC3, 0.9 * smoothstep(1.05, 1.05 + 0.3 * soft, g));
  col *= uAmt * (0.78 + 0.25 * uAmp);

  if (band < 0.5) {
    col = mix(col, uC1 * 0.8, 0.72 * uAmt);
    col += uC2 * 0.25 * exp(-s / 9.0) * uAmt; // glow hugging the button
  }

  // Glass body, depth shading, and a lift along each band's inner edge.
  col += vec3(0.032, 0.034, 0.04) * (1.0 - 0.5 * uAmt);
  col *= mix(1.08, 0.5, smoothstep(0.5, 1.0, t));
  col += vec3(0.05) * (1.0 - smoothstep(0.0, 0.22, t));

  float cover = 1.0 - smoothstep(outer, outer + px, s);

  // Lit rims: brightest along the top, like light falling from above.
  float lit = 0.5 + 0.5 * dot(n, normalize(vec2(-0.3, 1.0)));
  float rimW = 0.6;
  float r1 = (1.0 - smoothstep(rimW, rimW + px, abs(s - d1))) * uA.x;
  float r2 = (1.0 - smoothstep(rimW, rimW + px, abs(s - d2))) * uA.y;
  float r3 = (1.0 - smoothstep(rimW, rimW + px, abs(s - d3))) * uA.z;
  float rim = max(r1, max(r2, r3)) * (0.22 + 0.4 * lit);

  float a = max(cover, rim);
  vec3 rgb = col * cover + vec3(0.86, 0.9, 0.96) * rim;
  gl_FragColor = vec4(rgb, a);
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
};

export function createGlass(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(sh));
    return sh;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const loc = {
    res: u("uRes"), scale: u("uScale"), time: u("uTime"), btn: u("uBtn"), d: u("uD"), a: u("uA"),
    amt: u("uAmt"), amp: u("uAmp"), refr: u("uRefr"), c1: u("uC1"), c2: u("uC2"), c3: u("uC3"),
  };

  return {
    resize(width: number, height: number, scale: number) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * scale * dpr));
      canvas.height = Math.max(1, Math.round(height * scale * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.res, canvas.width, canvas.height);
      gl.uniform1f(loc.scale, scale * dpr);
    },
    setStyle(colors: GlassColors, refraction: number) {
      gl.uniform3fv(loc.c1, hexToRgb(colors.deep));
      gl.uniform3fv(loc.c2, hexToRgb(colors.mid));
      gl.uniform3fv(loc.c3, hexToRgb(colors.light));
      gl.uniform1f(loc.refr, refraction);
    },
    draw(f: GlassFrame) {
      gl.uniform1f(loc.time, f.time);
      gl.uniform2f(loc.btn, f.btnHalf[0], f.btnHalf[1]);
      gl.uniform3f(loc.d, ...f.offsets);
      gl.uniform3f(loc.a, ...f.alphas);
      gl.uniform1f(loc.amt, f.amount);
      gl.uniform1f(loc.amp, f.amp);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      // Free the GPU context right away if the canvas is gone (browsers cap live contexts).
      // If the same canvas gets re-used (React dev mode remounts), keep it alive, since
      // getContext would hand back the lost context.
      setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
      }, 0);
    },
  };
}
