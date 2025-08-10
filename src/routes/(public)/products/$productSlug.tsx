import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/products/$productSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div></div>
}
