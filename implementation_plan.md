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
- [x] `/src/routes/index.tsx` (component + loader)

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
- [x] Hero section with background image and CTA
- [x] Featured products grid (2 cols mobile, 3-4 desktop)
- [x] Category navigation chips (horizontal scroll mobile)
- [x] Promotional banner slots
- [x] Newsletter signup section
- [x] Mobile-first responsive layout

**Components (in same file)**:
- [x] HeroSection component
- [x] ProductCard component (2 variants: compact, detailed)
- [x] CategoryChips component
- [x] PromoBanner component
- [x] NewsletterSignup component

**Acceptance**: 
- [x] Mobile-responsive layout with proper touch targets
- [x] Mock products display with proper image aspect ratios
- [x] Navigation to products page works
- [x] All interactive elements have proper hover/active states

### Route 1.2: Products Listing (/products)
**Purpose**: Filterable, sortable product catalog with search
**Files to create**:
- [x] `/src/routes/products/index.tsx` (component + loader)

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
- [x] Product grid with skeleton loading states
- [x] Infinite scroll loading (instead of pagination)
- [x] Sort dropdown (price, name, newest - functional with mock data)
- [x] Filter drawer (categories, price range, availability)
- [x] Search functionality with debounced input
- [x] Empty state when no products found
- [x] Mobile filter drawer with apply/clear actions

**Components (in same file)**:
- [x] ProductGrid component
- [x] SortDropdown component
- [x] FilterDrawer component
- [x] SearchInput component
- [x] EmptyState component

**Acceptance**:
- [x] Grid responsive with proper spacing
- [x] Infinite scroll works smoothly on mobile and desktop
- [x] Sort actually reorders mock products
- [x] Filter drawer opens/closes smoothly on mobile
- [x] Search filters products by name/description

### Route 1.3: Product Detail (/products/$productSlug)
**Purpose**: Individual product page with variants, gallery, add to cart
**Files to create**:
- [x] `/src/routes/products/$productSlug.tsx` (component + loader)

**Status**: ✅ COMPLETE

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
- [x] Image gallery with zoom on desktop, swipe on mobile
- [x] Product info (title, price, rating, description)
- [x] Variant selector (size, color buttons/dropdowns)
- [x] Quantity selector with stock validation
- [x] Add to cart with loading state
- [x] Specifications accordion
- [x] Related products horizontal scroll
- [x] Sticky add to cart bar on mobile
- [x] Breadcrumb navigation

**Components (in same file)**:
- [x] ImageGallery component
- [x] ProductInfo component (includes title, price, rating, description)
- [x] VariantSelector component
- [x] QuantitySelector component
- [x] AddToCartButton component
- [x] SpecificationsAccordion component
- [x] RelatedProducts component
- [x] ReviewsSummary component
- [x] Breadcrumbs component

**Acceptance**:
- [x] Gallery works smoothly on mobile with swipe gestures
- [x] Variant selection updates price/image/stock status
- [x] Add to cart updates cart state and shows feedback
- [x] Sticky bottom bar appears on mobile scroll
- [x] All content readable on small screens

### Route 1.4: Shopping Cart (/cart)
**Purpose**: Review cart items, adjust quantities, proceed to checkout
**Files to create**:
- [x] `/src/routes/(public)/cart/index.tsx` (component + loader)

**Status**: ✅ COMPLETE

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

**Implementation Priority**:
1. [x] Mock cart data structure with multiple items
2. [x] CartItemList component with product thumbnails
3. [x] QuantityControls component with +/- buttons
4. [x] Remove item with confirmation modal
5. [x] CartSummary component with real-time calculations
6. [x] PromoCodeInput component (mock validation)
7. [x] Empty cart state with continue shopping CTA
8. [x] Mobile-first responsive layout
9. [x] Desktop-optimized UX with enhanced layout
10. [x] localStorage persistence for cart state

**Acceptance**:
- [x] Mobile layout prioritizes essential info with thumb-friendly controls
- [x] Desktop layout uses full width with better visual hierarchy  
- [x] Quantity changes update totals immediately with smooth animations
- [x] Remove items with confirmation modal and undo functionality
- [x] Cart persists state during session and across browser sessions
- [x] Real-time calculations update across all components
- [x] Loading states for all async operations
- [x] Hover effects and visual feedback on desktop
- [x] Clickable product images and names for navigation
- [x] Responsive grid layout (12-column on desktop)

