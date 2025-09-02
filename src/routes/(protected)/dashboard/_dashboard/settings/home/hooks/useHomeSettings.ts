import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(protected)/dashboard/_dashboard/settings/home/hooks/useHomeSettings',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello
      "/(protected)/dashboard/_dashboard/settings/home/hooks/useHomeSettings"!
    </div>
  )
}
