package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2301922722")
		if err != nil {
			return err
		}

		// add new fields
		new_read := &core.SchemaField{}
		if err := json.Unmarshal([]byte(`{
			"system": false,
			"id": "bool3208210256",
			"name": "read",
			"type": "bool",
			"required": false,
			"presentable": false,
			"unique": false,
			"options": {}
		}`), new_read); err != nil {
			return err
		}
		collection.Schema.AddField(new_read)

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2301922722")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("bool3208210256")

		return app.Save(collection)
	})
}