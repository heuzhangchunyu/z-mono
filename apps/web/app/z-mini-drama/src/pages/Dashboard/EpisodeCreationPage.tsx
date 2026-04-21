import { App, Button, Card, Empty, Form, Input, Modal, Select, Space, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useProjects } from '@/hooks';
import type { CreateProjectPayload, Project } from '@/types/project';
import './EpisodeCreationPage.less';

interface ProjectFormValues {
  name: string;
  description: string;
  aspect_ratio: '16:9' | '9:16' | '1:1';
  global_art_style: string;
}

const aspectRatioOptions = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' }
];

const statusMap: Record<Project['status'], string> = {
  draft: '草稿',
  in_progress: '进行中',
  completed: '已完成'
};

export default function EpisodeCreationPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<ProjectFormValues>();
  const { message } = App.useApp();
  const { projects, loading, submitting, total, error, reload, submitProject } = useProjects();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload: CreateProjectPayload = {
      name: values.name.trim(),
      description: values.description.trim(),
      aspect_ratio: values.aspect_ratio,
      global_art_style: values.global_art_style.trim()
    };

    try {
      const createdProject = await submitProject(payload);
      message.success(`项目「${createdProject.name}」创建成功`);
      setOpen(false);
      form.resetFields();
    } catch (submitError) {
      const nextMessage = submitError instanceof Error ? submitError.message : '创建项目失败';
      message.error(nextMessage);
    }
  };

  return (
    <div className="zmd-projects zmd-workspace__stage">
      <header className="zmd-projects__header">
        <div>
          <Typography.Title level={2}>创作项目</Typography.Title>
          <Typography.Paragraph>
            先创建项目，再逐步进入剧本、剧集和分镜工作流。当前账号可见项目共 {total} 个。
          </Typography.Paragraph>
        </div>
        <Space size={12}>
          <Button onClick={() => void reload()} loading={loading}>
            刷新列表
          </Button>
          <Button type="primary" onClick={() => setOpen(true)}>
            新建项目
          </Button>
        </Space>
      </header>

      <section className="zmd-projects__body">
        {loading ? (
          <div className="zmd-projects__state">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="zmd-projects__state">
            <Empty
              description={(
                <Space direction="vertical" size={4}>
                  <Typography.Text>项目列表加载失败</Typography.Text>
                  <Typography.Text type="secondary">{error}</Typography.Text>
                </Space>
              )}
            />
          </div>
        ) : projects.length === 0 ? (
          <div className="zmd-projects__state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="当前还没有项目，先创建你的第一个短剧项目。"
            />
          </div>
        ) : (
          <div className="zmd-projects__grid">
            {projects.map((project) => (
              <Card key={project.id} bordered={false} className="zmd-projects__card">
                <div className="zmd-projects__card-head">
                  <Typography.Title level={4}>{project.name}</Typography.Title>
                  <Tag color={project.status === 'completed' ? 'success' : project.status === 'in_progress' ? 'processing' : 'default'}>
                    {statusMap[project.status]}
                  </Tag>
                </div>
                <Typography.Paragraph className="zmd-projects__card-description">
                  {project.description || '这个项目还没有补充描述，可以直接开始创作。'}
                </Typography.Paragraph>
                <Space size={[8, 8]} wrap>
                  {project.aspect_ratio ? <Tag>{project.aspect_ratio}</Tag> : null}
                  {project.global_art_style ? <Tag>{project.global_art_style}</Tag> : null}
                </Space>
                <Typography.Text type="secondary" className="zmd-projects__card-meta">
                  创建于 {formatDate(project.created_at)}
                </Typography.Text>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={open}
        title="新建创作项目"
        onCancel={() => setOpen(false)}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        okText="创建项目"
        cancelText="取消"
        destroyOnHidden
      >
        <Form<ProjectFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            aspect_ratio: '9:16'
          }}
        >
          <Form.Item<ProjectFormValues>
            label="项目名称"
            name="name"
            rules={[
              { required: true, message: '请输入项目名称' },
              { max: 40, message: '项目名称不能超过 40 个字符' }
            ]}
          >
            <Input placeholder="例如：古风复仇短剧" maxLength={40} />
          </Form.Item>

          <Form.Item<ProjectFormValues>
            label="项目描述"
            name="description"
            rules={[{ max: 1000, message: '项目描述不能超过 1000 个字符' }]}
          >
            <Input.TextArea placeholder="简要描述项目方向、受众或核心设定" rows={4} maxLength={1000} />
          </Form.Item>

          <Form.Item<ProjectFormValues>
            label="画幅比例"
            name="aspect_ratio"
          >
            <Select options={aspectRatioOptions} />
          </Form.Item>

          <Form.Item<ProjectFormValues>
            label="全局画风"
            name="global_art_style"
            rules={[{ max: 1000, message: '全局画风设定不能超过 1000 个字符' }]}
          >
            <Input placeholder="例如：电影感、写实国风、低饱和冷色调" maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}
