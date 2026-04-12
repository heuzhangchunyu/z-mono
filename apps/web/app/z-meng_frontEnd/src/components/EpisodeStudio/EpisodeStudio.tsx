import { Alert, Button, Input, Modal, Skeleton, Typography, message } from 'antd';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  generateEpisodeSubjectImage,
  getEpisodeSubjectImages,
  getEpisodeSubjects,
  listEpisodes,
  type EpisodeItem,
  type EpisodeSubjectImageFeed,
  type EpisodeSubjectImageRecord,
  type EpisodeSubjectItem,
  type EpisodeSubjectsItem,
  triggerEpisodeSubjectsExtraction,
  updateEpisodeScript,
  updateEpisodeStage
} from '../../services/episode/episode';
import './EpisodeStudio.less';

type EpisodeStageKey = 'script' | 'subject' | 'keyframes' | 'video-production';

interface EpisodeStage {
  key: EpisodeStageKey;
  label: string;
}

interface SubjectSection {
  key: 'character' | 'scene' | 'prop';
  label: string;
  placeholderName: string;
}

type SubjectSectionKey = SubjectSection['key'];

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

const subjectSections: SubjectSection[] = [
  {
    key: 'character',
    label: '角色',
    placeholderName: '默认角色'
  },
  {
    key: 'scene',
    label: '场景',
    placeholderName: '默认场景'
  },
  {
    key: 'prop',
    label: '道具',
    placeholderName: '默认道具'
  }
];

