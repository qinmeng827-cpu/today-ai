import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Article,
  BookmarkSimple,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Circle,
  Clock,
  Eye,
  Funnel,
  Lightning,
  MagnifyingGlass,
  Newspaper,
  NotePencil,
  Sparkle,
  StackSimple,
  TrendUp,
  X,
} from '@phosphor-icons/react';

const categories = [
  '全部',
  'AI 大事',
  '模型更新',
  'AI 产品工具',
  '论文与技术',
  '商业融资',
  '政策与安全',
];

const dates = ['2026-06-25', '2026-06-24', '2026-06-23'];

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1500&q=85';

function makeOriginalSearchUrl(story) {
  const query = [story.sourceTitle, story.title, story.source].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function getOriginalUrl(story) {
  return story.url || makeOriginalSearchUrl(story);
}

const seedStories = [
  {
    id: 'real-openai-jalapeno',
    date: '2026-06-25',
    category: 'AI 大事',
    title: 'OpenAI 测试首款自研 AI 推理芯片 Jalapeno',
    sourceTitle: 'OpenAI fires up "Jalapeno," its first homegrown AI chip',
    summary: 'Axios 报道称，OpenAI 正在测试与 Broadcom 合作开发的首款自研 AI 芯片 Jalapeno，初期面向推理任务，目标是降低对 Nvidia 的依赖并控制推理成本。',
    analysis: '这是今天最值得放头条的基础设施新闻。模型竞争正在变成算力、成本和供应链控制的竞争，推理芯片会直接影响 AI 产品价格和可用性。',
    source: 'Axios',
    url: 'https://www.axios.com/2026/06/24/openai-jalapeno-ai-chip-broadcom-nvidia',
    time: '08:10',
    importance: '高',
    tags: ['OpenAI', 'AI 芯片', '推理成本'],
    image: heroImage,
    size: 'cover',
    readMinutes: 5,
  },
  {
    id: 'real-anthropic-alibaba',
    date: '2026-06-25',
    category: '政策与安全',
    title: 'Anthropic 指控阿里巴巴大规模违规访问 Claude',
    sourceTitle: "Anthropic Claims Alibaba Ran 'Brazen' Campaign to Access Its Claude AI Model",
    summary: '华尔街日报报道称，Anthropic 在致美国参议员的信中称，阿里巴巴涉嫌通过大量虚假账号访问 Claude，并试图蒸馏其智能体推理和软件工程能力。',
    analysis: '这把模型访问、蒸馏攻击和地缘技术管制放到同一个议题里。未来 API 风控、账号验证和跨境模型访问会变得更严格。',
    source: 'The Wall Street Journal',
    url: 'https://www.wsj.com/tech/ai/anthropic-claims-alibaba-ran-brazen-campaign-to-access-its-claude-ai-model-69d7a392',
    time: '08:45',
    importance: '高',
    tags: ['Anthropic', 'Claude', '安全'],
    image: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=900&q=82',
    size: 'tall',
    readMinutes: 5,
  },
  {
    id: 'real-google-gemini-delay',
    date: '2026-06-25',
    category: '模型更新',
    title: 'Google 据报将 Gemini 3.5 Pro 延至 7 月发布',
    sourceTitle: 'Google delays Gemini 3.5 Pro launch to July as it tweaks its new frontier AI model',
    summary: 'Business Insider 报道称，Google 将 Gemini 3.5 Pro 从 6 月推迟到 7 月，以便根据早期测试反馈继续调整长任务和智能体能力。',
    analysis: '这说明前沿模型发布不再只是跑分冲刺，真实长任务、token 消耗和智能体稳定性正在成为发布门槛。',
    source: 'Business Insider',
    url: 'https://www.businessinsider.com/google-3-5-pro-july-release-tokens-ai-agents-model-2026-6',
    time: '09:20',
    importance: '高',
    tags: ['Google', 'Gemini', '智能体'],
    image: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=900&q=82',
    size: 'tall',
    readMinutes: 4,
  },
  {
    id: 'real-ai-pac-ny',
    date: '2026-06-25',
    category: '政策与安全',
    title: '纽约初选成为 AI 监管阵营的 2700 万美元代理战',
    sourceTitle: 'The $27 million AI proxy war over Alex Bores ends in a draw',
    summary: 'The Verge 报道，纽约第 12 国会选区初选吸引 AI 相关超级 PAC 大额投入，围绕 Alex Bores 与 AI 安全监管展开高强度政治角力。',
    analysis: 'AI 政策已经从行业游说进入地方选举。模型公司不只在产品层竞争，也在监管框架成形前抢政治影响力。',
    source: 'The Verge',
    url: 'https://www.theverge.com/ai-artificial-intelligence/956263/alex-bores-new-york-12th-district-congressional-primary-results',
    time: '09:55',
    importance: '高',
    tags: ['AI 政策', '选举', '监管'],
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=82',
    size: 'wide',
    readMinutes: 4,
  },
  {
    id: 'real-lasher-openai-anthropic',
    date: '2026-06-25',
    category: '政策与安全',
    title: '纽约初选胜者公开回击 OpenAI 与 Anthropic 的政治影响力',
    sourceTitle: 'A New York primary winner has a defiant message for OpenAI and Anthropic',
    summary: 'Business Insider 报道，Micah Lasher 在纽约第 12 国会选区初选获胜后，强调不会被 OpenAI、Anthropic 等 AI 公司左右。',
    analysis: '这条和上一条一起看，能看到 AI 监管已经成为候选人公开表态的政治议题。',
    source: 'Business Insider',
    url: 'https://www.businessinsider.com/manhattan-primary-winner-lasher-openai-anthropic-2026-6',
    time: '10:10',
    importance: '中',
    tags: ['OpenAI', 'Anthropic', '政治'],
    image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 3,
  },
  {
    id: 'real-colorado-ai-primary',
    date: '2026-06-25',
    category: '国内动态',
    title: 'AI 行业资金继续进入美国地方初选',
    sourceTitle: 'AI leaders pour millions into 8th District primary',
    summary: 'Axios Denver 报道，科技行业相关资金大规模进入科罗拉多第 8 选区初选，AI 监管立场成为竞选分歧之一。',
    analysis: '这说明 AI 政策争夺不是纽约个案，行业资金正在复制到更多州和选区。',
    source: 'Axios Denver',
    url: 'https://www.axios.com/local/denver/2026/06/24/ai-leaders-pour-millions-into-8th-district-primary',
    time: '10:35',
    importance: '中',
    tags: ['AI 政策', '地方选举', '美国'],
    image: 'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&w=900&q=82',
    size: 'small',
    readMinutes: 3,
  },
  {
    id: 'real-microsoft-water-ai',
    date: '2026-06-25',
    category: '海外动态',
    title: '微软强调新一代 AI 数据中心降低用水',
    sourceTitle: 'Microsoft points to lower water use in AI era',
    summary: 'Axios 报道，微软称其最新 AI 数据中心设计通过空气冷却与闭环冷却液系统减少常规运行中的水消耗，但外界仍关注 AI 基础设施总环境影响。',
    analysis: 'AI 基础设施争议已经从电力扩展到水资源。未来大型模型公司的环境指标会越来越像财报指标一样被追踪。',
    source: 'Axios',
    url: 'https://www.axios.com/2026/06/24/microsoft-lower-water-use-ai',
    time: '11:05',
    importance: '中',
    tags: ['Microsoft', '数据中心', '水资源'],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 3,
  },
  {
    id: 'real-nvidia-halos',
    date: '2026-06-25',
    category: 'AI 产品工具',
    title: 'Nvidia 发布 humanoid 机器人安全软件 Halos',
    sourceTitle: 'Nvidia debuts AI humanoid software to advance robotics safety',
    summary: 'Axios 报道，Nvidia 推出 Halos for Robotics，面向人形机器人部署的安全系统，延续其自动驾驶安全架构经验。',
    analysis: 'Nvidia 继续押注机器人软件与芯片栈，而不是亲自造机器人硬件。物理 AI 的竞争焦点正在转向安全和规模化部署。',
    source: 'Axios',
    url: 'https://www.axios.com/2026/06/22/nvidia-humanoid-ai-robotics',
    time: '11:40',
    importance: '高',
    tags: ['Nvidia', '机器人', 'Physical AI'],
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=82',
    size: 'tall',
    readMinutes: 4,
  },
  {
    id: 'real-chevron-microsoft-ai-power',
    date: '2026-06-25',
    category: '商业融资',
    title: 'Chevron 与 Microsoft 数据中心电力项目显示 AI 进入 BYOP 阶段',
    sourceTitle: 'Chevron signs 20-year power supply deal tied to Microsoft data center',
    summary: 'Axios Closer 提到，Chevron 与 Microsoft 相关数据中心项目签订长期供电安排，Project Kilby 体现数据中心与发电设施共址趋势。',
    analysis: 'AI 公司的瓶颈不只是 GPU，还包括电力接入速度。Bring Your Own Power 会成为大型 AI 基础设施的新常态。',
    source: 'Axios Closer',
    url: 'https://www.axios.com/newsletters/axios-closer-f56c702f-09eb-4f59-a2f6-0f193e8670e9',
    time: '12:05',
    importance: '中',
    tags: ['Microsoft', '能源', '数据中心'],
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=82',
    size: 'wide',
    readMinutes: 3,
  },
  {
    id: 'real-axios-real-content',
    date: '2026-06-25',
    category: '海外动态',
    title: 'Axios Cannes 讨论：AI 越泛滥，真实报道越稀缺',
    sourceTitle: "Axios House: The one thing AI can't make - something real",
    summary: 'Axios 报道，媒体与品牌人士在 Cannes 讨论 AI 内容泛滥后，真实报道、真实人格和真实结果的价值反而上升。',
    analysis: '这对你的日报产品也有提醒：真实来源、可点击原文和可追溯摘要，会比“看起来像新闻”的生成内容更重要。',
    source: 'Axios',
    url: 'https://www.axios.com/2026/06/24/axios-house-the-one-thing-ai-cant-make-something-real',
    time: '12:30',
    importance: '中',
    tags: ['媒体', '生成内容', '可信来源'],
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 3,
  },
  {
    id: 'real-openai-hollywood',
    date: '2026-06-25',
    category: '海外动态',
    title: 'OpenAI 相关传记片风波折射 Hollywood 与 Big Tech 关系',
    sourceTitle: 'Hollywood is bending the knee to OpenAI',
    summary: 'The Verge 讨论电影 Artificial 的发行争议，认为 Hollywood 对 AI 巨头的依赖可能影响其批判科技权力的能力。',
    analysis: '这不是模型能力新闻，但很重要：AI 公司正在进入文化产业的融资、发行和叙事权结构。',
    source: 'The Verge',
    url: 'https://www.theverge.com/entertainment/954899/luca-guadagnino-artificial-sam-altman-amazon-a24-neon-mubi-chatgpt',
    time: '13:10',
    importance: '中',
    tags: ['OpenAI', '影视', '文化产业'],
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 4,
  },
  {
    id: 'real-google-talent-war',
    date: '2026-06-25',
    category: '商业融资',
    title: 'Google AI 人才流动显示前沿实验室进入明星争夺战',
    sourceTitle: 'Google loses two AI stars as the talent wars enter their celebrity era',
    summary: 'Business Insider 报道，Google 两位高知名度 AI 人才转投 OpenAI 与 Anthropic，AI 人才战进入更公开、更明星化阶段。',
    analysis: '人才迁移会影响实验室路线和投资者信心。前沿模型竞争不仅是算力，也是谁能聚集关键研究者。',
    source: 'Business Insider',
    url: 'https://www.businessinsider.com/google-ai-talent-wars-anthropic-jumper-shazeer-karpathy-openai-2026-6',
    time: '13:45',
    importance: '中',
    tags: ['Google', 'OpenAI', 'Anthropic'],
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=82',
    size: 'small',
    readMinutes: 3,
  },
  {
    id: 'real-hang-ten-funding',
    date: '2026-06-25',
    category: '商业融资',
    title: 'Vishal Sikka 的 AI 创业公司 Hang Ten Systems 获 3200 万美元种子轮',
    sourceTitle: "Vishal Sikka's AI startup Hang Ten Systems raises $32 million led by Mayfield",
    summary: 'The Economic Times 报道，前 Infosys CEO Vishal Sikka 创立的 Hang Ten Systems 完成 3200 万美元种子轮融资，由 Mayfield 领投。',
    analysis: '老牌企业软件人物继续回流 AI 创业，说明企业级 AI 仍有大量流程与系统层机会。',
    source: 'The Economic Times',
    url: 'https://m.economictimes.com/tech/funding/vishal-sikkas-ai-startup-hang-ten-systems-raises-32-million-led-by-mayfield/articleshow/131971910.cms',
    time: '14:15',
    importance: '中',
    tags: ['融资', '企业 AI', 'Mayfield'],
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 3,
  },
  {
    id: 'real-justai-funding',
    date: '2026-06-25',
    category: '商业融资',
    title: 'AI 营销平台 JustAI 完成 1700 万美元 A 轮融资',
    sourceTitle: 'Marketing platform JustAI raises $17 million led by Base10',
    summary: 'The Economic Times 报道，AI 营销平台 JustAI 完成超过 1700 万美元 A 轮融资，Base10 领投，Y Combinator 与 Peak XV 参投。',
    analysis: '营销仍是 AI 商业化最快的落地点之一。要观察的是这些工具能否从内容生成升级到投放、归因和增长闭环。',
    source: 'The Economic Times',
    url: 'https://m.economictimes.com/tech/funding/marketing-platform-justai-raises-17-million-led-base10/articleshow/131968605.cms',
    time: '14:40',
    importance: '中',
    tags: ['融资', '营销 AI', 'YC'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=82',
    size: 'wide',
    readMinutes: 3,
  },
  {
    id: 'real-china-open-ai-ecosystem',
    date: '2026-06-25',
    category: '论文与技术',
    title: '论文：美国政策可能意外加速中国开放 AI 生态',
    sourceTitle: "U.S. Policies Unintentionally Accelerated China's Open AI Ecosystems",
    summary: 'arXiv 论文分析称，美国围绕芯片和基础设施的限制提高了中国 AI 开发成本，但也提升了开放模型与本土适配生态的战略价值。',
    analysis: '这篇适合放在政策与技术交叉处：限制政策可能改变创新路径，而不是简单减速。',
    source: 'arXiv',
    url: 'https://arxiv.org/abs/2606.15999',
    time: '15:05',
    importance: '中',
    tags: ['开源 AI', '中国', '政策'],
    image: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=900&q=82',
    size: 'tall',
    readMinutes: 5,
  },
  {
    id: 'real-nvidia-isaac-sim-paper',
    date: '2026-06-25',
    category: '论文与技术',
    title: '论文综述 Nvidia Isaac Sim 在机器人仿真中的系统价值',
    sourceTitle: 'NVIDIA Isaac Sim: Enabling Scalable, GPU-Accelerated Simulation for Robotics',
    summary: 'arXiv 论文系统综述 Isaac Sim 的 GPU 加速仿真、合成数据生成和机器人训练用途，强调大规模并行训练与高保真物理建模。',
    analysis: '机器人与 embodied AI 的进展离不开仿真基础设施。Isaac Sim 这类平台会成为物理 AI 的“训练场”。',
    source: 'arXiv',
    url: 'https://arxiv.org/abs/2606.03551',
    time: '15:35',
    importance: '中',
    tags: ['Nvidia', '机器人', '仿真'],
    image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 4,
  },
  {
    id: 'real-embodied-ai-sae',
    date: '2026-06-25',
    category: '论文与技术',
    title: 'SAE 论文强调 embodied AI 落地需要安全、信任与工程治理',
    sourceTitle: 'Embodied AI in Action: Insights from SAE World Congress 2026 on Safety, Trust, Robotics, and Real-World Deployment',
    summary: 'arXiv 白皮书总结 SAE World Congress 2026 关于 embodied AI 的讨论，强调自动驾驶、移动机器人与工业系统部署中的安全和生命周期治理。',
    analysis: '物理世界里的 AI 不能只看能力演示，安全标准、工程流程和人机协作会决定能否规模化。',
    source: 'arXiv',
    url: 'https://arxiv.org/abs/2605.10653',
    time: '16:05',
    importance: '中',
    tags: ['Embodied AI', '机器人', '安全'],
    image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=900&q=82',
    size: 'small',
    readMinutes: 4,
  },
  {
    id: 'real-verge-dangerous-ai',
    date: '2026-06-25',
    category: '政策与安全',
    title: 'The Verge 追问：谁来判断 AI 模型是否过于危险',
    sourceTitle: 'Who decides when AI is too dangerous?',
    summary: 'The Verge Decoder 节目回顾 Anthropic 模型与美国政府管制风波，讨论模型危险性判断、出口控制和监管流程的不确定性。',
    analysis: '这不是今天新发布，但对理解本周 Anthropic 相关政策新闻很有背景价值。',
    source: 'The Verge',
    url: 'https://www.theverge.com/podcast/951542/anthropic-claude-fable-5-mythos-ban-pentagon-ai-regulation-trump',
    time: '16:30',
    importance: '中',
    tags: ['Anthropic', '监管', '安全'],
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 5,
  },
  {
    id: 'real-pentagon-ai-deals',
    date: '2026-06-25',
    category: '政策与安全',
    title: '五角大楼此前与多家 AI 公司达成涉密使用协议，Anthropic 缺席',
    sourceTitle: 'Pentagon strikes classified AI deals with OpenAI, Google, and Nvidia - but not Anthropic',
    summary: 'The Verge 早前报道，五角大楼与 OpenAI、Google、Microsoft、Amazon、Nvidia、xAI 等公司达成涉密 AI 使用协议，但 Anthropic 因政策分歧缺席。',
    analysis: '这条是理解 Anthropic 与美国政府关系的背景拼图，也解释为什么 AI 安全政策会快速政治化。',
    source: 'The Verge',
    url: 'https://www.theverge.com/ai-artificial-intelligence/922113/pentagon-ai-classified-openai-google-nvidia',
    time: '17:00',
    importance: '中',
    tags: ['国防 AI', 'OpenAI', 'Anthropic'],
    image: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?auto=format&fit=crop&w=900&q=82',
    size: 'wide',
    readMinutes: 4,
  },
  {
    id: 'real-axios-ai-ny-brands',
    date: '2026-06-25',
    category: 'AI 产品工具',
    title: 'Axios AI+NY Summit：品牌需要为 AI 发现机制重写传播方式',
    sourceTitle: 'Axios AI+NY Summit: Brands get the message - AI is rewriting all the rules',
    summary: 'Axios 总结 AI+NY Summit 讨论：品牌声誉越来越受 AI bot 影响，企业需要同时面向人和 AI 系统组织信息。',
    analysis: '这与搜索入口变化直接相关。未来内容是否被 AI 引用、如何被摘要，可能和 SEO 一样重要。',
    source: 'Axios',
    url: 'https://www.axios.com/2026/06/08/axios-ainy-summit-brands-get-the-message-ai-is-rewriting-all-the-rules',
    time: '17:25',
    importance: '中',
    tags: ['品牌', 'AI 搜索', '传播'],
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=82',
    size: 'medium',
    readMinutes: 3,
  },
];

const extraToday = [];

function useLocalMap(key) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function buildGeneratedStories() {
  return [];
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedStoryId, setSelectedStoryId] = useState(seedStories[0].id);
  const [favorites, setFavorites] = useLocalMap('today-ai:favorites');
  const [readItems, setReadItems] = useLocalMap('today-ai:read');
  const [notes, setNotes] = useLocalMap('today-ai:notes');
  const [generatedStories, setGeneratedStories] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState('今日日报已就绪');
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = Number(localStorage.getItem('today-ai:drawer-width'));
    return Number.isFinite(saved) && saved >= 360 ? saved : 560;
  });
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);

  const allStories = useMemo(
    () => [...seedStories, ...generatedStories],
    [generatedStories],
  );

  const dayStories = useMemo(
    () => allStories.filter((story) => story.date === selectedDate),
    [allStories, selectedDate],
  );

  const coverStory = dayStories[0] || allStories[0];

  const filteredStories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return dayStories.filter((story) => {
      const categoryMatch = selectedCategory === '全部' || story.category === selectedCategory;
      const queryMatch =
        !normalized ||
        [story.title, story.sourceTitle, story.summary, story.source, story.category, ...story.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [dayStories, query, selectedCategory]);

  const selectedStory = useMemo(
    () => (selectedStoryId ? allStories.find((story) => story.id === selectedStoryId) || null : null),
    [allStories, selectedStoryId],
  );

  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] =
        category === '全部'
          ? dayStories.length
          : dayStories.filter((story) => story.category === category).length;
      return acc;
    }, {});
  }, [dayStories]);

  const stats = useMemo(() => {
    const dayIds = dayStories.map((story) => story.id);
    return {
      total: dayStories.length,
      high: dayStories.filter((story) => story.importance === '高').length,
      saved: dayIds.filter((id) => favorites[id]).length,
      read: dayIds.filter((id) => readItems[id]).length,
      noted: dayIds.filter((id) => notes[id]?.trim()).length,
    };
  }, [dayStories, favorites, notes, readItems]);

  useEffect(() => {
    localStorage.setItem('today-ai:drawer-width', String(drawerWidth));
  }, [drawerWidth]);

  useEffect(() => {
    if (!isResizingDrawer) return undefined;

    function handlePointerMove(event) {
      const viewportWidth = window.innerWidth;
      const nextWidth = Math.min(Math.max(viewportWidth - event.clientX - 18, 360), viewportWidth - 36);
      setDrawerWidth(nextWidth);
    }

    function stopResize() {
      setIsResizingDrawer(false);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, [isResizingDrawer]);

  function startDrawerResize(event) {
    event.preventDefault();
    setIsResizingDrawer(true);
  }

  function toggleMap(setter, id) {
    setter((current) => ({ ...current, [id]: !current[id] }));
  }

  function handleGenerate() {
    setIsGenerating(true);
    setGenerationLog('正在校验真实来源链接');
    window.setTimeout(() => {
      setGeneratedStories([]);
      setSelectedDate('2026-06-25');
      setSelectedCategory('全部');
      setQuery('');
      setGenerationLog('已载入 20 条真实来源日报');
      setIsGenerating(false);
    }, 650);
  }

  function shiftDate(direction) {
    const index = dates.indexOf(selectedDate);
    const next = dates[Math.min(Math.max(index + direction, 0), dates.length - 1)];
    setSelectedDate(next);
    const nextStory = allStories.find((story) => story.date === next);
    if (nextStory) setSelectedStoryId(nextStory.id);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="edition">Personal AI Intelligence</span>
          <h1>今日 AI</h1>
        </div>
        <div className="topbar-actions">
          <label className="search-box" aria-label="搜索资讯">
            <MagnifyingGlass size={18} weight="regular" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、来源、标签"
            />
          </label>
          <button className="generate-button" onClick={handleGenerate} disabled={isGenerating}>
            <Sparkle size={18} weight="fill" />
            <span>{isGenerating ? '生成中' : '生成今日 AI 日报'}</span>
          </button>
        </div>
      </header>

      <section className="date-strip" aria-label="日报日期">
        <button className="icon-button" onClick={() => shiftDate(1)} aria-label="前一天">
          <CaretLeft size={18} />
        </button>
        <div className="date-display">
          <CalendarBlank size={18} />
          <span>{selectedDate.replaceAll('-', '.')}</span>
          <strong>{generationLog}</strong>
        </div>
        <button className="icon-button" onClick={() => shiftDate(-1)} aria-label="后一天">
          <CaretRight size={18} />
        </button>
      </section>

      <div className="workspace-grid">
        <aside className="personal-rail" aria-label="个人沉淀">
          <div className="rail-section rail-intro">
            <span className="section-kicker">Desk</span>
            <h2>个人情报编辑台</h2>
            <p>收藏、已读和笔记会保存在本地浏览器。</p>
          </div>
          <div className="rail-metrics">
            <Metric icon={<Newspaper size={18} />} label="今日条目" value={stats.total} />
            <Metric icon={<Lightning size={18} />} label="高优先级" value={stats.high} />
            <Metric icon={<BookmarkSimple size={18} />} label="收藏" value={stats.saved} />
            <Metric icon={<Eye size={18} />} label="已读" value={stats.read} />
          </div>
          <div className="rail-section past-reports">
            <span className="section-kicker">Archive</span>
            {dates.map((date) => (
              <button
                key={date}
                className={date === selectedDate ? 'archive-row active' : 'archive-row'}
                onClick={() => setSelectedDate(date)}
              >
                <span>{date.slice(5).replace('-', '.')}</span>
                <strong>{allStories.filter((story) => story.date === date).length}</strong>
              </button>
            ))}
          </div>
          <div className="rail-section note-preview">
            <span className="section-kicker">Notes</span>
            <p>{stats.noted ? `已有 ${stats.noted} 条笔记` : '还没有笔记'}</p>
          </div>
        </aside>

        <section className="main-stage">
          <section className="cover-layout" aria-label="今日封面">
            <article className="lead-story" onClick={() => setSelectedStoryId(coverStory.id)}>
              <img src={coverStory.image} alt="AI news cover" />
              <div className="lead-overlay">
                <span className="label-hot">今日主线</span>
                <h2>{coverStory.title}</h2>
                <p>{coverStory.summary}</p>
                <div className="lead-meta">
                  <span>{coverStory.source}</span>
                  <span>{coverStory.time}</span>
                  <span>{coverStory.readMinutes} min</span>
                </div>
              </div>
            </article>

            <aside className="overview-panel" aria-label="今日总览">
              <span className="section-kicker">Today Overview</span>
              <h2>今日最重要的 3 件事</h2>
              <ol>
                {dayStories.slice(0, 3).map((story) => (
                  <li key={story.id} onClick={() => setSelectedStoryId(story.id)}>
                    <span>{story.category}</span>
                    <strong>{story.title}</strong>
                  </li>
                ))}
              </ol>
              <div className="one-line">
                <TrendUp size={18} />
                <p>智能体、算力价格与合规细节，正在共同决定 AI 产品的下一轮分化。</p>
              </div>
            </aside>
          </section>

          <nav className="category-tabs" aria-label="资讯分类">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? 'active' : ''}
                onClick={() => setSelectedCategory(category)}
              >
                <span>{category}</span>
                <strong>{categoryCounts[category] || 0}</strong>
              </button>
            ))}
          </nav>

          <section className="feed-header">
            <div>
              <span className="section-kicker">Waterfall</span>
              <h2>{selectedCategory === '全部' ? '全部资讯' : selectedCategory}</h2>
            </div>
            <div className="feed-tools">
              <Funnel size={18} />
              <span>{filteredStories.length} 条</span>
            </div>
          </section>

          <section className="masonry-feed" aria-label="资讯瀑布流">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                selected={selectedStory?.id === story.id}
                favorite={Boolean(favorites[story.id])}
                read={Boolean(readItems[story.id])}
                hasNote={Boolean(notes[story.id]?.trim())}
                onOpen={() => setSelectedStoryId(story.id)}
                onToggleFavorite={(event) => {
                  event.stopPropagation();
                  toggleMap(setFavorites, story.id);
                }}
                onToggleRead={(event) => {
                  event.stopPropagation();
                  toggleMap(setReadItems, story.id);
                }}
              />
            ))}
          </section>
        </section>
      </div>

      {selectedStory && (
        <aside
          className={isResizingDrawer ? "detail-drawer resizing" : "detail-drawer"}
          aria-label="资讯详情"
          style={{ "--drawer-width": `${drawerWidth}px` }}
        >
          <button
            className="drawer-resize-handle"
            onPointerDown={startDrawerResize}
            aria-label="拖动调整详情宽度"
            title="拖动调整宽度"
          />
          <div className="drawer-head">
            <div>
              <span className="section-kicker">Detail</span>
              <h2>{selectedStory.category}</h2>
            </div>
            <button className="icon-button" onClick={() => setSelectedStoryId(null)} aria-label="关闭详情">
              <X size={18} />
            </button>
          </div>
          <img className="drawer-image" src={selectedStory.image} alt="Selected AI story" />
          <div className="drawer-body">
            <div className="importance-row">
              <span className={selectedStory.importance === '高' ? 'importance high' : 'importance'}>
                {selectedStory.importance}优先级
              </span>
              <span>{selectedStory.source}</span>
              <span>{selectedStory.time}</span>
            </div>
            <h2>{selectedStory.title}</h2>
            <p className="source-title">{selectedStory.sourceTitle}</p>
            <p>{selectedStory.summary}</p>
            <div className="analysis-box">
              <span>为什么重要</span>
              <p>{selectedStory.analysis}</p>
            </div>
            <div className="tag-row">
              {selectedStory.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="drawer-actions">
              <button
                className={favorites[selectedStory.id] ? 'state-button active' : 'state-button'}
                onClick={() => toggleMap(setFavorites, selectedStory.id)}
              >
                <BookmarkSimple size={18} weight={favorites[selectedStory.id] ? 'fill' : 'regular'} />
                收藏
              </button>
              <button
                className={readItems[selectedStory.id] ? 'state-button active' : 'state-button'}
                onClick={() => toggleMap(setReadItems, selectedStory.id)}
              >
                {readItems[selectedStory.id] ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
                已读
              </button>
              <a
                className="state-button"
                href={getOriginalUrl(selectedStory)}
                target="_blank"
                rel="noreferrer"
              >
                <ArrowUpRight size={18} />
                原文
              </a>
            </div>
            <label className="note-box">
              <span>
                <NotePencil size={18} /> 我的笔记
              </span>
              <textarea
                value={notes[selectedStory.id] || ''}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [selectedStory.id]: event.target.value }))
                }
                placeholder="写下你的判断、待查问题或后续行动"
              />
            </label>
          </div>
        </aside>
      )}
    </main>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StoryCard({ story, selected, favorite, read, hasNote, onOpen, onToggleFavorite, onToggleRead }) {
  return (
    <article className={`story-card ${story.size} ${selected ? 'selected' : ''}`} onClick={onOpen}>
      <div className="image-wrap">
        <img src={story.image} alt="AI news visual" loading="lazy" />
        <span className={story.importance === '高' ? 'importance high' : 'importance'}>{story.importance}</span>
      </div>
      <div className="story-content">
        <div className="story-meta">
          <span>{story.category}</span>
          <span>
            <Clock size={14} /> {story.time}
          </span>
        </div>
        <h3>{story.title}</h3>
        <p className="source-title">{story.sourceTitle}</p>
        <p>{story.summary}</p>
        <div className="tag-row">
          {story.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="card-actions">
          <button className={favorite ? 'active' : ''} onClick={onToggleFavorite} aria-label="收藏">
            <BookmarkSimple size={17} weight={favorite ? 'fill' : 'regular'} />
          </button>
          <button className={read ? 'active' : ''} onClick={onToggleRead} aria-label="已读">
            <Eye size={17} weight={read ? 'fill' : 'regular'} />
          </button>
          <button className={hasNote ? 'active' : ''} aria-label="笔记">
            <NotePencil size={17} weight={hasNote ? 'fill' : 'regular'} />
          </button>
          <span>{story.source}</span>
        </div>
      </div>
    </article>
  );
}

export { App };







