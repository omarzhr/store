package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3800236418")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(11, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text223244161",
			"max": 0,
			"min": 0,
			"name": "address",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(12, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text1146066909",
			"max": 0,
			"min": 0,
			"name": "phone",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(13, []byte(`{
			"exceptDomains": null,
			"hidden": false,
			"id": "email3885137012",
			"name": "email",
			"onlyDomains": null,
			"presentable": false,
			"required": false,
			"system": false,
			"type": "email"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(14, []byte(`{
			"exceptDomains": null,
			"hidden": false,
			"id": "url1198480871",
			"name": "website",
			"onlyDomains": null,
			"presentable": false,
			"required": false,
			"system": false,
			"type": "url"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(15, []byte(`{
			"autogeneratePattern": "",
			"hidden": false,
			"id": "text4012560215",
			"max": 0,
			"min": 0,
			"name": "aboutUs",
			"pattern": "",
			"presentable": false,
			"primaryKey": false,
			"required": false,
			"system": false,
			"type": "text"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(16, []byte(`{
			"hidden": false,
			"id": "json41364835",
			"maxSize": 0,
			"name": "socialLinks",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "json"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(17, []byte(`{
			"hidden": false,
			"id": "json1181081759",
			"maxSize": 0,
			"name": "businessHours",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "json"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3800236418")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("text223244161")

		// remove field
		collection.Fields.RemoveById("text1146066909")

		// remove field
		collection.Fields.RemoveById("email3885137012")

		// remove field
		collection.Fields.RemoveById("url1198480871")

		// remove field
		collection.Fields.RemoveById("text4012560215")

		// remove field
		collection.Fields.RemoveById("json41364835")

		// remove field
		collection.Fields.RemoveById("json1181081759")

		return app.Save(collection)
	})
}
