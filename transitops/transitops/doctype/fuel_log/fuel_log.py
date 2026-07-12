import frappe
from frappe.model.document import Document

class FuelLog(Document):
	def validate(self):
		if self.liters <= 0:
			frappe.throw("Liters must be greater than zero.")
		if self.cost < 0:
			frappe.throw("Cost cannot be negative.")
		if self.odometer_reading < 0:
			frappe.throw("Odometer reading cannot be negative.")

		self.price_per_liter = self.cost / self.liters
