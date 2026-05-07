interface IndexablePage {
  url?: string | undefined;
  filePath?: string | undefined;
  title: string | null;
  rawContent?: string | undefined;
}

export interface PageChunk {
  source: string;
  anchor: string | null;
  headingPath: string | null;
  content: string;
  tokenCount: number;
}

const APPROX_CHARS_PER_TOKEN = 4;
const MAX_TOKENS_PER_CHUNK = 700;
const MAX_CHARS = MAX_TOKENS_PER_CHUNK * APPROX_CHARS_PER_TOKEN;

const HEADING_REGEX = /^(#{1,6})\s+(.+?)\s*$/;

function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function splitOversized(content: string): string[] {
  if (content.length <= MAX_CHARS) return [content];
  const parts: string[] = [];
  const paragraphs = content.split(/\n\n+/);
  let buf = '';
  for (const para of paragraphs) {
    if (buf.length + para.length + 2 > MAX_CHARS) {
      if (buf) parts.push(buf);
      if (para.length > MAX_CHARS) {
        for (let i = 0; i < para.length; i += MAX_CHARS) {
          parts.push(para.slice(i, i + MAX_CHARS));
        }
        buf = '';
      } else {
        buf = para;
      }
    } else {
      buf = buf ? `${buf}\n\n${para}` : para;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

export function chunkPage(page: IndexablePage): PageChunk[] {
  const source = page.url ?? page.filePath ?? '';
  const content = page.rawContent ?? '';
  if (!content.trim()) return [];

  const lines = content.split('\n');
  const sections: { headingPath: string[]; anchor: string | null; body: string[] }[] = [];
  const stack: { level: number; text: string }[] = [];
  let currentBody: string[] = [];
  let currentAnchor: string | null = null;

  const flush = (): void => {
    const body = currentBody.join('\n').trim();
    if (!body) return;
    sections.push({
      headingPath: stack.map((h) => h.text),
      anchor: currentAnchor,
      body: [body],
    });
  };

  for (const line of lines) {
    const match = line.match(HEADING_REGEX);
    if (match) {
      flush();
      currentBody = [];
      const level = match[1].length;
      const text = match[2].trim();
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack.push({ level, text });
      currentAnchor = slugify(text);
      currentBody.push(line);
    } else {
      currentBody.push(line);
    }
  }
  flush();

  const chunks: PageChunk[] = [];
  for (const sec of sections) {
    const headingPath = sec.headingPath.length > 0 ? sec.headingPath.join(' > ') : null;
    for (const part of splitOversized(sec.body.join('\n\n'))) {
      const trimmed = part.trim();
      if (trimmed.length < 40) continue;
      chunks.push({
        source,
        anchor: sec.anchor,
        headingPath,
        content: trimmed,
        tokenCount: Math.ceil(trimmed.length / APPROX_CHARS_PER_TOKEN),
      });
    }
  }

  if (chunks.length === 0 && content.trim().length >= 40) {
    for (const part of splitOversized(content.trim())) {
      chunks.push({
        source,
        anchor: null,
        headingPath: page.title,
        content: part,
        tokenCount: Math.ceil(part.length / APPROX_CHARS_PER_TOKEN),
      });
    }
  }

  return chunks;
}
