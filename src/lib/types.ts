/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	Analytics = "analytics",
	Cartes = "cartes",
	Categories = "categories",
	Customers = "customers",
	Notifications = "notifications",
	OrderItems = "order_items",
	Orders = "orders",
	Products = "products",
	Stores = "stores",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type AnalyticsRecord<Tdata = unknown> = {
	created?: IsoDateString
	data?: null | Tdata
	date?: IsoDateString
	id: string
	metric_name?: string
	period?: string
	store?: RecordIdString[]
	updated?: IsoDateString
}

export type CartesRecord<Tselected_variants = unknown> = {
	created?: IsoDateString
	id: string
	inStock?: boolean
	price?: number
	productId?: RecordIdString[]
	productImage?: string[]
	productName?: string
	quantity?: number
	selected_variants?: null | Tselected_variants
	updated?: IsoDateString
	variantPrice?: number
	variantSku?: string
}

export type CategoriesRecord = {
	created?: IsoDateString
	id: string
	image?: string
	name: string
	updated?: IsoDateString
}

export enum CustomersStatusOptions {
	"active" = "active",
	"inactive" = "inactive",
	"blocked" = "blocked",
}
export type CustomersRecord = {
	created?: IsoDateString
	email?: string
	full_name?: string
	id: string
	lastOrderDate?: IsoDateString
	phone?: number
	status?: CustomersStatusOptions
	totalOrders?: number
	totalSpent?: number
	updated?: IsoDateString
}

export enum NotificationsTypeOptions {
	"new_order" = "new_order",
	"low_stock" = "low_stock",
}
export type NotificationsRecord = {
	created?: IsoDateString
	id: string
	is_read?: boolean
	order?: RecordIdString
	product?: RecordIdString
	type?: NotificationsTypeOptions
	updated?: IsoDateString
}

export type OrderItemsRecord<TselectedVariants = unknown> = {
	created?: IsoDateString
	id: string
	orderId?: RecordIdString[]
	price?: number
	products?: RecordIdString[]
	quantity?: number
	selectedVariants?: null | TselectedVariants
	updated?: IsoDateString
}

export enum OrdersStatusOptions {
	"pending" = "pending",
	"confirmed" = "confirmed",
	"preparing" = "preparing",
	"shipped" = "shipped",
	"delivered" = "delivered",
	"cancelled" = "cancelled",
}

export enum OrdersPaymentStatusOptions {
	"pending" = "pending",
	"cod-confirmed" = "cod-confirmed",
	"paid" = "paid",
	"failed" = "failed",
}

export enum OrdersFulfillmentStatusOptions {
	"pending" = "pending",
	"processing" = "processing",
	"shipped" = "shipped",
	"delivered" = "delivered",
	"cancelled" = "cancelled",
}
export type OrdersRecord<TcustomerInfo = unknown, TshippingAddress = unknown> = {
	created?: IsoDateString
	customerId?: RecordIdString[]
	customerInfo?: null | TcustomerInfo
	estimatedDelivery?: IsoDateString
	fulfillmentStatus?: OrdersFulfillmentStatusOptions
	id: string
	internalNotes?: string
	notes?: string
	orderNumber?: string
	paymentStatus?: OrdersPaymentStatusOptions
	shipping?: number
	shippingAddress?: null | TshippingAddress
	status?: OrdersStatusOptions
	subtotal?: number
	total?: number
	trackingNumber?: string
	updated?: IsoDateString
}

export type ProductsRecord<Tvariants = unknown> = {
	baseCurrency?: string
	basePrice?: number
	categories: RecordIdString[]
	cost: number
	created?: IsoDateString
	description?: HTMLString
	featured_image?: string
	id: string
	images?: string[]
	isActive?: boolean
	old_price?: number
	price: number
	profit: number
	reorderLevel?: number
	sku?: string
	slug: string
	stockQuantity?: number
	store?: RecordIdString[]
	title: string
	updated?: IsoDateString
	variants?: null | Tvariants
}

