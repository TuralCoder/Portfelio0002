import { useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';

interface BackgroundCanvasProps {
  paused: boolean;
  onTogglePause: () => void;
}

interface Star {
  x: number;
  y: number;
  z: number;
  speed: number;
  size: number;
}

interface Streak {
  x: number;
  y: number;
  z: number;
  length: number;
  speed: number;
  life: number;
}

interface Shard {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  speed: number;
  size: number;
  spin: number;
  spinSpeed: number;
}

interface Palette {
  bg: string;
  bgRgb: string;
  accentRgb: string;
  lineRgb: string;
}

const NEAR = 0.12;
const FAR = 7.5;
const FOCAL = 1.05;
const RING_RADIUS = 2.05;

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
  const kickRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) kickRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let isMobile = false;
    let tabVisible = document.visibilityState === 'visible';
    let lastFrame = 0;
    let lastDraw = 0;
    let time = 0;
    let scrollNorm = 0;
    let palette = readPalette();
    let running = false;
    let needsDraw = true;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let stars: Star[] = [];
    let streaks: Streak[] = [];
    let shards: Shard[] = [];

    const spawnStar = (s: Star, fresh: boolean) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 1.85 + 0.2;
      s.x = Math.cos(angle) * radius;
      s.y = Math.sin(angle) * radius * 0.62;
      s.z = fresh ? rand(NEAR, FAR) : FAR;
      s.speed = rand(0.45, 1.15);
      s.size = rand(0.55, 1.9);
    };

    const spawnStreak = (k: Streak) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = rand(0.45, 1.7);
      k.x = Math.cos(angle) * radius;
      k.y = Math.sin(angle) * radius * 0.62;
      k.z = FAR;
      k.length = rand(0.85, 2.2);
      k.speed = rand(2.4, 4.2);
      k.life = 1;
    };

    const spawnShard = (d: Shard, fresh: boolean) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = rand(0.7, 1.9);
      d.x = Math.cos(angle) * radius;
      d.y = Math.sin(angle) * radius * 0.55;
      d.z = fresh ? rand(NEAR + 0.8, FAR) : FAR;
      d.vx = rand(-0.08, 0.08);
      d.vy = rand(-0.06, 0.06);
      d.speed = rand(0.55, 1.05);
      d.size = rand(0.08, 0.18);
      d.spin = rand(0, Math.PI * 2);
      d.spinSpeed = rand(-1.2, 1.2);
    };

    const buildScene = () => {
      const starCount = isMobile ? 80 : 210;
      stars = Array.from({ length: starCount }, () => {
        const s: Star = { x: 0, y: 0, z: 0, speed: 0, size: 0 };
        spawnStar(s, true);
        return s;
      });
      streaks = Array.from({ length: isMobile ? 4 : 9 }, () => {
        const k: Streak = { x: 0, y: 0, z: 0, length: 0, speed: 0, life: 0 };
        spawnStreak(k);
        k.z = rand(NEAR, FAR);
        return k;
      });
      shards = Array.from({ length: isMobile ? 4 : 10 }, () => {
        const d: Shard = {
          x: 0,
          y: 0,
          z: 0,
          vx: 0,
          vy: 0,
          speed: 0,
          size: 0,
          spin: 0,
          spinSpeed: 0,
        };
        spawnShard(d, true);
        return d;
      });
      needsDraw = true;
    };

    const project = (x: number, y: number, z: number, cx: number, cy: number, f: number, rot: number) => {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const rx = x * c - y * s;
      const ry = x * s + y * c;
      const depth = Math.max(z, 0.04);
      const k = f / depth;
      return { sx: cx + rx * k, sy: cy + ry * k, k };
    };

    const drawShard = (
      d: Shard,
      cx: number,
      cy: number,
      f: number,
      rot: number,
      accentRgb: string,
      lineRgb: string,
    ) => {
      const depth = 1 - (d.z - NEAR) / (FAR - NEAR);
      const alpha = 0.08 + depth * 0.32;
      const h = d.size;
      const cos = Math.cos(d.spin + rot * 0.4);
      const sin = Math.sin(d.spin + rot * 0.4);
      const verts = [
        [h, 0, 0],
        [-h * 0.5, h * 0.7, 0],
        [-h * 0.5, -h * 0.7, 0],
        [0, 0, h * 0.9],
      ].map(([x, y, z]) => {
        const rx = x * cos - z * sin;
        const rz = x * sin + z * cos;
        return project(d.x + rx, d.y + y, d.z + rz, cx, cy, f, rot);
      });

      ctx.beginPath();
      ctx.moveTo(verts[0].sx, verts[0].sy);
      ctx.lineTo(verts[1].sx, verts[1].sy);
      ctx.lineTo(verts[2].sx, verts[2].sy);
      ctx.closePath();
      ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
      ctx.lineWidth = 1 + depth * 0.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(verts[0].sx, verts[0].sy);
      ctx.lineTo(verts[3].sx, verts[3].sy);
      ctx.lineTo(verts[1].sx, verts[1].sy);
      ctx.moveTo(verts[3].sx, verts[3].sy);
      ctx.lineTo(verts[2].sx, verts[2].sy);
      ctx.strokeStyle = `rgba(${lineRgb}, ${alpha * 0.7})`;
      ctx.stroke();
    };

    const render = (now: number) => {
      const dtRaw = lastFrame ? now - lastFrame : 16;
      lastFrame = now;
      const dt = Math.min(dtRaw, 50) / 1000;
      const frozen = pausedRef.current;

      if (!frozen) {
        time += dt;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
      }

      const { bg, bgRgb, accentRgb, lineRgb } = palette;
      const f = Math.min(width, height) * FOCAL;

      const swayX = frozen ? 0 : Math.sin(time * 0.22) * 0.045;
      const swayY = frozen ? 0 : Math.cos(time * 0.17) * 0.03;
      const baseCx = isMobile ? width * 0.52 : width * 0.66;
      const baseCy = isMobile ? height * 0.42 : height * 0.47;
      const cx = baseCx + (pointer.x + swayX) * width * 0.055;
      const cy = baseCy + (pointer.y + swayY) * height * 0.05 + scrollNorm * height * 0.07;
      const rot = pointer.x * 0.1 + scrollNorm * 0.55 + (frozen ? 0 : time * 0.06);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const ringCount = isMobile ? 7 : 12;
      const ringSpacing = (FAR - NEAR) / ringCount;
      const ringOffset = frozen ? 0 : (time * 0.85) % ringSpacing;

      for (let i = ringCount - 1; i >= 0; i--) {
        let z = NEAR + i * ringSpacing + (ringSpacing - ringOffset);
        if (z > FAR) z -= FAR - NEAR;
        const depth = 1 - (z - NEAR) / (FAR - NEAR);
        const alpha = 0.05 + depth * 0.26;
        const sides = 10;
        ctx.beginPath();
        for (let s = 0; s <= sides; s++) {
          const a = (s / sides) * Math.PI * 2 + i * 0.08;
          const p = project(
            Math.cos(a) * RING_RADIUS,
            Math.sin(a) * RING_RADIUS * 0.62,
            z,
            cx,
            cy,
            f,
            rot,
          );
          if (s === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
        ctx.lineWidth = 1 + depth * 1.4;
        ctx.stroke();
      }

      ctx.lineWidth = 1;
      for (let s = 0; s < 10; s++) {
        const a = (s / 10) * Math.PI * 2;
        const p0 = project(
          Math.cos(a) * RING_RADIUS,
          Math.sin(a) * RING_RADIUS * 0.62,
          NEAR,
          cx,
          cy,
          f,
          rot,
        );
        const p1 = project(
          Math.cos(a) * RING_RADIUS,
          Math.sin(a) * RING_RADIUS * 0.62,
          FAR,
          cx,
          cy,
          f,
          rot,
        );
        const grad = ctx.createLinearGradient(p0.sx, p0.sy, p1.sx, p1.sy);
        grad.addColorStop(0, `rgba(${lineRgb}, 0)`);
        grad.addColorStop(0.35, `rgba(${lineRgb}, 0.14)`);
        grad.addColorStop(1, `rgba(${lineRgb}, 0)`);
        ctx.beginPath();
        ctx.moveTo(p0.sx, p0.sy);
        ctx.lineTo(p1.sx, p1.sy);
        ctx.strokeStyle = grad;
        ctx.stroke();
      }

      if (!isMobile) {
        const floorY = 1.28;
        const gridSpan = 3.4;
        const gridStep = 0.38;
        const gridShift = frozen ? 0 : (time * 0.85) % gridStep;
        ctx.strokeStyle = `rgba(${lineRgb}, 0.065)`;
        for (let gz = NEAR + 0.35; gz < FAR; gz += gridStep) {
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
          const a = project(gx, floorY, NEAR + 0.35, cx, cy, f, rot);
          const b = project(gx, floorY, FAR, cx, cy, f, rot);
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      for (const d of shards) {
        if (!frozen) {
          d.z -= d.speed * dt * (1 + scrollNorm * 0.45);
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.spin += d.spinSpeed * dt;
          if (d.z < NEAR) spawnShard(d, false);
        }
        drawShard(d, cx, cy, f, rot, accentRgb, lineRgb);
      }

      for (const s of stars) {
        const prevZ = s.z;
        if (!frozen) {
          s.z -= s.speed * dt * (1.15 + scrollNorm * 0.7);
          if (s.z < NEAR) spawnStar(s, false);
        }
        const depth = 1 - (s.z - NEAR) / (FAR - NEAR);
        const head = project(s.x, s.y, s.z, cx, cy, f, rot);
        if (head.sx < -24 || head.sx > width + 24 || head.sy < -24 || head.sy > height + 24) continue;

        const alpha = 0.12 + depth * 0.7;
        const size = s.size * (0.35 + depth * 1.55);

        if (!frozen && prevZ > s.z) {
          const tailZ = Math.min(prevZ + 0.16 + depth * 0.22, FAR);
          const tail = project(s.x, s.y, tailZ, cx, cy, f, rot);
          ctx.beginPath();
          ctx.moveTo(tail.sx, tail.sy);
          ctx.lineTo(head.sx, head.sy);
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha * 0.5})`;
          ctx.lineWidth = Math.max(0.6, size * 0.65);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(head.sx, head.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`;
        ctx.fill();
      }
      ctx.lineWidth = 1;

      for (const k of streaks) {
        if (!frozen) {
          k.z -= k.speed * dt;
          k.life -= dt * 0.32;
          if (k.z < NEAR || k.life <= 0) spawnStreak(k);
        }
        const zTail = Math.min(k.z + k.length, FAR);
        if (zTail <= k.z) continue;
        const head = project(k.x, k.y, k.z, cx, cy, f, rot);
        const tail = project(k.x, k.y, zTail, cx, cy, f, rot);
        const depth = 1 - (k.z - NEAR) / (FAR - NEAR);
        const grad = ctx.createLinearGradient(tail.sx, tail.sy, head.sx, head.sy);
        grad.addColorStop(0, `rgba(${accentRgb}, 0)`);
        grad.addColorStop(1, `rgba(${accentRgb}, ${0.28 + depth * 0.42})`);
        ctx.beginPath();
        ctx.moveTo(tail.sx, tail.sy);
        ctx.lineTo(head.sx, head.sy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.1 + depth * 1.8;
        ctx.stroke();
      }
      ctx.lineWidth = 1;

      const glowR = Math.min(width, height) * 0.32;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${accentRgb}, 0.12)`);
      glow.addColorStop(0.45, `rgba(${accentRgb}, 0.04)`);
      glow.addColorStop(1, `rgba(${accentRgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const fade = ctx.createLinearGradient(0, 0, width, 0);
      fade.addColorStop(0, `rgba(${bgRgb}, ${isMobile ? 0.42 : 0.62})`);
      fade.addColorStop(isMobile ? 0.55 : 0.4, `rgba(${bgRgb}, ${isMobile ? 0.18 : 0.22})`);
      fade.addColorStop(1, `rgba(${bgRgb}, 0)`);
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(
        cx,
        cy,
        glowR * 0.5,
        cx,
        cy,
        Math.max(width, height) * 0.92,
      );
      vignette.addColorStop(0, `rgba(${bgRgb}, 0)`);
      vignette.addColorStop(1, `rgba(${bgRgb}, 0.5)`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      needsDraw = false;
      lastDraw = now;
    };

    const pump = (now: number) => {
      rafRef.current = 0;
      if (!tabVisible) {
        running = false;
        return;
      }

      const frozen = pausedRef.current;
      const minDelta = isMobile ? 1000 / 30 : 1000 / 60;
      const due = now - lastDraw >= minDelta;

      if (!frozen || needsDraw) {
        if (due || needsDraw || !lastDraw) render(now);
        else lastFrame = now;
      } else {
        lastFrame = now;
      }

      if (!frozen) {
        running = true;
        rafRef.current = requestAnimationFrame(pump);
      } else {
        running = false;
      }
    };

    const ensureRunning = () => {
      if (!tabVisible) return;
      if (running) return;
      running = true;
      lastFrame = performance.now();
      rafRef.current = requestAnimationFrame(pump);
    };

    kickRef.current = ensureRunning;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
      ensureRunning();
    };

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
      needsDraw = true;
      if (pausedRef.current) ensureRunning();
    };
    const onVisibility = () => {
      tabVisible = document.visibilityState === 'visible';
      if (tabVisible) {
        lastFrame = performance.now();
        needsDraw = true;
        ensureRunning();
      } else if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        running = false;
      }
    };

    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      needsDraw = true;
      ensureRunning();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    onScroll();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      kickRef.current = null;
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
