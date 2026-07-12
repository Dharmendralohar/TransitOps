import frappe
from frappe import _

def check_trip_permission(trip_doc, action):
	user = frappe.session.user
	roles = frappe.get_roles(user)

	if "System Manager" in roles or "Fleet Manager" in roles:
		return

	if "Driver" in roles:
		linked_driver = frappe.db.get_value("Driver", {"user": user}, "name")
		if linked_driver and trip_doc.driver == linked_driver:
			if action in ["dispatch", "complete"]:
				return
			else:
				frappe.throw(_("Drivers are not authorized to cancel trips."))
		else:
			frappe.throw(_("You are not authorized to perform actions on a trip assigned to another driver."))

	frappe.throw(_("You do not have permission to perform this action."))

@frappe.whitelist()
def dispatch_trip(trip_name):
	trip = frappe.get_doc("Trip", trip_name)
	check_trip_permission(trip, "dispatch")
	trip.status = "Dispatched"
	trip.save()
	return trip

@frappe.whitelist()
def complete_trip(trip_name, final_odometer, fuel_consumed, revenue=0.0):
	trip = frappe.get_doc("Trip", trip_name)
	check_trip_permission(trip, "complete")
	trip.final_odometer = float(final_odometer)
	trip.fuel_consumed = float(fuel_consumed)
	trip.revenue = float(revenue or 0.0)
	trip.status = "Completed"
	trip.save()
	return trip

@frappe.whitelist()
def cancel_trip(trip_name, cancellation_reason):
	trip = frappe.get_doc("Trip", trip_name)
	check_trip_permission(trip, "cancel")
	trip.cancellation_reason = cancellation_reason
	trip.status = "Cancelled"
	trip.save()
	return trip
