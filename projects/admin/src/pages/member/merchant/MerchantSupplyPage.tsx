import { Button, Card, Table, Tag, message, Upload, Modal, Space, Input, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import { ListSearchToolbar } from '../../../components/ListSearchToolbar'

const mockSupply = [
  {
    id: '1',
    goodsName: 'iPhone 16 Pro Max',
    supplierName: 'Apple',
    supplyPrice: 8500,
    status: 'APPROVED',
    createdAt: '2024-04-01',
  },
]

export function MerchantSupplyPage() {
  const [data] = useState(mockSupply)
  const [keyword, setKeyword] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const filteredData = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return data
    return data.filter((r) => [r.goodsName, r.supplierName].some((f) => (f || '').toLowerCase().includes(kw)))
  }, [data, keyword])

  const handleReset = () => {
    setKeyword('')
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const columns = [
    { title: '商品名称', dataIndex: 'goodsName', width: 200 },
    { title: '供应商', dataIndex: 'supplierName', width: 150 },
    { title: '供货价', dataIndex: 'supplyPrice', render: (v: number) => `￥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const map: Record<string, { text: string; color: string }> = {
          APPROVED: { text: '已审核', color: 'green' },
          ACTIVE: { text: '生效', color: 'green' },
          PENDING: { text: '待审核', color: 'gold' },
          REJECTED: { text: '已拒绝', color: 'red' },
          REVOKED: { text: '已撤销', color: 'default' },
        }
        const item = map[s] || { text: s, color: 'green' }
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    { title: '时间', dataIndex: 'createdAt', width: 120 },
  ]

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <ListSearchToolbar
          searchPlaceholder="搜索商品/供应商"
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onReset={handleReset}
          resultCount={filteredData.length}
          extraActions={
            <Button type="primary" icon={<UploadOutlined />} size="small">
              导入供货商品
            </Button>
          }
        />
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ y: 'calc(100vh - 280px)' }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            size: 'small',
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Space>
    </Card>
  )
}

export default MerchantSupplyPage
