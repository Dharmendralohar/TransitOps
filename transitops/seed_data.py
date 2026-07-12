import frappe
from frappe.utils import now_datetime, add_to_date

def seed():
	print("Starting database seeding for TransitOps...")
	
	# 1. Create Roles
	roles = ["Fleet Manager", "Safety Officer", "Financial Analyst", "Driver"]
	for r in roles:
		if not frappe.db.exists("Role", r):
			role_doc = frappe.new_doc("Role")
			role_doc.role_name = r
			role_doc.insert(ignore_permissions=True)
			print(f"Created Role: {r}")
	
	# 2. Create Users
	users_to_create = [
		{
			"email": "manager@transitops.local",
			"first_name": "Marcus",
			"last_name": "Vance",
			"roles": ["Fleet Manager", "System Manager"]
		},
		{
			"email": "safety@transitops.local",
			"first_name": "Sarah",
			"last_name": "Conner",
			"roles": ["Safety Officer"]
		},
		{
			"email": "finance@transitops.local",
			"first_name": "Frank",
			"last_name": "Miller",
			"roles": ["Financial Analyst"]
		},
		{
			"email": "driver1@transitops.local",
			"first_name": "John",
			"last_name": "Doe",
			"roles": ["Driver"]
		},
		{
			"email": "driver2@transitops.local",
			"first_name": "Jane",
			"last_name": "Smith",
			"roles": ["Driver"]
		}
	]
	
	for u in users_to_create:
		if not frappe.db.exists("User", u["email"]):
			user_doc = frappe.new_doc("User")
			user_doc.email = u["email"]
			user_doc.username = u["email"].split("@")[0]
			user_doc.first_name = u["first_name"]
			user_doc.last_name = u["last_name"]
			user_doc.enabled = 1
			user_doc.send_welcome_email = 0
			
			for role in u["roles"]:
				user_doc.append("roles", {"role": role})
			
			user_doc.insert(ignore_permissions=True)
			# Set default password
			from frappe.utils.password import update_password
			update_password(user_doc.name, "password")
			print(f"Created User: {u['email']} (password: password)")
	
	frappe.db.commit()
	
	# 3. Create Drivers
	drivers_to_create = [
		{
			"driver_name": "John Doe",
			"full_name": "John Doe",
			"user": "driver1@transitops.local",
			"license_number": "DL-123456",
			"license_category": "HMV",
			"license_expiry_date": add_to_date(now_datetime(), days=150).strftime("%Y-%m-%d"),
			"contact_number": "+919876543210",
			"safety_score": 95,
			"status": "Available"
		},
		{
			"driver_name": "Jane Smith",
			"full_name": "Jane Smith",
			"user": "driver2@transitops.local",
			"license_number": "DL-987654",
			"license_category": "LMV",
			"license_expiry_date": add_to_date(now_datetime(), days=15).strftime("%Y-%m-%d"), # Expiring soon
			"contact_number": "+919876543211",
			"safety_score": 88,
			"status": "Available"
		}
	]
	
	for d in drivers_to_create:
		if not frappe.db.exists("Driver", {"driver_name": d["driver_name"]}):
			d_doc = frappe.new_doc("Driver")
			d_doc.update(d)
			d_doc.insert(ignore_permissions=True)
			print(f"Created Driver: {d['driver_name']}")
			
	frappe.db.commit()

	# 4. Create Vehicles
	vehicles_to_create = [
		{
			"registration_number": "MH-12-TC-0001",
			"vehicle_name": "Volvo FH16 Truck",
			"vehicle_type": "Truck",
			"max_load_capacity": 15000,
			"odometer": 125000,
			"acquisition_cost": 85000,
			"status": "Available",
			"region": "North"
		},
		{
			"registration_number": "MH-12-TC-0002",
			"vehicle_name": "Mercedes Sprinter Van",
			"vehicle_type": "Van",
			"max_load_capacity": 3500,
			"odometer": 45000,
			"acquisition_cost": 32000,
			"status": "Available",
			"region": "South"
		}
	]
	
	for v in vehicles_to_create:
		if not frappe.db.exists("Vehicle", {"registration_number": v["registration_number"]}):
			v_doc = frappe.new_doc("Vehicle")
			v_doc.update(v)
			v_doc.insert(ignore_permissions=True)
			print(f"Created Vehicle: {v['registration_number']}")
			
	frappe.db.commit()

	# Get generated document names
	v1_name = frappe.db.get_value("Vehicle", {"registration_number": "MH-12-TC-0001"}, "name")
	v2_name = frappe.db.get_value("Vehicle", {"registration_number": "MH-12-TC-0002"}, "name")
	d1_name = frappe.db.get_value("Driver", {"driver_name": "John Doe"}, "name")
	d2_name = frappe.db.get_value("Driver", {"driver_name": "Jane Smith"}, "name")

	# 5. Create Settings
	settings_name = "TransitOps Settings"
	if not frappe.db.exists("TransitOps Settings", settings_name):
		s_doc = frappe.new_doc("TransitOps Settings")
		s_doc.name = settings_name
		s_doc.enable_license_reminders = 1
		s_doc.license_reminder_days = 30
		s_doc.reminder_recipients = "manager@transitops.local"
		s_doc.insert(ignore_permissions=True)
		print("Initialized TransitOps Settings")
	else:
		s_doc = frappe.get_doc("TransitOps Settings", settings_name)
		s_doc.enable_license_reminders = 1
		s_doc.license_reminder_days = 30
		s_doc.reminder_recipients = "manager@transitops.local"
		s_doc.save(ignore_permissions=True)
		print("Updated TransitOps Settings")
		
	frappe.db.commit()

	# 6. Create Trip Logs
	trips_to_create = [
		{
			"source": "Depot A",
			"destination": "Warehouse X",
			"vehicle": v1_name,
			"driver": d1_name,
			"cargo_weight": 12000,
			"planned_distance": 120,
			"starting_odometer": 124875,
			"status": "Draft"
		},
		{
			"source": "Depot B",
			"destination": "Store Y",
			"vehicle": v2_name,
			"driver": d2_name,
			"cargo_weight": 2200,
			"planned_distance": 45,
			"starting_odometer": 45000,
			"status": "Draft"
		}
	]

	for t in trips_to_create:
		if not frappe.db.exists("Trip", {"source": t["source"], "destination": t["destination"], "vehicle": t["vehicle"]}):
			t_doc = frappe.new_doc("Trip")
			t_doc.update(t)
			t_doc.insert(ignore_permissions=True)
			print(f"Created Trip: {t['source']} to {t['destination']}")
			
	frappe.db.commit()

	t1_name = frappe.db.get_value("Trip", {"source": "Depot A", "destination": "Warehouse X"}, "name")
	t2_name = frappe.db.get_value("Trip", {"source": "Depot B", "destination": "Store Y"}, "name")

	# Update fields direct in DB to simulate dispatch/completion
	if t1_name:
		frappe.db.set_value("Trip", t1_name, {
			"status": "Completed",
			"actual_distance": 125,
			"final_odometer": 125000,
			"fuel_consumed": 38,
			"revenue": 1500,
			"dispatch_datetime": "2026-07-01 08:00:00",
			"completion_datetime": "2026-07-01 11:30:00"
		}, update_modified=False)
	if t2_name:
		frappe.db.set_value("Trip", t2_name, {
			"status": "Dispatched",
			"dispatch_datetime": "2026-07-12 05:00:00"
		}, update_modified=False)
	frappe.db.commit()

	t1_name = frappe.db.get_value("Trip", {"source": "Depot A", "destination": "Warehouse X"}, "name")
	t2_name = frappe.db.get_value("Trip", {"source": "Depot B", "destination": "Store Y"}, "name")

	# 7. Create Maintenance Log
	if not frappe.db.exists("Maintenance Log", {"vehicle": v1_name, "status": "Active"}):
		m_doc = frappe.new_doc("Maintenance Log")
		m_doc.vehicle = v1_name
		m_doc.maintenance_type = "Tire Replacement"
		m_doc.date = "2026-07-10"
		m_doc.status = "Active"
		m_doc.notes = "Scheduled rear tires replacement."
		m_doc.insert(ignore_permissions=True)
		print("Created Maintenance Log")
		
	# Update vehicle status to 'In Shop' for active maintenance
	frappe.db.set_value("Vehicle", v1_name, "status", "In Shop")
	frappe.db.commit()

	# 8. Create Fuel Log
	if not frappe.db.exists("Fuel Log", {"vehicle": v1_name, "trip": t1_name}):
		f_doc = frappe.new_doc("Fuel Log")
		f_doc.vehicle = v1_name
		f_doc.trip = t1_name
		f_doc.date = "2026-07-01"
		f_doc.odometer_reading = 124950
		f_doc.liters = 120
		f_doc.cost = 180
		f_doc.insert(ignore_permissions=True)
		print("Created Fuel Log")
		
	# 9. Create Expense
	if not frappe.db.exists("Expense", {"vehicle": v2_name, "trip": t2_name}):
		e_doc = frappe.new_doc("Expense")
		e_doc.vehicle = v2_name
		e_doc.trip = t2_name
		e_doc.expense_type = "Toll"
		e_doc.amount = 15
		e_doc.date = "2026-07-12"
		e_doc.description = "Highway toll fee."
		e_doc.insert(ignore_permissions=True)
		print("Created Expense")
		
	frappe.db.commit()
	print("Database seeding completed successfully!")
