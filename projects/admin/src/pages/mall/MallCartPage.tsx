import { Button, Card, InputNumber, message, Table, Spin, Empty, Pagination } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons'
import type { MallCartItem } from '../../types/models'
import { fetchCartItems, removeCartItem, updateCartItem } from '../../services/ant-design-pro/cart'
import { getAuthProfile } from '../../utils/auth'

export function MallCartPage() {
  const [cartItems, setCartItems] = useState<MallCartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 })
  const navigate = useNavigate()
  const profile = getAuthProfile()

  useEffect(() => {
    if (profile) {
      loadCartItems()
    } else {
      setLoading(false)
    }
  }, [profile])

  async function loadCartItems() {
    try {
      setLoading(true)
      const result = await fetchCartItems()
      const list = result?.list || []
      setCartItems(list)
      setPagination((prev) => ({ ...prev, total: result?.total || list.length }))
    } catch (error: any) {
      console.error('加载购物车失败:', error)
      message.error('加载购物车失败')
    } finally {
      setLoading(false)
    }
  }

  const paginatedItems = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize
    return cartItems.slice(start, start + pagination.pageSize)
  }, [cartItems, pagination.current, pagination.pageSize])

  const totalAmount = useMemo(() => cartItems.reduce((sum, item) => sum + item.lineAmount, 0), [cartItems])
  const freightAmount = 36
  const payAmount = totalAmount + freightAmount

  const handleQuantityChange = async (id: string, quantity: number) => {
    try {
      await updateCartItem(id, quantity)
      setCartItems((items) =>
        items.map((item) =>
          item.id === id ? { ...item, quantity, lineAmount: item.finalUnitPrice * quantity } : item,
        ),
      )
    } catch (error: any) {
      message.error('更新数量失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeCartItem(id)
      setCartItems((items) => items.filter((item) => item.id !== id))
      message.success('已删除')
    } catch (error: any) {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '商品信息',
      dataIndex: 'productName',
      render: (_: any, record: MallCartItem) => (
        <div>
          <div>{record.productName}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.specText}</div>
        </div>
      ),
    },
    {
      title: '单价',
      dataIndex: 'finalUnitPrice',
      render: (value: number) => `￥${value}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      render: (_: any, record: MallCartItem) => (
        <InputNumber
          min={1}
          max={record.stockQty}
          value={record.quantity}
          onChange={(value) => handleQuantityChange(record.id, value || 1)}
        />
      ),
    },
    {
      title: '小计',
      dataIndex: 'lineAmount',
      render: (value: number) => `￥${value}`,
    },
    {
      title: '操作',
      dataIndex: 'action',
      render: (_: any, record: MallCartItem) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
      ),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <ShoppingOutlined style={{ fontSize: 48, color: '#999' }} />
          <p>请先登录</p>
          <Link to="/login">
            <Button type="primary">去登录</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ flexShrink: 0 }}>购物车</h2>
      {cartItems.length === 0 ? (
        <Card style={{ flexShrink: 0 }}>
          <Empty description="购物车为空">
            <Link to="/mall/home">
              <Button type="primary">去购物</Button>
            </Link>
          </Empty>
        </Card>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Table dataSource={paginatedItems} columns={columns} rowKey="id" pagination={false} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={cartItems.length}
              showSizeChanger
              pageSizeOptions={[10, 15, 20, 50]}
              onChange={(p, ps) => setPagination((prev) => ({ ...prev, current: p, pageSize: ps || 15 }))}
            />
          </div>
          <Card style={{ marginTop: 16, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24 }}>
              <span>
                共 <strong>{cartItems.length}</strong> 件商品
                <span style={{ color: '#999', marginLeft: 12 }}>
                  商品金额 ￥{totalAmount} + 运费 ￥{freightAmount}
                </span>
                <strong style={{ fontSize: 24, color: '#ff4d4f', marginLeft: 12 }}>应付 ￥{payAmount}</strong>
              </span>
              <Button type="primary" size="large" onClick={() => navigate('/mall/checkout')}>
                去结算
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default MallCartPage
