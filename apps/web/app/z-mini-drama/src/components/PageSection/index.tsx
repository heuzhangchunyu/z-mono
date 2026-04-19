import type { PropsWithChildren, ReactNode } from 'react';
import { Card, Space, Typography } from 'antd';
import './index.less';

interface PageSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  extra?: ReactNode;
}

export default function PageSection({ title, description, extra, children }: PageSectionProps) {
  return (
    <Card className="zmd-page-section" bordered={false}>
      <Space className="zmd-page-section__header" align="start" size="middle">
        <div className="zmd-page-section__copy">
          <Typography.Title level={4}>{title}</Typography.Title>
          {description ? (
            <Typography.Paragraph type="secondary">
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
        {extra ? <div>{extra}</div> : null}
      </Space>
      <div className="zmd-page-section__body">{children}</div>
    </Card>
  );
}
