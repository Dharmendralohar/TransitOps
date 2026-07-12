# TransitOps Documentation

TransitOps is a Frappe v16 application with a Vue 3 frontend for managing fleet operations, drivers, trips, maintenance, fuel, expenses, and operational analytics.

## Application Access

Development frontend:

```bash
cd apps/transitops/frontend
npm run dev
```

Open:

```text
http://localhost:5173/
```

The Vite frontend proxies API, login, assets, and files to the Frappe backend at `http://127.0.0.1:8000`.

Production frontend build:

```bash
cd apps/transitops/frontend
npm run build
```

The compiled assets are written to:

```text
apps/transitops/transitops/public/frontend
```

## Demo Login

After running seed data, use:

```text
User: manager@transitops.local
Password: password
```

The manager user has `Fleet Manager` and `System Manager` access.

## Demo Data

Seed base demo data:

```bash
bench --site trip.com execute transitops.seed_data.seed
```

Seed five additional demo data sets:

```bash
bench --site trip.com execute transitops.seed_data.seed_five_demo_sets
```

The seed data creates sample roles, users, drivers, vehicles, trips, maintenance logs, fuel logs, and expenses.

## Roles And Permissions

TransitOps uses Frappe roles to control visible actions and financial data.

| Role | Main Access |
| --- | --- |
| System Manager | Full access to records, settings, and financial data |
| Fleet Manager | Fleet, driver, trip, maintenance, and financial operations |
| Safety Officer | Driver and compliance-oriented access |
| Financial Analyst | Financial reports and cost/ROI data |
| Driver | Limited access to assigned trips |

Financial reports are protected by backend permission checks. Only `System Manager`, `Fleet Manager`, and `Financial Analyst` can access operational cost and ROI APIs.

## Main Frontend Screens

| Screen | Purpose |
| --- | --- |
| Dashboard | Shows fleet KPIs, status charts, trip status, and monthly cost summaries |
| Vehicles | Manage fleet vehicles, status, load capacity, odometer, acquisition cost, and region |
| Drivers | Manage driver profiles, license details, safety score, linked user, and status |
| Trips | Create, dispatch, complete, or cancel trip records |
| Maintenance | Track maintenance events, cost, dates, and status |
| Expenses | Log fuel and other operational expenses |
| Reports | View utilization, fuel efficiency, operational cost, ROI, and export analytics PDF |
| Settings | Configure TransitOps settings and license reminder behavior |

## Core DocTypes

### Vehicle

Tracks individual fleet assets.

Important fields:

| Field | Description |
| --- | --- |
| Registration Number | Unique vehicle ID and document name |
| Vehicle Name / Model | Human-readable model/name |
| Vehicle Type | `Truck`, `Van`, `Bike`, `Bus`, `Other` |
| Maximum Load Capacity | Load limit used during trip validation |
| Current Odometer | Vehicle odometer |
| Acquisition Cost | Used for ROI reporting |
| Status | `Available`, `On Trip`, `In Shop`, `Retired` |
| Region | Operational region |

### Driver

Tracks driver profiles and compliance details.

Important fields:

| Field | Description |
| --- | --- |
| Driver Name | Driver display name |
| System User | Optional linked Frappe User |
| License Number | Unique license number |
| License Category | `LMV`, `HMV`, `Motorcycle`, `Commercial`, `Other` |
| License Expiry Date | Used for license compliance checks |
| Contact Number | Must include country code, for example `+919876543210` |
| Safety Score | Must be between `0` and `100` |
| Status | `Available`, `On Trip`, `Off Duty`, `Suspended` |

Validation:

- Safety score must be between `0` and `100`.
- A Frappe user can be linked to only one driver profile.
- Phone values should include a country code. The frontend normalizes 10-digit local numbers to `+91...`.

### Trip

Tracks dispatch and route execution.

Important fields:

| Field | Description |
| --- | --- |
| Source | Trip origin |
| Destination | Trip destination |
| Vehicle | Assigned Vehicle |
| Driver | Assigned Driver |
| Cargo Weight | Cargo weight in kg |
| Planned Distance | Planned route distance |
| Dispatch Datetime | Set when dispatched |
| Completion Datetime | Set when completed |
| Starting Odometer | Captured from vehicle when dispatched |
| Final Odometer | Required when completing a trip |
| Actual Distance | Calculated from odometer readings |
| Fuel Consumed | Fuel used for completed trip |
| Revenue | Trip revenue |
| Status | `Draft`, `Dispatched`, `Completed`, `Cancelled` |

Trip lifecycle:

```text
Draft -> Dispatched -> Completed
Draft -> Cancelled
Dispatched -> Cancelled
```

