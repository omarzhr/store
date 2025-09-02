import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/search/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(public)/search/"!</div>
}
