import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-midnight px-4 text-center">
      <h1 className="text-glow-white font-syne text-7xl font-extrabold italic text-white sm:text-9xl">
        404
      </h1>
      <p className="mt-4 text-base text-ash sm:text-lg">
        This page doesn&apos;t exist. Probably a bad decision.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-white/20 bg-white px-6 py-3 font-syne text-sm font-bold tracking-wide text-midnight transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] sm:text-base"
      >
        GO HOME
      </Link>
    </div>
  )
}
