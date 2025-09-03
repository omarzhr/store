import pb from '@/lib/db'
import { Collections, type NotificationsRecord, type NotificationsResponse, NotificationsTypeOptions } from '@/lib/types'

export interface CreateNotificationParams {
  type: NotificationsTypeOptions
  orderId?: string
  productId?: string
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(params: CreateNotificationParams): Promise<NotificationsResponse | null> {
    try {
      const notificationData: Partial<NotificationsRecord> = {
        type: params.type,
        order: params.orderId,
        product: params.productId,
        is_read: false,
      }

      const notification = await pb.collection(Collections.Notifications).create<NotificationsResponse>(notificationData, {
        requestKey: `create-notification-${Date.now()}`
      })
      return notification
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Notification creation request was cancelled')
        return null
      }
      console.error('Error creating notification:', error)
      return null
    }
  }

  /**
   * Create a new order notification
   */
  static async createOrderNotification(orderId: string): Promise<NotificationsResponse | null> {
    return this.create({
      type: NotificationsTypeOptions['new_order'],
      orderId,
    })
  }

  /**
   * Create a low stock notification
   */
  static async createLowStockNotification(productId: string): Promise<NotificationsResponse | null> {
    return this.create({
      type: NotificationsTypeOptions['low_stock'],
      productId,
    })
  }

  /**
   * Get all notifications with expanded relations
   */
  static async getAll(): Promise<NotificationsResponse[]> {
    try {
      const notifications = await pb.collection(Collections.Notifications).getFullList<NotificationsResponse>({
        sort: '-created',
        expand: 'order,product',
        requestKey: `get-all-notifications-${Date.now()}`
      })
      return notifications
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Get all notifications request was cancelled')
        return []
      }
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  /**
   * Get recent notifications (limit)
   */
  static async getRecent(limit: number = 10): Promise<NotificationsResponse[]> {
    try {
      const notifications = await pb.collection(Collections.Notifications).getList<NotificationsResponse>(1, limit, {
        sort: '-created',
        expand: 'order,product',
        requestKey: `get-recent-notifications-${Date.now()}`
      })
      return notifications.items
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Get recent notifications request was cancelled')
        return []
      }
      console.error('Error fetching recent notifications:', error)
      return []
    }
  }

  /**
   * Delete a notification
   */
  static async delete(id: string): Promise<boolean> {
    try {
      await pb.collection(Collections.Notifications).delete(id, {
        requestKey: `delete-notification-${id}-${Date.now()}`
      })
      return true
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Delete notification request was cancelled')
        return false
      }
      console.error('Error deleting notification:', error)
      return false
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string): Promise<boolean> {
    try {
      await pb.collection(Collections.Notifications).update(id, {
        is_read: true
      }, {
        requestKey: `mark-notification-read-${id}-${Date.now()}`
      })
      return true
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Mark as read request was cancelled')
        return false
      }
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(ids: string[]): Promise<boolean> {
    try {
      const updatePromises = ids.map(id => 
        pb.collection(Collections.Notifications).update(id, {
          is_read: true
        }, {
          requestKey: `mark-notification-read-${id}-${Date.now()}`
        })
      )
      await Promise.all(updatePromises)
      return true
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Mark multiple as read request was cancelled')
        return false
      }
      console.error('Error marking multiple notifications as read:', error)
      return false
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const result = await pb.collection(Collections.Notifications).getList(1, 1, {
        filter: 'is_read = false',
        requestKey: `count-unread-notifications-${Date.now()}`
      })
      return result.totalItems
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Get unread count request was cancelled')
        return 0
      }
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Get only unread notifications
   */
  static async getUnread(limit: number = 10): Promise<NotificationsResponse[]> {
    try {
      const notifications = await pb.collection(Collections.Notifications).getList<NotificationsResponse>(1, limit, {
        sort: '-created',
        expand: 'order,product',
        filter: 'is_read = false',
        requestKey: `get-unread-notifications-${Date.now()}`
      })
      return notifications.items
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('autocancelled'))) {
        console.log('Get unread notifications request was cancelled')
        return []
      }
      console.error('Error fetching unread notifications:', error)
      return []
    }
  }

  /**
   * Delete multiple notifications
   */
  static async deleteMany(ids: string[]): Promise<boolean> {
    try {
      const deletePromises = ids.map(id => pb.collection(Collections.Notifications).delete(id))
      await Promise.all(deletePromises)
      return true
    } catch (error) {
      console.error('Error deleting multiple notifications:', error)
      return false
    }
  }

  /**
   * Check if a similar notification already exists to avoid duplicates
   */
  static async exists(type: NotificationsTypeOptions, relatedId: string): Promise<boolean> {
    try {
      const filter = type === 'new_order' 
        ? `type = "new_order" && order = "${relatedId}"`
        : `type = "low_stock" && product = "${relatedId}"`

      const existing = await pb.collection(Collections.Notifications).getFirstListItem<NotificationsResponse>(filter, {
        requestKey: `check-notification-exists-${Date.now()}`
      })
      return !!existing
    } catch (error) {
      // If no notification found, exists returns false
      return false
    }
  }

  /**
   * Get notifications count by type
   */
  static async getCountByType(): Promise<{ new_order: number; low_stock: number; total: number }> {
    try {
      const [newOrderCount, lowStockCount, unreadCount] = await Promise.all([
        pb.collection(Collections.Notifications).getList(1, 1, {
          filter: 'type = "new_order"',
          requestKey: `count-order-notifications-${Date.now()}`
        }),
        pb.collection(Collections.Notifications).getList(1, 1, {
          filter: 'type = "low_stock"',
          requestKey: `count-stock-notifications-${Date.now()}`
        }),
        pb.collection(Collections.Notifications).getList(1, 1, {
          filter: 'is_read = false',
          requestKey: `count-unread-notifications-${Date.now()}`
        }),
      ])

      return {
        new_order: newOrderCount.totalItems,
        low_stock: lowStockCount.totalItems,
        total: newOrderCount.totalItems + lowStockCount.totalItems,
        unread: unreadCount.totalItems,
      }
    } catch (error) {
      console.error('Error getting notification counts:', error)
      return { new_order: 0, low_stock: 0, total: 0 }
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  static subscribeToUpdates(callback: (data: any) => void): (() => void) {
    try {
      const unsubscribePromise = pb.collection(Collections.Notifications).subscribe('*', callback)
      return () => {
        unsubscribePromise.then(unsubscribe => {
          if (typeof unsubscribe === 'function') {
            unsubscribe()
          }
        }).catch(error => {
          console.error('Error unsubscribing from notifications:', error)
        })
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error)
      return () => {}
    }
  }

  /**
   * Trigger notification when order is created
   */
  static async onOrderCreated(orderId: string): Promise<void> {
    try {
      // Check if notification already exists for this order
      const exists = await this.exists(NotificationsTypeOptions['new_order'], orderId)
      if (!exists) {
        await this.createOrderNotification(orderId)
      }
    } catch (error) {
      console.error('Error handling order created notification:', error)
    }
  }

  /**
   * Trigger notification when product stock is low
   */
  static async onLowStock(productId: string, currentStock: number, reorderLevel: number): Promise<void> {
    try {
      // Only create notification if stock is below reorder level
      if (currentStock <= reorderLevel) {
        // Check if notification already exists for this product
        const exists = await this.exists(NotificationsTypeOptions['low_stock'], productId)
        if (!exists) {
          await this.createLowStockNotification(productId)
        }
      }
    } catch (error) {
      console.error('Error handling low stock notification:', error)
    }
  }
}

export default NotificationService