import frappe
from frappe import _
from frappe.utils import getdate

def check_financial_permission():
	user = frappe.session.user
	roles = frappe.get_roles(user)
	if not (set(["System Manager", "Fleet Manager", "Financial Analyst"]) & set(roles)):
		frappe.throw(_("Access Denied: You do not have permission to view financial details."), frappe.PermissionError)

@frappe.whitelist()
def get_fuel_efficiency_report(from_date=None, to_date=None, vehicle=None, vehicle_type=None, region=None):
	v_filters = {}
	if vehicle_type:
		v_filters["vehicle_type"] = vehicle_type
	if region:
		v_filters["region"] = region
	if vehicle:
		v_filters["name"] = vehicle

	matched_vehicles = frappe.get_all("Vehicle", filters=v_filters, fields=["name", "registration_number"])
	vehicle_map = {mv.name: mv.registration_number for mv in matched_vehicles}

	if not vehicle_map:
		return []

	trip_filters = {
		"status": "Completed",
		"vehicle": ["in", list(vehicle_map.keys())]
	}
	if from_date and to_date:
		trip_filters["completion_datetime"] = ["between", [from_date, to_date]]
	elif from_date:
		trip_filters["completion_datetime"] = [">=", from_date]
	elif to_date:
		trip_filters["completion_datetime"] = ["<=", to_date]

	trips = frappe.get_all(
		"Trip",
		filters=trip_filters,
		fields=["vehicle", "actual_distance", "fuel_consumed"]
	)

	data = {}
	for t in trips:
		v = t.vehicle
		if v not in data:
			data[v] = {
				"vehicle": v,
				"registration_number": vehicle_map.get(v, v),
				"total_distance": 0.0,
				"total_fuel": 0.0
			}
		data[v]["total_distance"] += t.actual_distance or 0.0
		data[v]["total_fuel"] += t.fuel_consumed or 0.0

	report_data = []
	for v, val in data.items():
		dist = val["total_distance"]
		fuel = val["total_fuel"]
		efficiency = 0.0
		if fuel > 0:
			efficiency = round(dist / fuel, 2)

		report_data.append({
			"vehicle": v,
			"registration_number": val["registration_number"],
			"total_distance": dist,
			"total_fuel": fuel,
			"efficiency": efficiency,
			"unit": "km/liter"
		})
	return report_data

@frappe.whitelist()
def get_fleet_utilization_report(vehicle_type=None, region=None):
	v_filters = {}
	if vehicle_type:
		v_filters["vehicle_type"] = vehicle_type
	if region:
		v_filters["region"] = region

	vehicles = frappe.get_all("Vehicle", filters=v_filters, fields=["name", "status"])
	if not vehicles:
		return []

	total_active = sum(1 for v in vehicles if v.status != "Retired")
	on_trip = sum(1 for v in vehicles if v.status == "On Trip")
	available = sum(1 for v in vehicles if v.status == "Available")
	in_shop = sum(1 for v in vehicles if v.status == "In Shop")

	utilization = 0.0
	if total_active > 0:
		utilization = round((on_trip / total_active) * 100, 2)

	return [{
		"total_active_vehicles": total_active,
		"vehicles_on_trip": on_trip,
		"vehicles_available": available,
		"vehicles_in_shop": in_shop,
		"fleet_utilization_percentage": utilization
	}]

