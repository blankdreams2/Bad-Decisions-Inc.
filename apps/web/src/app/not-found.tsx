import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-midnight px-4 text-center">
      <h1 className="font-syne text-7xl font-extrabold text-gold sm:text-9xl">404</h1>
      <p className="mt-4 text-base text-ash sm:text-lg">
        This page doesn&apos;t exist. Probably a bad decision.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-gold px-6 py-3 font-syne text-sm font-bold tracking-wide text-midnight transition-colors hover:bg-gold-light sm:text-base"
      >
        GO HOME
      </Link>
    </div>
  )
}
