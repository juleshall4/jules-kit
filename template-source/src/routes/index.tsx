import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="space-y-6">
      <h1>Welcome to TanStack Start</h1>
      <p>
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
      <Button type="button">
        Start building
        <ArrowRight aria-hidden="true" />
      </Button>
    </main>
  )
}
