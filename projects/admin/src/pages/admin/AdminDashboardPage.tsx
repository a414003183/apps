import { AuditOutlined, TeamOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { Card, Col, Row, Table, Button, Statistic, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UserRow } from '../../types/models'
import { fetchAdminUsers } from '../../services/ant-design-pro/admin'

export function AdminDashboardPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const usersData = await fetchAdminUsers({ page: 1, pageSize: 10 })
      if (usersData?.list) {
        setUsers(usersData.list)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const enabledCount = useMemo(() => users.filter((item) => item.status === 'ENABLED').length, [users])

  return (
    <div>
      <Row gutter={[8, 8]}>
        {[
          { label: '用户总数', value: users.length, trend: '当前系统账号存量' },
          { label: '启用账号', value: enabledCount, trend: '当前可登录账号' },
          { label: '角色数量', value: 4, trend: '权限分组配置' },
          { label: '菜单数量', value: 15, trend: '最近登录记录' },
        ].map((item, index) => (
          <Col xs={24} md={12} xl={6} key={index}>
            <Card hoverable size="small" loading={loading} styles={{ body: { padding: '8px 12px' } }}>
              <Statistic title={item.label} value={item.value} valueStyle={{ fontSize: 28, fontWeight: 600 }} />
              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{item.trend}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={16}>
          <Card title="最近账号" size="small" extra={<Link to="/admin/users">{'进入用户管理'}</Link>}>
            <Table<UserRow>
              rowKey="id"
              loading={loading}
              dataSource={users.slice(0, 8)}
              pagination={false}
              size="small"
              columns={[
                { title: '登录账号', dataIndex: 'username' },
                { title: '显示名称', dataIndex: 'displayName' },
                { title: '角色', dataIndex: 'role' },
                { title: '手机号', dataIndex: 'phone' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (text: string) => (
                    <Tag color={text === 'ENABLED' ? 'green' : 'red'}>{text === 'ENABLED' ? '启用' : '禁用'}</Tag>
                  ),
                },
                { title: '创建时间', dataIndex: 'createdAt' },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="账号治理" size="small" style={{ marginBottom: 8 }}>
            <Statistic
              title="启用账号"
              value={enabledCount}
              suffix={`/ ${users.length}`}
              valueStyle={{ fontSize: 20 }}
            />
            <p style={{ color: '#666', fontSize: 12, margin: '4px 0 8px' }}>{'启用异常账号可在用户管理中处理。'}</p>
            <Link to="/admin/users">
              <Button size="small" icon={<TeamOutlined />}>
                {'处理账号'}
              </Button>
            </Link>
          </Card>

          <Card title="权限结构" size="small" style={{ marginBottom: 8 }}>
            <Statistic title="角色/菜单" value="4 / 15" valueStyle={{ fontSize: 20 }} />
            <p style={{ color: '#666', fontSize: 12, margin: '4px 0 8px' }}>{'查看角色数量和菜单配置。'}</p>
            <Link to="/admin/governance">
              <Button size="small" icon={<UserSwitchOutlined />}>
                {'维护菜单'}
              </Button>
            </Link>
          </Card>

          <Card title="审计入口" size="small">
            <p style={{ color: '#666', fontSize: 12, margin: '0 0 8px' }}>{'登录日志和操作日志可用于追溯关键操作。'}</p>
            <Link to="/admin/governance">
              <Button size="small" icon={<AuditOutlined />}>
                {'查看操作日志'}
              </Button>
            </Link>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboardPage
