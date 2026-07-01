import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DATA = path.join(ROOT, 'src', 'data', 'daily-news.json');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data', 'daily-news.json');

const IMAGE_POOLS = {
  'AI 大事': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1500&q=85',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1500&q=85',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1500&q=85',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1500&q=85',
    'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1500&q=85',
  ],
  '模型更新': [
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1200&q=82',
  ],
  'AI 产品工具': [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=82',
  ],
  '论文与技术': [
    'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=82',
  ],
  '商业融资': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=82',
  ],
  '政策与安全': [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1528747045269-390fe33c19f2?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1200&q=82',
  ],
};

const RSS_FEEDS = [
  { source: 'The Verge', category: 'AI 大事', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { source: 'TechCrunch', category: '商业融资', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { source: 'Google AI Blog', category: '模型更新', url: 'https://blog.google/technology/ai/rss/' },
  { source: 'OpenAI News', category: 'AI 大事', url: 'https://openai.com/news/rss.xml' },
  { source: '量子位', category: 'AI 大事', region: 'china', requireAi: true, url: 'https://www.qbitai.com/feed' },
  { source: 'InfoQ 中文', category: 'AI 产品工具', region: 'china', requireAi: true, url: 'https://www.infoq.cn/feed' },
  { source: 'Qwen Blog', category: '模型更新', region: 'china', url: 'https://qwenlm.github.io/blog/index.xml' },
];

const STORY_LIMIT = 28;
const CHINA_STORY_MIN = 3;
const CHINA_STORY_MAX = 5;

const SOURCE_WEIGHT = new Map([
  ['Reuters', 40], ['Associated Press', 36], ['The Verge', 34], ['Axios', 34],
  ['TechCrunch', 32], ['Bloomberg', 32], ['Financial Times', 32], ['The Wall Street Journal', 32],
  ['Business Insider', 26], ['VentureBeat', 24], ['MIT Technology Review', 28], ['arXiv', 24],
  ['OpenAI News', 36], ['Google AI Blog', 34], ['Microsoft', 30], ['NVIDIA Blog', 30],
  ['量子位', 31], ['InfoQ 中文', 27], ['Qwen Blog', 33],
]);

const EDITORIAL_OVERRIDES = new Map(Object.entries({
  'AI was supposed to kill engineering jobs, but new data suggests they’re the most resilient': {
    title: 'AI 没有杀死工程岗位，反而让工程师更抗冲击',
    summary: '这篇报道关注 AI 对工程岗位的真实影响：新数据并不支持“工程师会最先被替代”的判断，反而显示工程类岗位在就业市场里更有韧性。值得看的是，AI 正在改变岗位内容，而不是简单消灭岗位。',
    analysis: '如果你关心职业选择或团队配置，这条新闻比“AI 替代人类”的笼统叙事更有参考价值。关键要观察工程师的工作重心会向系统设计、评审和 AI 协作迁移多少。',
    category: 'AI 大事',
  },
  'Europe is pushing back on Washington’s chip war': {
    title: '欧洲开始反击美国芯片战，AI 算力供应链再起波动',
    summary: '报道聚焦欧洲对美国芯片限制政策的反弹。芯片出口、供应链和算力获取正在变成 AI 竞争里的政策变量，欧洲不愿完全跟随华盛顿的节奏。',
    analysis: 'AI 公司真正的瓶颈不只是模型能力，还有芯片、云资源和跨境政策。欧洲态度变化会影响企业采购、模型部署和长期成本。',
    category: '政策与安全',
  },
  'The memory chip crunch is paying off for this US company': {
    title: '存储芯片紧缺推高 AI 硬件景气，一家美国公司率先受益',
    summary: '这条新闻关注存储芯片供需紧张带来的行业收益。AI 训练和推理都在推高高性能存储需求，硬件产业链的部分公司因此获得更强定价权。',
    analysis: '算力竞争不只发生在 GPU 上，存储、网络和数据中心配套也会成为利润重新分配的地方。',
    category: 'AI 大事',
  },
  'The $27 million AI proxy war over Alex Bores ends in a draw': {
    title: '一场围绕 AI 政策的 2700 万美元代理战暂时打成平手',
    summary: 'The Verge 报道了一场围绕 Alex Bores 的高额政治代理战。背后真正的焦点不是单一选举，而是 AI 产业、监管路线和政治资金正在更深地绑定。',
    analysis: '当 AI 政策进入选举和游说体系，行业规则会越来越受资本和政治博弈影响。这类新闻适合追踪监管风向。',
    category: '政策与安全',
  },
  'Congresswoman denies staff used AI to write defense funding amendment': {
    title: '美国议员否认用 AI 撰写国防拨款修正案',
    summary: '报道提到，一名美国国会议员否认其团队使用 AI 撰写国防拨款修正案。争议点在于，AI 是否已经进入严肃立法与国防预算文本的起草流程。',
    analysis: '这不是普通工具使用问题，而是公共决策透明度问题。未来政府文件是否需要披露 AI 参与程度，会成为政策焦点。',
    category: '政策与安全',
  },
  'Former Infosys chief has a new startup that wants to challenge the IT services world': {
    title: 'Infosys 前高管创业，想用 AI 改写 IT 服务行业',
    summary: '这篇报道关注 Infosys 前高管的新创业项目，目标是挑战传统 IT 服务模式。核心看点是 AI 是否能把外包、咨询和软件交付从人力密集型业务变成更自动化的服务。',
    analysis: '如果 AI 能改变 IT 服务交付，受影响的会是大型外包公司、企业软件预算和咨询公司的收费模式。',
    category: '商业融资',
  },
  'Cerebras stock plunges after earnings as CEO says margin outlook was misunderstood': {
    title: 'Cerebras 财报后股价大跌，市场担心 AI 芯片利润率',
    summary: '报道指出 Cerebras 股价在财报后下挫，公司 CEO 认为外界误解了利润率展望。它反映出 AI 芯片公司即使站在热门赛道，也会被毛利、交付和客户集中度检验。',
    analysis: 'AI 硬件公司不能只讲算力故事，资本市场会越来越关注真实收入质量、毛利率和可持续订单。',
    category: '商业融资',
  },
  'AI researchers continue to leave Google for its rivals': {
    title: 'AI 研究员继续离开 Google，顶级人才流向竞争对手',
    summary: '报道关注 Google AI 人才持续流失的问题。顶尖研究员流向竞争对手，说明大模型竞争不只是产品竞赛，也是研究文化、激励机制和创业机会的竞争。',
    analysis: 'AI 公司之间的人才迁移会改变模型路线和产品速度。人才流向有时比单次发布更能提示行业重心。',
    category: 'AI 大事',
  },
  'OpenAI reveals its first AI processor: Jalapeño': {
    title: 'OpenAI 首款自研 AI 处理器 Jalapeño 曝光',
    summary: 'The Verge 报道 OpenAI 首款 AI 处理器 Jalapeño。OpenAI 正在把竞争从模型和应用延伸到芯片与推理成本，试图降低对外部硬件供应的依赖。',
    analysis: '自研芯片会直接影响推理成本、产品价格和模型可用性。它也是 OpenAI 从软件公司走向基础设施公司的信号。',
    category: 'AI 大事',
  },
  'The Google Home Speaker sounds good and looks great — but it’s finicky': {
    title: '新版 Google Home 音箱体验不错，但智能家居细节仍不稳定',
    summary: '这篇评测关注 Google Home Speaker 的真实使用体验：硬件观感和声音表现不错，但连接、控制或场景体验仍显得不够稳定。',
    analysis: 'AI 助手进入家庭场景后，真正决定体验的往往不是模型参数，而是稳定性、响应速度和设备生态协同。',
    category: 'AI 产品工具',
  },
  'Companies are scrambling to stop employees from maxing out AI budgets with small tasks': {
    title: '企业开始管控 AI 使用预算，防止小任务烧掉大额费用',
    summary: '报道关注企业员工用 AI 处理小任务导致预算快速消耗的问题。随着 AI 工具进入日常工作，企业开始需要更细的用量分析、权限分级和成本控制。',
    analysis: 'AI 普及后的第一批管理难题不是“能不能用”，而是“怎么用得划算”。这会推动企业级 AI 管理工具增长。',
    category: '商业融资',
  },
  'OpenAI unveils its first custom chip, built by Broadcom': {
    title: 'OpenAI 与 Broadcom 推出首款定制芯片',
    summary: 'TechCrunch 报道 OpenAI 与 Broadcom 合作推出首款定制芯片。它指向 OpenAI 在推理基础设施上的长期布局，目标是控制成本、供应和性能。',
    analysis: '这条新闻的重要性在于，模型公司正在向硬件和云基础设施深入。未来 AI 产品竞争会越来越受单位推理成本影响。',
    category: 'AI 大事',
  },
  'Figma now has AI motion graphics and shader tools': {
    title: 'Figma 加入 AI 动效和 Shader 工具',
    summary: 'The Verge 报道 Figma 新增 AI 动效与 Shader 工具。设计工具正在从静态界面设计扩展到动效、视觉生成和前端表达，降低设计师制作复杂视觉效果的门槛。',
    analysis: '这会让设计流程更接近“设计即生产”。对产品团队来说，原型、动效和视觉实验的周期会继续缩短。',
    category: 'AI 产品工具',
  },
  'Facebook rolls out an AI companion app for creators': {
    title: 'Facebook 推出面向创作者的 AI 陪伴应用',
    summary: 'TechCrunch 报道 Facebook 面向创作者推出 AI companion app。它瞄准创作者与粉丝互动、内容生产和账号运营中的自动化需求。',
    analysis: '平台把 AI 助手放进创作者生态，意味着内容平台的竞争会从流量分发延伸到创作工具和粉丝关系运营。',
    category: 'AI 产品工具',
  },
  'Agility Robotics plans to go public via SPAC in a $2.5B deal': {
    title: 'Agility Robotics 计划通过 SPAC 上市，估值约 25 亿美元',
    summary: '报道指出机器人公司 Agility Robotics 计划通过 SPAC 上市，交易估值约 25 亿美元。人形机器人和实体智能正在重新获得资本市场关注。',
    analysis: '机器人公司能否上市成功，会检验实体智能商业化的真实预期。重点看订单、交付能力和单位经济模型。',
    category: '商业融资',
  },
  'OpenAI and Broadcom unveil LLM-optimized inference chip': {
    title: 'OpenAI 与 Broadcom 发布面向大模型推理的定制芯片',
    summary: 'OpenAI News 介绍与 Broadcom 合作的 LLM 优化推理芯片。重点是让大模型服务在更低成本、更高效率的硬件上运行。',
    analysis: '推理芯片是 AI 商业化的关键基础设施。谁能降低推理成本，谁就更容易把 AI 功能做进更多产品。',
    category: 'AI 大事',
  },
  'Helping build shared standards for advanced AI': {
    title: 'OpenAI 推动高级 AI 共享标准建设',
    summary: 'OpenAI 介绍其参与高级 AI 共享标准建设的工作。重点在于为更强模型建立评估、安全、治理和协作框架。',
    analysis: '行业标准会影响模型发布节奏、监管沟通和企业采用门槛。它比单个产品发布更偏长期基础设施。',
    category: '政策与安全',
  },
  'How Omio is building the future of conversational travel': {
    title: 'Omio 用对话式 AI 重做旅行预订体验',
    summary: 'OpenAI News 展示 Omio 如何构建对话式旅行服务。重点是把搜索、规划、预订和客服变成自然语言交互流程。',
    analysis: '旅行是 AI agent 很适合落地的场景，因为用户任务复杂、步骤多、信息变化快。值得观察转化率和客服成本变化。',
    category: 'AI 产品工具',
  },
  'Patch the Planet: a Daybreak initiative to support open source maintainers': {
    title: 'OpenAI 支持开源维护者，推出 Patch the Planet 计划',
    summary: 'OpenAI News 介绍 Daybreak 旗下 Patch the Planet 计划，目标是支持开源维护者。它关注 AI 时代基础软件生态的维护压力和可持续资金。',
    analysis: 'AI 工具高度依赖开源生态。支持维护者不是公益边角料，而是 AI 基础设施稳定性的组成部分。',
    category: 'AI 大事',
  },
  'Codex-maxxing for long-running work': {
    title: 'OpenAI 介绍 Codex 处理长周期工作的使用方式',
    summary: 'OpenAI News 讨论如何让 Codex 更好地处理长时间、复杂代码任务。重点是把 AI 编程助手从短问答推进到持续执行、跟踪和交付。',
    analysis: '如果 AI 编程工具能稳定处理长任务，它会改变开发者把工作拆分、委派和审查的方式。',
    category: 'AI 产品工具',
  },
  'New usage analytics and updated spend controls for enterprises': {
    title: 'OpenAI 为企业更新用量分析和费用控制',
    summary: 'OpenAI News 介绍企业级用量分析和费用控制更新。它帮助企业看清 AI 使用情况、控制支出并管理不同团队的使用权限。',
    analysis: '企业采用 AI 后，管理能力会成为关键卖点。预算、合规和可观测性决定 AI 能否从试点走向规模化。',
    category: 'AI 产品工具',
  },
  'Figma adds code layers, support for animations, more AI features in new update': {
    title: 'Figma 更新代码图层、动画支持和更多 AI 功能',
    summary: 'TechCrunch 报道 Figma 新版本加入代码图层、动画支持和更多 AI 功能。设计工具正在更深地连接设计、动效和工程实现。',
    analysis: '这类更新会影响设计师与工程师协作方式，也会提高原型到产品代码之间的转换效率。',
    category: 'AI 产品工具',
  },
  'Using AI to help physicians diagnose rare genetic diseases affecting children': {
    title: 'OpenAI 探索用 AI 帮助医生诊断儿童罕见遗传病',
    summary: 'OpenAI News 介绍 AI 辅助医生诊断儿童罕见遗传病的案例。重点是用模型处理复杂医学信息，帮助缩短诊断路径。',
    analysis: '医疗 AI 的价值不在炫技，而在降低漏诊、缩短诊断时间和辅助专业医生决策。这个方向需要持续关注可靠性和临床验证。',
    category: 'AI 大事',
  },
  'A near-autonomous AI chemist improves a challenging reaction in medicinal chemistry': {
    title: '近自主 AI 化学家改进药物化学中的困难反应',
    summary: 'OpenAI News 介绍一个近自主 AI 化学家改进药物化学反应的案例。它展示 AI 在实验设计、反应优化和科研自动化中的潜力。',
    analysis: '如果 AI 能参与真实实验优化，科研效率会发生结构性变化。关键仍是可重复性、实验闭环和安全边界。',
    category: '论文与技术',
  },
  'Introducing LifeSciBench': {
    title: 'OpenAI 发布 LifeSciBench，用于评估生命科学能力',
    summary: 'OpenAI News 发布 LifeSciBench，面向生命科学任务评估模型能力。它用于衡量模型在生物、医学和科研推理上的表现。',
    analysis: '生命科学评测会影响模型进入科研和医疗场景的可信度。比起通用榜单，垂直评测更能说明真实应用能力。',
    category: '论文与技术',
  },
  'Introducing the OpenAI Partner Network': {
    title: 'OpenAI 推出合作伙伴网络',
    summary: 'OpenAI News 介绍 OpenAI Partner Network。它旨在通过合作伙伴帮助企业更快部署 AI 方案，覆盖咨询、集成和行业落地。',
    analysis: '合作伙伴生态是 AI 平台商业化的重要一步。模型能力需要服务商、集成商和行业方案才能进入企业流程。',
    category: '商业融资',
  },
  'New OpenAI Academy courses for the next era of work': {
    title: 'OpenAI Academy 推出面向新工作时代的课程',
    summary: 'OpenAI News 介绍 OpenAI Academy 新课程，面向 AI 改变工作方式后的技能训练。重点是帮助个人和组织学习如何把 AI 放进日常流程。',
    analysis: 'AI 普及最终会落到人的技能重构上。培训和课程生态会成为企业采用 AI 的配套基础设施。',
    category: 'AI 产品工具',
  },
  'Google Home will soon get better at recognizing you': {
    title: 'Google Home 将更擅长识别家庭成员',
    summary: 'The Verge 报道 Google Home 即将提升识别用户的能力。智能家居助手正在变得更个性化，能根据不同家庭成员提供更准确的响应。',
    analysis: '家庭 AI 的关键是身份识别、隐私和上下文记忆。越个性化，越需要处理好数据边界和误识别风险。',
    category: 'AI 产品工具',
  },

  'The White House is asking OpenAI to slow roll the release of its new model over safety concerns': {
    title: '白宫因安全担忧要求 OpenAI 放慢新模型发布',
    summary: 'TechCrunch 报道称，白宫因安全顾虑要求 OpenAI 暂缓或分阶段发布新模型 GPT-5.6。模型发布开始受到政府安全审查影响，说明前沿模型不再只是产品节奏问题。',
    analysis: '这条新闻重要在于，政府可能直接影响大模型发布时间表。企业和开发者需要关注模型可用性、API 节奏和合规要求的变化。',
    category: '政策与安全',
  },
  'OpenAI will delay GPT-5.6 after Trump administration request': {
    title: 'OpenAI 将按政府要求推迟 GPT-5.6 发布',
    summary: 'The Verge 报道称，OpenAI 将在特朗普政府要求后推迟 GPT-5.6 的更广泛发布。发布方式可能从面向公众转向先给少量伙伴测试。',
    analysis: '前沿模型发布正在进入“安全审查 + 分阶段放量”的新阶段。它会影响开发者预期、产品路线和竞争对手节奏。',
    category: '模型更新',
  },
  'Patronus AI lands $50M to build ‘digital worlds’ that stress-test AI agents': {
    title: 'Patronus AI 融资 5000 万美元，用数字世界压力测试 AI 智能体',
    summary: 'Patronus AI 获得 5000 万美元融资，计划构建“数字世界”来压力测试 AI agents。它瞄准的是智能体在复杂任务、工具调用和长流程中的可靠性问题。',
    analysis: '智能体要进入企业流程，必须先证明不会在复杂环境里失控。评测和压力测试会成为 AI agent 生态的基础设施。',
    category: 'AI 产品工具',
  },
  'Ford had to hire back former engineers to fix mistakes made by its automated systems': {
    title: '福特召回前工程师修复自动化系统留下的问题',
    summary: 'The Verge 报道称，福特不得不重新聘请前工程师来修复自动化系统造成的错误。这是一个典型提醒：自动化并不等于无需专业经验。',
    analysis: 'AI 和自动化系统如果缺少人类专家校验，可能把组织知识和生产细节一起丢掉。它对制造业和企业自动化都有警示意义。',
    category: 'AI 大事',
  },
  'Our latest Google Finance upgrades, including a new app': {
    title: 'Google Finance 升级并推出新应用，强化金融信息体验',
    summary: 'Google 宣布 Google Finance 的最新升级，并推出新的 Android 应用。它将金融信息查询、个性化体验和移动端使用结合得更紧。',
    analysis: '金融信息产品正在被 AI 和个性化体验重新包装。对普通用户来说，关键是信息是否更及时、解释是否更清楚。',
    category: 'AI 产品工具',
  },
  'Anthropic’s Claude is winning over paid consumers, a market owned by ChatGPT': {
    title: 'Claude 正在吸引付费用户，挑战 ChatGPT 的消费市场优势',
    summary: 'TechCrunch 报道称，尽管 ChatGPT 仍占据领先地位，越来越多愿意为 AI 付费的消费者开始选择 Anthropic 的 Claude。',
    analysis: '付费用户迁移比免费流量更能说明产品黏性。Claude 的增长意味着消费级 AI 市场并没有完全定型。',
    category: '模型更新',
  },
  'General Intuition’s $2.3B bet that video games can train AI agents for the real world': {
    title: 'General Intuition 押注游戏数据训练现实世界 AI 智能体',
    summary: 'General Intuition 以 23 亿美元估值押注用海量游戏行为数据训练 AI agents。它相信游戏中的行动数据能帮助 AI 学到更接近人类直觉的能力。',
    analysis: '如果游戏数据能迁移到真实世界任务，智能体训练会出现新路径。关键要看这种“动作数据”能否跨场景泛化。',
    category: 'AI 产品工具',
  },
  'Databricks’ former AI chief thinks he can cut AI’s power bill by 1,000x': {
    title: 'Databricks 前 AI 负责人想把 AI 电力成本降低 1000 倍',
    summary: 'TechCrunch 报道 Databricks 前 AI 负责人正在尝试大幅降低 AI 系统的能源开销。目标是让 AI 推理和生成更便宜、更可持续。',
    analysis: 'AI 的成本竞争越来越像能源效率竞争。谁能显著降低功耗，谁就可能改变模型服务的价格结构。',
    category: 'AI 大事',
  },
  'Netris raises $15M Series A from a16z to help AI neoclouds go live faster': {
    title: 'Netris 获 a16z 领投 1500 万美元，帮助 AI 云更快上线',
    summary: 'Netris 完成 1500 万美元 A 轮融资，投资方包括 a16z。它服务 AI neocloud 基础设施，帮助新型 AI 云更快部署网络和算力环境。',
    analysis: 'AI 云服务竞争正在催生新的基础设施公司。网络、部署和运维效率会直接影响算力交付速度。',
    category: '商业融资',
  },
  '2 days left to save up to $190: Join 1,000+ founders and investors at TechCrunch Founder Summit': {
    title: 'TechCrunch 创始人峰会倒计时，创业者和投资人继续涌向 AI 议题',
    summary: 'TechCrunch 推介 Founder Summit 活动，预计吸引大量创始人和投资人参与。虽然它是活动信息，但也反映 AI 创业和资本交流仍然活跃。',
    analysis: '这类活动不是核心技术新闻，但能观察市场热度、融资叙事和创业者关注方向。',
    category: '商业融资',
  },
  'Adobe acquires image and video enhancement tool maker Topaz Labs': {
    title: 'Adobe 收购图像和视频增强工具 Topaz Labs',
    summary: 'Adobe 收购 Topaz Labs，后者专注图像和视频增强工具。Adobe 正在继续补强创意工具链里的 AI 影像处理能力。',
    analysis: '创意软件巨头会通过收购把独立 AI 工具纳入主工作流。对创作者来说，功能会更集中，但工具生态也会进一步整合。',
    category: 'AI 产品工具',
  },
  'Amazon ups India bet with fresh $13B AI infrastructure investment': {
    title: 'Amazon 加码印度，投入 130 亿美元建设 AI 基础设施',
    summary: 'Amazon 宣布继续加大在印度的 AI 基础设施投资，规模达 130 亿美元。投资重点指向云、数据中心和算力能力。',
    analysis: 'AI 基础设施正在全球扩张。印度市场既是云计算增长点，也是未来 AI 应用和开发者生态的重要战场。',
    category: '商业融资',
  },
  'Facebook’s Creator Studio has been revived as an AI companion app': {
    title: 'Facebook 将 Creator Studio 复活为 AI 创作者助手',
    summary: 'The Verge 报道 Facebook 将 Creator Studio 以 AI companion app 的形式重新推出，面向创作者提供内容和运营辅助。',
    analysis: '创作者平台正在把 AI 变成生产力入口。谁能帮创作者省时间、提高互动效率，谁就更能锁住内容供给。',
    category: 'AI 产品工具',
  },
  'Hollywood is bending the knee to OpenAI': {
    title: '好莱坞开始向 OpenAI 靠拢，影视行业 AI 态度转向',
    summary: 'The Verge 报道好莱坞与 OpenAI 的关系正在发生变化。影视行业一边担心版权和工作岗位，一边也开始寻找与 AI 平台合作的方式。',
    analysis: '内容行业对 AI 的态度从抵触走向谈判，会影响版权授权、视频生成产品和创意工作流。',
    category: 'AI 大事',
  },
  'How Preply combines AI and human tutors to personalize learning': {
    title: 'Preply 用 AI 搭配真人教师做个性化学习',
    summary: 'OpenAI News 介绍 Preply 如何把 AI 与真人教师结合，用于个性化学习体验。AI 负责辅助练习、反馈和学习路径，教师保留关键指导角色。',
    analysis: '教育 AI 的可行路径很可能不是替代教师，而是放大教师能力。混合模式更容易被用户和机构接受。',
    category: 'AI 产品工具',
  },
  'How an astrophysicist uses Codex to help simulate black holes': {
    title: '天体物理学家用 Codex 辅助模拟黑洞',
    summary: 'OpenAI News 展示天体物理学家如何使用 Codex 辅助黑洞模拟。AI 编程工具正在进入科研计算和复杂模拟工作。',
    analysis: '科研场景能检验 AI 编程工具的深度能力。它不只是写业务代码，也可能改变科学计算的迭代速度。',
    category: '论文与技术',
  },
  'Supporting Europe’s work in ensuring a trustworthy AI ecosystem': {
    title: 'OpenAI 支持欧洲建设可信 AI 生态',
    summary: 'OpenAI News 介绍其支持欧洲可信 AI 生态建设的工作。重点包括安全、合规、政策合作和企业采用。',
    analysis: '欧洲是全球 AI 监管的重要样板市场。OpenAI 在欧洲的动作会影响合规标准和企业落地节奏。',
    category: '政策与安全',
  },
  'OpenAI to acquire Ona': {
    title: 'OpenAI 将收购 Ona，继续扩展产品与团队能力',
    summary: 'OpenAI News 宣布将收购 Ona。虽然公开信息有限，但这说明 OpenAI 仍在通过并购补强特定产品、人才或技术能力。',
    analysis: 'OpenAI 的收购动作值得关注，因为它往往透露公司下一阶段要补齐的产品或组织短板。',
    category: '商业融资',
  },
  'BBVA puts AI at the core of banking with OpenAI': {
    title: 'BBVA 与 OpenAI 合作，把 AI 放进银行核心流程',
    summary: 'OpenAI News 介绍 BBVA 如何把 AI 纳入银行核心业务。银行业正在从试点工具走向更系统的 AI 工作流改造。',
    analysis: '金融机构采用 AI 的速度和边界，会影响企业级 AI 的合规、审计和风险管理标准。',
    category: 'AI 大事',
  },
  'Our new community investments in Virginia support local jobs and expand energy affordability.': {
    title: 'Google 在弗吉尼亚投资社区与能源项目，支撑数据中心扩张',
    summary: 'Google 介绍其在弗吉尼亚的新社区投资，重点包括本地就业和能源可负担性。背后与数据中心和 AI 基础设施扩张密切相关。',
    analysis: 'AI 基础设施不只需要芯片，还需要电力、社区支持和地方政策。能源议题会越来越影响 AI 扩张速度。',
    category: 'AI 大事',
  },
  'PRC-linked influence operations are targeting AI debates in the US': {
    title: 'OpenAI 称关联中国的影响力行动正瞄准美国 AI 争论',
    summary: 'OpenAI News 称，与中国相关的影响力行动正在针对美国 AI 政策和舆论讨论。AI 议题正在成为国际信息博弈的一部分。',
    analysis: 'AI 安全已经超出模型本身，进入舆论、政策和地缘竞争层面。平台需要更强的监测和溯源能力。',
    category: '政策与安全',
  },
  'From data to decisions: how LSEG is scaling trusted AI': {
    title: 'LSEG 用可信 AI 把数据转化为决策',
    summary: 'OpenAI News 介绍 LSEG 如何规模化部署可信 AI，把金融数据转化为更可用的决策支持。',
    analysis: '金融数据公司采用 AI 的重点是可信度、可解释性和合规。它代表企业级 AI 从工具走向决策基础设施。',
    category: 'AI 产品工具',
  },
  'How engineers at Nextdoor use Codex to build without limits': {
    title: 'Nextdoor 工程师用 Codex 提升开发效率',
    summary: 'OpenAI News 展示 Nextdoor 工程师如何使用 Codex 辅助开发。AI 编程工具正在被放进真实工程团队的日常工作流。',
    analysis: 'AI 编程助手的价值不只在生成代码，而在缩短调试、迁移和维护周期。团队采用方式会决定实际收益。',
    category: 'AI 产品工具',
  },
  'What Codex unlocks for Notion': {
    title: 'Notion 用 Codex 解锁新的产品开发方式',
    summary: 'OpenAI News 介绍 Codex 为 Notion 带来的开发效率和产品协作变化。它展示 AI 编程工具如何进入成熟 SaaS 团队。',
    analysis: '当 Notion 这类产品团队深度使用 Codex，说明 AI 编程正在从个人效率工具走向团队级研发基础设施。',
    category: 'AI 产品工具',
  },

  'Confidential submission of draft S-1 to the SEC': {
    title: 'OpenAI 已向 SEC 秘密递交 S-1 草案',
    summary: 'OpenAI News 确认，公司已向美国 SEC 秘密递交 S-1 草案，但尚未确定下一步行动时间。它释放出 OpenAI 资本市场路径正在推进的信号。',
    analysis: '如果 OpenAI 进一步走向公开市场，外界会更关注收入结构、算力成本、治理架构和长期盈利能力。',
    category: '商业融资',
  },
  'Built to benefit everyone: our plan': {
    title: 'OpenAI 发布“让所有人受益”的 AGI 规划',
    summary: 'OpenAI News 介绍其面向未来 AI 的整体愿景，重点包括普惠访问、安全治理和共享繁荣。核心是解释 OpenAI 如何让 AGI 的收益覆盖更多人群。',
    analysis: '这类声明虽然偏战略，但会影响 OpenAI 的产品叙事、政策沟通和公众信任建设。',
    category: '政策与安全',
  },
  'How Wasmer used Codex to build a Node.js runtime for the edge': {
    title: 'Wasmer 用 Codex 构建边缘端 Node.js 运行时',
    summary: 'OpenAI News 展示 Wasmer 如何使用 Codex 和 GPT-5.5 构建面向边缘计算的 Node.js runtime，并把开发速度提升 10 到 20 倍。',
    analysis: '这是 AI 编程工具进入底层开发场景的案例。它说明 Codex 不只是写业务代码，也能参与运行时和基础设施开发。',
    category: 'AI 产品工具',
  },
  'Travelers deploys AI-powered claims countrywide with OpenAI': {
    title: 'Travelers 与 OpenAI 在全美部署 AI 理赔助手',
    summary: 'OpenAI News 介绍 Travelers 使用 OpenAI 构建 AI-powered Claim Assistant，帮助客户提交理赔、提供 24 小时支持，并在需求高峰期扩展服务能力。',
    analysis: '保险理赔是 AI 落地价值很明确的场景：流程标准、用户焦虑高、客服压力大。关键要看准确性和责任边界。',
    category: 'AI 产品工具',
  },
  'Building the infrastructure for the Intelligence Age in Michigan': {
    title: 'OpenAI 在密歇根建设 Intelligence Age 基础设施',
    summary: 'OpenAI News 介绍其在密歇根启动 1GW 数据中心项目，作为 Stargate 计划的一部分，用于扩展 AI 基础设施、创造就业并支持社区。',
    analysis: 'AI 竞争正在落到数据中心、电力和地方社区支持上。基础设施布局会决定未来模型服务的规模和成本。',
    category: 'AI 大事',
  },
  'Boston Children’s uses AI to unlock new diagnoses': {
    title: '波士顿儿童医院用 AI 帮助发现新的诊断线索',
    summary: 'OpenAI News 介绍波士顿儿童医院使用 OpenAI 技术改善患者护理、减轻运营负担，并帮助诊断 40 多个罕见疾病病例。',
    analysis: '医疗 AI 的关键价值是辅助专业医生更快找到线索，而不是替代医生。可靠性、隐私和临床验证仍然重要。',
    category: 'AI 大事',
  },
  'How Braintrust turns customer requests into code with Codex': {
    title: 'Braintrust 用 Codex 把客户需求更快转成代码',
    summary: 'OpenAI News 展示 Braintrust 工程师如何使用 Codex 和 GPT-5.5 更快运行实验、编写代码，并缩短从客户反馈到产品改动的周期。',
    analysis: '这类案例说明 AI 编程工具的价值正在从个人提效走向产品迭代提速。客户需求到代码交付的链条会被压缩。',
    category: 'AI 产品工具',
  },
  'MUFG aims to become AI-native with OpenAI': {
    title: '三菱日联金融集团与 OpenAI 推进 AI 原生组织转型',
    summary: 'OpenAI News 介绍 MUFG 使用 ChatGPT Enterprise 构建 AI-native 组织，改进内部工作流，并推出新的 AI 金融服务。',
    analysis: '大型金融机构采用 AI 的方式，会影响合规、审计、员工培训和客户服务标准。它是企业级 AI 落地的重要风向。',
    category: 'AI 大事',
  },
  'Cisco and OpenAI redefine enterprise engineering with Codex': {
    title: 'Cisco 与 OpenAI 用 Codex 重塑企业工程流程',
    summary: 'OpenAI News 介绍 Cisco 使用 Codex 推进 AI-native 开发，提升 AI Defense 工作效率，并自动化缺陷修复。',
    analysis: '企业工程团队使用 Codex 的案例，能说明 AI 编程工具是否能进入复杂组织流程，而不只是个人开发者玩具。',
    category: 'AI 产品工具',
  },
  'OpenAI, Grupo Folha and Grupo UOL announce strategic content partnership': {
    title: 'OpenAI 与巴西媒体 Grupo Folha、UOL 达成内容合作',
    summary: 'OpenAI News 宣布与 Grupo Folha 和 Grupo UOL 建立战略内容合作，把可信巴西新闻带入 ChatGPT，并强调署名和透明度。',
    analysis: '媒体内容合作会影响 AI 搜索、新闻分发和版权授权模式。对内容行业来说，这是平台化合作继续扩展的信号。',
    category: '商业融资',
  },
}));

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

function normalizeImageUrl(url = '') {
  const clean = decodeEntities(url).trim();
  if (!/^https?:\/\//i.test(clean)) return '';
  if (/\.(svg)(\?|$)/i.test(clean)) return '';
  return clean.replace(/&amp;/g, '&');
}

function pickImageFromItem(item) {
  const patterns = [
    /<media:content[^>]*url=["']([^"']+)["'][^>]*>/i,
    /<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i,
    /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["'][^>]*>/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = item.match(pattern);
    const image = match ? normalizeImageUrl(match[1]) : '';
    if (image) return image;
  }
  return '';
}

function stableHash(text = '') {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickFallbackImage(category, seed, index) {
  const pool = IMAGE_POOLS[category] || IMAGE_POOLS['AI 大事'];
  return pool[(stableHash(seed) + index) % pool.length];
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

function editorialFor(title = '') {
  return EDITORIAL_OVERRIDES.get(title.trim());
}

function cleanExcerpt(text = '') {
  return stripTags(text)
    .replace(/\s+/g, ' ')
    .replace(/Continue reading.*$/i, '')
    .trim()
    .slice(0, 260);
}

function pickSourceExcerpt(item) {
  return cleanExcerpt(pick(item, 'description') || pick(item, 'summary') || pick(item, 'content:encoded'));
}

function isWeakExcerpt(excerpt = '') {
  return !excerpt || excerpt.length < 12 || /^点击查看原文|^read more|^continue reading/i.test(excerpt);
}

function makeChinaSummary(story) {
  const focus = story.category === '模型更新'
    ? '国内模型能力和发布节奏'
    : story.category === '政策与安全'
      ? '国内外 AI 竞争、合规和治理变化'
      : story.category === '商业融资'
        ? '中国 AI 公司的商业化和资本动向'
        : '中国 AI 产品和企业应用落地';
  return `${story.source} 报道关注「${story.sourceTitle}」。这条适合用来观察${focus}，建议结合原文判断它对行业主线的实际影响。`;
}

function hasChinese(text = '') {
  return /[\u4e00-\u9fff]/.test(text);
}

function isChinaStory(story = {}) {
  const text = `${story.source || ''} ${story.sourceTitle || ''} ${story.title || ''}`;
  return story.region === 'china' || /量子位|InfoQ 中文|Qwen|通义|千问|阿里|腾讯|百度|字节|豆包|DeepSeek|Kimi|月之暗面|智谱|GLM|讯飞|商汤|阶跃星辰|MiniMax|百川|零一万物/.test(text);
}

function isAiRelevant(story = {}) {
  const text = `${story.sourceTitle || ''} ${story.sourceExcerpt || ''}`.toLowerCase();
  return /ai|人工智能|大模型|模型|智能体|agent|agentic|qwen|通义|千问|deepseek|kimi|智谱|glm|豆包|claude|gpt|openai|anthropic|llm|copilot|算力|芯片|机器人|生成式|aigc|机器学习|神经网络|推理|训练|数据集|基准|安全|治理/.test(text);
}

function classify(title, fallbackCategory) {
  const override = editorialFor(title);
  if (override?.category) return override.category;
  const text = title.toLowerCase();
  if (/监管|政策|安全|合规|隐私|版权|诉讼|法律|治理|风险|权限|白宫|政府|国防|regulation|safety|policy|copyright|lawsuit|court|security|privacy|government|election|pentagon|risk|congress|congresswoman|defense|washington|chip war/.test(text)) return '政策与安全';
  if (/论文|研究|数据集|基准|评测|训练|推理|强化学习|科学|开源|paper|research|arxiv|benchmark|training|dataset|robotics|simulation|agentic|eval|scientists/.test(text)) return '论文与技术';
  if (/模型|qwen|通义|千问|deepseek|kimi|智谱|glm|豆包|claude|gpt|gemini|llama|mistral|release|frontier|reasoning/.test(text)) return '模型更新';
  if (/工具|应用|助手|智能体|平台|搜索|编码|copilot|tool|app|browser|assistant|agent|product|launch|workflow|coding|search/.test(text)) return 'AI 产品工具';
  if (/融资|收购|投资|估值|上市|营收|arr|商业|创业|funding|raises|valuation|acquisition|ipo|startup|venture|revenue|deal|investor|earnings|stock/.test(text)) return '商业融资';
  if (/算力|芯片|数据中心|基础设施|企业|job|jobs|workforce|labor|employment|chip|compute|data center/.test(text)) return 'AI 大事';
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

function makeQwenChineseTitle(sourceTitle = '') {
  const qwenTitleMap = [
    [/Qwen3Guard/i, 'Qwen3Guard：Token 流实时安全防护'],
    [/Qwen-Image-Edit/i, 'Qwen-Image-Edit：更高质量的图像编辑模型'],
    [/Qwen-Image:/i, 'Qwen-Image：强化原生文字渲染的图像模型'],
    [/Qwen-MT/i, 'Qwen-MT：更快更智能的机器翻译模型'],
    [/Qwen3-Coder/i, 'Qwen3-Coder：面向智能体编程的代码模型'],
    [/Qwen-TTS/i, 'Qwen-TTS：通义千问语音模型支持更多方言'],
    [/Qwen VLo/i, 'Qwen VLo：从理解世界到生成视觉内容'],
  ];
  const match = qwenTitleMap.find(([pattern]) => pattern.test(sourceTitle));
  return match ? match[1] : `通义千问官方：${sourceTitle}`;
}


const FALLBACK_EDITORIAL_RULES = [
  { pattern: /Anthropic.?s long-sidelined Fable 5 is greenlit to return/i, title: 'Anthropic 长期搁置的 Fable 5 获准回归', summary: 'Anthropic 的 Fable 5 重新获得发布许可，说明前沿模型发布正在安全审查、监管沟通和产品节奏之间反复拉扯。' },
  { pattern: /Netflix is using an AI-generated Gene Wilder voice/i, title: 'Netflix 在真人秀中使用 AI 生成的 Gene Wilder 声音', summary: 'Netflix 在威利·旺卡相关真人秀里使用 AI 生成声音，继续把影视娱乐里的授权、纪念形象和合成内容争议推到台前。' },
  { pattern: /Libby will filter out AI content/i, title: 'Libby 将尝试过滤 AI 内容，但做法并不彻底', summary: '电子书与有声书平台 Libby 开始处理 AI 内容过滤问题，反映内容平台正在面对 AI 生成作品的标注、分发和版权边界。' },
  { pattern: /Google.?s NotebookLM can sum up your research in a TikTok-style clip/i, title: 'Google NotebookLM 可把研究资料生成 TikTok 风格短视频摘要', summary: 'Google 正在把 NotebookLM 从文字和音频摘要扩展到短视频表达，研究资料和知识管理工具正在明显向多媒体化发展。' },
  { pattern: /OpenClaw is finally available on Android and iOS/i, title: 'OpenClaw 终于登陆 Android 和 iOS', summary: 'OpenClaw 推出移动端版本，说明 AI 原生应用正在从桌面和网页继续迁移到手机入口。' },
  { pattern: /DeepMind trio who built a poker AI.*quant hedge funds/i, title: 'DeepMind 三位扑克 AI 作者转向量化对冲基金', summary: '曾参与扑克 AI 的 DeepMind 团队成员转向量化投资，显示强化学习、博弈推理和金融交易之间的技术迁移正在加速。' },
  { pattern: /Meet the lawyer who beat Elon Musk/i, title: '两次击败马斯克的律师进入科技诉讼焦点', summary: '这篇报道聚焦与马斯克相关的诉讼人物。它和 AI 行业的关系在于，科技巨头的竞争正越来越多地进入法律和监管战场。' },
  { pattern: /Google introduces a faster, cheaper image generator with Nano Banana 2 Lite/i, title: 'Google 推出更快更便宜的 Nano Banana 2 Lite 图像生成器', summary: 'Google 发布更低成本的图像生成模型，重点是把生成式视觉能力做得更快、更便宜，方便进入更多产品场景。' },
  { pattern: /Nvidia competitor Etched hits \$5B valuation, \$1B in sales for AI chip/i, title: 'AI 芯片公司 Etched 估值达 50 亿美元，销售额冲上 10 亿美元', summary: 'Nvidia 竞争者 Etched 获得高估值和大额销售数据，说明 AI 芯片市场正在从“只有 GPU”转向更多专用推理芯片竞争。' },
  { pattern: /Anthropic launches Claude Sonnet 5 as a cheaper way to run agents/i, title: 'Anthropic 发布 Claude Sonnet 5，降低智能体运行成本', summary: 'Anthropic 推出更适合智能体任务的 Claude Sonnet 5，核心看点是用更低成本支撑长流程、多步骤的 AI agent。' },
  { pattern: /Acti puts AI agents directly into your smartphone keyboard/i, title: 'Acti 把 AI 智能体直接放进手机键盘', summary: 'Acti 试图把 AI agent 放到输入法入口，让智能体更贴近日常沟通、搜索和操作场景。' },
  { pattern: /Claude Science bets on workflow, not a new model/i, title: 'Anthropic 的 Claude Science 押注科研工作流，而不是单纯发新模型', summary: 'Anthropic 面向科研场景强调工作流整合，说明科学 AI 的竞争不只看模型指标，也看能否进入研究人员真实流程。' },
  { pattern: /Lumo, Proton.?s privacy-focused AI chatbot, gets an upgrade/i, title: 'Proton 升级隐私优先的 AI 聊天机器人 Lumo', summary: 'Proton 更新 Lumo，主打隐私保护的 AI 聊天体验。它反映用户对 AI 工具的数据边界和隐私承诺越来越敏感。' },
  { pattern: /X now offers an MCP server/i, title: 'X 推出 MCP Server，让 AI 工具更容易接入平台', summary: 'X 提供 MCP Server，方便外部 AI 工具调用平台能力。MCP 正在成为应用和智能体之间连接数据、工具与服务的新接口。' },
  { pattern: /Podcasting platform Riverside enters the newsletter publishing game/i, title: '播客平台 Riverside 进军 Newsletter 发布工具', summary: 'Riverside 从播客制作扩展到 Newsletter 发布，内容创作平台正在把音视频、文字和分发工具打包到同一工作流里。' },
  { pattern: /Amazon launches new \$1 billion FDE org/i, title: 'Amazon 成立 10 亿美元 FDE 组织，追随 OpenAI 与 Anthropic 的企业落地打法', summary: 'Amazon 建立新的前线部署工程组织，显示大模型公司正在用更贴近客户现场的团队推动企业级 AI 落地。' },
  { pattern: /How ChatGPT adoption has expanded/i, title: 'ChatGPT 的采用范围继续扩大', summary: 'OpenAI 介绍 ChatGPT 的采用变化，重点是 AI 从个人工具扩展到企业、教育和专业工作流中的速度。' },
  { pattern: /OKX wants AI agents to hire and pay each other/i, title: 'OKX 设想让 AI 智能体彼此雇佣并支付报酬', summary: 'OKX 把加密支付和 AI agent 结合，试图让智能体之间可以完成雇佣、结算和协作。' },
  { pattern: /The AI jobs debate just got messier/i, title: 'AI 对就业的影响争论变得更复杂', summary: '关于 AI 是否取代工作的争论出现更多矛盾证据。真正值得关注的是岗位内容、工资结构和技能要求如何变化。' },
  { pattern: /Tidal won.?t pay royalties on AI-generated music/i, title: 'Tidal 不会为 AI 生成音乐支付版税，但也不完全封禁', summary: 'Tidal 对 AI 生成音乐采取折中政策，不支付版税但也不彻底禁止，音乐平台正在寻找版权、创作者权益和 AI 内容之间的平衡。' },
  { pattern: /OpenAI is teasing new hardware.*Codex/i, title: 'OpenAI 暗示将推出面向 Codex 的新硬件', summary: 'OpenAI 预告与 Codex 相关的新硬件，可能意味着 AI 编程助手未来会和专用设备或新交互方式结合。' },
  { pattern: /Lawmakers want to ban AI companies from selling your health data/i, title: '美国议员拟禁止 AI 公司出售用户健康数据', summary: '美国议员希望限制 AI 公司出售健康数据，医疗与个人数据正在成为 AI 监管里的高敏感区域。' },
  { pattern: /Unlocking Britain.?s next era of productivity/i, title: 'Google 推动英国 AI 生产力计划，培养 AI 先行者', summary: 'Google AI Blog 介绍面向英国的 AI 生产力计划，重点是培训、企业采用和国家层面的 AI 能力建设。' },
  { pattern: /Introducing GeneBench-Pro/i, title: 'OpenAI 发布 GeneBench-Pro，评估基因相关 AI 能力', summary: 'OpenAI 推出 GeneBench-Pro，用于评估模型在基因、生物和生命科学任务上的表现。' },
  { pattern: /Core dump epidemiology: fixing an 18-year-old bug/i, title: 'OpenAI 通过 core dump 分析修复 18 年老 bug', summary: 'OpenAI 分享一次长期软件缺陷的定位和修复过程，展示 AI 与工程诊断工具在复杂系统维护中的价值。' },
  { pattern: /Trump drops restrictions on Anthropic.?s Mythos and Fable models/i, title: '特朗普政府取消 Anthropic Mythos 与 Fable 模型限制', summary: '美国政府放松对 Anthropic 前沿模型的限制，说明模型发布正在安全审查、产业竞争和政策博弈之间不断调整。' },
  { pattern: /Wayve launches \$85M employee tender offer at \$8\.5B valuation/i, title: '自动驾驶 AI 公司 Wayve 以 85 亿美元估值启动员工股权回购', summary: 'Wayve 启动 8500 万美元员工股权回购，估值达到 85 亿美元，说明自动驾驶与具身智能方向仍受到资本关注。' },
  { pattern: /Inside Genebench-Pro/i, title: 'OpenAI 详解 GeneBench-Pro 的生命科学评测方法', summary: 'OpenAI 进一步介绍 GeneBench-Pro，重点是如何评估模型在基因和生命科学任务中的可靠性。' },
];

function fallbackEditorialFor(sourceTitle = '') {
  return FALLBACK_EDITORIAL_RULES.find(({ pattern }) => pattern.test(sourceTitle));
}
function makeOpenAINewsTitle(sourceTitle = '') {
  const accessMatch = sourceTitle.match(/Access OpenAI models and Codex through your (.+?) cloud commitment/i);
  if (accessMatch) return `可通过 ${accessMatch[1]} 云承诺使用 OpenAI 模型和 Codex`;
  const codexMatch = sourceTitle.match(/How (.+?) ships faster with Codex/i);
  if (codexMatch) return `${codexMatch[1]} 用 Codex 加快软件交付`;
  const careMatch = sourceTitle.match(/(.+?) advances .*care with OpenAI/i);
  if (careMatch) return `${careMatch[1]} 用 OpenAI 推进医疗护理服务`;
  if (/Education for Countries/i.test(sourceTitle)) return 'OpenAI 推进国家级 AI 教育计划下一阶段';
  if (/infrastructure for the Intelligence Age/i.test(sourceTitle)) return 'OpenAI 推进智能时代基础设施建设';
  if (/benefit everyone/i.test(sourceTitle)) return 'OpenAI 公布让 AI 惠及更多人的计划';
  if (/Frontier strategic partnership/i.test(sourceTitle)) return 'HP 与 OpenAI 扩大战略合作，推进企业级 AI 落地';
  if (/disproved a central conjecture in discrete geometry/i.test(sourceTitle)) return 'OpenAI 模型推翻离散几何中的核心猜想';
  if (/Ramp engineers accelerate code review with Codex/i.test(sourceTitle)) return 'Ramp 工程师用 Codex 加速代码审查';
  const fallback = fallbackEditorialFor(sourceTitle);
  if (fallback) return fallback.title;
  return makeKeywordTitle(sourceTitle, 'OpenAI News', classify(sourceTitle, 'AI 大事'));
}
function makeFallbackChineseTitle(sourceTitle = '', source = '', category = '') {
  const rules = [
    [/Z\.ai.*match Mythos.*cybersecurity/i, '智谱 Z.ai 称其模型在网络安全任务上可媲美 Mythos'],
    [/Suno launches Spark incubator/i, 'Suno 推出 Spark 孵化计划，扶持独立音乐人进入 AI 音乐生态'],
    [/Ford rehires.*engineers.*AI falls short/i, 'AI 自动化未达预期，福特返聘资深工程师救场'],
    [/Prosecutors used ChatGPT logs/i, '检方在 Palisades 火灾案中使用 ChatGPT 记录作为证据'],
    [/Wall Street.*Micron.*next Nvidia/i, '华尔街为何把美光视为下一个 NVIDIA'],
    [/Margaret Atwood.*garbage in, garbage out/i, '玛格丽特·阿特伍德批评 AI：垃圾进，垃圾出'],
    [/Anthropic.*Mythos 5 is back/i, 'Anthropic 的 Mythos 5 模型重新上线'],
    [/Anthropic.*Mythos mess/i, 'Anthropic 的 Mythos 发布风波继续升级'],
    [/OpenAI.*SpaceX.*own chips/i, '从 OpenAI 到 SpaceX，科技巨头为何纷纷自研 AI 芯片'],
    [/Jalape(?:ñ|n)o chip.*Nvidia/i, 'OpenAI 的 Jalapeño 芯片让大厂加速摆脱 NVIDIA 依赖'],
  ];
  const fallback = fallbackEditorialFor(sourceTitle);
  if (fallback) return fallback.title;
  const matched = rules.find(([pattern]) => pattern.test(sourceTitle));
  if (matched) return matched[1];

  return makeKeywordTitle(sourceTitle, source, category);
}

function makeKeywordTitle(sourceTitle = '', source = '', category = '') {
  const subject = primarySubject(sourceTitle) || source;
  const categoryPhrases = {
    'AI 大事': '重要 AI 动态',
    '模型更新': '模型与能力更新',
    'AI 产品工具': 'AI 产品工具动态',
    '论文与技术': 'AI 技术研究动态',
    '商业融资': 'AI 商业与融资动态',
    '政策与安全': 'AI 政策与安全动态',
  };
  return `${subject}：${categoryPhrases[category] || 'AI 行业动态'}`;
}

function makeChineseTitle(sourceTitle, source, category) {
  const override = editorialFor(sourceTitle);
  if (override?.title) return override.title;
  if (hasChinese(sourceTitle)) return sourceTitle;
  if (source === 'Qwen Blog') return makeQwenChineseTitle(sourceTitle);
  if (source === 'OpenAI News') return makeOpenAINewsTitle(sourceTitle);
  return makeFallbackChineseTitle(sourceTitle, source, category);
}

function makeEnglishSourceSummary(story) {
  const fallback = fallbackEditorialFor(story.sourceTitle);
  const title = makeChineseTitle(story.sourceTitle, story.source, story.category);
  const theme = {
    'AI 大事': '它可能影响行业主线、公司竞争和后续产品节奏。',
    '模型更新': '重点看模型能力、开放策略和真实任务表现是否发生变化。',
    'AI 产品工具': '重点看它是否会改变创作者、开发者或企业用户的日常工作流。',
    '论文与技术': '重点看技术路线是否能从论文或实验走向真实产品。',
    '商业融资': '重点看资本和产业资源正在流向哪些 AI 场景。',
    '政策与安全': '重点看它对合规、安全、模型访问和公众信任的影响。',
  }[story.category] || '重点看它对 AI 行业后续走向的实际影响。';
  return `${story.source} 报道关注「${title}」。${theme}英文原题保留在卡片下方，方便回到原文核对细节。`;
}

function makeSummary(story) {
  const override = editorialFor(story.sourceTitle);
  if (override?.summary) return override.summary;
  if (story.source === 'Qwen Blog') return makeChinaSummary(story);
  if (isChinaStory(story) && isWeakExcerpt(story.sourceExcerpt)) return makeChinaSummary(story);
  if (story.sourceExcerpt && !isWeakExcerpt(story.sourceExcerpt)) {
    if (story.region === 'china' || hasChinese(story.sourceExcerpt)) {
      return `${story.source} 报道：${story.sourceExcerpt}`;
    }
    return makeEnglishSourceSummary(story);
  }
  return `这条新闻关注「${makeChineseTitle(story.sourceTitle, story.source, story.category)}」。它被归入「${story.category}」，建议重点看它对产品路线、成本结构、监管环境或行业竞争的实际影响。`;
}

function makeAnalysis(story) {
  const override = editorialFor(story.sourceTitle);
  if (override?.analysis) return override.analysis;
  if (isChinaStory(story)) {
    return '这条来自中国 AI 生态，适合用来补足国内模型、产品、算力、政策和资本动向的观察。重点看它是否会改变国内 AI 应用落地和企业采用节奏。';
  }

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
  for (const keyword of ['OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Nvidia', 'Meta', 'Claude', 'Gemini', 'GPT', 'Qwen', 'DeepSeek', 'Kimi', '智谱', '豆包', '通义', 'agent', 'robotics', 'arXiv']) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) tags.add(keyword.replace('agent', '智能体').replace('robotics', '机器人'));
  }
  if (isChinaStory(story)) tags.add('中国 AI');
  tags.add(story.category.replace('AI ', ''));
  tags.add(story.source);
  return [...tags].slice(0, 5);
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
    const story = {
      sourceTitle,
      title: sourceTitle,
      source: feed.source,
      region: feed.region || 'global',
      url: pickLink(item) || feed.url,
      image: pickImageFromItem(item),
      sourceExcerpt: pickSourceExcerpt(item),
      published: Number.isNaN(published.getTime()) ? new Date() : published,
      category: classify(sourceTitle, feed.category),
    };
    return story;
  }).filter((item) => item.sourceTitle && item.url && (!feed.requireAi || isAiRelevant(item)));
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
      image: '',
      sourceExcerpt: cleanExcerpt(pick(entry, 'summary')),
      published: Number.isNaN(published.getTime()) ? new Date() : published,
      category: '论文与技术',
    };
  }).filter((item) => item.sourceTitle && item.url);
}

