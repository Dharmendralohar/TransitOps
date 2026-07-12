import frappe
from frappe.model.document import Document
from frappe.utils import getdate
from transitops.transitops.status_utils import resolve_vehicle_status

class MaintenanceLog(Document):
	def validate(self):
		if self.cost < 0:
			frappe.throw("Cost cannot be negative.")

		if self.completion_date and getdate(self.completion_date) < getdate(self.date):
			frappe.throw(f"Completion Date ({self.completion_date}) cannot be earlier than Start Date ({self.date}).")

		# Rules for Active Maintenance Logs
		if self.status == "Active":
			vehicle_status = frappe.db.get_value("Vehicle", self.vehicle, "status")

			# Check if vehicle is retired
			if vehicle_status == "Retired":
				frappe.throw(f"Vehicle {self.vehicle} is retired and cannot be placed in maintenance.")

			# Check if vehicle is on a dispatched trip
			if vehicle_status == "On Trip":
				frappe.throw(f"Vehicle {self.vehicle} is currently on a trip and cannot be placed in maintenance.")

			# Block multiple active maintenance logs for the same vehicle
			duplicate_active = frappe.db.exists("Maintenance Log", {
				"vehicle": self.vehicle,
				"status": "Active",
				"name": ["!=", self.name]
			})
			if duplicate_active:
				frappe.throw(f"Vehicle {self.vehicle} already has an active maintenance record: {duplicate_active}.")

		# If completion date is set but status is still Active, close it
		if self.status == "Closed" and not self.completion_date:
			frappe.throw("Completion Date is required when status is Closed.")

	def on_update(self):
		# Sync vehicle status
		resolve_vehicle_status(self.vehicle)
