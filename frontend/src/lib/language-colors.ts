/**
 * 프로그래밍 언어 색 — GitHub 가 언어마다 쓰는 색을 따랐다. 개발자는 이름을 읽기 전에 색으로 먼저 알아본다.
 * 어두운 배경에서 안 보이는 색(Lua 남색, C 짙은 회색 등)만 밝게 조정했다.
 */
const COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#8a8f98',
  'C#': '#178600',
  PHP: '#7a86b8',
  Ruby: '#cc342d',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Lua: '#6b6bff',
  HTML: '#e34c26',
  CSS: '#8b5cf6',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Zig: '#ec915c',
  Scala: '#dc322f',
  Elixir: '#8e5aa8',
  'Jupyter Notebook': '#DA5B0B',
};

/** 알려진 언어는 GitHub 색, 그 밖의 언어는 이름에서 만든 고정된 색 */
export function languageColor(language: string | null | undefined): string {
  if (!language) return '#8b949e';
  const known = COLORS[language];
  if (known) return known;
  let hash = 0;
  for (const ch of language) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${hash} 55% 58%)`;
}

/** 배경색 위에 올릴 글자 색(검정/흰색) — 밝기로 고른다. hsl() 은 중간 밝기라 흰색을 쓴다. */
export function readableOn(color: string): '#0d1117' | '#ffffff' {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return '#ffffff';
  const n = parseInt(m[1]!, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0d1117' : '#ffffff';
}
