# Ecommerce (Cash on Delivery) – Route-Based Implementation Plan
Date: 2025-08-10
Status: Planning document (no code implementation here)

## Project Principles
- Mobile-first, responsive design
- TypeScript with strict type safety
- TanStack Router with file-based routing
- All data via loaders (no useEffect for fetching)
- Mock data with common ecommerce fields FIRST, backend integration LATER
- shadcn/ui components only
- Keep components simple, avoid unnecessary abstractions
- Route folders are self-contained (component + loader + local helpers)
- Consistent UX patterns across the application
- COD only (no payment gateway integration)

## Project Setup (Already Complete)
- ✅ Tailwind CSS configured
- ✅ PocketBase SDK ready
- ✅ shadcn/ui components installed
- ✅ React + TanStack Router setup
- ✅ Design tokens in src/styles.css (light/dark themes)
- ✅ File-based routing structure

---

## Implementation Phases Overview

### Phase 1: Customer-Facing Routes (Mock Data)
### Phase 2: Dashboard Routes (Mock Data)  
### Phase 3: Backend Integration (PocketBase + ./src/lib/types.ts)
### Phase 4: Polish & Production

---

## PHASE 1: CUSTOMER-FACING ROUTES (MOCK DATA)

### Route 1.1: Home Page (/)
**Purpose**: Landing page with hero, featured products, customizable sections
**Files to create**:
- [ ] `/src/routes/index.tsx` (component + loader)

**Mock Data Structure**:
```typescript
// Common ecommerce fields for mock data
interface MockProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  inStock: boolean;
  description: string;
  slug: string;
}

interface MockHeroSection {
  title: string;
  subtitle: string;
  backgroundImage: string;
  ctaText: string;
  ctaLink: string;
}
```

**Features**:
- [ ] Hero section with background image and CTA
- [ ] Featured products grid (2 cols mobile, 3-4 desktop)
- [ ] Category navigation chips (horizontal scroll mobile)
- [ ] Promotional banner slots
- [ ] Newsletter signup section
- [ ] Mobile-first responsive layout

**Components (in same file)**:
- [ ] HeroSection component
- [ ] ProductCard component (2 variants: compact, detailed)
- [ ] CategoryChips component
- [ ] PromoBanner component
- [ ] NewsletterSignup component

**Acceptance**: 
- [ ] Mobile-responsive layout with proper touch targets
- [ ] Mock products display with proper image aspect ratios
- [ ] Navigation to products page works
- [ ] All interactive elements have proper hover/active states

### Route 1.2: Products Listing (/products)
**Purpose**: Filterable, sortable product catalog with search
**Files to create**:
- [ ] `/src/routes/products/index.tsx` (component + loader)

**Mock Data Extensions**:
```typescript
interface MockProductFilters {
  categories: string[];
  priceRange: { min: number; max: number };
  inStock: boolean;
  sortBy: 'name' | 'price-low' | 'price-high' | 'newest';
}

interface MockCategory {
  id: string;
  name: string;
  count: number;
}
```

**Features**:
- [ ] Product grid with skeleton loading states
- [ ] Sort dropdown (price, name, newest - functional with mock data)
- [ ] Filter drawer (categories, price range, availability)
- [ ] Search functionality with debounced input
- [ ] Pagination with page numbers
- [ ] Empty state when no products found
- [ ] Mobile filter drawer with apply/clear actions

**Components (in same file)**:
- [ ] ProductGrid component
- [ ] FilterDrawer component
- [ ] SortDropdown component
- [ ] SearchInput component
- [ ] Pagination component
- [ ] EmptyState component

**Acceptance**:
- [ ] Grid responsive with proper spacing
- [ ] Filter drawer opens/closes smoothly on mobile
- [ ] Sort actually reorders mock products
- [ ] Search filters products by name/description
- [ ] Pagination works with mock data sets

### Route 1.3: Product Detail (/products/$productSlug)
**Purpose**: Individual product page with variants, gallery, add to cart
**Files to create**:
- [ ] `/src/routes/products/$productSlug.tsx` (component + loader)

