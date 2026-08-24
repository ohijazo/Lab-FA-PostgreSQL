import { Children, isValidElement } from 'react'

export function Tabs({ value, onChange, children, className = '' }) {
  const tabs = Children.toArray(children).filter(isValidElement)
  const active = tabs.find((c) => c.props.id === value) || tabs[0]

  // El tabIndex rotatori de sota ja pressuposa aquesta navegació: sense
  // ella només s'arriba a la pestanya activa i les altres queden mortes.
  function handleKeyDown(e, index) {
    const keys = { ArrowLeft: -1, ArrowRight: 1 }
    let next
    if (e.key in keys) next = (index + keys[e.key] + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    const id = tabs[next].props.id
    if (onChange) onChange(id)
    const el = e.currentTarget.parentElement?.querySelector(`#tab-${CSS.escape(String(id))}`)
    if (el) el.focus()
  }

  return (
    <div className={`lab-tabs ${className}`.trim()}>
      <div className="lab-tabs-list" role="tablist">
        {tabs.map((tab, index) => {
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
              onKeyDown={(e) => handleKeyDown(e, index)}
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
