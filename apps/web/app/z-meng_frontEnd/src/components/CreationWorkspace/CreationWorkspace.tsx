import { Button, Card, Empty, Form, Input, Modal, Select, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEpisode, listEpisodes, type EpisodeItem } from '../../services/episode/episode';
import './CreationWorkspace.less';

interface CreationWorkspaceProps {
  username: string;
}

interface EpisodeFormValues {
  episodeName: string;
  style: '动漫' | '真人';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export default function CreationWorkspace({ username: _username }: CreationWorkspaceProps) {
  const username = _username;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [form] = Form.useForm<EpisodeFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    void loadEpisodes();
  }, [username]);

  const loadEpisodes = async () => {
    try {
      setLoadingEpisodes(true);
      const response = await listEpisodes();
      setEpisodes(response.data);
    } catch (error) {
      console.error('Failed to load episodes.', error);
      messageApi.error('剧集列表加载失败');
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleConfirm = async () => {
    const values = await form.validateFields();

    try {
      setSubmitting(true);
      const response = await createEpisode({
        episodeName: values.episodeName,
        style: values.style,
        aspectRatio: values.aspectRatio
      });
      messageApi.success(response.message);
      setOpen(false);
      form.resetFields();
      await loadEpisodes();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="zmeng-creation">
      {contextHolder}
      <div className="zmeng-creation__surface">
        <button className="zmeng-creation__primary" type="button" onClick={() => setOpen(true)}>
          新建剧集
        </button>

        <section className="zmeng-creation__list">
          <Typography.Title level={4} className="zmeng-creation__list-title">
            已有剧集
          </Typography.Title>

          {episodes.length === 0 && !loadingEpisodes ? (
            <div className="zmeng-creation__empty">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="当前还没有剧集，先创建第一集吧。"
              />
            </div>
          ) : (
            <div className="zmeng-creation__cards">
              {episodes.map((episode) => (
                <Card
                  key={episode.scriptId}
                  className="zmeng-creation__episode-card"
                  loading={loadingEpisodes}
                  bordered={false}
                  hoverable
                  onClick={() => navigate(`/creation/episodes/${episode.scriptId}/script`)}
                >
                  <Typography.Title level={5} className="zmeng-creation__episode-title">
                    {episode.episodeName}
                  </Typography.Title>
                  <Space size={[8, 8]} wrap>
                    <Tag>{episode.style}</Tag>
                    <Tag>{episode.aspectRatio}</Tag>
                  </Space>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          centered
          width={720}
          destroyOnHidden
          className="zmeng-creation-modal"
          title="剧集创作"
        >
          <Form<EpisodeFormValues>
            form={form}
            layout="vertical"
            initialValues={{
              style: '动漫',
              aspectRatio: '16:9'
            }}
          >
            <Form.Item
              label="剧集名"
              name="episodeName"
              rules={[{ required: true, message: '请输入剧集名' }]}
            >
              <Input placeholder="请输入剧集名..." maxLength={120} />
            </Form.Item>

            <div className="zmeng-creation-modal__grid">
              <Form.Item
                label="风格"
                name="style"
                rules={[{ required: true, message: '请选择风格' }]}
              >
                <Select
                  popupClassName="zmeng-creation-modal__select-popup"
                  options={[
                    { label: '动漫', value: '动漫' },
                    { label: '真人', value: '真人' }
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="比例"
                name="aspectRatio"
                rules={[{ required: true, message: '请选择比例' }]}
              >
                <Select
                  popupClassName="zmeng-creation-modal__select-popup"
                  options={[
                    { label: '16:9', value: '16:9' },
                    { label: '9:16', value: '9:16' },
                    { label: '1:1', value: '1:1' }
                  ]}
                />
              </Form.Item>
            </div>

            <div className="zmeng-creation-modal__actions">
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={() => void handleConfirm()}
              >
                确认
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </section>
  );
}