### Route 1.5: Checkout (/checkout)
**Purpose**: Multi-step checkout process for COD orders
**Files to create**:
- [x] `/src/routes/(public)/checkout/index.tsx` (component + loader)

**Status**: ✅ COMPLETE

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
- [x] Step 1: Customer information form
- [x] Step 2: Shipping address with validation
- [x] Step 3: Shipping options selection
- [x] Step 4: Order review + COD confirmation
- [x] Progress indicator showing current step
- [x] Form validation with error messages
- [x] Address autocomplete (mock suggestions)
- [x] COD terms and conditions
- [x] Order summary sidebar (desktop) / collapsible (mobile)

**Components (in same file)**:
- [x] CheckoutStepper component
- [x] CustomerInfoForm component
- [x] ShippingAddressForm component
- [x] ShippingOptions component
- [x] OrderReview component
- [x] CODTerms component
- [x] OrderSummary component

**Validation**:
- [x] Real-time form validation
- [x] Phone number format validation
- [x] Email format validation
- [x] Required field indicators

**Acceptance**:
- [x] Multi-step flow works smoothly with back/next
- [x] Form validation prevents progression with errors
- [x] Mobile forms are thumb-friendly with proper input types
- [x] COD terms are clear and prominent
- [x] Order summary updates with shipping selection

### Route 1.6: Order Confirmation (/order-confirmation/$orderId)
**Purpose**: Success page after order placement with COD instructions
**Files to create**:
- [x] `/src/routes/(public)/order-confirmation/$orderId.tsx` (component + loader)

**Status**: ✅ COMPLETE

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
- [x] Order details summary with order number
- [x] COD payment instructions with amount
- [x] Estimated delivery date
- [x] Customer and shipping information
- [x] Order items list
- [x] Download receipt button (mock PDF)
- [x] Track order button (future)
- [x] Continue shopping CTA
- [x] Support contact information

**Components (in same file)**:
- [x] OrderHeader component
- [x] CODInstructions component
- [x] OrderItemsList component
- [x] DeliveryInfo component
- [x] SupportContact component
- [x] DownloadReceipt component

**Acceptance**:
- [x] Order details display correctly from mock data
- [x] COD instructions are prominent and clear
- [x] Customer can easily find support contact
- [x] Mobile layout prioritizes key information
- [x] Clear next steps for customer


## PHASE 2: DASHBOARD ROUTES (MOCK DATA)

### Route 2.1: Dashboard Layout (/dashboard)
**Purpose**: Protected layout for store owner with navigation
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/route.tsx` (layout component)

**Status**: 🚧 IN PROGRESS

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
- [x] Sidebar navigation with icons (collapsible on desktop)
- [x] Mobile drawer navigation with overlay
- [x] Top header with user menu and notifications
- [x] Breadcrumbs for nested routes
- [x] Theme toggle (light/dark)
- [x] Mock logout functionality

**Components (in same file)**:
- [x] DashboardSidebar component
- [x] MobileNav component
- [x] UserMenu component
- [x] NotificationBell component
- [x] Breadcrumbs component
- [x] ThemeToggle component

**Auth Protection**:
- [x] Mock authentication check in loader
- [x] Redirect to login if not authenticated
- [x] Role-based access (store owner only)

### Route 2.2: Dashboard Overview (/dashboard/index)
**Purpose**: Key metrics and quick actions dashboard
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/_dashboard/index.tsx` (component + loader)

**Status**: ✅ COMPLETE

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
- [x] KPI cards with icons and trend indicators
- [x] Recent orders table with quick actions
- [x] Low stock alerts
- [x] Quick action buttons (add product, view orders)
- [x] Revenue chart (simple mock chart)
- [x] Top selling products list

**Components (in same file)**:
- [x] StatsCard component
- [x] RecentOrdersTable component
- [x] QuickActions component
- [x] LowStockAlert component
- [x] TopProducts component