**Mock Data Extensions**:
```typescript
interface MockProductVariant {
  id: string;
  name: string;
  value: string;
  type: 'color' | 'size' | 'material';
  price?: number; // if variant affects price
  image?: string; // if variant has specific image
  inStock: boolean;
}

interface MockProductDetail extends MockProduct {
  variants: MockProductVariant[];
  specifications: { label: string; value: string }[];
  relatedProducts: MockProduct[];
  reviews: { rating: number; count: number };
}
```

**Features**:
- [ ] Image gallery with zoom on desktop, swipe on mobile
- [ ] Product info (title, price, rating, description)
- [ ] Variant selector (size, color buttons/dropdowns)
- [ ] Quantity selector with stock validation
- [ ] Add to cart with loading state
- [ ] Specifications accordion
- [ ] Related products horizontal scroll
- [ ] Sticky add to cart bar on mobile
- [ ] Breadcrumb navigation

**Components (in same file)**:
- [ ] ImageGallery component
- [ ] VariantSelector component
- [ ] QuantitySelector component
- [ ] AddToCartButton component
- [ ] SpecificationsAccordion component
- [ ] RelatedProducts component
- [ ] ReviewsSummary component
- [ ] Breadcrumbs component

**Acceptance**:
- [ ] Gallery works smoothly on mobile with swipe gestures
- [ ] Variant selection updates price/image/stock status
- [ ] Add to cart updates cart state and shows feedback
- [ ] Sticky bottom bar appears on mobile scroll
- [ ] All content readable on small screens

### Route 1.4: Shopping Cart (/cart)
**Purpose**: Review cart items, adjust quantities, proceed to checkout
**Files to create**:
- [ ] `/src/routes/cart/index.tsx` (component + loader)

**Mock Cart State**:
```typescript
interface MockCartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  selectedVariants: { type: string; value: string }[];
  quantity: number;
  price: number;
  inStock: boolean;
}

interface MockCartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}
```

**Features**:
- [ ] Cart items list with product thumbnails
- [ ] Quantity adjustment with +/- buttons
- [ ] Remove item with confirmation
- [ ] Subtotal calculation with real-time updates
- [ ] Shipping calculator (mock zones)
- [ ] Promo code input (mock validation)
- [ ] Proceed to checkout button
- [ ] Empty cart state with continue shopping CTA
- [ ] Save for later functionality (mock)

**Components (in same file)**:
- [ ] CartItemList component
- [ ] CartItem component
- [ ] QuantityControls component
- [ ] CartSummary component
- [ ] PromoCodeInput component
- [ ] EmptyCart component

**State Management**:
- [ ] localStorage persistence
- [ ] Context provider for cart state
- [ ] Optimistic updates for quantity changes

**Acceptance**:
- [ ] Quantity changes update totals immediately
- [ ] Remove items with smooth animation
- [ ] Cart persists on page refresh
- [ ] Mobile layout shows essential info clearly
- [ ] Loading states for all async operations

### Route 1.5: Checkout (/checkout)
**Purpose**: Multi-step checkout process for COD orders
**Files to create**:
- [ ] `/src/routes/checkout/index.tsx` (component + loader)

**Mock Checkout Data**:
```typescript
interface MockCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface MockShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface MockShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}
```

**Features**:
- [ ] Step 1: Customer information form
- [ ] Step 2: Shipping address with validation
- [ ] Step 3: Shipping options selection
- [ ] Step 4: Order review + COD confirmation
- [ ] Progress indicator showing current step
- [ ] Form validation with error messages
- [ ] Address autocomplete (mock suggestions)
- [ ] COD terms and conditions
- [ ] Order summary sidebar (desktop) / collapsible (mobile)

**Components (in same file)**:
- [ ] CheckoutStepper component
- [ ] CustomerInfoForm component
- [ ] ShippingAddressForm component
- [ ] ShippingOptions component
- [ ] OrderReview component
- [ ] CODTerms component
- [ ] OrderSummary component

**Validation**:
- [ ] Real-time form validation
- [ ] Phone number format validation
- [ ] Email format validation
- [ ] Required field indicators

