interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  desc?: string
}

export default function EmptyState({ icon, title, desc }: EmptyStateProps) {
  return (
    <div className="text-center py-16 animate-fade-in">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <p className="font-medium text-slate-600 mb-1">{title}</p>
      {desc && <p className="text-sm text-slate-400">{desc}</p>}
    </div>
  )
}
