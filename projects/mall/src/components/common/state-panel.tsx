import { Button, Card } from '@heroui/react'

interface StatePanelAction {
  label: string
  onPress: () => void | Promise<void>
}

interface StatePanelProps {
  eyebrow?: string
  title: string
  description: string
  primaryAction?: StatePanelAction
  secondaryAction?: StatePanelAction
}

export function StatePanel({ eyebrow, title, description, primaryAction, secondaryAction }: StatePanelProps) {
  return (
    <Card className="p-8 sm:p-12 text-center">
      <Card.Content className="flex flex-col items-center">
        {eyebrow && <span className="text-xs font-bold text-accent uppercase tracking-wider">{eyebrow}</span>}
        <h2 className="text-xl font-bold mt-3 text-foreground">{title}</h2>
        <p className="text-sm text-muted mt-2 max-w-md">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {primaryAction && <Button onPress={primaryAction.onPress}>{primaryAction.label}</Button>}
            {secondaryAction && (
              <Button variant="outline" onPress={secondaryAction.onPress}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </Card.Content>
    </Card>
  )
}