### Route 2.3: Products Management (/dashboard/products)
**Purpose**: Complete product CRUD interface
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/_dashboard/products/index.tsx` (component + loader)
- [x] `/src/routes/(protected)/dashboard/_dashboard/products/new.tsx` (component + loader)
- [x] `/src/routes/(protected)/dashboard/_dashboard/products/$productId/edit.tsx` (component + loader)

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
- [x] Product list table with search and filters
- [x] Bulk actions (delete, toggle status, export)
- [x] Add new product form with image upload
- [x] Edit product with dedicated form page
- [x] Stock management with low stock warnings
- [ ] Product status toggle (active/inactive)
- [ ] Category management
- [ ] Duplicate product functionality

**Components (in same file per route)**:
- [x] ProductsTable component
- [x] BulkActions component
- [x] ProductForm component
- [x] ImageUpload component
- [ ] StockControls component
- [ ] CategorySelector component

### Route 2.4: Orders Management (/dashboard/orders)
**Purpose**: View and manage all customer orders
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/_dashboard/orders/index.tsx` (component + loader)
- [ ] `/src/routes/(protected)/dashboard/_dashboard/orders/$orderId.tsx` (component + loader)

**Mock Order Management Data**:
```typescript
interface MockOrderManagement extends MockOrder {
  paymentStatus: 'pending' | 'cod-confirmed' | 'paid' | 'failed';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes: string;
  internalNotes: string;
  assignedTo?: string;
  statusHistory: { status: string; updatedAt: string }[];
}
```

**Features**:
- [x] Orders table with status filters and search
- [x] Order status updates with history tracking
- [x] COD confirmation workflow
- [x] Print shipping labels (mock)
- [x] Order timeline view
- [x] Customer communication log
- [x] Bulk status updates
- [x] Export orders to CSV

**Components (in same file per route)**:
- [x] OrdersTable component
- [x] StatusFilter component
- [x] OrderDetail component
- [x] StatusUpdateForm component
- [x] OrderTimeline component
- [x] PrintLabel component

### Route 2.5: Customers Management (/dashboard/customers)
**Purpose**: Customer database and communication
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/_dashboard/customers/index.tsx` (component + loader)
- [x] `/src/routes/(protected)/dashboard/_dashboard/customers/$customerId.tsx` (component + loader)

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
- [x] Customer list with search and filters
- [x] Customer profiles with order history
- [x] Communication log and notes
- [x] Customer segmentation
- [x] Export customer data
- [x] Block/unblock customers

**Components (in same file per route)**:
- [x] CustomersTable component
- [x] CustomerProfile component
- [x] OrderHistory component
- [x] CustomerNotes component
- [x] AddressBook component

### Route 2.6: Analytics & Reports (/dashboard/analytics)
**Purpose**: Sales analytics and business intelligence
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/_dashboard/analytics/index.tsx` (component + loader)

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
- [x] Revenue charts (daily, weekly, monthly)
- [x] Top selling products
- [x] Customer acquisition metrics
- [x] COD vs other payment analysis
- [x] Geographic sales distribution
- [x] Export reports

**Components (in same file)**:
- [x] RevenueChart component
- [x] TopProductsChart component
- [x] CustomerAcquisitionChart component
- [x] PaymentAnalysisChart component
- [x] GeographicMap component
- [x] ExportReportsButton component

