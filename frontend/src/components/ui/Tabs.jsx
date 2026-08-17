import { Children, isValidElement } from 'react'

export function Tabs({ value, onChange, children, className = '' }) {
  const tabs = Children.toArray(children).filter(isValidElement)
  const active = tabs.find((c) => c.props.id === value) || tabs[0]

  return (
    <div className={`lab-tabs ${className}`.trim()}>
      <div className="lab-tabs-list" role="tablist">
        {tabs.map((tab) => {
          const id = tab.props.id
          const isActive = id === (active && active.props.id)
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${id}`}
              tabIndex={isActive ? 0 : -1}
              className={`lab-tabs-tab ${isActive ? 'is-active' : ''}`.trim()}
              onClick={() => onChange && onChange(id)}
            >
              {tab.props.label}
            </button>
          )
        })}
      </div>
      {active && (
        <div
          role="tabpanel"
          id={`tabpanel-${active.props.id}`}
          aria-labelledby={`tab-${active.props.id}`}
          className="lab-tabs-panel"
        >
          {active.props.children}
        </div>
      )}
    </div>
  )
}

export function Tab({ children }) {
  return children
}
