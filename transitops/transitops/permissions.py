import frappe

def get_permission_query_conditions(user):
	if not user:
		user = frappe.session.user

	roles = frappe.get_roles(user)
	if set(["System Manager", "Fleet Manager", "Safety Officer", "Financial Analyst"]) & set(roles):
		return ""

	if "Driver" in roles:
		driver = frappe.db.get_value("Driver", {"user": user}, "name")
		if driver:
			return f"`tabTrip`.`driver` = {frappe.db.escape(driver)}"
		else:
			# If no Driver profile is linked, allow nothing
			return "1=0"

	return ""

def has_permission(doc, ptype, user):
	if not user:
		user = frappe.session.user

	roles = frappe.get_roles(user)
	if set(["System Manager", "Fleet Manager", "Safety Officer", "Financial Analyst"]) & set(roles):
		return True

	if "Driver" in roles:
		driver = frappe.db.get_value("Driver", {"user": user}, "name")
		if driver and doc.driver == driver:
			# No delete permission after a trip is dispatched
			if ptype == "delete" and doc.status in ["Dispatched", "Completed", "Cancelled"]:
				return False
			return True
		return False

	return False
