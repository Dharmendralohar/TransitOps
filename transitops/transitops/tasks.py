import frappe
from frappe.utils import add_days, getdate, today

def send_license_expiry_reminders():
	settings = frappe.get_single("TransitOps Settings")
	if not settings.enable_license_reminders:
		return

	days = settings.license_reminder_days or 30
	recipients_list = [r.strip() for r in (settings.reminder_recipients or "").split(",") if r.strip()]

	if not recipients_list:
		# Default to users with the 'Safety Officer' role
		safety_officers = frappe.db.sql_list("""
			SELECT DISTINCT parent FROM `tabHas Role` WHERE role='Safety Officer'
		""")
		recipients_list = []
		for u in safety_officers:
			email = frappe.db.get_value("User", u, "email")
			if email:
				recipients_list.append(email)

	if not recipients_list:
		# Fallback to Administrator or system managers
		recipients_list = ["admin@example.com"]

	target_date = add_days(today(), days)

	# Find drivers whose license is expiring exactly `days` from now, or today
	drivers = frappe.get_all(
		"Driver",
		filters={
			"license_expiry_date": ["in", [target_date, today()]],
			"status": ["!=", "Suspended"]
		},
		fields=["name", "driver_name", "license_number", "license_expiry_date", "user"]
	)

	for driver in drivers:
		message = f"""
		<h3>Driver License Expiry Reminder</h3>
		<p>This is to inform you that the driver license for <b>{driver.driver_name}</b> is expiring or has expired.</p>
		<ul>
			<li><b>Driver Name:</b> {driver.driver_name}</li>
			<li><b>License/ID:</b> {driver.name}</li>
			<li><b>License Number:</b> {driver.license_number}</li>
			<li><b>Expiry Date:</b> {driver.license_expiry_date}</li>
		</ul>
		"""
		subject = f"License Expiry Alert: {driver.driver_name}"

		# Send to recipients
		for email in recipients_list:
			frappe.sendmail(recipients=email, subject=subject, message=message)

		# Also send to linked driver user
		if driver.user:
			user_email = frappe.db.get_value("User", driver.user, "email")
			if user_email:
				frappe.sendmail(recipients=user_email, subject=subject, message=message)