function scoreStory(story, index) {
  const sourceScore = SOURCE_WEIGHT.get(story.source) || 12;
  const categoryScore = story.category === 'AI 大事' ? 10 : story.category === '政策与安全' ? 7 : 5;
  const recencyScore = Math.max(0, 24 - Math.floor((Date.now() - story.published.getTime()) / 36e5));
  const text = `${story.sourceTitle || ''} ${story.sourceExcerpt || ''}`;
  let qualityScore = 0;
  if (isChinaStory(story)) {
    if (/发布|模型|平台|产品|工具|智能体|企业|融资|投资|ARR|算力|芯片|基础设施|科大讯飞|智谱|GLM|通义|千问|Qwen|DeepSeek|Kimi|豆包|腾讯|阿里|百度|字节|商汤/.test(text)) qualityScore += 6;
    if (/WAIC|WAVES|报名|大会|峰会|论坛|联名|盛夏|活动|直播|回放|嘉宾|\d+月\d+日|深圳|上海|北京/.test(text)) qualityScore -= 36;
  }
  return sourceScore + categoryScore + recencyScore + qualityScore - index * 0.05;
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
    sourceExcerpt: raw.sourceExcerpt || '',
    source: raw.source,
    region: raw.region || 'global',
    url: raw.url,
    time: timeInShanghai(raw.published),
    importance: index < 5 ? '高' : '中',
    tags: [],
    image: raw.image || pickFallbackImage(category, raw.sourceTitle, index),
    size: ['cover', 'tall', 'wide', 'medium', 'small'][index % 5],
    readMinutes: 3 + (index % 3),
  };
  story.summary = makeSummary(story);
  story.analysis = makeAnalysis(story);
  story.tags = makeTags(story);
  return story;
}

function selectDailyStories(scored) {
  const selected = [];
  const seen = new Set();
  let chinaCount = 0;

  const keyFor = (entry) => `${entry.story.source}-${entry.story.sourceTitle}`;
  const add = (entry) => {
    const key = keyFor(entry);
    if (seen.has(key) || selected.length >= STORY_LIMIT) return false;
    if (isChinaStory(entry.story) && chinaCount >= CHINA_STORY_MAX) return false;
    seen.add(key);
    selected.push(entry);
    if (isChinaStory(entry.story)) chinaCount += 1;
    return true;
  };

  for (const entry of scored) {
    if (selected.length >= STORY_LIMIT) break;
    add(entry);
  }

  const chinaCandidates = scored.filter(({ story }) => isChinaStory(story));
  const balancedChinaCandidates = [
    ...['量子位', 'Qwen Blog', 'InfoQ 中文']
      .map((source) => chinaCandidates.find(({ story }) => story.source === source))
      .filter(Boolean),
    ...chinaCandidates,
  ];

  for (const entry of balancedChinaCandidates) {
    if (chinaCount >= CHINA_STORY_MIN) break;
    const key = keyFor(entry);
    if (seen.has(key)) continue;

    const replaceIndex = [...selected]
      .map((candidate, index) => ({ candidate, index }))
      .reverse()
      .find(({ candidate }) => !isChinaStory(candidate.story))?.index;
    if (replaceIndex === undefined) break;

    selected[replaceIndex] = entry;
    seen.add(key);
    chinaCount += 1;
  }

  return selected.sort((a, b) => b.score - a.score).slice(0, STORY_LIMIT);
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
  const scored = dedupe(fetched)
    .map((story, index) => ({ story, score: scoreStory(story, index) }))
    .sort((a, b) => b.score - a.score);
  const ranked = selectDailyStories(scored)
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
























