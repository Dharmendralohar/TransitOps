import frappe

def run():
	from erpnext.setup.setup_wizard.operations.install_fixtures import install_company, install_defaults
	
	args = frappe._dict({
		'company_name': 'Solufy',
		'company_abbr': 'S',
		'fy_start_date': '2026-07-12',
		'fy_end_date': '2027-07-11',
		'country': 'United States',
		'currency': 'USD',
		'timezone': 'America/New_York',
		'language': 'en',
		'chart_of_accounts': 'Standard Chart of Accounts',
		'domain': 'Distribution'
	})

	if not frappe.db.exists('Company', 'Solufy'):
		print("Creating company Solufy...")
		install_company(args)
		install_defaults(args)
		frappe.db.commit()
		print("Company Solufy created successfully!")
	else:
		print("Company Solufy already exists!")
