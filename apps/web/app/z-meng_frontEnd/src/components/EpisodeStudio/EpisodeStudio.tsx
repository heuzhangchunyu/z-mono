import { Alert, Button, Input, Skeleton, Typography } from 'antd';
import { Fragment, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { listEpisodes, type EpisodeItem } from '../../services/episode/episode';
import './EpisodeStudio.less';

interface EpisodeStudioProps {
  username: string;
}

type EpisodeStageKey = 'script' | 'subject' | 'keyframes' | 'video-production';

interface EpisodeStage {
  key: EpisodeStageKey;
  label: string;
}

const episodeStages: EpisodeStage[] = [
  {
    key: 'script',
    label: '剧本'
  },
  {
    key: 'subject',
    label: '主体'
  },
  {
    key: 'keyframes',
    label: '关键帧'
  },
  {
    key: 'video-production',
    label: '视频制作'
  }
];

function isEpisodeStageKey(value: string): value is EpisodeStageKey {
  return episodeStages.some((stage) => stage.key === value);
}

export default function EpisodeStudio({ username }: EpisodeStudioProps) {
  const { episodeId } = useParams<{ episodeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<EpisodeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedStages, setCompletedStages] = useState<EpisodeStageKey[]>([]);

  useEffect(() => {
    void loadEpisode();
  }, [episodeId]);

  useEffect(() => {
    if (!episodeId) {
      setCompletedStages([]);
      return;
    }

    const rawValue = window.sessionStorage.getItem(getEpisodeStageStorageKey(episodeId));
    if (!rawValue) {
      setCompletedStages([]);
      return;
    }

    try {
      const parsed = JSON.parse(rawValue);
      const normalized = Array.isArray(parsed)
        ? parsed.filter((item): item is EpisodeStageKey => typeof item === 'string' && isEpisodeStageKey(item))
        : [];
      setCompletedStages(normalized);
    } catch {
      setCompletedStages([]);
    }
  }, [episodeId]);

  useEffect(() => {
    if (!episodeId) {
      return;
    }

    window.sessionStorage.setItem(
      getEpisodeStageStorageKey(episodeId),
      JSON.stringify(completedStages)
    );
  }, [completedStages, episodeId]);

  const loadEpisode = async () => {
    if (!episodeId) {
      setEpisode(null);
      setLoading(false);
      setErrorMessage('缺少剧集 ID。');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const response = await listEpisodes();
      const matched = response.data.find((item) => item.scriptId === Number(episodeId)) ?? null;

      if (!matched) {
        setEpisode(null);
        setErrorMessage('未找到对应剧集。');
        return;
      }

      setEpisode(matched);
    } catch (error) {
      console.error('Failed to load episode detail.', error);
      setEpisode(null);
      setErrorMessage('剧集详情加载失败。');
    } finally {
      setLoading(false);
    }
  };

  if (!episodeId) {
    return <Navigate to="/creation" replace />;
  }

  const currentStageKey = episodeStages.find((stage) => location.pathname.endsWith(`/${stage.key}`))?.key ?? 'script';
  const currentStageIndex = episodeStages.findIndex((stage) => stage.key === currentStageKey);
  const completedCount = getCompletedStageCount(completedStages);
  const highestUnlockedIndex = Math.min(completedCount, episodeStages.length - 1);
  const redirectStageKey = episodeStages[Math.max(highestUnlockedIndex, 0)]?.key ?? 'script';

  if (currentStageIndex > highestUnlockedIndex) {
    return <Navigate to={`/creation/episodes/${episodeId}/${redirectStageKey}`} replace />;
  }

  const markStageCompleted = (stageKey: EpisodeStageKey) => {
    const stageIndex = episodeStages.findIndex((stage) => stage.key === stageKey);
    if (stageIndex === -1 || stageIndex > highestUnlockedIndex || completedStages.includes(stageKey)) {
      return;
    }

    const nextCompletedStages = [...completedStages, stageKey];
    setCompletedStages(nextCompletedStages);

    const nextStage = episodeStages[stageIndex + 1];
    if (nextStage) {
      navigate(`/creation/episodes/${episodeId}/${nextStage.key}`);
    }
  };

  return (
    <section className="zmeng-episode-studio">
      <header className="zmeng-episode-studio__hero">
        <nav className="zmeng-episode-studio__milestones" aria-label="剧集制作里程碑">
          {episodeStages.map((stage, index) => (
            <Fragment key={stage.key}>
              {index > 0 ? <span className="zmeng-episode-studio__milestone-separator">-----</span> : null}
              {index <= highestUnlockedIndex ? (
                <Link
                  to={`/creation/episodes/${episodeId}/${stage.key}`}
                  className={[
                    'zmeng-episode-studio__milestone',
                    currentStageKey === stage.key ? 'is-active' : '',
                    completedStages.includes(stage.key) ? 'is-completed' : ''
                  ].filter(Boolean).join(' ')}
                >
                  {stage.label}
                </Link>
              ) : (
                <span className="zmeng-episode-studio__milestone is-locked">{stage.label}</span>
              )}
            </Fragment>
          ))}
        </nav>

        <Typography.Title level={2} className="zmeng-episode-studio__title">
          {loading ? '加载剧集中...' : episode?.episodeName ?? '剧集创作页'}
        </Typography.Title>

        <Link to="/creation" className="zmeng-episode-studio__back-link">
          返回剧集列表
        </Link>
      </header>

      <section className="zmeng-episode-studio__content">
        {loading ? (
          <div className="zmeng-episode-studio__panel">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <Alert
            className="zmeng-episode-studio__alert"
            type="error"
            showIcon
            message={errorMessage}
          />
        ) : null}

        {!loading && episode ? (
          <Routes>
            <Route index element={<Navigate to="script" replace />} />
            {episodeStages.map((stage) => (
              <Route
                key={stage.key}
                path={stage.key}
                element={(
                  <EpisodeStagePanel
                    episode={episode}
                    username={username}
                    stage={stage}
                    isCompleted={completedStages.includes(stage.key)}
                    canComplete={stage.key === currentStageKey && currentStageIndex === highestUnlockedIndex}
                    onComplete={() => markStageCompleted(stage.key)}
                  />
                )}
              />
            ))}
            <Route path="*" element={<Navigate to="script" replace />} />
          </Routes>
        ) : null}
      </section>
    </section>
  );
}

interface EpisodeStagePanelProps {
  episode: EpisodeItem;
  username: string;
  stage: EpisodeStage;
  isCompleted: boolean;
  canComplete: boolean;
  onComplete: () => void;
}

function EpisodeStagePanel({ episode, username, stage, isCompleted, canComplete, onComplete }: EpisodeStagePanelProps) {
  const [scriptDraft, setScriptDraft] = useState(episode.scriptContent);

  if (stage.key === 'script') {
    return (
      <article className="zmeng-episode-studio__panel zmeng-episode-studio__panel--script">
        <div className="zmeng-episode-studio__script-layout">
          <div className="zmeng-episode-studio__script-editor">
            <Input.TextArea
              value={scriptDraft}
              onChange={(event) => setScriptDraft(event.target.value)}
              className="zmeng-episode-studio__script-textarea"
              autoSize={false}
            />
          </div>

          <div className="zmeng-episode-studio__script-footer">
            <Button type="primary" size="large" onClick={onComplete} disabled={!canComplete}>
              下一步
            </Button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="zmeng-episode-studio__panel">
      <div className="zmeng-episode-studio__panel-head">
        <div>
          <Typography.Title level={3} className="zmeng-episode-studio__panel-title">
            {stage.label}
          </Typography.Title>
          <Typography.Text className="zmeng-episode-studio__panel-meta">
            当前剧集：{episode.episodeName} / 用户：{episode.username ?? username}
          </Typography.Text>
        </div>
      </div>

      <Typography.Paragraph className="zmeng-episode-studio__panel-copy">
        这里先保留为“{stage.label}”里程碑的内容区占位。你告诉我这个里程碑需要展示什么，我再把这一块替换成具体模块。
      </Typography.Paragraph>

      <div className="zmeng-episode-studio__panel-actions">
        {isCompleted ? (
          <span className="zmeng-episode-studio__panel-status">当前里程碑已完成</span>
        ) : null}

        {!isCompleted && canComplete ? (
          <Button type="primary" size="large" onClick={onComplete}>
            完成当前里程碑
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function getEpisodeStageStorageKey(episodeId: string): string {
  return `zmeng-episode-stage-progress:${episodeId}`;
}

function getCompletedStageCount(completedStages: EpisodeStageKey[]): number {
  let count = 0;

  for (const stage of episodeStages) {
    if (!completedStages.includes(stage.key)) {
      break;
    }
    count += 1;
  }

  return count;
}