**Acceptance**:
- [ ] Multi-step flow works smoothly with back/next
- [ ] Form validation prevents progression with errors
- [ ] Mobile forms are thumb-friendly with proper input types
- [ ] COD terms are clear and prominent
- [ ] Order summary updates with shipping selection

### Route 1.6: Order Confirmation (/order-confirmation/$orderId)
**Purpose**: Success page after order placement with COD instructions
**Files to create**:
- [ ] `/src/routes/order-confirmation/$orderId.tsx` (component + loader)

**Mock Order Data**:
```typescript
interface MockOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';
  items: MockCartItem[];
  customer: MockCustomerInfo;
  shipping: MockShippingAddress;
  summary: MockCartSummary;
  estimatedDelivery: string;
  trackingNumber?: string;
  placedAt: string;
}
```

**Features**:
- [ ] Order details summary with order number
- [ ] COD payment instructions with amount
- [ ] Estimated delivery date
- [ ] Customer and shipping information
- [ ] Order items list
- [ ] Download receipt button (mock PDF)
- [ ] Track order button (future)
- [ ] Continue shopping CTA
- [ ] Support contact information

**Components (in same file)**:
- [ ] OrderHeader component
- [ ] CODInstructions component
- [ ] OrderItemsList component
- [ ] DeliveryInfo component
- [ ] SupportContact component
- [ ] DownloadReceipt component

**Acceptance**:
- [ ] Order details display correctly from mock data
- [ ] COD instructions are prominent and clear
- [ ] Customer can easily find support contact
- [ ] Mobile layout prioritizes key information
- [ ] Clear next steps for customer

### Route 1.7: Search Results (/search)
**Purpose**: Global search results page
**Files to create**:
- [ ] `/src/routes/search/index.tsx` (component + loader)

**Features**:
- [ ] Search results grid (same as products)
- [ ] Search query highlighting in results
- [ ] Filter by category within search results
- [ ] Sort search results
- [ ] No results state with suggestions
- [ ] Recent searches (localStorage)

**Components (reuse from products page)**:
- [ ] SearchResults component
- [ ] NoResults component

---

## PHASE 2: DASHBOARD ROUTES (MOCK DATA)

### Route 2.1: Dashboard Layout (/dashboard)
**Purpose**: Protected layout for store owner with navigation
**Files to create**:
- [ ] `/src/routes/dashboard.tsx` (layout component)

**Mock Auth**:
```typescript
interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin';
  avatar?: string;
}
```

**Features**:
- [ ] Sidebar navigation with icons (collapsible on desktop)
- [ ] Mobile drawer navigation with overlay
- [ ] Top header with user menu and notifications
- [ ] Breadcrumbs for nested routes
- [ ] Theme toggle (light/dark)
- [ ] Mock logout functionality

**Components (in same file)**:
- [ ] DashboardSidebar component
- [ ] MobileNav component
- [ ] UserMenu component
- [ ] NotificationBell component
- [ ] ThemeToggle component

**Auth Protection**:
- [ ] Mock authentication check in loader
- [ ] Redirect to login if not authenticated
- [ ] Role-based access (store owner only)

### Route 2.2: Dashboard Overview (/dashboard/index)
**Purpose**: Key metrics and quick actions dashboard
**Files to create**:
- [ ] `/src/routes/dashboard/index.tsx` (component + loader)

**Mock Analytics Data**:
```typescript
interface MockDashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingCODOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  conversionRate: number;
  avgOrderValue: number;
}

interface MockRecentOrder {
  id: string;
  customerName: string;
  total: number;
  status: string;
  placedAt: string;
}
```

**Features**:
- [ ] KPI cards with icons and trend indicators
- [ ] Recent orders table with quick actions
- [ ] Low stock alerts
- [ ] Quick action buttons (add product, view orders)
- [ ] Revenue chart (simple mock chart)
- [ ] Top selling products list

**Components (in same file)**:
- [ ] StatsCard component
- [ ] RecentOrdersTable component
- [ ] QuickActions component
- [ ] LowStockAlert component
- [ ] TopProducts component

