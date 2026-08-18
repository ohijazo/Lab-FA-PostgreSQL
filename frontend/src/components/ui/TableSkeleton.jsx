import Skeleton from './Skeleton'

/**
 * Skeleton genèric per a pàgines admin: capçalera + toolbar + N files simulades.
 * Utilitzat mentre carrega la llista principal per donar percepció de rapidesa.
 */
export default function TableSkeleton({ rows = 5, hasHeader = true, hasToolbar = true }) {
  return (
    <div className="admin-skeleton">
      {hasHeader && (
        <div className="admin-skeleton-header">
          <div>
            <Skeleton width="35%" height="1.5rem" />
            <div style={{ marginTop: '0.4rem' }}>
              <Skeleton width="55%" height="0.85rem" />
            </div>
          </div>
          {hasToolbar && <Skeleton width="110px" height="2.2rem" radius="6px" />}
        </div>
      )}
      <div className="admin-skeleton-table">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="admin-skeleton-row">
            <Skeleton width="14%" height="0.9rem" />
            <Skeleton width="24%" height="0.9rem" />
            <Skeleton width="20%" height="0.9rem" />
            <Skeleton width="12%" height="0.9rem" />
            <Skeleton width="18%" height="0.9rem" />
          </div>
        ))}
      </div>
    </div>
  )
}
