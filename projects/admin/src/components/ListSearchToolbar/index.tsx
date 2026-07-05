import { useState } from 'react'
import { Button, Input, Space } from 'antd'
import { SearchOutlined, ReloadOutlined, FilterOutlined, UpOutlined, DownOutlined } from '@ant-design/icons'

interface ListSearchToolbarProps {
  searchPlaceholder?: string
  keyword: string
  onKeywordChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
  advancedFilter?: React.ReactNode
  resultCount?: number
  extraActions?: React.ReactNode
}

export function ListSearchToolbar({
  searchPlaceholder = '请输入关键词搜索',
  keyword,
  onKeywordChange,
  onSearch,
  onReset,
  advancedFilter,
  resultCount,
  extraActions,
}: ListSearchToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {/* 左侧：操作按钮（如新增） + 结果计数 */}
        <Space wrap align="center">
          {extraActions}
          {typeof resultCount === 'number' && (
            <span style={{ fontSize: 13, color: '#666' }}>
              共 <strong style={{ color: '#1890ff' }}>{resultCount}</strong> 条结果
            </span>
          )}
        </Space>
        {/* 右侧：搜索输入 + 查询/重置/高级筛选 */}
        <Space wrap align="center">
          <Input
            allowClear
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder={searchPlaceholder}
            onPressEnter={onSearch}
            style={{ width: 200 }}
            size="small"
          />
          <Button type="primary" size="small" icon={<SearchOutlined />} onClick={onSearch}>
            查询
          </Button>
          <Button size="small" icon={<ReloadOutlined />} onClick={onReset}>
            重置
          </Button>
          {advancedFilter && (
            <Button size="small" icon={<FilterOutlined />} onClick={() => setAdvancedOpen(!advancedOpen)}>
              高级筛选
              {advancedOpen ? (
                <UpOutlined style={{ fontSize: 12, marginLeft: 4 }} />
              ) : (
                <DownOutlined style={{ fontSize: 12, marginLeft: 4 }} />
              )}
            </Button>
          )}
        </Space>
      </Space>
      {advancedOpen && advancedFilter && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {advancedFilter}
          </div>
        </div>
      )}
    </Space>
  )
}
