import { useEffect, useMemo, useState } from 'react';
import fallbackDailyNews from './data/daily-news.json';
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

const REMOTE_DATA_URL = 'https://qinmeng827-cpu.github.io/today-ai/data/daily-news.json';
const fallbackStories = fallbackDailyNews.stories;
const fallbackDates = fallbackDailyNews.dates;

function getDataUrls() {
  const localDataUrl = `${import.meta.env.BASE_URL}data/daily-news.json`;
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocal ? [REMOTE_DATA_URL, localDataUrl] : [localDataUrl, REMOTE_DATA_URL];
}

async function fetchLatestNewsData() {
  const urls = getDataUrls();
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.stories) || !data.stories.length) {
        throw new Error('daily-news.json has no stories');
      }
      return data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

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

function App() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [newsData, setNewsData] = useState(fallbackDailyNews);
  const [dataStatus, setDataStatus] = useState('读取内置日报');
  const [selectedDate, setSelectedDate] = useState(fallbackDates[0]);
  const [selectedStoryId, setSelectedStoryId] = useState(fallbackStories[0].id);
  const [favorites, setFavorites] = useLocalMap('today-ai:favorites');
  const [readItems, setReadItems] = useLocalMap('today-ai:read');
  const [notes, setNotes] = useLocalMap('today-ai:notes');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState('今日日报已就绪');
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = Number(localStorage.getItem('today-ai:drawer-width'));
    return Number.isFinite(saved) && saved >= 360 ? saved : 560;
  });
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);

  const seedStories = newsData.stories || fallbackStories;
  const dates = newsData.dates || fallbackDates;

  const allStories = useMemo(() => seedStories, [seedStories]);

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

  useEffect(() => {
    loadLatestNews();
  }, []);

  function toggleMap(setter, id) {
    setter((current) => ({ ...current, [id]: !current[id] }));
  }

  async function loadLatestNews() {
    setIsGenerating(true);
    setGenerationLog('正在同步最新日报');
    try {
      const data = await fetchLatestNewsData();
      setNewsData(data);
      const nextDate = data.dates?.[0] || data.stories?.[0]?.date || selectedDate;
      const nextStory = data.stories?.find((story) => story.date === nextDate) || data.stories?.[0];
      if (nextDate) setSelectedDate(nextDate);
      if (nextStory) setSelectedStoryId(nextStory.id);
      const generatedDate = data.generatedAt ? new Date(data.generatedAt).toLocaleString('zh-CN') : '刚刚';
      setDataStatus(`已同步：${generatedDate}`);
      setGenerationLog(`已载入 ${data.stories.length} 条最新日报`);
    } catch (error) {
      setDataStatus('同步失败，使用本地内置日报');
      setGenerationLog('同步失败，已保留本地日报');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleGenerate() {
    loadLatestNews();
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
          <strong>{generationLog} · {dataStatus}</strong>
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
            <p className="source-title" translate="no">{selectedStory.sourceTitle}</p>
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
        <p className="source-title" translate="no">{story.sourceTitle}</p>
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