export default function EpisodeStudio() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<EpisodeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingScript, setSavingScript] = useState(false);
  const [advancingStage, setAdvancingStage] = useState(false);
  const [subjectState, setSubjectState] = useState<EpisodeSubjectsItem | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [triggeringSubjectExtraction, setTriggeringSubjectExtraction] = useState(false);
  const [activeSubjectItem, setActiveSubjectItem] = useState<EpisodeSubjectItem | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    void loadEpisode();
  }, [episodeId]);

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

  const currentRouteStageKey = episodeStages.find((stage) => location.pathname.endsWith(`/${stage.key}`))?.key ?? 'script';
  const storedStageKey = episode?.currentStage ?? 'script';
  const currentStageIndex = episodeStages.findIndex((stage) => stage.key === storedStageKey);
  const highestUnlockedIndex = Math.max(currentStageIndex, 0);
  const redirectStageKey = episodeStages[Math.max(highestUnlockedIndex, 0)]?.key ?? 'script';
  const completedStages = useMemo(
    () => episodeStages.filter((_stage, index) => index < highestUnlockedIndex).map((stage) => stage.key),
    [highestUnlockedIndex]
  );

  useEffect(() => {
    if (!episode || currentRouteStageKey !== 'subject') {
      return;
    }

    void loadSubjectState(episode.scriptId);
  }, [episode?.scriptId, currentRouteStageKey]);

  useEffect(() => {
    if (!episode || currentRouteStageKey !== 'subject' || subjectState?.status !== 'processing') {
      return;
    }

    const timer = window.setInterval(() => {
      void loadSubjectState(episode.scriptId, true);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [episode?.scriptId, currentRouteStageKey, subjectState?.status]);

  if (episode && episodeStages.findIndex((stage) => stage.key === currentRouteStageKey) > highestUnlockedIndex) {
    return <Navigate to={`/creation/episodes/${episodeId}/${redirectStageKey}`} replace />;
  }

  const markStageCompleted = async (stageKey: EpisodeStageKey) => {
    const stageIndex = episodeStages.findIndex((stage) => stage.key === stageKey);
    const nextStage = episodeStages[stageIndex + 1];

    if (!episode || !nextStage || stageIndex === -1 || stageIndex !== highestUnlockedIndex) {
      return;
    }

    try {
      setAdvancingStage(true);
      const response = await updateEpisodeStage(episode.scriptId, nextStage.key);
      setEpisode(response.data);
      navigate(`/creation/episodes/${episodeId}/${nextStage.key}`);
    } catch (error) {
      console.error('Failed to update episode stage.', error);
      messageApi.error('里程碑状态更新失败');
    } finally {
      setAdvancingStage(false);
    }
  };

  const handleScriptNext = async (scriptContent: string) => {
    if (!episode || savingScript) {
      return;
    }

    try {
      setSavingScript(true);
      const response = await updateEpisodeScript(episode.scriptId, scriptContent);
      setEpisode(response.data);
      navigate(`/creation/episodes/${episodeId}/${response.data.currentStage}`);
    } catch (error) {
      console.error('Failed to update episode script.', error);
      messageApi.error('剧本保存失败');
    } finally {
      setSavingScript(false);
    }
  };

  const handleExtractSubjects = () => {
    void triggerSubjectExtraction();
  };

  const handleOpenSubjectStudio = (subjectItem: EpisodeSubjectItem) => {
    setActiveSubjectItem(subjectItem);
  };

  const loadSubjectState = async (scriptId: number, silent = false) => {
    try {
      if (!silent) {
        setSubjectLoading(true);
      }

      const response = await getEpisodeSubjects(scriptId);
      setSubjectState(response.data);
    } catch (error) {
      console.error('Failed to load episode subjects.', error);
      if (!silent) {
        messageApi.error('主体信息加载失败');
      }
    } finally {
      if (!silent) {
        setSubjectLoading(false);
      }
    }
  };

  const triggerSubjectExtraction = async () => {
    if (!episode || triggeringSubjectExtraction) {
      return;
    }

    try {
      setTriggeringSubjectExtraction(true);
      const response = await triggerEpisodeSubjectsExtraction(episode.scriptId);
      setSubjectState(response.data);
    } catch (error) {
      console.error('Failed to trigger episode subject extraction.', error);
      messageApi.error('主体提取触发失败');
    } finally {
      setTriggeringSubjectExtraction(false);
    }
  };

  return (
    <section className="zmeng-episode-studio">
      {contextHolder}
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
                    currentRouteStageKey === stage.key ? 'is-active' : '',
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
                    stage={stage}
                    isCompleted={completedStages.includes(stage.key)}
                    canComplete={stage.key === currentRouteStageKey && stage.key === storedStageKey && Boolean(getNextStageKey(stage.key))}
                    isSavingScript={savingScript}
                    isAdvancingStage={advancingStage}
                    subjectState={subjectState}
                    subjectLoading={subjectLoading}
                    isTriggeringSubjectExtraction={triggeringSubjectExtraction}
                    onOpenSubjectStudio={handleOpenSubjectStudio}
                    onComplete={() => void markStageCompleted(stage.key)}
                    onScriptNext={handleScriptNext}
                    onExtractSubjects={handleExtractSubjects}
                  />
                )}
              />
            ))}
            <Route path="*" element={<Navigate to="script" replace />} />
          </Routes>
        ) : null}
      </section>

      <SubjectCreationModal
        subjectItem={activeSubjectItem}
        onClose={() => setActiveSubjectItem(null)}
      />
    </section>
  );
}

interface EpisodeStagePanelProps {
  episode: EpisodeItem;
  stage: EpisodeStage;
  isCompleted: boolean;
  canComplete: boolean;
  isSavingScript: boolean;
  isAdvancingStage: boolean;
  subjectState: EpisodeSubjectsItem | null;
  subjectLoading: boolean;
  isTriggeringSubjectExtraction: boolean;
  onOpenSubjectStudio: (subjectItem: EpisodeSubjectItem) => void;
  onComplete: () => void;
  onScriptNext: (scriptContent: string) => Promise<void>;
  onExtractSubjects: () => void;
}

