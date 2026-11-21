'use client';

import { useEffect, useRef } from 'react';

interface HeroGlobeProps {
  /** 지금 뜨는 프로젝트 이름들 — 지구본 위의 빛나는 점에 이름표로 붙는다 */
  labels: string[];
  className?: string;
}

interface Vec {
  x: number;
  y: number;
  z: number;
}

const POINTS = 150;
const NEIGHBORS = 2;
const SPARKLES = 12;

/**
 * 3D 지구본 — 점(프로젝트)과 선(의존·포크 관계)으로 이뤄진 구가 천천히 돌고, 마우스를 따라 기운다.
 * 빛나는 초록 점에는 실제로 지금 뜨는 프로젝트 이름이 붙고, 노란 별 조각들이 궤도를 돈다.
 * 외부 라이브러리 없이 캔버스 2D 에 직접 투영한다. 화면 밖이거나 탭이 숨겨지면 멈추고,
 * 움직임 줄이기 설정이면 한 장면만 그린다. 순수 장식이라 스크린리더에서는 숨긴다.
 */
export function HeroGlobe({ labels, className }: HeroGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsKey = labels.join('\u0000');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 피보나치 구: 점을 구 위에 고르게 흩뿌린다
    const points: Vec[] = Array.from({ length: POINTS }, (_, i) => {
      const y = 1 - (i / (POINTS - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      return { x: Math.cos(phi) * r, y, z: Math.sin(phi) * r };
    });

    // 가까운 점끼리 잇는다 (점마다 가장 가까운 NEIGHBORS 개)
    const edgeSet = new Set<string>();
    const edges: [number, number][] = [];
    points.forEach((p, i) => {
      points
        .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2 }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, NEIGHBORS)
        .forEach(({ j }) => {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push([i, j]);
          }
        });
    });

    // 이름표가 붙는 "뜨는" 점: 구 전체에 고르게 퍼지게 간격을 두고 고른다
    const hot = labels.slice(0, 6).map((text, k) => ({ index: Math.floor(((k + 0.5) * POINTS) / Math.max(1, Math.min(6, labels.length))), text }));
    const hotIndex = new Map(hot.map((h) => [h.index, h.text]));

    // 궤도를 도는 별 조각
    const sparkles = Array.from({ length: SPARKLES }, (_, i) => ({
      radius: 1.28 + (i % 4) * 0.1,
      speed: 0.0004 + (i % 5) * 0.00012,
      phase: (i / SPARKLES) * Math.PI * 2,
      incl: ((i % 3) - 1) * 0.5 + 0.3,
      size: 1.2 + (i % 3) * 0.5,
    }));

    let width = 0;
    let height = 0;
    let rotY = 0.5;
    let tiltX = -0.38;
    let targetTilt = -0.38;
    let colors = readColors();
    let running = !reduceMotion;
    let visible = true;
    let frameId = 0;
    let last = performance.now();

    function readColors() {
      const css = getComputedStyle(document.documentElement);
      const c = (name: string) => css.getPropertyValue(name).trim();
      return { fg: c('--foreground'), trend: c('--trend'), star: c('--signal'), bg: c('--background'), border: c('--border') };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }

    function rotate(p: Vec): Vec {
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const cx = Math.cos(tiltX);
      const sx = Math.sin(tiltX);
      return { x: x1, y: p.y * cx - z1 * sx, z: p.y * sx + z1 * cx };
    }

    function draw(now: number) {
      ctx!.clearRect(0, 0, width, height);
      const R = Math.min(width, height) * 0.34;
      const cx = width / 2;
      const cy = height / 2;
      const project = (p: Vec) => {
        const f = 3.4 / (3.4 - p.z);
        return { sx: cx + p.x * R * f, sy: cy + p.y * R * f, f, depth: (p.z + 1) / 2 };
      };

      const rotated = points.map(rotate);

      // 선
      ctx!.lineWidth = 1;
      for (const [i, j] of edges) {
        const a = rotated[i]!;
        const b = rotated[j]!;
        const depth = ((a.z + b.z) / 2 + 1) / 2;
        const pa = project(a);
        const pb = project(b);
        ctx!.strokeStyle = `hsl(${colors.fg} / ${0.05 + depth * 0.22})`;
        ctx!.beginPath();
        ctx!.moveTo(pa.sx, pa.sy);
        ctx!.lineTo(pb.sx, pb.sy);
        ctx!.stroke();
      }

      // 점 (뒤에 있는 것부터 그려서 앞쪽이 위에 오게)
      const order = rotated.map((p, i) => ({ p, i })).sort((a, b) => a.p.z - b.p.z);
      const pulse = (Math.sin(now / 520) + 1) / 2;
      const labelsToDraw: { sx: number; sy: number; text: string; depth: number }[] = [];

      for (const { p, i } of order) {
        const { sx, sy, f, depth } = project(p);
        const text = hotIndex.get(i);
        if (text) {
          // 빛나는 "뜨는" 점: 번지는 고리 + 단단한 점
          ctx!.fillStyle = `hsl(${colors.trend} / ${(0.18 + 0.2 * pulse) * (0.3 + depth)})`;
          ctx!.beginPath();
          ctx!.arc(sx, sy, (5 + pulse * 6) * f, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = `hsl(${colors.trend} / ${0.45 + depth * 0.55})`;
          ctx!.beginPath();
          ctx!.arc(sx, sy, 3.2 * f, 0, Math.PI * 2);
          ctx!.fill();
          if (p.z > -0.1) labelsToDraw.push({ sx, sy, text, depth });
        } else {
          ctx!.fillStyle = `hsl(${colors.fg} / ${0.12 + depth * 0.55})`;
          ctx!.beginPath();
          ctx!.arc(sx, sy, (0.9 + depth * 1.3) * f, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // 궤도를 도는 별 조각 (4꼭짓점 별)
      for (const s of sparkles) {
        const a = s.phase + now * s.speed * 6;
        const base: Vec = { x: Math.cos(a) * s.radius, y: Math.sin(a) * s.radius * Math.sin(s.incl), z: Math.sin(a) * s.radius * Math.cos(s.incl) };
        const p = rotate(base);
        const { sx, sy, f, depth } = project(p);
        const size = s.size * 2.4 * f;
        ctx!.fillStyle = `hsl(${colors.star} / ${0.25 + depth * 0.75})`;
        ctx!.beginPath();
        ctx!.moveTo(sx, sy - size);
        ctx!.quadraticCurveTo(sx, sy, sx + size, sy);
        ctx!.quadraticCurveTo(sx, sy, sx, sy + size);
        ctx!.quadraticCurveTo(sx, sy, sx - size, sy);
        ctx!.quadraticCurveTo(sx, sy, sx, sy - size);
        ctx!.fill();
      }

      // 이름표 (맨 위에, 앞쪽 점만)
      ctx!.font = '500 11px ui-monospace, "JetBrains Mono", Menlo, monospace';
      ctx!.textBaseline = 'middle';
      for (const l of labelsToDraw) {
        const padX = 7;
        const w = ctx!.measureText(l.text).width + padX * 2;
        const x = Math.min(l.sx + 12, width - w - 4);
        const y = l.sy - 14;
        ctx!.fillStyle = `hsl(${colors.bg} / 0.88)`;
        ctx!.strokeStyle = `hsl(${colors.trend} / ${0.35 + l.depth * 0.4})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        if (typeof ctx!.roundRect === 'function') ctx!.roundRect(x, y - 10, w, 20, 6);
        else ctx!.rect(x, y - 10, w, 20);
        ctx!.fill();
        ctx!.stroke();
        ctx!.fillStyle = `hsl(${colors.fg} / ${0.55 + l.depth * 0.45})`;
        ctx!.fillText(l.text, x + padX, y);
      }
    }

    function tick(now: number) {
      frameId = requestAnimationFrame(tick);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(now - last, 50);
      last = now;
      rotY += dt * 0.00018; // 느린 자전
      tiltX += (targetTilt - tiltX) * 0.06;
      if (Math.floor(now / 1000) % 2 === 0) colors = readColors(); // 테마가 바뀌면 색을 따라간다
      draw(now);
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      targetTilt = -0.38 + ny * 0.5;
      rotY += nx * 0.004;
    };
    const onLeave = () => {
      targetTilt = -0.38;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      colors = readColors();
      if (!running) draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    resize();
    if (running) {
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerleave', onLeave);
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
    // labels 배열의 내용이 바뀔 때만 다시 만든다 (참조가 아니라 값으로 비교)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelsKey]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
