// ============================================================
//  TSP.MMIII — Gerador de feed de notícias
//  Busca RSS (Google Notícias + fontes fixas), pontua a
//  relevância por tema e grava docs/feed.json.
// ============================================================
import Parser from 'rss-parser';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { topics, extraFeeds, settings } from '../config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs');
const OUT_FILE = path.join(OUT_DIR, 'feed.json');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

// ---------- utilidades de texto ----------
const stripAccents = (s = '') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const norm = (s = '') => stripAccents(s).toLowerCase();

function splitTitleSource(raw) {
  const m = String(raw || '').trim().match(/^(.*?)\s+-\s+([^-]+)$/);
  if (m) return { title: m[1].trim(), source: m[2].trim() };
  return { title: String(raw || '').trim(), source: null };
}

function titleKey(title) {
  return norm(title).replace(/[^a-z0-9]+/g, '');
}

// Palavras irrelevantes para comparar títulos (deduplicação por similaridade).
const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
  'em', 'no', 'na', 'nos', 'nas', 'e', 'ou', 'que', 'para', 'por', 'com', 'se',
  'nao', 'ao', 'aos', 'mais', 'menos', 'sobre', 'entre', 'apos', 'durante',
  'como', 'sem', 'mas', 'foi', 'sera', 'vai', 'vem', 'tem', 'ter', 'sua', 'seu',
  'sao', 'ele', 'ela', 'eles', 'elas', 'pela', 'pelo', 'esta', 'esse', 'essa',
  'este', 'ate', 'ja', 'quando', 'onde', 'qual',
]);

