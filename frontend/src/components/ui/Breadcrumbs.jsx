import { Link } from 'react-router-dom'
import Icon from '../Icon'

export default function Breadcrumbs({ items = [], className = '' }) {
  if (!items.length) return null
  return (
    <nav className={`lab-breadcrumbs ${className}`.trim()} aria-label="Breadcrumbs">
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className={isLast ? 'is-current' : ''}>
              {item.to && !isLast ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
              {!isLast && (
                <Icon name="ChevronRight" size={12} className="lab-breadcrumbs-sep" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
