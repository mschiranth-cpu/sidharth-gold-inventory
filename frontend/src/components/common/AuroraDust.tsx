import { useEffect, useRef } from 'react';

/**
 * AuroraDust — luxe animated background.
 * Layered slow-drifting gold "aurora" orbs + twinkling gold dust motes.
 * Designed for the jewellery hero: warm, calm, organic.
 */
type Props = {
  className?: string;
  /** number of dust motes per 100k px² (default 9) */
  dustDensity?: number;
};

type Orb = {
  baseX: number; baseY: number;
  ax: number; ay: number;          // amplitude
  sx: number; sy: number;          // speed
  px: number; py: number;          // phase
  r: number;                       // radius
  hue: [number, number, number];   // rgb
  alpha: number;
};

type Mote = {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  twPhase: number;                 // twinkle phase
  twSpeed: number;                 // twinkle speed
  baseAlpha: number;
};

export default function AuroraDust({ className, dustDensity = 9 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0, height = 0;
    let orbs: Orb[] = [];
    let motes: Mote[] = [];
    let raf = 0;
    let running = true;
    let visible = true;
    const start = performance.now();

    const champagne: [number, number, number] = [245, 225, 181];   // champagne-300
    const goldDeep: [number, number, number] = [196, 154, 79];     // champagne-700
    const ember:    [number, number, number] = [220, 170, 90];     // warm gold

    const seedOrbs = () => {
      // 3 large slow orbs anchored in different quadrants
      orbs = [
        {
          baseX: width * 0.18, baseY: height * 0.30,
          ax: width * 0.10, ay: height * 0.12,
          sx: 0.00012, sy: 0.00009, px: 0, py: 1.3,
          r: Math.max(width, height) * 0.55,
          hue: goldDeep, alpha: 0.16,
        },
        {
          baseX: width * 0.82, baseY: height * 0.70,
          ax: width * 0.12, ay: height * 0.10,
          sx: 0.00010, sy: 0.00013, px: 2.1, py: 0.4,
          r: Math.max(width, height) * 0.60,
          hue: ember, alpha: 0.12,
        },
        {
          baseX: width * 0.50, baseY: height * 0.55,
          ax: width * 0.08, ay: height * 0.07,
          sx: 0.00008, sy: 0.00011, px: 4.0, py: 2.6,
          r: Math.max(width, height) * 0.45,
          hue: champagne, alpha: 0.07,
        },
      ];
    };

    const seedMotes = () => {
      const count = Math.max(40, Math.round((width * height) / 100000 * dustDensity));
      motes = new Array(count).fill(0).map(() => {
        const r = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (reduce ? 0.03 : 0.08),
          vy: (Math.random() - 0.5) * (reduce ? 0.02 : 0.05) - (reduce ? 0.01 : 0.04), // slight upward drift
          r: 0.5 + r * 1.6,
          twPhase: Math.random() * Math.PI * 2,
          twSpeed: 0.0008 + Math.random() * 0.0018,
          baseAlpha: 0.35 + Math.random() * 0.5,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedOrbs();
      seedMotes();
    };

    const draw = (now: number) => {
      if (!running) return;
      const t = now - start;

      // clear (transparent so the parent onyx shows through)
      ctx.clearRect(0, 0, width, height);

      // additive light blending for the orbs — gives that sun-through-glass glow
      ctx.globalCompositeOperation = 'lighter';

      for (const o of orbs) {
        const x = o.baseX + Math.sin(t * o.sx + o.px) * o.ax;
        const y = o.baseY + Math.cos(t * o.sy + o.py) * o.ay;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, o.r);
        const [r, g, b] = o.hue;
        grad.addColorStop(0, `rgba(${r},${g},${b},${o.alpha})`);
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${o.alpha * 0.35})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // dust motes — drawn on top, normal blending for crisp twinkle
      ctx.globalCompositeOperation = 'source-over';
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        // wrap
        if (m.x < -4) m.x = width + 4;
        else if (m.x > width + 4) m.x = -4;
        if (m.y < -4) m.y = height + 4;
        else if (m.y > height + 4) m.y = -4;

        const tw = (Math.sin(t * m.twSpeed + m.twPhase) + 1) * 0.5; // 0..1
        const a = m.baseAlpha * (0.35 + tw * 0.65);

        // soft halo
        const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        halo.addColorStop(0, `rgba(245,225,181,${a * 0.55})`);
        halo.addColorStop(1, 'rgba(245,225,181,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = `rgba(252,240,210,${Math.min(1, a + 0.15)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const loop = () => {
      if (!running || !visible) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    resize();
    loop();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) loop();
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);

    const onVis = () => {
      running = !document.hidden;
      if (running && visible) loop();
      else cancelAnimationFrame(raf);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [dustDensity]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
