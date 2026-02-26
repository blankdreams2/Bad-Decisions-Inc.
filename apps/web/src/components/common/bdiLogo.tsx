interface BdiLogoProps {
  className?: string
  size?: number
  multicolor?: boolean
}

export default function BdiLogo({ className = '', size = 40, multicolor = false }: BdiLogoProps) {
  const cross = multicolor ? '#FF2D6B' : 'currentColor'     // neon
  const triangle = multicolor ? '#00E5FF' : 'currentColor'  // electric
  const square = multicolor ? '#F5B800' : 'currentColor'    // gold
  const circle = multicolor ? '#8B5CF6' : 'currentColor'    // royal

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cross (X) — top left */}
      <path
        d="M13 13 L37 37 M37 13 L13 37"
        stroke={cross}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Triangle — top right */}
      <path
        d="M75 10 L94 44 L56 44 Z"
        stroke={triangle}
        strokeWidth="6.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Square — bottom left */}
      <rect
        x="8"
        y="58"
        width="34"
        height="34"
        rx="3"
        stroke={square}
        strokeWidth="6.5"
        fill="none"
      />
      {/* Circle — bottom right */}
      <circle
        cx="75"
        cy="75"
        r="16"
        stroke={circle}
        strokeWidth="6.5"
        fill="none"
      />
    </svg>
  )
}
