import { Button, Descriptions, Empty, Skeleton, Space, Tag, Typography } from 'antd';
import PageSection from '@/components/PageSection';
import { useHealthCheck } from '@/hooks';
import './index.less';

export default function DashboardPage() {
  const { data, loading, error, reload } = useHealthCheck();

  return (
    <div className="zmd-dashboard">
      <PageSection
        title="项目初始化完成"
        description="当前脚手架已经按 example-mini-drama 的基本思路搭好页面、hooks、api、types、styles 等目录，可以在此基础上继续扩展业务页面。"
        extra={(
          <Button type="primary" onClick={() => void reload()} loading={loading}>
            刷新接口状态
          </Button>
        )}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : error ? (
          <Empty
            description={(
              <Space direction="vertical" size={4}>
                <Typography.Text>健康检查接口暂不可用</Typography.Text>
                <Typography.Text type="secondary">{error}</Typography.Text>
              </Space>
            )}
          />
        ) : (
          <Descriptions
            className="zmd-dashboard__descriptions"
            column={1}
            bordered
            items={[
              {
                key: 'serviceName',
                label: '服务名',
                children: data?.serviceName ?? '-'
              },
              {
                key: 'status',
                label: '状态',
                children: <Tag color={data?.status === 'ok' ? 'success' : 'warning'}>{data?.status ?? '-'}</Tag>
              },
              {
                key: 'version',
                label: '版本',
                children: data?.version ?? '-'
              },
              {
                key: 'timestamp',
                label: '时间戳',
                children: data?.timestamp ?? '-'
              }
            ]}
          />
        )}
      </PageSection>

      <div className="zmd-dashboard__grid">
        <PageSection
          title="推荐下一步"
          description="这一块预留给后续业务模块扩展。建议先按业务域补充 pages、components、hooks、api/modules 和 types。"
        >
          <ul className="zmd-dashboard__list">
            <li>补充登录鉴权与项目列表页面</li>
            <li>按业务域拆分 axios 接口模块</li>
            <li>同步建立接口文档和领域类型</li>
          </ul>
        </PageSection>
        <PageSection
          title="当前技术栈"
          description="已按需求接入 React、antd、less、axios，并保留 Vite 开发代理和别名配置。"
        >
          <ul className="zmd-dashboard__list">
            <li>React 18 + React Router</li>
            <li>antd 5 组件体系</li>
            <li>less 样式组织</li>
            <li>axios 统一请求实例</li>
          </ul>
        </PageSection>
      </div>
    </div>
  );
}
