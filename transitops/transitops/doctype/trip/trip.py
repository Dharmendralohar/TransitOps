import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, getdate
from transitops.transitops.status_utils import resolve_vehicle_status, resolve_driver_status

class Trip(Document):
	def validate(self):
		if self.cargo_weight <= 0:
			frappe.throw("Cargo weight must be greater than zero.")
		if self.planned_distance <= 0:
			frappe.throw("Planned distance must be greater than zero.")

		db_doc = self.get_doc_before_save()
		prev_status = db_doc.status if db_doc else "Draft"

		# Field locking after dispatch
		if db_doc and prev_status in ["Dispatched", "Completed", "Cancelled"]:
			for field in ["vehicle", "driver", "source", "destination", "cargo_weight", "planned_distance"]:
				if self.get(field) != db_doc.get(field):
					frappe.throw(f"Cannot change '{self.meta.get_label(field)}' after trip has been dispatched.")

		# Handle status transitions
		if self.status != prev_status:
			self.handle_status_transition(prev_status, self.status)

	def handle_status_transition(self, prev, new):
		# Validate allowed transitions
		allowed = {
			"Draft": ["Dispatched", "Cancelled"],
			"Dispatched": ["Completed", "Cancelled"],
			"Completed": [],
			"Cancelled": []
		}
		if new not in allowed.get(prev, []):
			frappe.throw(f"Invalid status transition from {prev} to {new}.")

		if new == "Dispatched":
			# Re-run all eligibility validations
			self.validate_vehicle_eligibility()
			self.validate_driver_eligibility()
			self.validate_no_double_assignment()
			self.validate_cargo_weight()

			# Set starting values
			self.dispatch_datetime = now_datetime()
			self.starting_odometer = frappe.db.get_value("Vehicle", self.vehicle, "odometer") or 0.0

		elif new == "Completed":
			if prev != "Dispatched":
				frappe.throw("Trip must be Dispatched before it can be Completed.")

			if self.final_odometer is None or self.final_odometer == "":
				frappe.throw("Final Odometer is required to complete the trip.")

			if self.final_odometer < (self.starting_odometer or 0.0):
				frappe.throw(f"Final Odometer ({self.final_odometer}) cannot be lower than Starting Odometer ({self.starting_odometer}).")

			if self.fuel_consumed is None or self.fuel_consumed < 0:
				frappe.throw("Fuel consumed must be greater than or equal to zero.")

			self.completion_datetime = now_datetime()
			self.actual_distance = self.final_odometer - (self.starting_odometer or 0.0)

		elif new == "Cancelled":
			if prev == "Dispatched":
				if not self.cancellation_reason:
					frappe.throw("Cancellation Reason is mandatory when cancelling a dispatched trip.")

	def on_update(self):
		# On status change, resolve linked status of vehicle and driver
		db_doc = self.get_doc_before_save()
		prev_status = db_doc.status if db_doc else "Draft"

		# If we completed, update vehicle odometer
		if self.status == "Completed" and prev_status != "Completed":
			frappe.db.set_value("Vehicle", self.vehicle, "odometer", self.final_odometer)

		if self.status != prev_status:
			resolve_vehicle_status(self.vehicle)
			resolve_driver_status(self.driver)

	def validate_vehicle_eligibility(self):
		vehicle = frappe.get_doc("Vehicle", self.vehicle)
		if vehicle.status != "Available":
			frappe.throw(f"Vehicle {self.vehicle} is not available for dispatch.")

	def validate_driver_eligibility(self):
		driver = frappe.get_doc("Driver", self.driver)
		if driver.status != "Available":
			frappe.throw(f"Driver {self.driver} is not available for dispatch.")

		if getdate(driver.license_expiry_date) < getdate(now_datetime().date()):
			frappe.throw(f"Driver {self.driver} has an expired license (Expired on {driver.license_expiry_date}).")

	def validate_no_double_assignment(self):
		# Check if vehicle or driver is already assigned to a dispatched trip
		conflict_vehicle = frappe.db.exists("Trip", {
			"vehicle": self.vehicle,
			"status": "Dispatched",
			"name": ["!=", self.name]
		})
		if conflict_vehicle:
			frappe.throw(f"Vehicle {self.vehicle} is already assigned to another active dispatched trip {conflict_vehicle}.")

		conflict_driver = frappe.db.exists("Trip", {
			"driver": self.driver,
			"status": "Dispatched",
			"name": ["!=", self.name]
		})
		if conflict_driver:
			frappe.throw(f"Driver {self.driver} is already assigned to another active dispatched trip {conflict_driver}.")

	def validate_cargo_weight(self):
		vehicle_capacity = frappe.db.get_value("Vehicle", self.vehicle, "max_load_capacity") or 0.0
		if self.cargo_weight > vehicle_capacity:
			frappe.throw(f"Cargo weight {self.cargo_weight} kg exceeds vehicle capacity of {vehicle_capacity} kg.")
