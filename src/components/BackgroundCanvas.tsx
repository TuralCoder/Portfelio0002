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
  isDark: boolean;
}

interface Point {
  sx: number;
  sy: number;
}

const NEAR = 0.14;
const FAR = 8;
const FOCAL = 1.12;
const RING_RX = 2.15;
const RING_RY = 1.22;

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  const bgRgb = get('--color-canvas-bg-rgb', '246, 247, 241');
  const parts = bgRgb.split(',').map((n) => Number.parseFloat(n.trim()));
  const [r, g, b] = parts.length === 3 ? parts : [246, 247, 241];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return {
    bg: get('--color-canvas-bg', '#f6f7f1'),
    bgRgb,
    accentRgb: get('--color-accent-rgb', '63, 122, 14'),
    lineRgb: get('--color-line-rgb', '12, 14, 12'),
    isDark: lum < 0.45,
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
      const radius = Math.sqrt(Math.random()) * 1.95 + 0.18;
      s.x = Math.cos(angle) * radius;
      s.y = Math.sin(angle) * radius * 0.58;
      s.z = fresh ? rand(NEAR, FAR) : FAR;
      s.speed = rand(0.55, 1.35);
      s.size = rand(0.5, 1.85);
    };

    const spawnStreak = (k: Streak) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = rand(0.4, 1.75);
      k.x = Math.cos(angle) * radius;
      k.y = Math.sin(angle) * radius * 0.58;
      k.z = FAR;
      k.length = rand(1.0, 2.6);
      k.speed = rand(2.8, 4.8);
      k.life = 1;
    };

    const spawnShard = (d: Shard, fresh: boolean) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = rand(0.75, 1.95);
      d.x = Math.cos(angle) * radius;
      d.y = Math.sin(angle) * radius * 0.52;
      d.z = fresh ? rand(NEAR + 0.7, FAR) : FAR;
      d.vx = rand(-0.06, 0.06);
      d.vy = rand(-0.05, 0.05);
      d.speed = rand(0.6, 1.15);
      d.size = rand(0.09, 0.2);
      d.spin = rand(0, Math.PI * 2);
      d.spinSpeed = rand(-1.4, 1.4);
    };

    const buildScene = () => {
      const starCount = isMobile ? 90 : 240;
      stars = Array.from({ length: starCount }, () => {
        const s: Star = { x: 0, y: 0, z: 0, speed: 0, size: 0 };
        spawnStar(s, true);
        return s;
      });
      streaks = Array.from({ length: isMobile ? 5 : 11 }, () => {
        const k: Streak = { x: 0, y: 0, z: 0, length: 0, speed: 0, life: 0 };
        spawnStreak(k);
        k.z = rand(NEAR, FAR);
        return k;
      });
      shards = Array.from({ length: isMobile ? 5 : 12 }, () => {
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
      const depth = Math.max(z, 0.05);
      const k = f / depth;
      return { sx: cx + rx * k, sy: cy + ry * k };
    };

    const ringPoints = (
      z: number,
      twist: number,
      cx: number,
      cy: number,
      f: number,
      rot: number,
      sides: number,
    ): Point[] => {
      const pts: Point[] = [];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + twist;
        pts.push(project(Math.cos(a) * RING_RX, Math.sin(a) * RING_RY, z, cx, cy, f, rot));
      }
      return pts;
    };

    const strokeLoop = (pts: Point[]) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
      ctx.closePath();
      ctx.stroke();
    };

    const drawShard = (
      d: Shard,
      cx: number,
      cy: number,
      f: number,
      rot: number,
      accentRgb: string,
      lineRgb: string,
      isDark: boolean,
    ) => {
      const depth = 1 - (d.z - NEAR) / (FAR - NEAR);
      const alpha = (isDark ? 0.12 : 0.16) + depth * 0.4;
      const h = d.size;
      const cos = Math.cos(d.spin + rot * 0.45);
      const sin = Math.sin(d.spin + rot * 0.45);
      const verts = [
        [h, 0, 0],
        [-h * 0.5, h * 0.72, 0],
        [-h * 0.5, -h * 0.72, 0],
        [0, 0, h],
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
      ctx.fillStyle = `rgba(${accentRgb}, ${alpha * 0.12})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
      ctx.lineWidth = 1 + depth * 0.9;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(verts[0].sx, verts[0].sy);
      ctx.lineTo(verts[3].sx, verts[3].sy);
      ctx.lineTo(verts[1].sx, verts[1].sy);
      ctx.moveTo(verts[3].sx, verts[3].sy);
      ctx.lineTo(verts[2].sx, verts[2].sy);
      ctx.strokeStyle = `rgba(${lineRgb}, ${alpha * 0.65})`;
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

      const { bg, bgRgb, accentRgb, lineRgb, isDark } = palette;
      const f = Math.min(width, height) * FOCAL;
      const sides = isMobile ? 28 : 40;

      const swayX = frozen ? 0 : Math.sin(time * 0.23) * 0.05;
      const swayY = frozen ? 0 : Math.cos(time * 0.18) * 0.032;
      const baseCx = isMobile ? width * 0.5 : width * 0.68;
      const baseCy = isMobile ? height * 0.4 : height * 0.48;
      const cx = baseCx + (pointer.x + swayX) * width * 0.05;
      const cy = baseCy + (pointer.y + swayY) * height * 0.045 + scrollNorm * height * 0.06;
      const rot = pointer.x * 0.09 + scrollNorm * 0.48 + (frozen ? 0 : time * 0.07);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const ringCount = isMobile ? 8 : 14;
      const ringSpacing = (FAR - NEAR) / ringCount;
      const ringOffset = frozen ? 0 : (time * 1.05) % ringSpacing;
      const rings: { z: number; depth: number; pts: Point[] }[] = [];

      for (let i = 0; i < ringCount; i++) {
        let z = NEAR + i * ringSpacing + (ringSpacing - ringOffset);
        if (z > FAR) z -= FAR - NEAR;
        const depth = 1 - (z - NEAR) / (FAR - NEAR);
        rings.push({
          z,
          depth,
          pts: ringPoints(z, i * 0.045 + rot * 0.15, cx, cy, f, rot, sides),
        });
      }
      rings.sort((a, b) => b.z - a.z);

      if (!isMobile) {
        for (let i = 0; i < rings.length - 1; i++) {
          const a = rings[i];
          const b = rings[i + 1];
          const step = 2;
          for (let s = 0; s < sides; s += step) {
            const a0 = a.pts[s];
            const a1 = a.pts[(s + step) % sides];
            const b1 = b.pts[(s + step) % sides];
            const b0 = b.pts[s];
            const wall = (isDark ? 0.035 : 0.045) * ((a.depth + b.depth) * 0.5);
            ctx.beginPath();
            ctx.moveTo(a0.sx, a0.sy);
            ctx.lineTo(a1.sx, a1.sy);
            ctx.lineTo(b1.sx, b1.sy);
            ctx.lineTo(b0.sx, b0.sy);
            ctx.closePath();
            ctx.fillStyle = `rgba(${accentRgb}, ${wall})`;
            ctx.fill();
          }
        }
      }

      const ribRgb = isDark ? lineRgb : lineRgb;
      for (let s = 0; s < 12; s++) {
        const a = (s / 12) * Math.PI * 2;
        const p0 = project(Math.cos(a) * RING_RX, Math.sin(a) * RING_RY, NEAR, cx, cy, f, rot);
        const p1 = project(Math.cos(a) * RING_RX, Math.sin(a) * RING_RY, FAR, cx, cy, f, rot);
        const grad = ctx.createLinearGradient(p0.sx, p0.sy, p1.sx, p1.sy);
        grad.addColorStop(0, `rgba(${ribRgb}, 0)`);
        grad.addColorStop(0.28, `rgba(${ribRgb}, ${isDark ? 0.2 : 0.22})`);
        grad.addColorStop(1, `rgba(${ribRgb}, 0)`);
        ctx.beginPath();
        ctx.moveTo(p0.sx, p0.sy);
        ctx.lineTo(p1.sx, p1.sy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }

      for (const ring of rings) {
        const alpha = (isDark ? 0.1 : 0.14) + ring.depth * (isDark ? 0.42 : 0.36);
        ctx.lineWidth = 1.05 + ring.depth * 1.85;
        ctx.strokeStyle = `rgba(${isDark ? accentRgb : lineRgb}, ${alpha})`;
        strokeLoop(ring.pts);
        if (ring.depth > 0.35) {
          ctx.lineWidth = 0.7;
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha * (isDark ? 0.55 : 0.4)})`;
          strokeLoop(ring.pts);
        }
      }

      if (!isMobile) {
        const floorY = RING_RY + 0.08;
        const gridSpan = 3.5;
        const gridStep = 0.36;
        const gridShift = frozen ? 0 : (time * 1.05) % gridStep;
        ctx.strokeStyle = `rgba(${lineRgb}, ${isDark ? 0.08 : 0.09})`;
        ctx.lineWidth = 1;
        for (let gz = NEAR + 0.3; gz < FAR; gz += gridStep) {
          const z = gz + gridStep - gridShift;
          if (z >= FAR) continue;
          const a = project(-gridSpan, floorY, z, cx, cy, f, rot);
          const b = project(gridSpan, floorY, z, cx, cy, f, rot);
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      if (isDark) ctx.globalCompositeOperation = 'lighter';

      for (const d of shards) {
        if (!frozen) {
          d.z -= d.speed * dt * (1 + scrollNorm * 0.4);
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.spin += d.spinSpeed * dt;
          if (d.z < NEAR) spawnShard(d, false);
        }
        drawShard(d, cx, cy, f, rot, accentRgb, lineRgb, isDark);
      }

      for (const s of stars) {
        const prevZ = s.z;
        if (!frozen) {
          s.z -= s.speed * dt * (1.25 + scrollNorm * 0.75);
          if (s.z < NEAR) spawnStar(s, false);
        }
        const depth = 1 - (s.z - NEAR) / (FAR - NEAR);
        const head = project(s.x, s.y, s.z, cx, cy, f, rot);
        if (head.sx < -28 || head.sx > width + 28 || head.sy < -28 || head.sy > height + 28) continue;

        const alpha = (isDark ? 0.18 : 0.2) + depth * 0.72;
        const size = s.size * (0.32 + depth * 1.7);

        if (!frozen && prevZ > s.z) {
          const tailZ = Math.min(prevZ + 0.2 + depth * 0.28, FAR);
          const tail = project(s.x, s.y, tailZ, cx, cy, f, rot);
          ctx.beginPath();
          ctx.moveTo(tail.sx, tail.sy);
          ctx.lineTo(head.sx, head.sy);
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha * 0.55})`;
          ctx.lineWidth = Math.max(0.7, size * 0.7);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(head.sx, head.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`;
        ctx.fill();
      }

      for (const k of streaks) {
        if (!frozen) {
          k.z -= k.speed * dt;
          k.life -= dt * 0.3;
          if (k.z < NEAR || k.life <= 0) spawnStreak(k);
        }
        const zTail = Math.min(k.z + k.length, FAR);
        if (zTail <= k.z) continue;
        const head = project(k.x, k.y, k.z, cx, cy, f, rot);
        const tail = project(k.x, k.y, zTail, cx, cy, f, rot);
        const depth = 1 - (k.z - NEAR) / (FAR - NEAR);
        const grad = ctx.createLinearGradient(tail.sx, tail.sy, head.sx, head.sy);
        grad.addColorStop(0, `rgba(${accentRgb}, 0)`);
        grad.addColorStop(1, `rgba(${accentRgb}, ${0.32 + depth * 0.5})`);
        ctx.beginPath();
        ctx.moveTo(tail.sx, tail.sy);
        ctx.lineTo(head.sx, head.sy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2 + depth * 2.1;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1;

      const glowR = Math.min(width, height) * (isDark ? 0.38 : 0.3);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${accentRgb}, ${isDark ? 0.2 : 0.1})`);
      glow.addColorStop(0.35, `rgba(${accentRgb}, ${isDark ? 0.07 : 0.04})`);
      glow.addColorStop(1, `rgba(${accentRgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const fade = ctx.createLinearGradient(0, 0, width, 0);
      fade.addColorStop(0, `rgba(${bgRgb}, ${isMobile ? 0.38 : 0.48})`);
      fade.addColorStop(isMobile ? 0.5 : 0.32, `rgba(${bgRgb}, ${isMobile ? 0.14 : 0.14})`);
      fade.addColorStop(1, `rgba(${bgRgb}, 0)`);
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(cx, cy, glowR * 0.45, cx, cy, Math.max(width, height) * 0.95);
      vignette.addColorStop(0, `rgba(${bgRgb}, 0)`);
      vignette.addColorStop(1, `rgba(${bgRgb}, ${isDark ? 0.46 : 0.4})`);
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