### Route 2.7: Settings (/dashboard/settings)
**Purpose**: Store configuration and preferences
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/_dashboard/settings/index.tsx` (component + loader)
- [ ] `/src/routes/(protected)/dashboard/_dashboard/settings/checkout.tsx` (component + loader)

**Mock Settings Data**:
```typescript
interface MockStoreSettings {
  storeName: string;
  storeDescription: string;
  logo: string;
  currency: string;
  timezone: string;
  shippingZones: MockShippingOption[];
  codSettings?: {
    enabled: boolean;
    maxOrderValue: number;
    confirmationRequired: boolean;
  };
  notifications?: {
    newOrders: boolean;
    lowStock: boolean;
    customerMessages: boolean;
  };
  taxRate?: number;
  checkoutSettings?: {
    fields: {
      phoneRequired: boolean;
      companyNameEnabled: boolean;
      customFields: string[];
    };
    appearance: {
      primaryColor: string;
      buttonText: string;
      submitButtonText: string;
    };
    features: {
      guestCheckoutEnabled: boolean;
      showOrderSummary: boolean;
      enableCouponCodes: boolean;
    };
    messages: {
      thankYouMessage: string;
      processingMessage: string;
    };
    steps: {
      enabledSteps: string[];
      stepOrder: string[];
    };
  };
}
```

**Features**:
- [x] Store information form
- [x] Shipping zones configuration
- [x] COD settings management
- [x] Notification preferences
- [x] Tax settings
- [x] Logo upload
- [ ] **Checkout Page Settings**
- [ ] Add/remove checkout fields configuration
- [ ] Customize button text and colors
- [ ] Enable/disable guest checkout
- [ ] Add custom thank-you message
- [ ] Reorder checkout steps

**Components (in same file per route)**:
- [x] StoreInfoForm component
- [x] ShippingZones component
- [x] CODSettings component
- [x] NotificationSettings component
- [x] TaxSettings component
- [x] LogoUpload component
- [ ] CheckoutFieldsSettings component
- [ ] CheckoutAppearanceSettings component
- [ ] CheckoutFeaturesSettings component
- [ ] CheckoutMessagesSettings component
- [ ] CheckoutStepsSettings component

### Route 2.7.1: Home Page Settings (/dashboard/settings/home)
**Purpose**: Comprehensive home page and header management interface
**Files to create**:
- [x] `/src/routes/(protected)/dashboard/_dashboard/settings/home.tsx` (component + loader)

**Status**: ✅ COMPLETE

**Integration Complete:**
- [x] Header reflects store settings (logo, search visibility, wishlist visibility, style)
- [x] Home page uses dynamic content from dashboard settings
- [x] Hero background image upload and display
- [x] Real-time preview functionality
- [x] All sections can be enabled/disabled from dashboard
- [x] Settings persist and update immediately on website

**Features**:
- [x] Header configuration (store name, logo, navigation options)
- [x] Hero section management (title, subtitle, CTA, background image)
- [x] Categories section control (visibility, layout, title)
- [x] Featured products settings (enable/disable, count, sorting)
- [x] Promotional banners management (add/remove/edit banners)
- [x] Newsletter section customization
- [x] Real-time preview of changes
- [x] File uploads for logo and hero background
- [x] Mobile-responsive interface

**Components (in same file)**:
- [x] HeaderConfigSection component
- [x] HeroSettingsSection component
- [x] CategoriesSettingsSection component
- [x] FeaturedProductsSection component
- [x] PromoBannersManager component
- [x] NewsletterSettingsSection component

**Data Structure Updates**:
- [x] Extended `StoresRecord.checkoutSettings` to include home page configuration
- [x] Header settings (showSearch, showWishlist, style)
- [x] Hero section settings (enabled, title, subtitle, ctaText, backgroundImage)
- [x] Categories configuration (enabled, title, layout, visibleCategories)
- [x] Featured products settings (enabled, title, limit, sortBy)
- [x] Promo banners array with individual banner controls
- [x] Newsletter customization options

**Acceptance**:
- [x] Store owners can customize all home page sections
- [x] Header navigation and branding can be configured
- [x] Image uploads work for logo and hero background
- [x] Settings are saved to PocketBase and reflected on frontend
- [x] Mobile-first responsive design with tabbed interface
- [x] Real-time validation and error handling
- [x] Integration with existing store settings

---

## PHASE 3: BACKEND INTEGRATION (POCKETBASE)

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

## CURRENT STATUS: IMPLEMENTING CHECKOUT PAGE SETTINGS
Next step: Create Route 2.7.1: Checkout Page Settings (/dashboard/settings/checkout)

**Recently Completed:**
- ✅ Phase 1: All Customer-Facing Routes (Mock Data)
- ✅ Phase 2: Dashboard Routes (Mock Data) - Most routes completed
- ✅ Route 2.3: Products Management (including edit functionality)

**Currently Working On:**
- 🚧 Route 2.7.1: Checkout Page Settings - NEW FEATURE REQUESTED