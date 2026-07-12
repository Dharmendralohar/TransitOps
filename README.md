# TransitOps - Smart Transport & Fleet Operations Console

TransitOps is a modern, high-performance fleet operations dashboard built with React, TypeScript, Tailwind CSS, and local storage database persistence. It features robust Role-Based Access Control (RBAC), global multi-currency support, dynamic data filtering, visual interactive charts, and high-fidelity report export capabilities.

---

## 🚀 Setup & Launch Instructions

To launch the application locally, run:

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

The application will be served at `http://localhost:7777/`.

---

## 📂 Step-by-Step Operational Flows

### Flow 1: Authentication & Role-Based Access (RBAC)
1. Navigate to the login screen at `http://localhost:7777/`.
2. Under the credentials form, locate the **Quick Switcher Access** panel.
3. Click any of the preconfigured profiles to sign in as that user:
   - **Administrator (Rohan K.)**: Access to all modules, settings, and creation/deletion forms.
   - **Dispatcher (Sarah J.)**: Access to Vehicles, Drivers, and Trip logs. Cannot access settings or financial reports.
   - **Maintenance Manager (Marcus T.)**: Access to Vehicle maintenance schedules and expense logs.
   - **Finance Analyst (Elena R.)**: Access to fuel registers, expenses, and report exports.
4. Try clicking a suspended profile to verify that the system blocks logins and raises a warnings notice.

### Flow 2: Setting up Global Regional Settings
1. Log in as **Rohan K. (Administrator)**.
2. Select **8. Settings** in the sidebar.
3. In the Settings workspace, click **Organization Profile**.
4. In the configuration modal:
   - Set the support contact numbers and details.
   - Change **Base System Currency** (e.g. choose `INR (₹)`, `EUR (€)`, or `GBP (£)`).
   - Change **Primary Timezone** (e.g. choose `Asia/Kolkata` for Indian Standard Time).
5. Click **Save System Settings**.
6. **Result**: Observe that all monetary listings, cards, lists, tooltips, and charts dynamically update to the new currency symbol immediately.

### Flow 3: Interactive Dashboard & Command Center
1. Click **1. Dashboard Overview** in the sidebar.
2. Inspect the **7 Live Statistics Cards** showing available vehicles, pending trips, drivers on duty, and fleet utilization.
3. Use the top filter dropdowns (**Vehicle Type**, **Current Status**, and **Region**) to filter statistics:
   - Changing "Vehicle Type" to `Heavy Duty` filters the active lists and metrics instantly.
   - All counters and statistics cards recalculate in real-time.
4. Review the **Recent Trips Log** table containing active dispatch trip details.

### Flow 4: Fleet Registry & Driver Dossiers
1. Click **2. Vehicles** in the sidebar to review active trucks and utility vehicles.
2. Click **Add Vehicle** to register a new chassis. Notice the purchase cost input field dynamically reflects the currency symbol set in settings.
3. Click **3. Drivers** to manage drivers' licenses, contact numbers, experience metrics, and status configurations.

### Flow 5: Maintenance Logs & Cost Tracking
1. Click **5. Maintenance** to view scheduled and resolved maintenance tickets.
2. Click **Schedule Maintenance** to log a ticket, entering the technician, workshop, service type, and estimated cost.
3. Select **Mark Completed** on a pending ticket to upload invoices and update the final servicing cost.
4. Click **6. Fuel & Expenses** to record fuel logs and tolls, permits, or tire replacements.

### Flow 6: Visual Analytics & Document Exports
1. Click **7. Analytics** in the sidebar.
2. View the visual charts, including:
   - Monthly Revenue vertical bar charts (scaling dynamically with currency symbols).
   - Top Costliest Vehicles registry progress bars.
3. Click the **Compile & Export** button:
   - **CSV (.csv)**: Generates a fully-escaped comma-separated spreadsheet of all tables.
   - **Excel (.xlsx)**: Downloads an Excel-formatted HTML spreadsheet with styled columns, bold headers, and gridlines.
   - **PDF**: Opens a clean, print-styled document layout with all registry tables and automatically triggers the browser print prompt to "Save as PDF".

---

## 📹 How to Record the Demo Video

### Option A: Fully Automated Recording (Recommended)
We have provided a Playwright automation script to run through the entire operational flow and output a high-definition video recording to `./recordings`.

```bash
# 1. Install Playwright dependency
npm install playwright

# 2. Run the automated recorder script
node record_demo.js
```

### Option B: Manual Recording Script & Narration Guide
If recording manually (using OBS, Zoom, or screen capture), follow this script:

| Time | Action | Narration Script |
|---|---|---|
| **0:00 - 0:15** | Start on the login screen. Click the **Quick Switcher card for Rohan K.** | *"Welcome to TransitOps, our intelligent fleet management console. We start by signing in as Rohan K., the system Administrator, using our Quick Switcher."* |
| **0:15 - 0:40** | Click **Settings** in the sidebar, open **Organization Profile**, and change Currency to `INR (₹)` and Timezone to `Asia/Kolkata`. Save settings. | *"Under settings, we can customize our organization parameters. We will change our base currency to INR and set our timezone to Asia/Kolkata. When we save, the change propagates globally."* |
| **0:40 - 1:05** | Click **Dashboard**. Point out the updated `₹` symbols on metric cards and bar charts. | *"Returning to the dashboard, we see all metrics cards, active operational costs, and recent trips are now formatted in Rupees. Changing filters updates statistics instantly."* |
| **1:05 - 1:30** | Go to **Analytics** and click **Compile & Export**. Select **Excel (.xlsx)** and download it. | *"Under Analytics, we see our monthly revenues and costliest vehicles. We can compile our entire fleet history and download it as a fully-formatted Excel sheet."* |
| **1:30 - 2:00** | Select **PDF** format, click export, and show the print-ready preview window. | *"Finally, exporting to PDF opens a clean, audit-friendly print table layout, ready to be saved as a high-fidelity PDF document. Thank you!"* |
