import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/(public)/')({
  loader: () => {
    return {
      hero: {
        title: "Eco-Friendly Products for Sustainable Living",
        subtitle: "Discover our curated collection of environmentally conscious products that help you live sustainably while reducing your carbon footprint.",
        ctaText: "Shop Now",
        backgroundImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop&crop=center"
      }
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { hero } = Route.useLoaderData()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hero.backgroundImage})` }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4 leading-tight">
            {hero.title}
          </h1>
          <p className="text-lg mb-8 opacity-90 leading-relaxed">
            {hero.subtitle}
          </p>
          <Button 
            size="lg" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            {hero.ctaText}
          </Button>
        </div>
      </section>
    </div>
  )
}
