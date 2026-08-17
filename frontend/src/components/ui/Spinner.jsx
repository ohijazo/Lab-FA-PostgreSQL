export default function Spinner({ size = 20, className = '', label }) {
  const style = { width: size, height: size }
  return (
    <span className={`lab-spinner ${className}`.trim()} style={style} role="status" aria-label={label || 'Carregant'}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}
