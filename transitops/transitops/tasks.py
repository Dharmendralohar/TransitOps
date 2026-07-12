import frappe
from frappe.utils import add_days, getdate, today

def get_license_reminder_recipients(settings):
	recipients = {r.strip() for r in (settings.reminder_recipients or "").split(",") if r.strip()}

	if not recipients:
		safety_officers = frappe.db.sql_list("""
			SELECT DISTINCT parent FROM `tabHas Role` WHERE role='Safety Officer'
		""")
		for user in safety_officers:
			email = frappe.db.get_value("User", user, "email")
			if email:
				recipients.add(email)

	return recipients or {"admin@example.com"}

def send_driver_license_reminders(recipients_list, target_date):
	drivers = frappe.get_all(
		"Driver",
		filters={
			"license_expiry_date": ["<=", target_date],
			"status": ["!=", "Suspended"]
		},
		fields=["name", "driver_name", "license_number", "license_expiry_date", "user"]
	)

	for driver in drivers:
		status_text = "expired" if getdate(driver.license_expiry_date) < getdate(today()) else "expiring soon"
		subject = f"Driver License {status_text.title()} Alert: {driver.driver_name}"
		message = f"""
		<h3>Driver License {status_text.title()} Reminder</h3>
		<p>The driver license for <b>{driver.driver_name}</b> is {status_text}.</p>
		<ul>
			<li><b>Driver Name:</b> {driver.driver_name}</li>
			<li><b>License/ID:</b> {driver.name}</li>
			<li><b>License Number:</b> {driver.license_number}</li>
			<li><b>Expiry Date:</b> {driver.license_expiry_date}</li>
		</ul>
		"""

		recipients = set(recipients_list)
		if driver.user:
			user_email = frappe.db.get_value("User", driver.user, "email")
			if user_email:
				recipients.add(user_email)

		frappe.sendmail(recipients=list(recipients), subject=subject, message=message)

def send_vehicle_license_reminders(recipients_list, target_date):
	vehicles = frappe.get_all(
		"Vehicle",
		filters={
			"license_expiry_date": ["<=", target_date],
			"status": ["!=", "Retired"]
		},
		fields=["name", "registration_number", "vehicle_name", "vehicle_type", "license_expiry_date", "reminder_email"]
	)

	for vehicle in vehicles:
		status_text = "expired" if getdate(vehicle.license_expiry_date) < getdate(today()) else "expiring soon"
		subject = f"Vehicle License {status_text.title()} Alert: {vehicle.registration_number}"
		message = f"""
		<h3>Vehicle License {status_text.title()} Reminder</h3>
		<p>The vehicle license for <b>{vehicle.registration_number}</b> is {status_text}.</p>
		<ul>
			<li><b>Vehicle:</b> {vehicle.registration_number}</li>
			<li><b>Vehicle Name / Model:</b> {vehicle.vehicle_name}</li>
			<li><b>Vehicle Type:</b> {vehicle.vehicle_type}</li>
			<li><b>Expiry Date:</b> {vehicle.license_expiry_date}</li>
		</ul>
		"""

		recipients = set(recipients_list)
		if vehicle.reminder_email:
			recipients.add(vehicle.reminder_email)

		frappe.sendmail(recipients=list(recipients), subject=subject, message=message)

def send_license_expiry_reminders():
	settings = frappe.get_single("TransitOps Settings")
	if not settings.enable_license_reminders:
		return

	days = settings.license_reminder_days or 30
	recipients_list = get_license_reminder_recipients(settings)
	target_date = add_days(today(), days)

	send_driver_license_reminders(recipients_list, target_date)
	send_vehicle_license_reminders(recipients_list, target_date)
