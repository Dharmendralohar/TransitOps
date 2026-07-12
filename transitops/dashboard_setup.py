import frappe
import json

def setup():
	print("Setting up Dashboard and Workspace...")
	
	# 1. Create Number Cards
	cards_data = [
		{
			"doctype": "Number Card",
			"name": "Active Vehicles",
			"label": "Active Vehicles",
			"document_type": "Vehicle",
			"function": "Count",
			"is_standard": 1,
			"module": "Transitops",
			"filters_json": json.dumps([["Vehicle", "status", "=", "Active", False]])
		},
		{
			"doctype": "Number Card",
			"name": "Pending Trips",
			"label": "Pending Trips",
			"document_type": "Trip",
			"function": "Count",
			"is_standard": 1,
			"module": "Transitops",
			"filters_json": json.dumps([["Trip", "status", "=", "Pending", False]])
		},
		{
			"doctype": "Number Card",
			"name": "Active Trips",
			"label": "Active Trips",
			"document_type": "Trip",
			"function": "Count",
			"is_standard": 1,
			"module": "Transitops",
			"filters_json": json.dumps([["Trip", "status", "=", "In Progress", False]])
		}
	]
	
	for card in cards_data:
		if not frappe.db.exists("Number Card", card["name"]):
			doc = frappe.get_doc(card)
			doc.insert(ignore_permissions=True)
			print(f"Created Number Card: {card['name']}")

	# 2. Create Dashboard Chart
	chart_name = "TransitOps Trip Status"
	if not frappe.db.exists("Dashboard Chart", chart_name):
		chart = frappe.get_doc({
			"doctype": "Dashboard Chart",
			"chart_name": chart_name,
			"chart_type": "Group By",
			"document_type": "Trip",
			"group_by_based_on": "status",
			"group_by_type": "Count",
			"type": "Donut",
			"width": "Half",
			"is_standard": 1,
			"module": "Transitops",
			"filters_json": "[]"
		})
		chart.insert(ignore_permissions=True)
		print(f"Created Dashboard Chart: {chart_name}")

	# 3. Create Workspace
	workspace_name = "TransitOps Desk"
	if not frappe.db.exists("Workspace", workspace_name):
		workspace = frappe.get_doc({
			"doctype": "Workspace",
			"name": workspace_name,
			"title": "TransitOps Desk",
			"label": "TransitOps Desk",
			"module": "Transitops",
			"public": 1,
			"icon": "ship",
			"number_cards": [
				{"number_card_name": "Active Vehicles", "label": "Active Vehicles"},
				{"number_card_name": "Pending Trips", "label": "Pending Trips"},
				{"number_card_name": "Active Trips", "label": "Active Trips"}
			],
			"charts": [
				{"chart_name": "TransitOps Trip Status", "label": "Trip Status"}
			],
			"links": [
				{"link_type": "DocType", "link_to": "Vehicle", "label": "Vehicles", "type": "Link"},
				{"link_type": "DocType", "link_to": "Driver", "label": "Drivers", "type": "Link"},
				{"link_type": "DocType", "link_to": "Trip", "label": "Trips", "type": "Link"},
				{"link_type": "DocType", "link_to": "Maintenance Log", "label": "Maintenance Logs", "type": "Link"},
				{"link_type": "DocType", "link_to": "Fuel Log", "label": "Fuel Logs", "type": "Link"},
				{"link_type": "DocType", "link_to": "Expense", "label": "Expenses", "type": "Link"},
				{"link_type": "DocType", "link_to": "TransitOps Settings", "label": "Settings", "type": "Link"}
			]
		})
		workspace.insert(ignore_permissions=True)
		print(f"Created Workspace: {workspace_name}")
	
	frappe.db.commit()
	print("Dashboard setup completed successfully!")

