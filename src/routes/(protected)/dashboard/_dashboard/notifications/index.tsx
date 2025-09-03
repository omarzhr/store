import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, BellOff, Trash2, Package, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Collections, type NotificationsResponse, type OrdersResponse, type ProductsResponse } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/notifications/')({
  loader: async () => {
    try {
      // Fetch notifications with expanded relations
      const notifications = await pb.collection(Collections.Notifications).getFullList<NotificationsResponse>({
        sort: '-created',
        expand: 'order,product',
        requestKey: `notifications-${Date.now()}`
      })

      return { notifications }
    } catch (error: any) {
      // Handle auto-cancellation gracefully
      if (error?.message?.includes('autocancelled') || error?.message?.includes('aborted')) {
        console.log('Notifications request was cancelled')
      } else {
        console.error('Error loading notifications:', error)
      }
      return { notifications: [] }
    }
  },
  component: NotificationsPage,
})

interface NotificationItemProps {
  notification: NotificationsResponse
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <ShoppingCart className="h-5 w-5 text-blue-500" />
      case 'low_stock':
        return <Package className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'new_order':
        return `New Order Received`
      case 'low_stock':
        return `Low Stock Alert`
      default:
        return 'Notification'
    }
  }

  const getNotificationMessage = (type: string, expand: any) => {
    switch (type) {
      case 'new_order':
        const order = expand?.order as OrdersResponse | undefined
        return `Order #${order?.orderNumber || notification.order} has been placed`
      case 'low_stock':
        const product = expand?.product as ProductsResponse | undefined
        return `${product?.title || 'Product'} is running low on stock`
      default:
        return 'You have a new notification'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type || '')}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${notification.is_read ? 'text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}>
                  {getNotificationTitle(notification.type || '')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getNotificationMessage(notification.type || '', notification.expand)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDate(notification.created)}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Badge 
                  variant={notification.type === 'new_order' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {notification.type?.replace('_', ' ').toUpperCase()}
                </Badge>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              {onMarkAsRead && !notification.is_read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                  className="h-8 px-3 text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark as Read
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(notification.id)
                  }}
                  className="h-8 px-3 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationsPage() {
  const { notifications: initialNotifications } = Route.useLoaderData()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleMarkAsRead = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await pb.collection(Collections.Notifications).update(id, {
        is_read: true
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      setError('Failed to mark notification as read')
      console.error('Error marking notification as read:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await pb.collection(Collections.Notifications).delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      setError('Failed to delete notification')
      console.error('Error deleting notification:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length > 0) {
        await Promise.all(
          unreadIds.map(id => 
            pb.collection(Collections.Notifications).update(id, {
              is_read: true
            })
          )
        )
      }
      setNotifications([])
    } catch (err) {
      setError('Failed to mark all notifications as read')
      console.error('Error marking all notifications as read:', err)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleNotificationClick = async (notification: NotificationsResponse) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await pb.collection(Collections.Notifications).update(notification.id, {
          is_read: true
        })
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to appropriate page
    if (notification.type === 'new_order' && notification.order) {
      navigate({ to: '/dashboard/orders', search: { orderId: notification.order } })
    } else if (notification.type === 'low_stock' && notification.product) {
      // Get product to navigate to its slug
      try {
        const product = await pb.collection('products').getOne(notification.product)
        navigate({ to: '/dashboard/products/$productSlug', params: { productSlug: product.slug } })
      } catch (error) {
        navigate({ to: '/dashboard/products' })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with your store activities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="secondary">
              {unreadCount} unread
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="text-sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className="cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <NotificationItem
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You're all caught up! New notifications will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Order Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'new_order').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.type === 'low_stock').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}