export type StoresRecord<TbusinessHours = unknown, TcheckoutSettings = unknown, TcodSettingscodSettings = unknown, TcurrencyRates = unknown, Tnotifications_ = unknown, TshippingZones = unknown, TsocialLinks = unknown> = {
	aboutUs?: string
	address?: string
	businessHours?: null | TbusinessHours
	checkoutSettings?: null | TcheckoutSettings
	codSettingscodSettings?: null | TcodSettingscodSettings
	created?: IsoDateString
	currency?: string
	currencyRates?: null | TcurrencyRates
	email?: string
	heroBackground?: string
	id: string
	isActive?: boolean
	is_cart_enabled?: boolean
	logo?: string
	notifications_?: null | Tnotifications_
	paymentMethod?: string
	phone?: string
	shippingZones?: null | TshippingZones
	socialLinks?: null | TsocialLinks
	storeDescription?: string
	storeName?: string
	taxRate?: number
	timezone?: string
	updated?: IsoDateString
	website?: string
}

export type UsersRecord = {
	age?: number
	avatar?: string
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AnalyticsResponse<Tdata = unknown, Texpand = unknown> = Required<AnalyticsRecord<Tdata>> & BaseSystemFields<Texpand>
export type CartesResponse<Tselected_variants = unknown, Texpand = unknown> = Required<CartesRecord<Tselected_variants>> & BaseSystemFields<Texpand>
export type CategoriesResponse<Texpand = unknown> = Required<CategoriesRecord> & BaseSystemFields<Texpand>
export type CustomersResponse<Texpand = unknown> = Required<CustomersRecord> & BaseSystemFields<Texpand>
export type NotificationsResponse<Texpand = unknown> = Required<NotificationsRecord> & BaseSystemFields<Texpand>
export type OrderItemsResponse<TselectedVariants = unknown, Texpand = unknown> = Required<OrderItemsRecord<TselectedVariants>> & BaseSystemFields<Texpand>
export type OrdersResponse<TcustomerInfo = unknown, TshippingAddress = unknown, Texpand = unknown> = Required<OrdersRecord<TcustomerInfo, TshippingAddress>> & BaseSystemFields<Texpand>
export type ProductsResponse<Tvariants = unknown, Texpand = unknown> = Required<ProductsRecord<Tvariants>> & BaseSystemFields<Texpand>
export type StoresResponse<TbusinessHours = unknown, TcheckoutSettings = unknown, TcodSettingscodSettings = unknown, TcurrencyRates = unknown, Tnotifications_ = unknown, TshippingZones = unknown, TsocialLinks = unknown, Texpand = unknown> = Required<StoresRecord<TbusinessHours, TcheckoutSettings, TcodSettingscodSettings, TcurrencyRates, Tnotifications_, TshippingZones, TsocialLinks>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	analytics: AnalyticsRecord
	cartes: CartesRecord
	categories: CategoriesRecord
	customers: CustomersRecord
	notifications: NotificationsRecord
	order_items: OrderItemsRecord
	orders: OrdersRecord
	products: ProductsRecord
	stores: StoresRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	analytics: AnalyticsResponse
	cartes: CartesResponse
	categories: CategoriesResponse
	customers: CustomersResponse
	notifications: NotificationsResponse
	order_items: OrderItemsResponse
	orders: OrdersResponse
	products: ProductsResponse
	stores: StoresResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'analytics'): RecordService<AnalyticsResponse>
	collection(idOrName: 'cartes'): RecordService<CartesResponse>
	collection(idOrName: 'categories'): RecordService<CategoriesResponse>
	collection(idOrName: 'customers'): RecordService<CustomersResponse>
	collection(idOrName: 'notifications'): RecordService<NotificationsResponse>
	collection(idOrName: 'order_items'): RecordService<OrderItemsResponse>
	collection(idOrName: 'orders'): RecordService<OrdersResponse>
	collection(idOrName: 'products'): RecordService<ProductsResponse>
	collection(idOrName: 'stores'): RecordService<StoresResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
