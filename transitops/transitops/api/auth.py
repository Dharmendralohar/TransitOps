import frappe
from frappe.sessions import get_csrf_token

@frappe.whitelist()
def get_current_user():
	user = frappe.session.user
	if user == "Guest":
		return {
			"authenticated": False
		}

	# Fetch linked driver if any
	driver = frappe.db.get_value("Driver", {"user": user}, ["name", "driver_name", "status"], as_dict=True)

	return {
		"authenticated": True,
		"user": user,
		"full_name": frappe.utils.get_fullname(user),
		"roles": frappe.get_roles(user),
		"driver": driver,
		"csrf_token": get_csrf_token()
	}