@frappe.whitelist()
def get_operational_cost_report(from_date=None, to_date=None, vehicle=None, vehicle_type=None, region=None):
	check_financial_permission()

	v_filters = {}
	if vehicle_type:
		v_filters["vehicle_type"] = vehicle_type
	if region:
		v_filters["region"] = region
	if vehicle:
		v_filters["name"] = vehicle

	matched_vehicles = frappe.get_all("Vehicle", filters=v_filters, fields=["name"])
	if not matched_vehicles:
		return []
	v_names = [mv.name for mv in matched_vehicles]

	# Aggregated Fuel Log Costs
	fuel_filters = {"vehicle": ["in", v_names]}
	if from_date and to_date:
		fuel_filters["date"] = ["between", [from_date, to_date]]
	elif from_date:
		fuel_filters["date"] = [">=", from_date]
	elif to_date:
		fuel_filters["date"] = ["<=", to_date]

	fuel_logs = frappe.get_all("Fuel Log", filters=fuel_filters, fields=["vehicle", "cost"])
	fuel_costs = {}
	for fl in fuel_logs:
		fuel_costs[fl.vehicle] = fuel_costs.get(fl.vehicle, 0.0) + float(fl.cost or 0.0)

	# Aggregated Maintenance Log Costs
	maint_filters = {"vehicle": ["in", v_names]}
	if from_date and to_date:
		maint_filters["date"] = ["between", [from_date, to_date]]
	elif from_date:
		maint_filters["date"] = [">=", from_date]
	elif to_date:
		maint_filters["date"] = ["<=", to_date]

	maint_logs = frappe.get_all("Maintenance Log", filters=maint_filters, fields=["vehicle", "cost"])
	maint_costs = {}
	for ml in maint_logs:
		maint_costs[ml.vehicle] = maint_costs.get(ml.vehicle, 0.0) + float(ml.cost or 0.0)

	# Aggregated Expenses (excluding maintenance to avoid double counting)
	exp_filters = {"vehicle": ["in", v_names], "expense_type": ["!=", "Maintenance"]}
	if from_date and to_date:
		exp_filters["date"] = ["between", [from_date, to_date]]
	elif from_date:
		exp_filters["date"] = [">=", from_date]
	elif to_date:
		exp_filters["date"] = ["<=", to_date]

	expenses = frappe.get_all("Expense", filters=exp_filters, fields=["vehicle", "amount"])
	other_costs = {}
	for ex in expenses:
		other_costs[ex.vehicle] = other_costs.get(ex.vehicle, 0.0) + float(ex.amount or 0.0)

	report_data = []
	for vn in v_names:
		fc = fuel_costs.get(vn, 0.0)
		mc = maint_costs.get(vn, 0.0)
		oc = other_costs.get(vn, 0.0)
		mandatory_cost = fc + mc
		total_cost = mandatory_cost + oc

		report_data.append({
			"vehicle": vn,
			"fuel_cost": fc,
			"maintenance_cost": mc,
			"other_expenses": oc,
			"mandatory_operational_cost": mandatory_cost,
			"total_cost": total_cost
		})

	return report_data

@frappe.whitelist()
def get_vehicle_roi_report(from_date=None, to_date=None, vehicle=None, vehicle_type=None, region=None):
	check_financial_permission()

	v_filters = {}
	if vehicle_type:
		v_filters["vehicle_type"] = vehicle_type
	if region:
		v_filters["region"] = region
	if vehicle:
		v_filters["name"] = vehicle

	matched_vehicles = frappe.get_all("Vehicle", filters=v_filters, fields=["name", "acquisition_cost"])
	if not matched_vehicles:
		return []
	v_names = [mv.name for mv in matched_vehicles]
	acq_cost_map = {mv.name: float(mv.acquisition_cost or 0.0) for mv in matched_vehicles}

	# Trip Revenue
	trip_filters = {"vehicle": ["in", v_names], "status": "Completed"}
	if from_date and to_date:
		trip_filters["completion_datetime"] = ["between", [from_date, to_date]]
	elif from_date:
		trip_filters["completion_datetime"] = [">=", from_date]
	elif to_date:
		trip_filters["completion_datetime"] = ["<=", to_date]

	trips = frappe.get_all("Trip", filters=trip_filters, fields=["vehicle", "revenue"])
	revenues = {}
	for t in trips:
		revenues[t.vehicle] = revenues.get(t.vehicle, 0.0) + float(t.revenue or 0.0)

	# Fuel and Maintenance Costs
	fuel_filters = {"vehicle": ["in", v_names]}
	if from_date and to_date:
		fuel_filters["date"] = ["between", [from_date, to_date]]
	elif from_date:
		fuel_filters["date"] = [">=", from_date]
	elif to_date:
		fuel_filters["date"] = ["<=", to_date]

	fuel_logs = frappe.get_all("Fuel Log", filters=fuel_filters, fields=["vehicle", "cost"])
	fuel_costs = {}
	for fl in fuel_logs:
		fuel_costs[fl.vehicle] = fuel_costs.get(fl.vehicle, 0.0) + float(fl.cost or 0.0)

	maint_filters = {"vehicle": ["in", v_names]}
	if from_date and to_date:
		maint_filters["date"] = ["between", [from_date, to_date]]
	elif from_date:
		maint_filters["date"] = [">=", from_date]
	elif to_date:
		maint_filters["date"] = ["<=", to_date]

	maint_logs = frappe.get_all("Maintenance Log", filters=maint_filters, fields=["vehicle", "cost"])
	maint_costs = {}
	for ml in maint_logs:
		maint_costs[ml.vehicle] = maint_costs.get(ml.vehicle, 0.0) + float(ml.cost or 0.0)

	report_data = []
	for vn in v_names:
		acq = acq_cost_map.get(vn, 0.0)
		rev = revenues.get(vn, 0.0)
		fc = fuel_costs.get(vn, 0.0)
		mc = maint_costs.get(vn, 0.0)

		operating_profit = rev - fc - mc
		roi_percentage = 0.0
		if acq > 0:
			roi_percentage = round((operating_profit / acq) * 100, 2)

		report_data.append({
			"vehicle": vn,
			"acquisition_cost": acq,
			"trip_revenue": rev,
			"fuel_cost": fc,
			"maintenance_cost": mc,
			"operating_profit": operating_profit,
			"roi_percentage": roi_percentage
		})

	return report_data
