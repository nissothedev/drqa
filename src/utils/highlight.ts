/**
 * Tiny dependency-free syntax highlighter. Produces tokens; rendering happens in <CodeBlock>.
 * Supports JSON, raw HTTP messages, cURL, SQL, Python and TypeScript – enough for DRQA's panels.
 */

export type Lang = 'json' | 'http' | 'curl' | 'sql' | 'python' | 'ts' | 'text' | 'env';

export interface Token {
  text: string;
  cls?: string;
}

const JSON_RE = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\],:])/g;

export function tokenizeJson(src: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of src.matchAll(JSON_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: src.slice(last, idx) });
    if (m[1] !== undefined) {
      if (m[2] !== undefined) {
        out.push({ text: m[1], cls: 'tok-key' });
        out.push({ text: m[2], cls: 'tok-punc' });
      } else out.push({ text: m[1], cls: 'tok-str' });
    } else if (m[3] !== undefined) out.push({ text: m[3], cls: 'tok-num' });
    else if (m[4] !== undefined) out.push({ text: m[4], cls: 'tok-bool' });
    else if (m[5] !== undefined) out.push({ text: m[5], cls: 'tok-null' });
    else if (m[6] !== undefined) out.push({ text: m[6], cls: 'tok-punc' });
    last = idx + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

function statusCls(code: number): string {
  if (code < 300) return 'tok-status-ok';
  if (code < 500 && code >= 400) return 'tok-status-warn';
  if (code >= 500) return 'tok-status-err';
  return 'tok-status-ok';
}

export function tokenizeHttp(src: string): Token[] {
  const out: Token[] = [];
  const blank = src.search(/\r?\n\r?\n/);
  const head = blank === -1 ? src : src.slice(0, blank);
  const body = blank === -1 ? '' : src.slice(blank);
  head.split('\n').forEach((line, i) => {
    if (i > 0) out.push({ text: '\n' });
    const req = line.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)(\s+)(\S+)(.*)$/);
    const res = line.match(/^(HTTP\/[\d.]+)(\s+)(\d{3})(.*)$/);
    const hdr = line.match(/^([A-Za-z0-9-]+)(:)(.*)$/);
    if (req) {
      out.push({ text: req[1], cls: 'tok-method' }, { text: req[2] }, { text: req[3], cls: 'tok-url' }, { text: req[4], cls: 'tok-comment' });
    } else if (res) {
      out.push({ text: res[1], cls: 'tok-comment' }, { text: res[2] }, { text: res[3], cls: statusCls(Number(res[3])) }, { text: res[4], cls: statusCls(Number(res[3])) });
    } else if (hdr) {
      out.push({ text: hdr[1], cls: 'tok-header' }, { text: hdr[2], cls: 'tok-punc' }, { text: hdr[3], cls: 'tok-str' });
    } else out.push({ text: line });
  });
  if (body) out.push(...tokenizeJson(body));
  return out;
}

export function tokenizeCurl(src: string): Token[] {
  const re = /(^curl\b)|(\s-{1,2}[A-Za-z-]+)|('(?:[^'\\]|\\.)*')|(\\\n)/gm;
  const out: Token[] = [];
  let last = 0;
  for (const m of src.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: src.slice(last, idx) });
    if (m[1]) out.push({ text: m[1], cls: 'tok-kw' });
    else if (m[2]) out.push({ text: m[2], cls: 'tok-header' });
    else if (m[3]) out.push({ text: m[3], cls: 'tok-str' });
    else if (m[4]) out.push({ text: m[4], cls: 'tok-punc' });
    last = idx + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

const KEYWORDS: Record<'sql' | 'python' | 'ts', string[]> = {
  sql: ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'AS', 'DISTINCT', 'LIMIT', 'DESC', 'ASC', 'LIKE', 'BETWEEN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'COALESCE', 'UNION', 'ALL', 'WITH'],
  python: ['def', 'class', 'import', 'from', 'return', 'assert', 'with', 'as', 'if', 'else', 'elif', 'for', 'in', 'not', 'and', 'or', 'None', 'True', 'False', 'self', 'yield', 'lambda', 'pass', 'raise', 'try', 'except'],
  ts: ['import', 'from', 'export', 'const', 'let', 'await', 'async', 'function', 'return', 'class', 'new', 'this', 'readonly', 'constructor', 'private', 'public', 'type', 'interface', 'extends', 'if', 'else', 'for', 'of', 'true', 'false', 'null', 'undefined', 'test', 'expect'],
};

export function tokenizeCode(src: string, lang: 'sql' | 'python' | 'ts'): Token[] {
  const commentRe = lang === 'sql' ? '--[^\\n]*' : lang === 'python' ? '#[^\\n]*' : '\\/\\/[^\\n]*';
  const strRe = lang === 'ts' ? "'(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\"|`(?:[^`\\\\]|\\\\.)*`" : "'(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\"";
  const re = new RegExp(`(${commentRe})|(${strRe})|(\\b\\d+(?:\\.\\d+)?\\b)|(@[A-Za-z_.]+)|\\b([A-Za-z_][A-Za-z0-9_]*)\\b`, 'g');
  const kw = new Set(KEYWORDS[lang]);
  const upper = lang === 'sql';
  const out: Token[] = [];
  let last = 0;
  for (const m of src.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: src.slice(last, idx) });
    if (m[1]) out.push({ text: m[1], cls: 'tok-comment' });
    else if (m[2]) out.push({ text: m[2], cls: 'tok-str' });
    else if (m[3]) out.push({ text: m[3], cls: 'tok-num' });
    else if (m[4]) out.push({ text: m[4], cls: 'tok-bool' });
    else if (m[5]) {
      const w = m[5];
      out.push({ text: w, cls: kw.has(upper ? w.toUpperCase() : w) ? 'tok-kw' : undefined });
    }
    last = idx + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

export function tokenizeEnv(src: string): Token[] {
  const out: Token[] = [];
  src.split('\n').forEach((line, i) => {
    if (i > 0) out.push({ text: '\n' });
    const m = line.match(/^(\s*[A-Za-z0-9_.-]+)(\s*=\s*)(.*)$/);
    if (line.trim().startsWith('#')) out.push({ text: line, cls: 'tok-comment' });
    else if (m) out.push({ text: m[1], cls: 'tok-key' }, { text: m[2], cls: 'tok-punc' }, { text: m[3], cls: 'tok-str' });
    else out.push({ text: line });
  });
  return out;
}

export function tokenize(src: string, lang: Lang): Token[] {
  switch (lang) {
    case 'json':
      return tokenizeJson(src);
    case 'http':
      return tokenizeHttp(src);
    case 'curl':
      return tokenizeCurl(src);
    case 'sql':
    case 'python':
    case 'ts':
      return tokenizeCode(src, lang);
    case 'env':
      return tokenizeEnv(src);
    default:
      return [{ text: src }];
  }
}
