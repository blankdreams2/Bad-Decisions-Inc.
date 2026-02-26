interface BdiLogoProps {
  className?: string
  size?: number
}

export default function BdiLogo({ className = '', size = 40 }: BdiLogoProps) {
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
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Triangle — top right */}
      <path
        d="M75 10 L94 44 L56 44 Z"
        stroke="currentColor"
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
        stroke="currentColor"
        strokeWidth="6.5"
        fill="none"
      />
      {/* Circle — bottom right */}
      <circle
        cx="75"
        cy="75"
        r="16"
        stroke="currentColor"
        strokeWidth="6.5"
        fill="none"
      />
    </svg>
  )
}
