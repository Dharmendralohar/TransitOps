import frappe
from frappe import _
from frappe.utils import getdate, today

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
def complete_trip(trip_name, final_odometer, fuel_consumed, revenue=0.0, fuel_cost=0.0):
	trip = frappe.get_doc("Trip", trip_name)
	check_trip_permission(trip, "complete")
	trip.final_odometer = float(final_odometer)
	trip.fuel_consumed = float(fuel_consumed)
	trip.revenue = float(revenue or 0.0)
	trip.status = "Completed"
	trip.save()

	fuel_cost = float(fuel_cost or 0.0)
	if trip.fuel_consumed > 0:
		fuel_log_name = frappe.db.get_value("Fuel Log", {"trip": trip.name, "vehicle": trip.vehicle}, "name")
		if fuel_log_name:
			fuel_log = frappe.get_doc("Fuel Log", fuel_log_name)
		else:
			fuel_log = frappe.new_doc("Fuel Log")
			fuel_log.vehicle = trip.vehicle
			fuel_log.trip = trip.name

		fuel_log.date = getdate(trip.completion_datetime) if trip.completion_datetime else today()
		fuel_log.liters = trip.fuel_consumed
		fuel_log.cost = fuel_cost
		fuel_log.odometer_reading = trip.final_odometer
		fuel_log.save(ignore_permissions=True)

	return trip

@frappe.whitelist()
def cancel_trip(trip_name, cancellation_reason):
	trip = frappe.get_doc("Trip", trip_name)
	check_trip_permission(trip, "cancel")
	trip.cancellation_reason = cancellation_reason
	trip.status = "Cancelled"
	trip.save()
	return trip
