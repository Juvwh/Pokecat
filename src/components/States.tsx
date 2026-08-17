interface EmptyProps {
  emoji: string
  title: string
  message?: string
  children?: React.ReactNode
}

export function EmptyState({ emoji, title, message, children }: EmptyProps) {
  return (
    <div className="state">
      <span className="state__emoji" aria-hidden="true">{emoji}</span>
      <p className="state__title">{title}</p>
      {message && <p>{message}</p>}
      {children}
    </div>
  )
}

export function Loading({ label = 'Chargement du Pokédex…' }: { label?: string }) {
  return (
    <div className="state">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}

export function Alert({
  children,
  variant = 'error',
}: {
  children: React.ReactNode
  variant?: 'error' | 'info'
}) {
  return <div className={variant === 'info' ? 'alert alert--info' : 'alert'}>{children}</div>
}
