import { ChevronRight } from 'lucide-react'

interface BreadcrumbsProps {
  items: { label: string; href?: string }[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6 overflow-x-auto scrollbar-hide">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1 flex-shrink-0">
          {item.href ? (
            <a 
              href={item.href}
              className="hover:text-gray-700 transition-colors duration-200"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      ))}
    </nav>
  )
}
