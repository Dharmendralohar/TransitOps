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


def seed_five_demo_sets():
	print("Creating 5 TransitOps demo data sets...")

	demo_rows = [
		{
			"driver": {
				"driver_name": "Aarav Mehta",
				"license_number": "DL-DEMO-5001",
				"license_category": "HMV",
				"license_expiry_date": "2027-02-15",
				"contact_number": "+919810050001",
				"safety_score": 97,
				"status": "Available",
			},
			"vehicle": {
				"registration_number": "MH-12-DE-5001",
				"vehicle_name": "Tata Prima 5530",
				"vehicle_type": "Truck",
				"max_load_capacity": 18000,
				"odometer": 68240,
				"acquisition_cost": 6400000,
				"status": "Available",
				"region": "West",
			},
			"trip": {
				"source": "Pune Hub",
				"destination": "Mumbai Port",
				"cargo_weight": 14200,
				"planned_distance": 154,
				"status": "Completed",
				"dispatch_datetime": "2026-07-03 07:15:00",
				"completion_datetime": "2026-07-03 12:05:00",
				"actual_distance": 158,
				"fuel_consumed": 52,
				"revenue": 42000,
			},
			"fuel": {"date": "2026-07-03", "liters": 86, "cost": 8170},
			"expense": {"expense_type": "Toll", "date": "2026-07-03", "amount": 2450, "description": "Expressway tolls"},
			"maintenance": {"maintenance_type": "Inspection", "date": "2026-07-04", "completion_date": "2026-07-04", "cost": 1800, "status": "Closed"},
		},
		{
			"driver": {
				"driver_name": "Neha Kulkarni",
				"license_number": "DL-DEMO-5002",
				"license_category": "Commercial",
				"license_expiry_date": "2027-05-30",
				"contact_number": "+919810050002",
				"safety_score": 92,
				"status": "Available",
			},
			"vehicle": {
				"registration_number": "MH-12-DE-5002",
				"vehicle_name": "Ashok Leyland Dost",
				"vehicle_type": "Van",
				"max_load_capacity": 2400,
				"odometer": 39120,
				"acquisition_cost": 1250000,
				"status": "Available",
				"region": "South",
			},
			"trip": {
				"source": "Bengaluru DC",
				"destination": "Mysuru Retail Cluster",
				"cargo_weight": 1850,
				"planned_distance": 147,
				"status": "Dispatched",
				"dispatch_datetime": "2026-07-12 06:40:00",
				"revenue": 18500,
			},
			"fuel": {"date": "2026-07-12", "liters": 48, "cost": 4560},
			"expense": {"expense_type": "Parking", "date": "2026-07-12", "amount": 300, "description": "Urban loading bay parking"},
			"maintenance": {"maintenance_type": "Oil Change", "date": "2026-07-05", "completion_date": "2026-07-05", "cost": 3200, "status": "Closed"},
		},
		{
			"driver": {
				"driver_name": "Imran Shaikh",
				"license_number": "DL-DEMO-5003",
				"license_category": "HMV",
				"license_expiry_date": "2026-12-22",
				"contact_number": "+919810050003",
				"safety_score": 89,
				"status": "Available",
			},
			"vehicle": {
				"registration_number": "MH-12-DE-5003",
				"vehicle_name": "Eicher Pro 3015",
				"vehicle_type": "Truck",
				"max_load_capacity": 11000,
				"odometer": 84200,
				"acquisition_cost": 3900000,
				"status": "Available",
				"region": "North",
			},
			"trip": {
				"source": "Delhi Depot",
				"destination": "Jaipur Warehouse",
				"cargo_weight": 7600,
				"planned_distance": 281,
				"status": "Completed",
				"dispatch_datetime": "2026-07-08 05:45:00",
				"completion_datetime": "2026-07-08 14:20:00",
				"actual_distance": 288,
				"fuel_consumed": 76,
				"revenue": 52500,
			},
			"fuel": {"date": "2026-07-08", "liters": 96, "cost": 9120},
			"expense": {"expense_type": "Permit", "date": "2026-07-08", "amount": 1200, "description": "State border permit"},
			"maintenance": {"maintenance_type": "Repair", "date": "2026-07-09", "completion_date": "2026-07-10", "cost": 8400, "status": "Closed"},
		},
		{
			"driver": {
				"driver_name": "Priya Nair",
				"license_number": "DL-DEMO-5004",
				"license_category": "LMV",
				"license_expiry_date": "2028-01-18",
				"contact_number": "+919810050004",
				"safety_score": 95,
				"status": "Available",
			},
			"vehicle": {
				"registration_number": "MH-12-DE-5004",
				"vehicle_name": "Force Traveller",
				"vehicle_type": "Bus",
				"max_load_capacity": 1800,
				"odometer": 22150,
				"acquisition_cost": 1750000,
				"status": "Available",
				"region": "West",
			},
			"trip": {
				"source": "Nashik Station",
				"destination": "Shirdi Terminal",
				"cargo_weight": 950,
				"planned_distance": 88,
				"status": "Draft",
				"revenue": 9800,
			},
			"fuel": {"date": "2026-07-11", "liters": 34, "cost": 3230},
			"expense": {"expense_type": "Other", "date": "2026-07-11", "amount": 650, "description": "Route supplies"},
			"maintenance": {"maintenance_type": "Inspection", "date": "2026-07-13", "cost": 1500, "status": "Active"},
		},
		{
			"driver": {
				"driver_name": "Rohan D'Souza",
				"license_number": "DL-DEMO-5005",
				"license_category": "Commercial",
				"license_expiry_date": "2027-09-09",
				"contact_number": "+919810050005",
				"safety_score": 86,
				"status": "Available",
			},
			"vehicle": {
				"registration_number": "MH-12-DE-5005",
				"vehicle_name": "Mahindra Jeeto",
				"vehicle_type": "Van",
				"max_load_capacity": 700,
				"odometer": 17890,
				"acquisition_cost": 520000,
				"status": "Available",
				"region": "Central",
			},
			"trip": {
				"source": "Nagpur Micro Hub",
				"destination": "Amravati Route",
				"cargo_weight": 520,
				"planned_distance": 158,
				"status": "Cancelled",
				"cancellation_reason": "Customer rescheduled delivery window",
				"revenue": 7600,
			},
			"fuel": {"date": "2026-07-10", "liters": 29, "cost": 2755},
			"expense": {"expense_type": "Fine", "date": "2026-07-10", "amount": 500, "description": "Documentation delay fine"},
			"maintenance": {"maintenance_type": "Tire Replacement", "date": "2026-07-06", "completion_date": "2026-07-06", "cost": 4600, "status": "Closed"},
		},
	]

	for row in demo_rows:
		driver_name = frappe.db.get_value("Driver", {"license_number": row["driver"]["license_number"]}, "name")
		if not driver_name:
			driver_doc = frappe.new_doc("Driver")
			driver_doc.update(row["driver"])
			driver_doc.insert(ignore_permissions=True)
			driver_name = driver_doc.name
			print(f"Created Driver: {row['driver']['driver_name']}")

		vehicle_name = frappe.db.get_value("Vehicle", {"registration_number": row["vehicle"]["registration_number"]}, "name")
		if not vehicle_name:
			vehicle_doc = frappe.new_doc("Vehicle")
			vehicle_doc.update(row["vehicle"])
			vehicle_doc.insert(ignore_permissions=True)
			vehicle_name = vehicle_doc.name
			print(f"Created Vehicle: {row['vehicle']['registration_number']}")

		trip_name = frappe.db.get_value("Trip", {
			"source": row["trip"]["source"],
			"destination": row["trip"]["destination"],
			"vehicle": vehicle_name,
		}, "name")
		if not trip_name:
			trip_doc = frappe.new_doc("Trip")
			trip_doc.update({
				"source": row["trip"]["source"],
				"destination": row["trip"]["destination"],
				"vehicle": vehicle_name,
				"driver": driver_name,
				"cargo_weight": row["trip"]["cargo_weight"],
				"planned_distance": row["trip"]["planned_distance"],
				"status": "Draft",
			})
			trip_doc.insert(ignore_permissions=True)
			trip_name = trip_doc.name
			print(f"Created Trip: {row['trip']['source']} to {row['trip']['destination']}")

		trip_updates = row["trip"].copy()
		trip_updates.pop("source")
		trip_updates.pop("destination")
		trip_updates.pop("cargo_weight")
		trip_updates.pop("planned_distance")
		if trip_updates:
			starting_odometer = row["vehicle"]["odometer"]
			if row["trip"].get("status") == "Completed":
				trip_updates["starting_odometer"] = starting_odometer
				trip_updates["final_odometer"] = starting_odometer + row["trip"]["actual_distance"]
			frappe.db.set_value("Trip", trip_name, trip_updates, update_modified=False)

		if not frappe.db.exists("Fuel Log", {"vehicle": vehicle_name, "trip": trip_name, "date": row["fuel"]["date"]}):
			fuel_doc = frappe.new_doc("Fuel Log")
			fuel_doc.update({
				"vehicle": vehicle_name,
				"trip": trip_name,
				"date": row["fuel"]["date"],
				"liters": row["fuel"]["liters"],
				"cost": row["fuel"]["cost"],
				"odometer_reading": row["vehicle"]["odometer"],
			})
			fuel_doc.insert(ignore_permissions=True)
			print(f"Created Fuel Log for {row['vehicle']['registration_number']}")

		if not frappe.db.exists("Expense", {"vehicle": vehicle_name, "trip": trip_name, "date": row["expense"]["date"], "expense_type": row["expense"]["expense_type"]}):
			expense_doc = frappe.new_doc("Expense")
			expense_doc.update({
				"vehicle": vehicle_name,
				"trip": trip_name,
				"expense_type": row["expense"]["expense_type"],
				"date": row["expense"]["date"],
				"amount": row["expense"]["amount"],
				"description": row["expense"]["description"],
			})
			expense_doc.insert(ignore_permissions=True)
			print(f"Created Expense for {row['vehicle']['registration_number']}")

		if not frappe.db.exists("Maintenance Log", {"vehicle": vehicle_name, "date": row["maintenance"]["date"], "maintenance_type": row["maintenance"]["maintenance_type"]}):
			maintenance_doc = frappe.new_doc("Maintenance Log")
			maintenance_doc.update({
				"vehicle": vehicle_name,
				"maintenance_type": row["maintenance"]["maintenance_type"],
				"date": row["maintenance"]["date"],
				"completion_date": row["maintenance"].get("completion_date"),
				"cost": row["maintenance"]["cost"],
				"status": row["maintenance"]["status"],
				"notes": "Demo maintenance record.",
			})
			maintenance_doc.insert(ignore_permissions=True)
			print(f"Created Maintenance Log for {row['vehicle']['registration_number']}")

	frappe.db.commit()
	print("5 TransitOps demo data sets created successfully!")
