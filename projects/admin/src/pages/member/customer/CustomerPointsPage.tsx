import { Card, Row, Col, Statistic, Table, Tag, Spin, Input, Select, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { PointRecord } from '../../../types/models'
import { fetchCustomerPoints, fetchPointRecords } from '../../../services/ant-design-pro/points'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

const TYPE_OPTIONS = [
  { value: 'ALL', label: '全部类型' },
  { value: 'INCREASE', label: '收入' },
  { value: 'DECREASE', label: '支出' },
]

export function CustomerPointsPage() {
  const [pointsInfo, setPointsInfo] = useState<any>({})
  const [records, setRecords] = useState<PointRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const filteredRecords = useMemo(() => {
    let list = records
    if (typeFilter !== 'ALL') list = list.filter((r) => r.type === typeFilter)
    const kw = keyword.trim().toLowerCase()
    if (kw) list = list.filter((r) => (r.source || '').toLowerCase().includes(kw))
    return list
  }, [records, keyword, typeFilter])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [pointsData, recordsData] = await Promise.all([
        fetchCustomerPoints(),
        fetchPointRecords({ page: 1, pageSize: 200 }),
      ])
      setPointsInfo(pointsData || {})
      setRecords(recordsData?.list || [])
    } catch (error: any) {
      console.error('加载积分失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setKeyword('')
    setTypeFilter('ALL')
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const columns = [
    { title: '来源', dataIndex: 'source', width: 150 },
    {
      title: '积分',
      dataIndex: 'points',
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#52c41a' : '#ff4d4f' }}>
          {v > 0 ? '+' : ''}
          {v}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (t: string) => <Tag color={t === 'INCREASE' ? 'green' : 'red'}>{t === 'INCREASE' ? '收入' : '支出'}</Tag>,
    },
    { title: '时间', dataIndex: 'createdAt', width: 180 },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Spin size="large" />
      </div>
    )
  }

  const advancedFilter = (
    <Select size="small" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} style={{ width: 120 }} />
  )

  return (
    <div>
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} md={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="当前积分" value={pointsInfo.currentPoints || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="累计积分" value={pointsInfo.totalPoints || 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="已使用" value={(pointsInfo.totalPoints || 0) - (pointsInfo.currentPoints || 0)} />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <ListSearchToolbar
            searchPlaceholder="搜索来源"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onReset={handleReset}
            advancedFilter={advancedFilter}
            resultCount={filteredRecords.length}
          />
          <Table
            dataSource={filteredRecords}
            columns={columns}
            rowKey="id"
            size="small"
            scroll={{ y: 'calc(100vh - 280px)' }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredRecords.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (t) => `共 ${t} 条`,
              size: 'small',
              onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
            }}
          />
        </Space>
      </Card>
    </div>
  )
}

export default CustomerPointsPage
