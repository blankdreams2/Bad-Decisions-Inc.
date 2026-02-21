'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-dvh p-4 max-w-md w-full mx-auto flex items-center justify-center">
      <SignIn routing="hash" />
    </main>
  )
}
