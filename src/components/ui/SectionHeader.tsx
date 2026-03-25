interface Props {
  badge:      string
  title:      string
  titleSpan?: string
  sub?:       string
  center?:    boolean
}

export default function SectionHeader({ badge, title, titleSpan, sub, center }: Props) {
  return (
    <div className={`mb-14 ${center ? 'text-center' : ''}`}>
      <span className="badge mb-4 inline-flex">{badge}</span>
      <h2 className="h2 text-gray-900 mb-3">
        {title} {titleSpan && <span className="text-navy">{titleSpan}</span>}
      </h2>
      {sub && (
        <p className={`text-gray-500 text-base leading-relaxed ${center ? 'max-w-xl mx-auto' : 'max-w-lg'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}