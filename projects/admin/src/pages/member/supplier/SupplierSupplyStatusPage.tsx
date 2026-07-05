import { Card, Table, Tag } from 'antd'
import { useState, useEffect } from 'react'
import { fetchSupplyStatus } from '../../../services/ant-design-pro/supplier'

export function SupplierSupplyStatusPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const result = await fetchSupplyStatus({ page: 1, pageSize: 10 })
      setData(result?.list || [])
    } catch (error) {
      console.error('加载供货状态失败:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '商品', dataIndex: 'goodsName', width: 200 },
    { title: '商家', dataIndex: 'merchantName', width: 150 },
    { title: '供货数量', dataIndex: 'quantity', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const map: Record<string, { text: string; color: string }> = {
          ACTIVE: { text: '供货中', color: 'green' },
          ENABLED: { text: '启用', color: 'green' },
          PENDING: { text: '待确认', color: 'gold' },
          SUSPENDED: { text: '已暂停', color: 'orange' },
          DISABLED: { text: '已停用', color: 'default' },
          FINISHED: { text: '已完成', color: 'green' },
        }
        const item = map[s] || { text: s, color: 'green' }
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
  ]

  return (
    <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ y: 'calc(100vh - 280px)' }}
        pagination={{ pageSize: 10, size: 'small' }}
      />
    </Card>
  )
}

export default SupplierSupplyStatusPage
