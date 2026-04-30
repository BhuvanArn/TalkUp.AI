import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cv-analysis')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/cv-analysis"!</div>
}
