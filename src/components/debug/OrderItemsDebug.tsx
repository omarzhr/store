import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import pb from '@/lib/db'
import { Collections } from '@/lib/types'
import type { OrdersResponse, OrderItemsResponse } from '@/lib/types'

interface DebugData {
  orders: OrdersResponse[]
  orderItems: OrderItemsResponse[]
  expansionTest: any
  relationshipStats: {
    totalOrders: number
    totalOrderItems: number
    linkedOrderItems: number
    orphanedOrderItems: number
  }
}

export function OrderItemsDebug() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDebugAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Starting order items debug analysis...')

      // 1. Fetch all orders
      const orders = await pb.collection(Collections.Orders).getFullList<OrdersResponse>({
        sort: '-created',
        requestKey: `debug-orders-${Date.now()}`
      })
      console.log('📋 Orders found:', orders.length)

      // 2. Fetch all order items
      const orderItems = await pb.collection(Collections.OrderItems).getFullList<OrderItemsResponse>({
        sort: '-created',
        requestKey: `debug-order-items-${Date.now()}`
      })
      console.log('📦 Order items found:', orderItems.length)

      // 3. Test expansion query
      let expansionTest = null
      try {
        expansionTest = await pb.collection(Collections.Orders).getFullList({
          expand: 'order_items(orderId).products',
          requestKey: `debug-expansion-${Date.now()}`
        })
        console.log('🔗 Expansion test successful:', expansionTest.length)
      } catch (expansionError) {
        console.error('❌ Expansion test failed:', expansionError)
        expansionTest = { error: expansionError }
      }

      // 4. Calculate relationship statistics
      const linkedOrderItems = orderItems.filter(item => 
        item.orderId && item.orderId.length > 0
      )
      const orphanedOrderItems = orderItems.filter(item => 
        !item.orderId || item.orderId.length === 0
      )

      const relationshipStats = {
        totalOrders: orders.length,
        totalOrderItems: orderItems.length,
        linkedOrderItems: linkedOrderItems.length,
        orphanedOrderItems: orphanedOrderItems.length
      }

      console.log('📊 Relationship stats:', relationshipStats)

      setDebugData({
        orders,
        orderItems,
        expansionTest,
        relationshipStats
      })

    } catch (err) {
      console.error('💥 Debug analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const migrateOrphanedItems = async () => {
    setLoading(true)
    try {
      console.log('🔧 Starting orphaned items migration...')
      
      // Get orphaned items
      const orphanedItems = debugData?.orderItems.filter(item => 
        !item.orderId || item.orderId.length === 0
      ) || []

      if (orphanedItems.length === 0) {
        alert('No orphaned items to migrate!')
        return
      }

      let migratedCount = 0
      const errors = []

      for (const item of orphanedItems) {
        try {
          // Try to find matching order by created date and total
          const potentialOrders = debugData?.orders.filter(order => {
            const orderDate = new Date(order.created)
            const itemDate = new Date(item.created)
            const timeDiff = Math.abs(orderDate.getTime() - itemDate.getTime())
            // Look for orders created within 1 hour of the item
            return timeDiff < 3600000
          }) || []

          if (potentialOrders.length === 1) {
            // Update the item with the orderId
            await pb.collection(Collections.OrderItems).update(item.id, {
              orderId: [potentialOrders[0].id]
            })
            migratedCount++
            console.log(`✅ Migrated item ${item.id} to order ${potentialOrders[0].id}`)
          } else {
            console.log(`⚠️ Could not find unique order for item ${item.id}`)
          }
        } catch (error) {
          console.error(`❌ Failed to migrate item ${item.id}:`, error)
          errors.push(`Item ${item.id}: ${error}`)
        }
      }

      alert(`Migration completed!\nMigrated: ${migratedCount} items\nErrors: ${errors.length}`)
      
      // Refresh the analysis
      await runDebugAnalysis()
      
    } catch (error) {
      console.error('💥 Migration failed:', error)
      alert(`Migration failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestOrder = async () => {
    setLoading(true)
    try {
      console.log('🧪 Creating test order...')
      
      // Create test order
      const orderData = {
        orderNumber: `TEST-${Date.now()}`,
        customerInfo: {
          email: 'test@example.com',
          fullName: 'Test Customer',
          phone: '1234567890'
        },
        subtotal: 100,
        shipping: 25,
        total: 125,
        status: 'pending',
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
        notes: 'Test order for debugging order items'
      }

      const order = await pb.collection(Collections.Orders).create(orderData)
      console.log('✅ Test order created:', order.id)

      // Create test order item with proper orderId
      const orderItemData = {
        orderId: [order.id],
        products: ['test_product_123'],
        quantity: 2,
        price: 50,
        selectedVariants: { size: 'large', color: 'blue' }
      }

      const orderItem = await pb.collection(Collections.OrderItems).create(orderItemData)
      console.log('✅ Test order item created:', orderItem.id)

      alert(`Test order created successfully!\nOrder ID: ${order.id}\nOrder Item ID: ${orderItem.id}`)
      
      // Refresh the analysis
      await runDebugAnalysis()
      
    } catch (error) {
      console.error('💥 Test order creation failed:', error)
      alert(`Test order creation failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDebugAnalysis()
  }, [])

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Debug analysis failed: {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Order Items Debug Analysis
        </h1>
        <Button onClick={runDebugAnalysis} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      {debugData && (
        <div className="grid gap-6">
          {/* Relationship Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Relationship Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {debugData.relationshipStats.totalOrders}
                  </div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {debugData.relationshipStats.totalOrderItems}
                  </div>
                  <div className="text-sm text-gray-600">Total Order Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {debugData.relationshipStats.linkedOrderItems}
                  </div>
                  <div className="text-sm text-gray-600">Linked Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {debugData.relationshipStats.orphanedOrderItems}
                  </div>
                  <div className="text-sm text-gray-600">Orphaned Items</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugData.relationshipStats.linkedOrderItems > 0)}
                  <span>Order items with proper orderId relationships</span>
                  <Badge variant={debugData.relationshipStats.linkedOrderItems > 0 ? "default" : "destructive"}>
                    {debugData.relationshipStats.linkedOrderItems > 0 ? "Found" : "None Found"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugData.relationshipStats.orphanedOrderItems === 0)}
                  <span>Orphaned order items (missing orderId)</span>
                  <Badge variant={debugData.relationshipStats.orphanedOrderItems === 0 ? "default" : "destructive"}>
                    {debugData.relationshipStats.orphanedOrderItems === 0 ? "None" : `${debugData.relationshipStats.orphanedOrderItems} Found`}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expansion Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>PocketBase Expansion Test</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.expansionTest?.error ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Expansion query failed: {debugData.expansionTest.error.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Expansion query successful</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Query: <code>expand: 'order_items(orderId).products'</code>
                  </div>
                  <div className="text-sm">
                    Orders with expanded items: {Array.isArray(debugData.expansionTest) ? debugData.expansionTest.length : 0}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {debugData.orders.slice(0, 10).map((order) => {
                    const relatedItems = debugData.orderItems.filter(item => 
                      item.orderId && item.orderId.includes(order.id)
                    )
                    
                    return (
                      <div key={order.id} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {order.orderNumber || `#${order.id.slice(-8)}`}
                          </span>
                          <Badge variant={relatedItems.length > 0 ? "default" : "destructive"}>
                            {relatedItems.length} items
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Total: {order.total ? `${order.total} DH` : 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Created: {new Date(order.created).toLocaleDateString()}
                        </div>
                        {relatedItems.length > 0 && (
                          <div className="text-xs bg-green-50 p-2 rounded">
                            Items: {relatedItems.map(item => `${item.quantity || 1}x Product`).join(', ')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Order Items Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {debugData.orderItems.slice(0, 10).map((item) => (
                    <div key={item.id} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          Item #{item.id.slice(-8)}
                        </span>
                        <Badge variant={item.orderId && item.orderId.length > 0 ? "default" : "destructive"}>
                          {item.orderId && item.orderId.length > 0 ? "Linked" : "Orphaned"}
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>Order ID: {item.orderId ? item.orderId.join(', ') : 'None'}</div>
                        <div>Products: {item.products ? item.products.join(', ') : 'None'}</div>
                        <div>Quantity: {item.quantity || 'Unknown'}</div>
                        <div>Price: {item.price ? `${item.price} DH` : 'Unknown'}</div>
                        {(item.selectedVariants && (
                          <div>Variants: Yes</div>
                        )) as React.ReactNode}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {debugData.relationshipStats.orphanedOrderItems > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issue Found:</strong> {debugData.relationshipStats.orphanedOrderItems} order items 
                    are missing orderId relationships. These items won't appear in order details.
                  </AlertDescription>
                </Alert>
              )}

              {debugData.relationshipStats.linkedOrderItems === 0 && debugData.relationshipStats.totalOrderItems > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Critical Issue:</strong> No order items have proper orderId relationships. 
                    All order details will show "No order items found".
                  </AlertDescription>
                </Alert>
              )}

              {debugData.relationshipStats.linkedOrderItems > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Good:</strong> Some order items have proper relationships. 
                    New orders should display correctly.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="text-sm space-y-2">
                  <h4 className="font-medium">Next Steps:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Create a new test order to verify the fix is working</li>
                    <li>Consider migrating orphaned order items to link them to their orders</li>
                    <li>Monitor new orders to ensure proper orderId relationships</li>
                    <li>Update existing orders if customer service needs complete history</li>
                  </ul>
                </div>

                {debugData.relationshipStats.orphanedOrderItems > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={migrateOrphanedItems} 
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      {loading ? 'Migrating...' : 'Migrate Orphaned Items'}
                    </Button>
                    <Button 
                      onClick={createTestOrder} 
                      disabled={loading}
                      size="sm"
                    >
                      Create Test Order
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}