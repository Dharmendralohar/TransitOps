import frappe
from frappe.model.document import Document

class Expense(Document):
	def validate(self):
		if self.amount < 0:
			frappe.throw("Amount must be greater than or equal to zero.")
