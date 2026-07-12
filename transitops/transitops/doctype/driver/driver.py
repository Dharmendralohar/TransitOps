import frappe
from frappe.model.document import Document

class Driver(Document):
	def validate(self):
		if self.safety_score < 0 or self.safety_score > 100:
			frappe.throw("Safety Score must be between 0 and 100.")

		if self.user:
			# Verify that a user is linked to only one driver profile
			existing_driver = frappe.db.get_value(
				"Driver",
				{"user": self.user, "name": ["!=", self.name]},
				"name"
			)
			if existing_driver:
				frappe.throw(f"System User {self.user} is already linked to another Driver profile ({existing_driver}).")
