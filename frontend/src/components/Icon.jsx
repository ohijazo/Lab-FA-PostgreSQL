import * as Lucide from 'lucide-react'

export default function Icon({ name, size = 16, strokeWidth = 2, className, ...rest }) {
  const Cmp = Lucide[name]
  if (!Cmp) return null
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...rest} />
}
