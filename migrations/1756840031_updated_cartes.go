package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_4021020699")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(7, []byte(`{
			"hidden": false,
			"id": "json2764548572",
			"maxSize": 0,
			"name": "selected_variants",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "json"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(8, []byte(`{
			"hidden": false,
			"id": "number3117738835",
			"max": null,
			"min": null,
			"name": "variantPrice",
			"onlyInt": false,
			"presentable": false,
			"required": false,
			"system": false,
			"type": "number"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(9, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text1794446011",
			"max": 0,
			"min": 0,
			"name": "variantSku",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_4021020699")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("json2764548572")

		// remove field
		collection.Fields.RemoveById("number3117738835")

		// remove field
		collection.Fields.RemoveById("text1794446011")

		return app.Save(collection)
	})
}