### Route 2.3: Products Management (/dashboard/products)
**Purpose**: Complete product CRUD interface
**Files to create**:
- [ ] `/src/routes/dashboard/products/index.tsx` (component + loader)
- [ ] `/src/routes/dashboard/products/new.tsx` (component + loader)
- [ ] `/src/routes/dashboard/products/$productId/edit.tsx` (component + loader)

**Mock Product Management Data**:
```typescript
interface MockProductManagement extends MockProduct {
  sku: string;
  stockQuantity: number;
  reorderLevel: number;
  cost: number;
  profit: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
```

**Features**:
- [ ] Product list table with search and filters
- [ ] Bulk actions (delete, toggle status, export)
- [ ] Add new product form with image upload
- [ ] Edit product with inline editing capabilities
- [ ] Stock management with low stock warnings
- [ ] Product status toggle (active/inactive)
- [ ] Category management
- [ ] Duplicate product functionality

**Components (in same file per route)**:
- [ ] ProductsTable component
- [ ] BulkActions component
- [ ] ProductForm component
- [ ] ImageUpload component
- [ ] StockControls component
- [ ] CategorySelector component

### Route 2.4: Orders Management (/dashboard/orders)
**Purpose**: View and manage all customer orders
**Files to create**:
- [ ] `/src/routes/dashboard/orders/index.tsx` (component + loader)
- [ ] `/src/routes/dashboard/orders/$orderId.tsx` (component + loader)

**Mock Order Management Data**:
```typescript
interface MockOrderManagement extends MockOrder {
  paymentStatus: 'pending' | 'cod-confirmed' | 'paid' | 'failed';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes: string;
  internalNotes: string;
  assignedTo?: string;
}
```

**Features**:
- [ ] Orders table with status filters and search
- [ ] Order status updates with history tracking
- [ ] COD confirmation workflow
- [ ] Print shipping labels (mock)
- [ ] Order timeline view
- [ ] Customer communication log
- [ ] Bulk status updates
- [ ] Export orders to CSV

**Components (in same file per route)**:
- [ ] OrdersTable component
- [ ] StatusFilter component
- [ ] OrderDetail component
- [ ] StatusUpdateForm component
- [ ] OrderTimeline component
- [ ] PrintLabel component

### Route 2.5: Customers Management (/dashboard/customers)
**Purpose**: Customer database and communication
**Files to create**:
- [ ] `/src/routes/dashboard/customers/index.tsx` (component + loader)
- [ ] `/src/routes/dashboard/customers/$customerId.tsx` (component + loader)

**Mock Customer Data**:
```typescript
interface MockCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'active' | 'inactive' | 'blocked';
  addresses: MockShippingAddress[];
  orderHistory: MockOrder[];
  joinedAt: string;
}
```

**Features**:
- [ ] Customer list with search and filters
- [ ] Customer profiles with order history
- [ ] Communication log and notes
- [ ] Customer segmentation
- [ ] Export customer data
- [ ] Block/unblock customers

**Components (in same file per route)**:
- [ ] CustomersTable component
- [ ] CustomerProfile component
- [ ] OrderHistory component
- [ ] CustomerNotes component
- [ ] AddressBook component

### Route 2.6: Analytics & Reports (/dashboard/analytics)
**Purpose**: Sales analytics and business intelligence
**Files to create**:
- [ ] `/src/routes/dashboard/analytics/index.tsx` (component + loader)

**Mock Analytics Data**:
```typescript
interface MockAnalytics {
  salesOverTime: { date: string; revenue: number; orders: number }[];
  topProducts: { product: MockProduct; sold: number; revenue: number }[];
  customerSegments: { segment: string; count: number; revenue: number }[];
  conversionFunnel: { stage: string; count: number; rate: number }[];
}
```

**Features**:
- [ ] Revenue charts (daily, weekly, monthly)
- [ ] Top selling products
- [ ] Customer acquisition metrics
- [ ] COD vs other payment analysis
- [ ] Geographic sales distribution
- [ ] Export reports

**Components (in same file)**:
- [ ] RevenueChart component
- [ ] TopProductsChart component
- [ ] CustomerMetrics component
- [ ] GeographicMap component

