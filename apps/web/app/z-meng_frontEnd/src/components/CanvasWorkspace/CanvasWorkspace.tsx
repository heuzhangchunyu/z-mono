import { Button, Card, Space, Tag, Typography } from 'antd';
import './CanvasWorkspace.less';

interface CanvasWorkspaceProps {
  username: string;
}

export default function CanvasWorkspace({ username }: CanvasWorkspaceProps) {
  return (
    <section className="zmeng-canvas">
      <div className="zmeng-canvas__hero">
        <Typography.Text className="zmeng-canvas__eyebrow">Canvas workspace</Typography.Text>
        <Typography.Title level={1}>画布</Typography.Title>
        <Typography.Paragraph>
          用统一的视觉工作区整理角色关系、场景参考和分镜流向，让创作脉络始终保持在一个页面里。
        </Typography.Paragraph>
        <Space wrap size={[10, 10]}>
          <Tag>Canvas</Tag>
          <Tag>Node</Tag>
          <Tag>Reference</Tag>
        </Space>
      </div>

      <Card className="zmeng-canvas__card" bordered={false}>
        <Typography.Text className="zmeng-canvas__label">当前用户</Typography.Text>
        <Typography.Title level={3}>{username}</Typography.Title>
        <Typography.Paragraph>
          这里后续可以直接接入你已有的无限画布组件，作为 z-meng 的视觉创作区。
        </Typography.Paragraph>
        <Button type="primary" size="large">
          进入画布
        </Button>
      </Card>
    </section>
  );
}
