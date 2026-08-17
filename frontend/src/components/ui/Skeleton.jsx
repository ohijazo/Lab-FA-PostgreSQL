export default function Skeleton({ width, height = '1em', radius, className = '', style: extraStyle }) {
  const style = {
    width: width ?? '100%',
    height,
    borderRadius: radius ?? 'var(--lab-radius-sm)',
    ...extraStyle,
  }
  return <span className={`lab-skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}