### Route 2.7: Settings (/dashboard/settings)
**Purpose**: Store configuration and preferences
**Files to create**:
- [ ] `/src/routes/dashboard/settings/index.tsx` (component + loader)

**Mock Settings Data**:
```typescript
interface MockStoreSettings {
  storeName: string;
  storeDescription: string;
  logo: string;
  currency: string;
  timezone: string;
  shippingZones: MockShippingOption[];
  codSettings: {
    enabled: boolean;
    maxOrderValue: number;
    confirmationRequired: boolean;
  };
  notifications: {
    newOrders: boolean;
    lowStock: boolean;
    customerMessages: boolean;
  };
}
```

**Features**:
- [ ] Store information form
- [ ] Shipping zones configuration
- [ ] COD settings management
- [ ] Notification preferences
- [ ] Tax settings
- [ ] Logo upload

**Components (in same file)**:
- [ ] StoreInfoForm component
- [ ] ShippingZones component
- [ ] CODSettings component
- [ ] NotificationSettings component

---

## PHASE 3: BACKEND INTEGRATION (POCKETBASE)

### 3.1: Database Schema Setup
**Files to update**:
- [ ] `./src/lib/types.ts` (replace mock types with real PocketBase types)

**PocketBase Collections to Create**:
- [ ] `products` collection
- [ ] `categories` collection
- [ ] `orders` collection
- [ ] `order_items` collection
- [ ] `customers` collection
- [ ] `addresses` collection
- [ ] `settings` collection

### 3.2: API Integration
**Files to create/update**:
- [ ] `./src/lib/pocketbase.ts` (API client setup)
- [ ] `./src/lib/api/products.ts` (product CRUD operations)
- [ ] `./src/lib/api/orders.ts` (order management)
- [ ] `./src/lib/api/customers.ts` (customer management)

### 3.3: Authentication System
**Files to create/update**:
- [ ] `./src/lib/auth.ts` (authentication utilities)
- [ ] `./src/routes/login.tsx` (login page)
- [ ] `./src/routes/register.tsx` (registration page)

### 3.4: Route Loaders Update
**Update all route loaders to use real API calls instead of mock data**

---

## PHASE 4: POLISH & PRODUCTION

### 4.1: Performance Optimization
- [ ] Image optimization and lazy loading
- [ ] Code splitting and bundle optimization
- [ ] Caching strategies
- [ ] Loading states and skeletons

### 4.2: SEO & Accessibility
- [ ] Meta tags and structured data
- [ ] ARIA labels and keyboard navigation
- [ ] Screen reader compatibility
- [ ] Social media sharing

### 4.3: Error Handling
- [ ] Global error boundaries
- [ ] API error handling
- [ ] Offline support
- [ ] Form validation improvements

### 4.4: Testing & QA
- [ ] Unit tests for critical functions
- [ ] Integration tests for user flows
- [ ] Mobile device testing
- [ ] Performance testing

### 4.5: Deployment
- [ ] Environment configuration
- [ ] Build optimization
- [ ] CDN setup for images
- [ ] Monitoring and analytics

---

## IMPLEMENTATION NOTES

### Mobile-First Considerations
- All layouts start with mobile (320px) and scale up
- Touch targets minimum 44px
- Thumb-friendly navigation patterns
- Essential information prioritized on small screens
- Horizontal scrolling for secondary content

### Component Reuse Strategy
- Keep components in route files unless used in 3+ places
- Extract to `/src/components/ui/` only for true reusables
- Use composition over complex prop APIs
- Prefer simple, focused components

### State Management
- TanStack Router for URL state and navigation
- React Context for app-wide state (cart, auth)
- localStorage for persistence
- No external state library unless complexity demands it

### Type Safety
- All API responses properly typed
- Form validation with type-safe schemas
- Mock data matches real data structure
- Gradual migration from mock to real types

### Performance Targets
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Mobile PageSpeed Score > 90
- Bundle size < 500KB initial load

---

## CURRENT STATUS: READY TO BEGIN PHASE 1.1
Next step: Implement Route 1.1 (Home Page) starting with Hero section for mobile view.