Validation:

- Vehicle and driver must be available before dispatch.
- Cargo weight cannot exceed vehicle load capacity.
- Driver license must not be expired.
- A vehicle or driver cannot be assigned to multiple dispatched trips.
- Completed trips require final odometer and fuel consumed.
- Final odometer cannot be lower than starting odometer.
- Cancelling a dispatched trip requires a cancellation reason.

### Maintenance Log

Tracks maintenance work against vehicles.

Statuses:

```text
Active
Closed
```

Maintenance types:

```text
Oil Change
Tire Replacement
Repair
Inspection
Other
```

### Fuel Log

Tracks refueling costs and quantity.

Important fields:

| Field | Description |
| --- | --- |
| Vehicle | Related vehicle |
| Trip | Optional related trip |
| Date | Fuel date |
| Liters | Fuel quantity |
| Cost | Total fuel cost |
| Odometer Reading | Odometer at fuel entry |
| Price per Liter | Read-only computed field |

### Expense

Tracks non-fuel operational costs.

Expense types:

```text
Toll
Maintenance
Fine
Parking
Permit
Other
```

### TransitOps Settings

Stores system configuration such as license reminder settings, reminder days, and recipient emails.

## Backend APIs

### Auth

```text
transitops.transitops.api.auth.get_current_user
```

Returns authenticated user details, roles, linked driver profile, and CSRF token.

### Dashboard

```text
transitops.transitops.api.dashboard.get_dashboard_data
```

Optional filters:

```text
vehicle_type
status
region
from_date
to_date
```

Returns active vehicle counts, available vehicles, on-trip vehicles, active trips, pending trips, drivers on duty, fleet utilization, monthly fuel cost, maintenance cost, and chart data.

### Trip Actions

```text
transitops.transitops.api.trips.dispatch_trip
transitops.transitops.api.trips.complete_trip
transitops.transitops.api.trips.cancel_trip
```

These APIs enforce action permissions and trigger Trip controller validations.

### Reports

```text
transitops.transitops.api.reports.get_fuel_efficiency_report
transitops.transitops.api.reports.get_fleet_utilization_report
transitops.transitops.api.reports.get_operational_cost_report
transitops.transitops.api.reports.get_vehicle_roi_report
```

Common filters:

```text
from_date
to_date
vehicle
vehicle_type
region
```

Operational cost and vehicle ROI reports require financial access.

## REST Resources

The Vue frontend also uses standard Frappe REST endpoints:

```text
GET    /api/resource/Vehicle
POST   /api/resource/Vehicle
PUT    /api/resource/Vehicle/{name}
DELETE /api/resource/Vehicle/{name}

GET    /api/resource/Driver
POST   /api/resource/Driver
PUT    /api/resource/Driver/{name}
DELETE /api/resource/Driver/{name}

GET    /api/resource/Trip
POST   /api/resource/Trip
PUT    /api/resource/Trip/{name}

GET    /api/resource/Maintenance Log
POST   /api/resource/Maintenance Log

GET    /api/resource/Fuel Log
POST   /api/resource/Fuel Log

GET    /api/resource/Expense
POST   /api/resource/Expense

GET    /api/resource/TransitOps Settings/TransitOps Settings
PUT    /api/resource/TransitOps Settings/TransitOps Settings
```

Write requests require the `X-Frappe-CSRF-Token` header.

## Developer Commands

Install app on a site:

```bash
bench --site trip.com install-app transitops
```

Run migrations:

```bash
bench --site trip.com migrate
```

Clear cache:

```bash
bench --site trip.com clear-cache
```

Build frontend:

```bash
cd apps/transitops/frontend
npm run build
```

Run frontend dev server:

```bash
cd apps/transitops/frontend
npm run dev
```

Run tests:

```bash
bench --site trip.com run-tests --app transitops
```

## Common Issues

### Driver Add Fails With Phone Error

Frappe Phone fields require a country code. Use:

```text
+919876543210
```

The current frontend automatically normalizes 10-digit local numbers to `+91...`.

### Frontend Shows Login Or Empty Data

Confirm the backend is running:

```bash
bench start
```

Confirm the Vite frontend is running:

```bash
cd apps/transitops/frontend
npm run dev
```

Confirm the site has demo data:

```bash
bench --site trip.com execute transitops.seed_data.seed
bench --site trip.com execute transitops.seed_data.seed_five_demo_sets
```

### API Returns Permission Error

Check the logged-in user's roles and ensure the user has the required role for the target operation. Financial report APIs require `System Manager`, `Fleet Manager`, or `Financial Analyst`.
