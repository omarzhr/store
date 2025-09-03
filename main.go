package main

import (
	"log"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	// enable once you have at least one migration
	// _ "yourpackage/migrations"
)

func main() {
	app := pocketbase.New()

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

	// Hook to create notification when a new order is placed
	app.OnRecordAfterCreateSuccess("orders").BindFunc(func(e *core.RecordEvent) error {
		orderId := e.Record.Id
		log.Printf("Creating notification for new order: %s", orderId)

		// Create notification record
		notificationCollection, err := app.FindCollectionByNameOrId("notifications")
		if err != nil {
			log.Printf("Failed to find notifications collection: %v", err)
			return e.Next()
		}

		notification := core.NewRecord(notificationCollection)
		notification.Set("type", "new_order")
		notification.Set("order", orderId)

		if err := app.Save(notification); err != nil {
			log.Printf("Failed to create order notification: %v", err)
		} else {
			log.Printf("Successfully created notification for order: %s", orderId)
		}

		return e.Next()
	})

	// Hook to create notification when product stock changes and becomes low
	app.OnRecordAfterUpdateSuccess("products").BindFunc(func(e *core.RecordEvent) error {
		product := e.Record
		productId := product.Id
		
		// Get current and previous stock quantities
		currentStock := product.GetInt("stockQuantity")
		reorderLevel := product.GetInt("reorderLevel")
		
		// Only create notification if stock is at or below reorder level and stock > 0
		if currentStock <= reorderLevel && currentStock > 0 {
			// Check if low stock notification already exists for this product
			existing, _ := app.FindFirstRecordByFilter("notifications",
				"type = 'low_stock' && product = {:product_id}",
				map[string]any{"product_id": productId})

			if existing != nil {
				log.Printf("Low stock notification already exists for product: %s", productId)
				return e.Next()
			}

			log.Printf("Creating low stock notification for product: %s (stock: %d, reorder: %d)", 
				productId, currentStock, reorderLevel)

			// Create notification record
			notificationCollection, err := app.FindCollectionByNameOrId("notifications")
			if err != nil {
				log.Printf("Failed to find notifications collection: %v", err)
				return e.Next()
			}

			notification := core.NewRecord(notificationCollection)
			notification.Set("type", "low_stock")
			notification.Set("product", productId)

			if err := app.Save(notification); err != nil {
				log.Printf("Failed to create low stock notification: %v", err)
			} else {
				log.Printf("Successfully created low stock notification for product: %s", productId)
			}
		}

		return e.Next()
	})

	// Hook to remove low stock notification when stock is replenished
	app.OnRecordAfterUpdateSuccess("products").BindFunc(func(e *core.RecordEvent) error {
		product := e.Record
		productId := product.Id
		
		// Get current stock quantity and reorder level
		currentStock := product.GetInt("stockQuantity")
		reorderLevel := product.GetInt("reorderLevel")
		
		// If stock is now above reorder level, remove any existing low stock notifications
		if currentStock > reorderLevel {
			existing, err := app.FindFirstRecordByFilter("notifications",
				"type = 'low_stock' && product = {:product_id}",
				map[string]any{"product_id": productId})

			if err == nil && existing != nil {
				log.Printf("Removing low stock notification for product: %s (stock replenished: %d)", 
					productId, currentStock)
				
				if err := app.Delete(existing); err != nil {
					log.Printf("Failed to remove low stock notification: %v", err)
				} else {
					log.Printf("Successfully removed low stock notification for product: %s", productId)
				}
			}
		}

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
