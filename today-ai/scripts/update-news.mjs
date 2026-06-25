import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DATA = path.join(ROOT, 'src', 'data', 'daily-news.json');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data', 'daily-news.json');

const CATEGORY_IMAGES = {
  'AI 大事': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1500&q=85',
  '模型更新': 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=900&q=82',
  'AI 产品工具': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=82',
  '论文与技术': 'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&w=900&q=82',
  '商业融资': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=82',
  '政策与安全': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=82',
};

const RSS_FEEDS = [
  { source: 'The Verge', category: 'AI 大事', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { source: 'TechCrunch', category: '商业融资', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { source: 'Google AI Blog', category: '模型更新', url: 'https://blog.google/technology/ai/rss/' },
  { source: 'OpenAI News', category: 'AI 大事', url: 'https://openai.com/news/rss.xml' },
];

const SOURCE_WEIGHT = new Map([
  ['Reuters', 40], ['Associated Press', 36], ['The Verge', 34], ['Axios', 34],
  ['TechCrunch', 32], ['Bloomberg', 32], ['Financial Times', 32], ['The Wall Street Journal', 32],
  ['Business Insider', 26], ['VentureBeat', 24], ['MIT Technology Review', 28], ['arXiv', 24],
  ['OpenAI News', 36], ['Google AI Blog', 34], ['Microsoft', 30], ['NVIDIA Blog', 30],
]);

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const obj = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

function timeInShanghai(date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function decodeEntities(text = '') {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&apos;/g, "'");
}

function stripTags(text = '') {
  return decodeEntities(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pick(text, tag) {
  const match = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripTags(match[1]) : '';
}

function pickLink(item) {
  const href = item.match(/<link[^>]*href="([^"]+)"[^>]*\/>/i);
  if (href) return decodeEntities(href[1]);
  return pick(item, 'link');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanTitle(title, sourceName) {
  const normalized = title.replace(/\bAl\b/g, 'AI').replace(/\s+/g, ' ').trim();
  if (!sourceName) return normalized;
  return normalized.replace(new RegExp(`\\s+-\\s+${escapeRegExp(sourceName)}$`, 'i'), '').trim();
}

function classify(title, fallbackCategory) {
  const text = title.toLowerCase();
  if (/regulation|safety|policy|copyright|lawsuit|court|security|privacy|government|election|pentagon|risk|congress|congresswoman|defense|washington|chip war/.test(text)) return '政策与安全';
  if (/paper|research|arxiv|benchmark|training|dataset|robotics|simulation|agentic|eval|scientists/.test(text)) return '论文与技术';
  if (/model|claude|gpt|gemini|llama|mistral|qwen|deepseek|release|frontier|reasoning/.test(text)) return '模型更新';
  if (/tool|app|browser|assistant|agent|product|launch|workflow|coding|search/.test(text)) return 'AI 产品工具';
  if (/funding|raises|valuation|acquisition|ipo|startup|venture|revenue|deal|investor|earnings|stock/.test(text)) return '商业融资';
  if (/job|jobs|workforce|labor|employment|chip|compute|data center/.test(text)) return 'AI 大事';
  return fallbackCategory || 'AI 大事';
}

function primarySubject(title = '') {
  const match = title.match(/\b(OpenAI|Anthropic|Google|Microsoft|Meta|Nvidia|NVIDIA|Apple|Amazon|xAI|DeepMind|Mistral|DeepSeek|Alibaba|Tencent|ByteDance|Perplexity|Stability AI|Hugging Face|Claude|Gemini|GPT-5?|Llama|Qwen)\b/i);
  if (!match) return '';
  const canonical = {
    nvidia: 'NVIDIA',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    microsoft: 'Microsoft',
    meta: 'Meta',
    apple: 'Apple',
    amazon: 'Amazon',
    xai: 'xAI',
    deepmind: 'DeepMind',
    mistral: 'Mistral',
    deepseek: 'DeepSeek',
    alibaba: 'Alibaba',
    tencent: 'Tencent',
    bytedance: 'ByteDance',
    perplexity: 'Perplexity',
    claude: 'Claude',
    gemini: 'Gemini',
    llama: 'Llama',
    qwen: 'Qwen',
  };
  return canonical[match[1].toLowerCase()] || match[1];
}

function makeChineseTitle(sourceTitle, source, category) {
  const subject = primarySubject(sourceTitle) || source;
  const labels = {
    'AI 大事': '重要 AI 动态',
    '模型更新': '模型与能力更新',
    'AI 产品工具': 'AI 产品工具动态',
    '论文与技术': 'AI 技术研究动态',
    '商业融资': 'AI 商业与融资动态',
    '政策与安全': 'AI 政策与安全动态',
  };
  return `${subject}：${labels[category] || 'AI 动态'}`;
}

function makeSummary(story) {
  return `${story.source} 发布/报道了一条「${story.category}」相关资讯。英文原标题已保留在下方，建议点击「原文」核对完整内容和上下文。`;
}

function makeAnalysis(story) {
  const hints = {
    'AI 大事': '这类消息通常会影响 AI 行业的主线判断，适合放在今日重点里追踪后续变化。',
    '模型更新': '模型更新会直接影响工具选择、成本结构和应用能力边界，值得观察真实任务表现。',
    'AI 产品工具': '产品工具新闻的关键不只是功能发布，而是它是否会改变日常工作流和用户入口。',
    '论文与技术': '技术论文适合看趋势，不必只看单点指标，更要关注它能否迁移到真实产品。',
    '商业融资': '融资与交易能反映资本正在押注哪些 AI 场景，也能提示哪些赛道进入加速期。',
    '政策与安全': '政策与安全新闻会影响模型访问、数据使用、企业采购和产品默认设计。',
  };
  return hints[story.category] || hints['AI 大事'];
}

function makeTags(story) {
  const tags = new Set();
  const text = `${story.title} ${story.sourceTitle}`;
  for (const keyword of ['OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Nvidia', 'Meta', 'Claude', 'Gemini', 'GPT', 'agent', 'robotics', 'arXiv']) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) tags.add(keyword.replace('agent', '智能体').replace('robotics', '机器人'));
  }
  tags.add(story.category.replace('AI ', ''));
  tags.add(story.source);
  return [...tags].slice(0, 4);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TodayAI/1.0 (+https://github.com/qinmeng827-cpu/today-ai)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function fetchRssFeed(feed) {
  const xml = await fetchText(feed.url);
  const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const entryMatches = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  const blocks = itemMatches.length ? itemMatches : entryMatches;
  return blocks.map((item) => {
    const sourceTitle = cleanTitle(pick(item, 'title'), feed.source);
    const publishedText = pick(item, 'pubDate') || pick(item, 'published') || pick(item, 'updated');
    const published = new Date(publishedText || Date.now());
    return {
      sourceTitle,
      title: sourceTitle,
      source: feed.source,
      url: pickLink(item) || feed.url,
      published: Number.isNaN(published.getTime()) ? new Date() : published,
      category: classify(sourceTitle, feed.category),
    };
  }).filter((item) => item.sourceTitle && item.url);
}

async function fetchArxiv() {
  const url = 'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=14';
  const xml = await fetchText(url);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  return entries.map((entry) => {
    const sourceTitle = pick(entry, 'title').replace(/\s+/g, ' ');
    const published = new Date(pick(entry, 'published') || Date.now());
    return {
      sourceTitle,
      title: sourceTitle,
      source: 'arXiv',
      url: pick(entry, 'id'),
      published: Number.isNaN(published.getTime()) ? new Date() : published,
      category: '论文与技术',
    };
  }).filter((item) => item.sourceTitle && item.url);
}

function scoreStory(story, index) {
  const sourceScore = SOURCE_WEIGHT.get(story.source) || 12;
  const categoryScore = story.category === 'AI 大事' ? 10 : story.category === '政策与安全' ? 7 : 5;
  const recencyScore = Math.max(0, 24 - Math.floor((Date.now() - story.published.getTime()) / 36e5));
  return sourceScore + categoryScore + recencyScore - index * 0.05;
}

function toStory(raw, index, date) {
  const idBase = `${raw.source}-${raw.sourceTitle}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const category = classify(raw.sourceTitle, raw.category);
  const story = {
    id: `${date}-${idBase || index}`,
    date,
    category,
    title: makeChineseTitle(raw.sourceTitle, raw.source, category),
    sourceTitle: raw.sourceTitle,
    summary: '',
    analysis: '',
    source: raw.source,
    url: raw.url,
    time: timeInShanghai(raw.published),
    importance: index < 5 ? '高' : '中',
    tags: [],
    image: CATEGORY_IMAGES[category] || CATEGORY_IMAGES['AI 大事'],
    size: ['cover', 'tall', 'wide', 'medium', 'small'][index % 5],
    readMinutes: 3 + (index % 3),
  };
  story.summary = makeSummary(story);
  story.analysis = makeAnalysis(story);
  story.tags = makeTags(story);
  return story;
}

function dedupe(stories) {
  const seen = new Set();
  const result = [];
  for (const story of stories) {
    const key = story.sourceTitle.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(story);
  }
  return result;
}

async function main() {
  const fetched = [];
  const results = await Promise.allSettled([...RSS_FEEDS.map(fetchRssFeed), fetchArxiv()]);
  for (const result of results) {
    if (result.status === 'fulfilled') fetched.push(...result.value);
    else console.warn(result.reason?.message || result.reason);
  }

  const date = todayInShanghai();
  const ranked = dedupe(fetched)
    .map((story, index) => ({ story, score: scoreStory(story, index) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 28)
    .map(({ story }, index) => toStory(story, index, date));

  if (ranked.length < 8) {
    throw new Error(`Only ${ranked.length} stories fetched; refusing to overwrite daily-news.json`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    generator: 'GitHub Actions RSS updater',
    dates: [date],
    stories: ranked,
  };

  await fs.mkdir(path.dirname(SRC_DATA), { recursive: true });
  await fs.mkdir(path.dirname(PUBLIC_DATA), { recursive: true });
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.writeFile(SRC_DATA, json, 'utf8');
  await fs.writeFile(PUBLIC_DATA, json, 'utf8');
  console.log(`Wrote ${ranked.length} stories for ${date}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
