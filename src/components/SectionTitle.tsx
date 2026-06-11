import type { ReactNode } from 'react'

interface SectionTitleProps {
  icon: ReactNode
  title: string
  action?: string
}

export function SectionTitle({ icon, title, action }: SectionTitleProps) {
  return (
    <div className="section-title">
      <div>
        <span className="section-title__icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      {action && <span>{action}</span>}
    </div>
  )
}
