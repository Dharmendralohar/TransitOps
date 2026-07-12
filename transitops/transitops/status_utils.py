import frappe

def get_expected_vehicle_status(vehicle_name):
	# Priority:
	# 1. Retired (Check if status in db is Retired)
	current_status = frappe.db.get_value("Vehicle", vehicle_name, "status")
	if current_status == "Retired":
		return "Retired"

	# 2. Active Maintenance -> In Shop
	active_maintenance = frappe.db.exists(
		"Maintenance Log",
		{"vehicle": vehicle_name, "status": "Active"}
	)
	if active_maintenance:
		return "In Shop"

	# 3. Dispatched Trip -> On Trip
	active_trip = frappe.db.exists(
		"Trip",
		{"vehicle": vehicle_name, "status": "Dispatched"}
	)
	if active_trip:
		return "On Trip"

	# Otherwise -> Available
	return "Available"

def get_expected_driver_status(driver_name):
	# Priority:
	# 1. Suspended or Off Duty (Check if current status in db is Suspended or Off Duty)
	current_status = frappe.db.get_value("Driver", driver_name, "status")
	if current_status in ["Suspended", "Off Duty"]:
		return current_status

	# 2. Dispatched Trip -> On Trip
	active_trip = frappe.db.exists(
		"Trip",
		{"driver": driver_name, "status": "Dispatched"}
	)
	if active_trip:
		return "On Trip"

	# Otherwise -> Available
	return "Available"

def resolve_vehicle_status(vehicle_name):
	expected = get_expected_vehicle_status(vehicle_name)
	frappe.db.set_value("Vehicle", vehicle_name, "status", expected, update_modified=True)

def resolve_driver_status(driver_name):
	expected = get_expected_driver_status(driver_name)
	frappe.db.set_value("Driver", driver_name, "status", expected, update_modified=True)
