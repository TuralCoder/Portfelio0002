import { useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';

interface BackgroundCanvasProps {
  paused: boolean;
  onTogglePause: () => void;
}

/** A point travelling through a 3D tunnel toward the camera. */
interface Star {
  x: number;
  y: number;
  z: number;
  speed: number;
  size: number;
}

/** Long light streak rushing past the camera. */
interface Streak {
  x: number;
  y: number;
  z: number;
  length: number;
  speed: number;
  life: number;
}

interface Palette {
  bg: string;
  bgRgb: string;
  accentRgb: string;
  lineRgb: string;
}

const NEAR = 0.15;
const FAR = 6;
const FOCAL = 0.9;

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    bg: get('--color-canvas-bg', '#f6f7f1'),
    bgRgb: get('--color-canvas-bg-rgb', '246, 247, 241'),
    accentRgb: get('--color-accent-rgb', '63, 122, 14'),
    lineRgb: get('--color-line-rgb', '12, 14, 12'),
  };
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function BackgroundCanvas({ paused, onTogglePause }: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ---- state kept out of React ----
    let width = 0;
    let height = 0;
    let isMobile = false;
    let tabVisible = document.visibilityState === 'visible';
    let lastFrame = 0;
    let time = 0;
    let scrollNorm = 0;
    let palette = readPalette();

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let stars: Star[] = [];
    let streaks: Streak[] = [];

    // ---- setup helpers ----
    const spawnStar = (s: Star, fresh: boolean) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 1.6 + 0.25;
      s.x = Math.cos(angle) * radius;
      s.y = Math.sin(angle) * radius * 0.7;
      s.z = fresh ? rand(NEAR, FAR) : FAR;
      s.speed = rand(0.35, 0.9);
      s.size = rand(0.6, 1.8);
    };

    const spawnStreak = (k: Streak) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = rand(0.5, 1.5);
      k.x = Math.cos(angle) * radius;
      k.y = Math.sin(angle) * radius * 0.7;
      k.z = FAR;
      k.length = rand(0.6, 1.6);
      k.speed = rand(2.2, 3.6);
      k.life = 1;
    };

    const buildScene = () => {
      const starCount = isMobile ? 90 : 220;
      stars = Array.from({ length: starCount }, () => {
        const s: Star = { x: 0, y: 0, z: 0, speed: 0, size: 0 };
        spawnStar(s, true);
        return s;
      });
      streaks = Array.from({ length: isMobile ? 3 : 7 }, () => {
        const k: Streak = { x: 0, y: 0, z: 0, length: 0, speed: 0, life: 0 };
        spawnStreak(k);
        k.z = rand(NEAR, FAR);
        return k;
      });
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
    };

    // ---- listeners ----
    const onPointerMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / width) * 2 - 1;
      pointer.ty = (e.clientY / height) * 2 - 1;
    };
    const onPointerLeave = () => {
      pointer.tx = 0;
      pointer.ty = 0;
    };
    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - height, 1);
      scrollNorm = Math.min(window.scrollY / max, 1);
    };
    const onVisibility = () => {
      tabVisible = document.visibilityState === 'visible';
      if (tabVisible) lastFrame = performance.now();
    };
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    onScroll();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    // ---- projection ----
    const project = (x: number, y: number, z: number, cx: number, cy: number, f: number, rot: number) => {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const rx = x * c - y * s;
      const ry = x * s + y * c;
      const k = f / z;
      return { sx: cx + rx * k, sy: cy + ry * k, k };
    };

    // ---- frame ----
    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (!tabVisible) return;

      const dtRaw = lastFrame ? now - lastFrame : 16;
      lastFrame = now;
      const dt = Math.min(dtRaw, 50) / 1000;
      // Reduced-motion users start paused (see App); the on-page control can override it.
      const frozen = pausedRef.current;

      if (!frozen) {
        time += dt;
        pointer.x += (pointer.tx - pointer.x) * 0.06;
        pointer.y += (pointer.ty - pointer.y) * 0.06;
      }

      const { bg, bgRgb, accentRgb, lineRgb } = palette;
      const f = Math.min(width, height) * FOCAL;

      // Vanishing point: right of centre on wide screens, pulled by the pointer.
      const baseCx = isMobile ? width * 0.5 : width * 0.64;
      const baseCy = height * 0.48;
      const cx = baseCx + pointer.x * width * 0.06;
      const cy = baseCy + pointer.y * height * 0.06 + scrollNorm * height * 0.08;
      const rot = pointer.x * 0.12 + scrollNorm * 0.9 + (frozen ? 0 : time * 0.025);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // --- Tunnel rings: concentric octagons receding into depth ---
      const ringCount = isMobile ? 6 : 10;
      const ringSpacing = (FAR - NEAR) / ringCount;
      const ringOffset = frozen ? 0 : (time * 0.55) % ringSpacing;
      ctx.lineWidth = 1;
      for (let i = 0; i < ringCount; i++) {
        let z = NEAR + i * ringSpacing + (ringSpacing - ringOffset);
        if (z > FAR) z -= FAR - NEAR;
        const depth = 1 - (z - NEAR) / (FAR - NEAR);
        const alpha = 0.08 + depth * 0.28;
        const r = 1.9;
        ctx.beginPath();
        for (let s = 0; s <= 8; s++) {
          const a = (s / 8) * Math.PI * 2 + i * 0.12;
          const p = project(Math.cos(a) * r, Math.sin(a) * r * 0.7, z, cx, cy, f, rot);
          if (s === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
        ctx.stroke();
      }

      // --- Tunnel rails: 8 lines converging to the vanishing point ---
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        const p0 = project(Math.cos(a) * 1.9, Math.sin(a) * 1.9 * 0.7, NEAR, cx, cy, f, rot);
        const p1 = project(Math.cos(a) * 1.9, Math.sin(a) * 1.9 * 0.7, FAR, cx, cy, f, rot);
        const grad = ctx.createLinearGradient(p0.sx, p0.sy, p1.sx, p1.sy);
        grad.addColorStop(0, `rgba(${lineRgb}, 0)`);
        grad.addColorStop(0.5, `rgba(${lineRgb}, 0.16)`);
        grad.addColorStop(1, `rgba(${lineRgb}, 0)`);
        ctx.beginPath();
        ctx.moveTo(p0.sx, p0.sy);
        ctx.lineTo(p1.sx, p1.sy);
        ctx.strokeStyle = grad;
        ctx.stroke();
      }

      // --- Perspective floor grid ---
      if (!isMobile) {
        const floorY = 1.35;
        const gridSpan = 3.2;
        const gridStep = 0.4;
        const gridShift = frozen ? 0 : (time * 0.55) % gridStep;
        ctx.strokeStyle = `rgba(${lineRgb}, 0.07)`;
        for (let gz = NEAR + 0.4; gz < FAR; gz += gridStep) {
          const z = gz + gridStep - gridShift;
          if (z >= FAR) continue;
          const a = project(-gridSpan, floorY, z, cx, cy, f, rot);
          const b = project(gridSpan, floorY, z, cx, cy, f, rot);
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
        for (let gx = -gridSpan; gx <= gridSpan; gx += gridStep * 2) {
          const a = project(gx, floorY, NEAR + 0.4, cx, cy, f, rot);
          const b = project(gx, floorY, FAR, cx, cy, f, rot);
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      // --- Star field with motion trails ---
      for (const s of stars) {
        const prevZ = s.z;
        if (!frozen) {
          s.z -= s.speed * dt * (1 + scrollNorm * 0.6);
          if (s.z < NEAR) spawnStar(s, false);
        }
        const depth = 1 - (s.z - NEAR) / (FAR - NEAR);
        const head = project(s.x, s.y, s.z, cx, cy, f, rot);
        if (head.sx < -20 || head.sx > width + 20 || head.sy < -20 || head.sy > height + 20) continue;

        const alpha = 0.15 + depth * 0.75;
        const size = s.size * (0.4 + depth * 1.4);

        if (!frozen && prevZ > s.z) {
          const tail = project(s.x, s.y, Math.min(prevZ + 0.08, FAR), cx, cy, f, rot);
          ctx.beginPath();
          ctx.moveTo(tail.sx, tail.sy);
          ctx.lineTo(head.sx, head.sy);
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha * 0.45})`;
          ctx.lineWidth = size * 0.7;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(head.sx, head.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`;
        ctx.fill();
      }
      ctx.lineWidth = 1;

      // --- Warp streaks ---
      for (const k of streaks) {
        if (!frozen) {
          k.z -= k.speed * dt;
          k.life -= dt * 0.35;
          if (k.z < NEAR || k.life <= 0) spawnStreak(k);
        }
        const zTail = Math.min(k.z + k.length, FAR);
        if (zTail <= k.z) continue;
        const head = project(k.x, k.y, k.z, cx, cy, f, rot);
        const tail = project(k.x, k.y, zTail, cx, cy, f, rot);
        const depth = 1 - (k.z - NEAR) / (FAR - NEAR);
        const grad = ctx.createLinearGradient(tail.sx, tail.sy, head.sx, head.sy);
        grad.addColorStop(0, `rgba(${accentRgb}, 0)`);
        grad.addColorStop(1, `rgba(${accentRgb}, ${0.35 + depth * 0.45})`);
        ctx.beginPath();
        ctx.moveTo(tail.sx, tail.sy);
        ctx.lineTo(head.sx, head.sy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + depth * 1.5;
        ctx.stroke();
      }
      ctx.lineWidth = 1;

      // --- Core glow at the vanishing point ---
      const glowR = Math.min(width, height) * 0.35;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${accentRgb}, 0.16)`);
      glow.addColorStop(0.4, `rgba(${accentRgb}, 0.05)`);
      glow.addColorStop(1, `rgba(${accentRgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // --- Vignette / readability fade on the content side ---
      const fade = ctx.createLinearGradient(0, 0, width, 0);
      fade.addColorStop(0, `rgba(${bgRgb}, ${isMobile ? 0.55 : 0.85})`);
      fade.addColorStop(isMobile ? 0.6 : 0.45, `rgba(${bgRgb}, ${isMobile ? 0.25 : 0.35})`);
      fade.addColorStop(1, `rgba(${bgRgb}, 0)`);
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(cx, cy, glowR * 0.6, cx, cy, Math.max(width, height) * 0.9);
      vignette.addColorStop(0, `rgba(${bgRgb}, 0)`);
      vignette.addColorStop(1, `rgba(${bgRgb}, 0.6)`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <>
      <div className="bg-canvas-wrap" aria-hidden="true">
        <canvas ref={canvasRef} className="bg-canvas" />
      </div>
      <button
        type="button"
        className="bg-canvas-toggle"
        onClick={onTogglePause}
        aria-pressed={paused}
        aria-label={paused ? 'Animasiyanı başlat' : 'Animasiyanı dayandır'}
        title={paused ? 'Animasiyanı başlat' : 'Animasiyanı dayandır'}
      >
        {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      </button>
    </>
  );
}
