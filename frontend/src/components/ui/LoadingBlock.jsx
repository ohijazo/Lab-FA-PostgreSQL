import Spinner from './Spinner'

export default function LoadingBlock({ label, size = 20 }) {
  return (
    <div className="loading-block" role="status">
      <Spinner size={size} />
      {label && <span>{label}</span>}
    </div>
  )
}
