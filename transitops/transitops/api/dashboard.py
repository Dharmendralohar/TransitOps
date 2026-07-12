import frappe
from frappe.utils import today, getdate, add_days

@frappe.whitelist()
def get_dashboard_data(vehicle_type=None, status=None, region=None, from_date=None, to_date=None):
	# Build vehicle filters
	vehicle_filters = {}
	if vehicle_type:
		vehicle_filters["vehicle_type"] = vehicle_type
	if status:
		vehicle_filters["status"] = status
	if region:
		vehicle_filters["region"] = region

	vehicles = frappe.get_all("Vehicle", filters=vehicle_filters, fields=["name", "status", "vehicle_type"])
	vehicle_names = [v.name for v in vehicles]

	if not vehicle_names:
		return {
			"active_vehicles": 0,
			"available_vehicles": 0,
			"vehicles_on_trip": 0,
			"vehicles_in_maintenance": 0,
			"active_trips": 0,
			"pending_trips": 0,
			"drivers_on_duty": 0,
			"fleet_utilization": 0.0,
			"monthly_fuel_cost": 0.0,
			"monthly_maintenance_cost": 0.0,
			"charts": {
				"vehicle_status": {},
				"vehicle_type": {},
				"trip_status": {},
				"monthly_costs": {"labels": [], "fuel": [], "maintenance": []}
			}
		}

	# KPIs
	active_vehicles_count = sum(1 for v in vehicles if v.status != "Retired")
	available_vehicles_count = sum(1 for v in vehicles if v.status == "Available")
	vehicles_on_trip_count = sum(1 for v in vehicles if v.status == "On Trip")
	vehicles_in_maintenance_count = sum(1 for v in vehicles if v.status == "In Shop")

	trip_filters = {"vehicle": ["in", vehicle_names]}
	if from_date:
		trip_filters["dispatch_datetime"] = [">=", from_date]
	if to_date:
		if "dispatch_datetime" in trip_filters:
			trip_filters["dispatch_datetime"] = ["between", [from_date, to_date]]
		else:
			trip_filters["dispatch_datetime"] = ["<=", to_date]

	active_trips_count = frappe.db.count("Trip", filters={**trip_filters, "status": "Dispatched"})
	pending_trips_count = frappe.db.count("Trip", filters={**trip_filters, "status": "Draft"})

	drivers_on_duty = frappe.db.count("Driver", filters={"status": "On Trip"})

	fleet_utilization = 0.0
	if active_vehicles_count > 0:
		fleet_utilization = round((vehicles_on_trip_count / active_vehicles_count) * 100, 2)

	# Fuel and Maintenance monthly costs
	fuel_filters = {"vehicle": ["in", vehicle_names]}
	if from_date and to_date:
		fuel_filters["date"] = ["between", [from_date, to_date]]
	else:
		current_date = getdate(today())
		from_date_curr = f"{current_date.year}-{current_date.month:02d}-01"
		fuel_filters["date"] = [">=", from_date_curr]

	fuel_logs = frappe.get_all("Fuel Log", filters=fuel_filters, fields=["cost"])
	monthly_fuel_cost = sum(fl.cost for fl in fuel_logs)

	maint_filters = {"vehicle": ["in", vehicle_names]}
	if from_date and to_date:
		maint_filters["date"] = ["between", [from_date, to_date]]
	else:
		current_date = getdate(today())
		from_date_curr = f"{current_date.year}-{current_date.month:02d}-01"
		maint_filters["date"] = [">=", from_date_curr]

	maint_logs = frappe.get_all("Maintenance Log", filters=maint_filters, fields=["cost"])
	monthly_maintenance_cost = sum(ml.cost for ml in maint_logs)

	# Chart Data
	vehicle_status_chart = {}
	for v in vehicles:
		vehicle_status_chart[v.status] = vehicle_status_chart.get(v.status, 0) + 1

	vehicle_type_chart = {}
	for v in vehicles:
		vehicle_type_chart[v.vehicle_type] = vehicle_type_chart.get(v.vehicle_type, 0) + 1

	trip_status_chart = {}
	trips_all = frappe.get_all("Trip", filters={"vehicle": ["in", vehicle_names]}, fields=["status"])
	for t in trips_all:
		trip_status_chart[t.status] = trip_status_chart.get(t.status, 0) + 1

	# Monthly Costs Chart (Last 6 Months)
	six_months_ago = add_days(today(), -180)
	fuel_six = frappe.get_all("Fuel Log", filters={"vehicle": ["in", vehicle_names], "date": [">=", six_months_ago]}, fields=["date", "cost"])
	maint_six = frappe.get_all("Maintenance Log", filters={"vehicle": ["in", vehicle_names], "date": [">=", six_months_ago]}, fields=["date", "cost"])

	monthly_costs = {}
	for fl in fuel_six:
		m_key = fl.date.strftime("%Y-%m") if hasattr(fl.date, 'strftime') else str(fl.date)[:7]
		if m_key not in monthly_costs:
			monthly_costs[m_key] = {"fuel": 0.0, "maint": 0.0}
		monthly_costs[m_key]["fuel"] += float(fl.cost)

	for ml in maint_six:
		m_key = ml.date.strftime("%Y-%m") if hasattr(ml.date, 'strftime') else str(ml.date)[:7]
		if m_key not in monthly_costs:
			monthly_costs[m_key] = {"fuel": 0.0, "maint": 0.0}
		monthly_costs[m_key]["maint"] += float(ml.cost)

	sorted_months = sorted(monthly_costs.keys())[-6:]
	chart_labels = sorted_months
	chart_fuel = [monthly_costs[m]["fuel"] for m in sorted_months]
	chart_maint = [monthly_costs[m]["maint"] for m in sorted_months]

	return {
		"active_vehicles": active_vehicles_count,
		"available_vehicles": available_vehicles_count,
		"vehicles_on_trip": vehicles_on_trip_count,
		"vehicles_in_maintenance": vehicles_in_maintenance_count,
		"active_trips": active_trips_count,
		"pending_trips": pending_trips_count,
		"drivers_on_duty": drivers_on_duty,
		"fleet_utilization": fleet_utilization,
		"monthly_fuel_cost": monthly_fuel_cost,
		"monthly_maintenance_cost": monthly_maintenance_cost,
		"charts": {
			"vehicle_status": vehicle_status_chart,
			"vehicle_type": vehicle_type_chart,
			"trip_status": trip_status_chart,
			"monthly_costs": {
				"labels": chart_labels,
				"fuel": chart_fuel,
				"maintenance": chart_maint
			}
		}
	}