function EpisodeStagePanel({
  episode,
  stage,
  isCompleted,
  canComplete,
  isSavingScript,
  isAdvancingStage,
  subjectState,
  subjectLoading,
  isTriggeringSubjectExtraction,
  onOpenSubjectStudio,
  onComplete,
  onScriptNext,
  onExtractSubjects
}: EpisodeStagePanelProps) {
  const [scriptDraft, setScriptDraft] = useState(episode.scriptContent);
  const canAdvanceFromScript = Boolean(getNextStageKey(stage.key)) && scriptDraft.trim().length > 0;

  useEffect(() => {
    setScriptDraft(episode.scriptContent);
  }, [episode.scriptContent, episode.scriptId]);

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
            <Button
              type="primary"
              size="large"
              loading={isSavingScript}
              onClick={() => void onScriptNext(scriptDraft)}
              disabled={!canAdvanceFromScript}
            >
              下一步
            </Button>
          </div>
        </div>
      </article>
    );
  }

  if (stage.key === 'subject') {
    const isSubjectProcessing = subjectState?.status === 'processing' || isTriggeringSubjectExtraction;
    const canExtractSubjects = !subjectLoading && !isTriggeringSubjectExtraction && !isSubjectProcessing;
    const hasTriggeredSubjectExtraction = Boolean(subjectState && subjectState.status !== 'waiting');
    const extractButtonLabel = hasTriggeredSubjectExtraction ? '重新提取' : '提取主体';

    return (
      <article className="zmeng-episode-studio__panel zmeng-episode-studio__panel--subject">
        <div className="zmeng-episode-studio__subject-layout">
          <div className="zmeng-episode-studio__subject-sections">
            {subjectSections.map((section) => (
              <section key={section.key} className="zmeng-episode-studio__subject-row">
                <Typography.Title level={4} className="zmeng-episode-studio__subject-row-title">
                  {section.label}
                </Typography.Title>

                <div className="zmeng-episode-studio__subject-cards">
                  {renderSubjectCards(section, subjectState, isSubjectProcessing, onOpenSubjectStudio)}
                </div>
              </section>
            ))}
          </div>

          <div className="zmeng-episode-studio__panel-actions">
            <Button
              type={hasTriggeredSubjectExtraction ? 'default' : 'primary'}
              size="large"
              onClick={onExtractSubjects}
              loading={isTriggeringSubjectExtraction || isSubjectProcessing}
              disabled={!canExtractSubjects}
            >
              {extractButtonLabel}
            </Button>

            {subjectState?.status === 'failed' && subjectState.errorMessage ? (
              <span className="zmeng-episode-studio__panel-status is-error">{subjectState.errorMessage}</span>
            ) : null}

            {isCompleted ? (
              <span className="zmeng-episode-studio__panel-status">当前里程碑已完成</span>
            ) : null}

            {!isCompleted && canComplete && hasTriggeredSubjectExtraction && !isSubjectProcessing ? (
              <Button type="primary" size="large" loading={isAdvancingStage} onClick={onComplete}>
                下一步
              </Button>
            ) : null}
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
            当前剧集：{episode.episodeName} / 用户：{episode.username ?? '未命名用户'}
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
          <Button type="primary" size="large" loading={isAdvancingStage} onClick={onComplete}>
            完成当前里程碑
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function getNextStageKey(stageKey: EpisodeStageKey): EpisodeStageKey | null {
  const currentIndex = episodeStages.findIndex((stage) => stage.key === stageKey);
  return episodeStages[currentIndex + 1]?.key ?? null;
}

function getSectionItems(sectionKey: SubjectSectionKey, subjectState: EpisodeSubjectsItem | null): string[] {
  if (!subjectState) {
    return [];
  }

  switch (sectionKey) {
    case 'character':
      return subjectState.characters;
    case 'scene':
      return subjectState.scenes;
    case 'prop':
      return subjectState.props;
    default:
      return [];
  }
}

function renderSubjectCards(
  section: SubjectSection,
  subjectState: EpisodeSubjectsItem | null,
  isSubjectProcessing: boolean,
  onOpenSubjectStudio: (subjectItem: EpisodeSubjectItem) => void
) {
  if (isSubjectProcessing) {
    return (
      <article className="zmeng-episode-studio__asset-card is-loading">
        <div className="zmeng-episode-studio__asset-card-image">
          <span>提取中</span>
        </div>
        <div className="zmeng-episode-studio__asset-card-name">主体识别中...</div>
      </article>
    );
  }

  const sectionItems = getSectionSubjectItems(section.key, subjectState);
  if (sectionItems.length > 0) {
    return sectionItems.map((item) => (
      <article key={item.id} className="zmeng-episode-studio__asset-card">
        <div className="zmeng-episode-studio__asset-card-image">
          <Button type="default" onClick={() => onOpenSubjectStudio(item)}>
            创作主体
          </Button>
        </div>
        <div className="zmeng-episode-studio__asset-card-name">{item.subjectName}</div>
      </article>
    ));
  }

  return (
    <article className="zmeng-episode-studio__asset-card">
      <div className="zmeng-episode-studio__asset-card-image">占位图</div>
      <div className="zmeng-episode-studio__asset-card-name">{section.placeholderName}</div>
    </article>
  );
}

function getSectionSubjectItems(
  sectionKey: SubjectSectionKey,
  subjectState: EpisodeSubjectsItem | null
): EpisodeSubjectItem[] {
  if (!subjectState) {
    return [];
  }

  const subjectType = sectionKey === 'character' ? 'character' : sectionKey === 'scene' ? 'scene' : 'prop';
  return subjectState.items.filter((item) => item.subjectType === subjectType);
}

interface SubjectCreationModalProps {
  subjectItem: EpisodeSubjectItem | null;
  onClose: () => void;
}

function SubjectCreationModal({ subjectItem, onClose }: SubjectCreationModalProps) {
  const [promptDraft, setPromptDraft] = useState('');
  const [imageFeed, setImageFeed] = useState<EpisodeSubjectImageFeed | null>(null);
  const [loadingImageFeed, setLoadingImageFeed] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPromptDraft('');
    setImageFeed(null);
  }, [subjectItem?.id]);

  useEffect(() => {
    if (!subjectItem) {
      return;
    }

    void loadImageFeed(subjectItem.id);
  }, [subjectItem?.id]);

  useEffect(() => {
    if (!subjectItem || imageFeed?.status !== 'processing') {
      return;
    }

    const timer = window.setInterval(() => {
      void loadImageFeed(subjectItem.id, true);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [subjectItem, imageFeed?.status]);

  useEffect(() => {
    if (!subjectItem) {
      return;
    }

    const timer = window.setTimeout(() => {
      const container = messageListRef.current;
      if (!container) {
        return;
      }

      container.scrollTop = container.scrollHeight;
    }, 0);

    return () => window.clearTimeout(timer);
  }, [subjectItem?.id, imageFeed?.records.length, imageFeed?.status]);

  const loadImageFeed = async (subjectItemId: number, silent = false) => {
    try {
      if (!silent) {
        setLoadingImageFeed(true);
      }

      const response = await getEpisodeSubjectImages(subjectItemId);
      setImageFeed(response.data);
    } catch (error) {
      console.error('Failed to load subject image feed.', error);
      if (!silent) {
        messageApi.error('主体图片历史加载失败');
      }
    } finally {
      if (!silent) {
        setLoadingImageFeed(false);
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!subjectItem || generatingImage) {
      return;
    }

    const prompt = promptDraft.trim();
    if (!prompt) {
      messageApi.warning('请先输入生图要求');
      return;
    }

    try {
      setGeneratingImage(true);
      await generateEpisodeSubjectImage(subjectItem.id, prompt);
      setPromptDraft('');
      await loadImageFeed(subjectItem.id, true);
    } catch (error) {
      console.error('Failed to trigger subject image generation.', error);
      messageApi.error('主体生图触发失败');
    } finally {
      setGeneratingImage(false);
    }
  };

  const historyRecords = useMemo(
    () => (imageFeed?.records ?? []).filter((record) => record.status === 'success' && Boolean(record.imageUrl)),
    [imageFeed?.records]
  );

  return (
    <Modal
      open={Boolean(subjectItem)}
      onCancel={onClose}
      footer={null}
      width={1240}
      className="zmeng-episode-studio__subject-modal"
      title={subjectItem ? `${subjectItem.subjectName} · 主体创作` : '主体创作'}
      destroyOnHidden
    >
      {contextHolder}
      {subjectItem ? (
        <div className="zmeng-episode-studio__subject-modal-layout">
          <section className="zmeng-episode-studio__subject-modal-panel zmeng-episode-studio__subject-modal-panel--history">
            <Typography.Title level={4} className="zmeng-episode-studio__subject-modal-title">
              历史生成图片
            </Typography.Title>
            <div className="zmeng-episode-studio__subject-history-list">
              {loadingImageFeed ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : historyRecords.length ? (
                historyRecords.map((record) => (
                  <article key={record.id} className="zmeng-episode-studio__subject-history-card">
                    <img
                      src={record.imageUrl ?? ''}
                      alt={`${record.subjectName} 历史生成图 ${record.id}`}
                      className="zmeng-episode-studio__subject-history-image"
                    />
                    <p className="zmeng-episode-studio__subject-history-prompt">{record.prompt}</p>
                  </article>
                ))
              ) : (
                <div className="zmeng-episode-studio__subject-history-empty">
                  暂无历史图片
                </div>
              )}
            </div>
          </section>

          <section className="zmeng-episode-studio__subject-modal-panel zmeng-episode-studio__subject-modal-panel--creation">
            <Typography.Title level={4} className="zmeng-episode-studio__subject-modal-title">
              创作主体
            </Typography.Title>
            <div className="zmeng-episode-studio__subject-creation-layout">
              <section ref={messageListRef} className="zmeng-episode-studio__subject-message-list">
                {renderSubjectImageMessages(subjectItem.subjectName, imageFeed)}
              </section>

              <section className="zmeng-episode-studio__subject-prompt-editor">
                <Typography.Title level={5} className="zmeng-episode-studio__subject-prompt-title">
                  生图要求输入区
                </Typography.Title>
                <Input.TextArea
                  value={promptDraft}
                  onChange={(event) => setPromptDraft(event.target.value)}
                  placeholder="请输入该主体的生图要求..."
                  className="zmeng-episode-studio__subject-prompt-textarea"
                  autoSize={false}
                />
                <div className="zmeng-episode-studio__subject-prompt-actions">
                  <Button
                    type="primary"
                    size="large"
                    loading={generatingImage || imageFeed?.status === 'processing'}
                    onClick={() => void handleGenerateImage()}
                  >
                    发送
                  </Button>
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

function renderSubjectImageMessages(subjectName: string, imageFeed: EpisodeSubjectImageFeed | null) {
  if (!imageFeed?.records.length) {
    return (
      <div className="zmeng-episode-studio__subject-message-item is-system">
        <span className="zmeng-episode-studio__subject-message-role">系统</span>
        <p>这里会展示“{subjectName}”的生图要求、生成中状态和最终图片结果。</p>
      </div>
    );
  }

  return [...imageFeed.records].reverse().flatMap((record) => [
    (
      <div key={`prompt-${record.id}`} className="zmeng-episode-studio__subject-message-item is-user">
        <span className="zmeng-episode-studio__subject-message-role">你</span>
        <p>{record.prompt}</p>
      </div>
    ),
    (
      <div key={`result-${record.id}`} className="zmeng-episode-studio__subject-message-item is-system">
        <span className="zmeng-episode-studio__subject-message-role">系统</span>
        <SubjectImageMessageBody record={record} />
      </div>
    )
  ]);
}

function SubjectImageMessageBody({ record }: { record: EpisodeSubjectImageRecord }) {
  if (record.status === 'processing') {
    return <p>正在根据当前生图要求生成图片，请稍候...</p>;
  }

  if (record.status === 'failed') {
    return <p>{record.errorMessage ?? '主体生图失败，请稍后重试。'}</p>;
  }

  if (record.status === 'success' && record.imageUrl) {
    return (
      <div className="zmeng-episode-studio__subject-message-result">
        <img
          src={record.imageUrl}
          alt={`${record.subjectName} 生成图 ${record.id}`}
          className="zmeng-episode-studio__subject-message-image"
        />
        <p className="zmeng-episode-studio__subject-message-caption">本次生图要求：{record.prompt}</p>
      </div>
    );
  }

  return <p>等待主体生图任务开始。</p>;
}
