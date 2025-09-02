import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(protected)/dashboard/_dashboard/settings/home/components/FileUpload',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello
      "/(protected)/dashboard/_dashboard/settings/home/components/FileUpload"!
    </div>
  )
}
