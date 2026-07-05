import { ArrowRight, BadgeCheck, ReceiptText } from 'lucide-react'
import { Button, Card } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCustomerOrderDetail } from '../api/mall'
import { StatePanel } from '../components/common/state-panel'
import { formatCurrency } from '../lib/format'
import { navigateToWorkspace } from '../lib/navigation'
import type { CreateOrderResult } from '../types/models'

const ORDER_STATUS_LABELS: Record<string, string> = {
  WAIT_PAY: '待付款',
  PENDING_AUDIT: '待审核',
  WAIT_SHIP: '待发货',
  WAIT_RECEIVE: '待收货',
  FINISHED: '已完成',
  CANCELLED: '已取消',
  CLOSED: '已关闭',
}

const PAY_STATUS_LABELS: Record<string, string> = {
  UNPAID: '未支付',
  PAID_REGISTERED: '已登记支付',
  PAID: '已支付',
  PARTIAL_REFUND: '部分退款',
  REFUNDED: '已退款',
}

export function OrderResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialResult = ((useLocation().state as { result?: CreateOrderResult } | null) ?? null)?.result
  const [result, setResult] = useState<CreateOrderResult | undefined>(initialResult)

  const orderIdentifier = initialResult?.orderNo ?? searchParams.get('orderNo') ?? undefined

  useEffect(() => {
    if (!orderIdentifier) return
    fetchCustomerOrderDetail(orderIdentifier)
      .then((detail) => {
        if (!detail) return
        setResult({
          id: String(detail.id ?? initialResult?.id ?? ''),
          orderNo: String(detail.orderNo ?? initialResult?.orderNo ?? ''),
          payAmount: Number(detail.payAmount ?? initialResult?.payAmount ?? 0),
          usedPoints: Number(detail.usedPoints ?? initialResult?.usedPoints ?? 0),
          pointsDeductionAmount: Number(detail.pointsDeductionAmount ?? initialResult?.pointsDeductionAmount ?? 0),
          orderStatus: String(detail.orderStatus ?? initialResult?.orderStatus ?? 'WAIT_PAY'),
          payStatus: String(detail.payStatus ?? initialResult?.payStatus ?? 'UNPAID'),
        })
      })
      .catch(() => {
        // 保持初始数据
      })
  }, [orderIdentifier])

  if (!result) {
    return (
      <StatePanel
        eyebrow="无结果"
        title="没有下单结果"
        description="请重新提交订单"
        primaryAction={{ label: '回到首页', onPress: () => navigate('/') }}
      />
    )
  }

  return (
    <div className="max-w-[600px] mx-auto space-y-3">
      <Card>
        <Card.Content className="p-8 text-center">
          <div className="w-[64px] h-[64px] rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <BadgeCheck size={32} className="text-success" />
          </div>
          <h1 className="text-xl font-bold mb-1">订单创建成功！</h1>
          <p className="text-sm text-muted mb-4">感谢您的采购，可在工作台跟踪订单</p>
          <div className="inline-block bg-accent-soft rounded-lg px-6 py-3">
            <span className="text-xs text-muted">支付金额</span>
            <span className="block text-accent text-[28px] font-bold">{formatCurrency(result.payAmount)}</span>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>订单信息</Card.Title>
        </Card.Header>
        <Card.Content className="p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['订单号', result.orderNo],
              ['订单状态', ORDER_STATUS_LABELS[result.orderStatus] || result.orderStatus],
              ['支付状态', PAY_STATUS_LABELS[result.payStatus] || result.payStatus],
              ['已用积分', String(result.usedPoints)],
            ].map(([k, v]) => (
              <div key={k} className="p-3 bg-surface rounded-lg">
                <span className="block text-[11px] text-muted mb-0.5">{k}</span>
                <span className="font-medium break-all">{v}</span>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button size="lg" onPress={() => navigate('/')}>
          继续逛商城 <ArrowRight size={16} />
        </Button>
        <Button size="lg" variant="outline" onPress={() => navigateToWorkspace(`/member/customer/orders/${result.id}`)}>
          <ReceiptText size={16} /> 查看订单
        </Button>
      </div>
    </div>
  )
}
