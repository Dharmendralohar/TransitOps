import frappe
from frappe.model.document import Document
from frappe.utils import getdate, nowdate

class Vehicle(Document):
	def validate(self):
		if self.max_load_capacity <= 0:
			frappe.throw("Maximum Load Capacity must be greater than zero.")
		if self.odometer < 0:
			frappe.throw("Odometer cannot be negative.")
		if self.acquisition_cost < 0:
			frappe.throw("Acquisition Cost cannot be negative.")
		if self.license_expiry_date and getdate(self.license_expiry_date) < getdate(nowdate()):
			frappe.msgprint(f"Vehicle license for {self.name or self.registration_number} is expired.", alert=True, indicator="orange")

		# Check status change rules
		db_doc = self.get_doc_before_save()
		if db_doc:
			if db_doc.status != self.status:
				if self.status == "Retired":
					if "Fleet Manager" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
						frappe.throw("Only Fleet Manager can manually change a vehicle status to Retired.")
				if db_doc.status == "Retired":
					if "Fleet Manager" not in frappe.get_roles() and "System Manager" not in frappe.get_roles():
						frappe.throw("Retired vehicle status cannot be changed.")
