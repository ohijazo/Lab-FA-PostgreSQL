import Icon from '../Icon'

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading ? 'is-loading' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Icon name="Loader2" size={14} className="btn-spin" />}
      {!loading && icon && <span className="btn-icon">{icon}</span>}
      {children && <span className="btn-label">{children}</span>}
      {!loading && iconRight && <span className="btn-icon btn-icon-right">{iconRight}</span>}
    </button>
  )
}