function significantTokens(title) {
  return new Set(
    norm(title).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccard(a, b) {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function mergeInto(target, incoming) {
  for (const t of incoming.topics) if (!target.topics.includes(t)) target.topics.push(t);
  for (const [t, s] of Object.entries(incoming._scores)) {
    target._scores[t] = Math.max(target._scores[t] || 0, s);
  }
  target.score = Math.max(target.score, incoming.score);
  if (!target.image && incoming.image) target.image = incoming.image;
  if (!target.summary && incoming.summary) target.summary = incoming.summary;
  return target;
}

// ---------- download ----------
async function fetchXml(url, attempts = 3) {
  let lastErr;
  for (let a = 0; a < attempts; a++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), settings.requestTimeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': settings.userAgent,
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      if (a < attempts - 1) await new Promise((r) => setTimeout(r, 600 * (a + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

function extractImage(item) {
  const html = item.contentEncoded || item.content || item.description || '';
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (m) return m[1];
  const pick = (field) => {
    if (!field) return null;
    const f = Array.isArray(field) ? field[0] : field;
    if (!f) return null;
    return (f.$ && (f.$.url || f.$.href)) || f.url || null;
  };
  return pick(item.mediaContent) || pick(item.mediaThumbnail) || (item.enclosure && item.enclosure.url) || null;
}

function sourceName(item) {
  if (item.source) {
    if (typeof item.source === 'string') return item.source;
    if (item.source.title) return item.source.title;
    if (item.source.url) return item.source.url;
  }
  return item.creator || null;
}

async function fetchFeed(feed) {
  const xml = await fetchXml(feed.url);
  const parsed = await parser.parseString(xml);
  const isGoogle = /news\.google\.com/.test(feed.url);

  return (parsed.items || [])
    .map((raw) => {
      const ts = isGoogle
        ? splitTitleSource(raw.title)
        : { title: String(raw.title || '').trim(), source: null };
      const snippet = String(raw.contentSnippet || '').replace(/\s+/g, ' ').trim();
      return {
        title: ts.title,
        link: raw.link || raw.guid || null,
        source: ts.source || sourceName(raw) || feed.source || null,
        publishedAt: raw.isoDate || raw.pubDate || null,
        summary: snippet ? snippet.slice(0, 240) : null,
        image: extractImage(raw),
        baseTopics: feed.topics || [],
        titleText: norm(ts.title),
        bodyText: norm(snippet),
      };
    })
    .filter((it) => it.link && it.title);
}

// ---------- relevância ----------
function scoreForTopic(item, topic, base = 0) {
  let s = base;
  for (const kw of topic.keywords) {
    const w = kw.includes(' ') ? 2 : 1;
    // Título é o sinal mais forte; o corpo da notícia pesa menos.
    if (item.titleText.includes(kw)) s += w;
    else if (item.bodyText.includes(kw)) s += w * 0.4;
  }
  return s;
}

function assignTopics(item) {
  const matches = [];
  for (const topic of topics) {
    const base = item.baseTopics.includes(topic.id) ? 3 : 0;
    const hits = scoreForTopic(item, topic, 0); // só palavras-chave
    const score = base + hits;
    // Sem viés de fonte, exige pelo menos 2 pontos (1 frase OU 2 palavras) para reduzir ruído.
    if (base > 0 || hits >= 2) matches.push({ id: topic.id, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 3); // no máx. 3 temas por item
}

// ---------- limitação de concorrência ----------
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (e) {
        results[idx] = [];
        console.error(`  ⚠️  Falha em ${items[idx].url}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results.flat();
}

// ---------- principal ----------
async function main() {
  console.log('🔎 Buscando feeds de notícias...');

  // Monta a lista de feeds: Google Notícias (por tema/query) + fontes fixas.
  const googleFeeds = [];
  for (const topic of topics) {
    for (const q of topic.queries) {
      googleFeeds.push({
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`,
        source: 'Google Notícias',
        topics: [topic.id],
      });
    }
  }
  const allFeeds = [...googleFeeds, ...extraFeeds];
  console.log(`   ${allFeeds.length} feeds na fila.`);

  const fetched = await mapLimit(allFeeds, settings.concurrency, fetchFeed);
  console.log(`   ${fetched.length} notícias baixadas.`);

  // Pontua e atribui temas.
  const now = Date.now();
  const maxAgeMs = settings.maxAgeHours * 60 * 60 * 1000;

  const scored = fetched
    .map((item) => {
      const topicMatches = assignTopics(item);
      if (!topicMatches.length) return null;
      const ts = item.publishedAt ? Date.parse(item.publishedAt) : NaN;
      if (!Number.isNaN(ts) && now - ts > maxAgeMs) return null;
      return {
        title: item.title,
        link: item.link,
        source: item.source,
        publishedAt: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
        summary: item.summary,
        image: item.image,
        topics: topicMatches.map((t) => t.id),
        score: Math.max(...topicMatches.map((t) => t.score)),
        _scores: Object.fromEntries(topicMatches.map((t) => [t.id, t.score])),
      };
    })
    .filter(Boolean);

  // Deduplicação: 1º por título normalizado, 2º por similaridade (Jaccard) entre títulos do mesmo tema.
  const byKey = new Map();
  for (const item of scored) {
    const key = titleKey(item.title);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev) byKey.set(key, item);
    else mergeInto(prev, item);
  }

  const unique = [];
  for (const item of byKey.values()) {
    const toks = significantTokens(item.title);
    if (!toks.size) { unique.push(item); continue; }
    const dup = unique.find((prev) => {
      if (!item.topics.some((t) => prev.topics.includes(t))) return false;
      return jaccard(toks, significantTokens(prev.title)) >= 0.45;
    });
    if (dup) mergeInto(dup, item);
    else unique.push(item);
  }
  unique.sort((a, b) => b.score - a.score || (b.publishedAt || '').localeCompare(a.publishedAt || ''));

  // Destaques (melhores no geral) + agrupamento por tema.
  const highlights = unique.slice(0, settings.maxHighlights);
  const byTopic = {};
  for (const topic of topics) {
    byTopic[topic.id] = unique
      .filter((it) => it.topics.includes(topic.id))
      .sort((a, b) => (b._scores[topic.id] || 0) - (a._scores[topic.id] || 0))
      .slice(0, settings.maxPerTopic);
  }

  const items = unique.slice(0, settings.maxTotal).map(({ _scores, ...rest }) => rest);
  const byTopicClean = {};
  for (const topic of topics) {
    byTopicClean[topic.id] = byTopic[topic.id].map(({ _scores, ...rest }) => rest);
  }

  const feed = {
    generatedAt: new Date().toISOString(),
    site: 'TSP.MMIII — tspmmiii.com',
    count: items.length,
    topics: topics.map((t) => ({ id: t.id, label: t.label })),
    highlights: highlights.map(({ _scores, ...rest }) => rest),
    items,
    byTopic: byTopicClean,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(feed, null, 2) + '\n');

  console.log(`\n✅ Feed gerado: ${feed.count} notícias em ${OUT_FILE}`);
  for (const topic of topics) {
    console.log(`   · ${topic.label}: ${byTopic[topic.id].length}`);
  }
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
