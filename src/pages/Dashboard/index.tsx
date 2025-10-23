import React from 'react'
import { Card, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Card title={t('pages.dashboard.title')} bordered={false}>
      <Typography.Paragraph type="secondary">{t('pages.dashboard.desc')}</Typography.Paragraph>
    </Card>
  )
}

export default Dashboard
