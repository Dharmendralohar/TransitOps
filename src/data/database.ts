export interface Vehicle {
  id: string;
  vehicleNumber: string;
  registrationNumber: string;
  vehicleType: string;
  brand: string;
  model: string;
  manufacturingYear: number;
  capacity: number; // in kg
  fuelType: string;
  purchaseDate: string;
  purchaseCost: number;
  insuranceExpiry: string;
  registrationExpiry: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  currentStatus: 'Active' | 'In Service' | 'Available' | 'Inactive';
  notes: string;
}

export interface Driver {
  id: string;
  fullName: string;
  employeeId: string;
  mobile: string;
  email: string;
  address: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  experience: number; // in years
  emergencyContact: string;
  assignedVehicleId?: string;
  assignedVehicleNumber?: string;
  driverStatus: 'Active' | 'On Leave' | 'Suspended' | 'Available';
}

export interface Trip {
  id: string;
  tripId: string;
  pickupLocation: string;
  destination: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  cargoType: string;
  cargoWeight: number; // in kg
  departureDate: string;
  expectedArrival: string;
  estimatedDistance: number; // in km
  estimatedFuel: number; // in liters
  priority: 'High' | 'Medium' | 'Low';
  remarks: string;
  status: 'Pending' | 'Dispatched' | 'On Route' | 'Completed' | 'Cancelled';
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  serviceType: string;
  workshop: string;
  serviceDate: string;
  estimatedCompletion: string;
  cost: number;
  technician: string;
  notes: string;
  status: 'Scheduled' | 'Completed';
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  date: string;
  fuelQuantity: number; // liters
  fuelCost: number;
  odometerReading: number;
  fuelStation: string;
}

export interface ExpenseRecord {
  id: string;
  expenseType: string;
  vehicleId: string;
  vehicleNumber: string;
  amount: number;
  vendor: string;
  description: string;
  date: string;
  receiptUrl?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    [module: string]: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      approve: boolean;
      export: boolean;
    };
  };
}

// Initial Mock Data
const initialVehicles: Vehicle[] = [
  {
    id: "v-1",
    vehicleNumber: "V-9081",
    registrationNumber: "CA-89A-7762",
    vehicleType: "Heavy Duty Hauler",
    brand: "Freightliner",
    model: "Cascadia",
    manufacturingYear: 2022,
    capacity: 22000,
    fuelType: "Diesel",
    purchaseDate: "2022-04-12",
    purchaseCost: 145000,
    insuranceExpiry: "2027-04-12",
    registrationExpiry: "2027-05-20",
    assignedDriverId: "d-1",
    assignedDriverName: "Alexander Wright",
    currentStatus: "Active",
    notes: "Primary cross-country route carrier. Equipped with APU."
  },
  {
    id: "v-2",
    vehicleNumber: "V-4491",
    registrationNumber: "TX-44B-1192",
    vehicleType: "Refrigerated Box Truck",
    brand: "Peterbilt",
    model: "220",
    manufacturingYear: 2021,
    capacity: 12000,
    fuelType: "Diesel",
    purchaseDate: "2021-08-15",
    purchaseCost: 98000,
    insuranceExpiry: "2027-08-15",
    registrationExpiry: "2027-09-01",
    assignedDriverId: "d-2",
    assignedDriverName: "Marcus Sterling",
    currentStatus: "Active",
    notes: "Cold storage transport. Reefer unit serviced monthly."
  },
  {
    id: "v-3",
    vehicleNumber: "V-2023",
    registrationNumber: "NY-12F-9092",
    vehicleType: "Flatbed Truck",
    brand: "Volvo",
    model: "VHD",
    manufacturingYear: 2023,
    capacity: 18000,
    fuelType: "Diesel",
    purchaseDate: "2023-01-10",
    purchaseCost: 128000,
    insuranceExpiry: "2026-12-01", // Upcoming warning
    registrationExpiry: "2027-01-10",
    assignedDriverId: undefined,
    assignedDriverName: undefined,
    currentStatus: "Available",
    notes: "Heavy machinery and construction hauling chassis."
  },
  {
    id: "v-4",
    vehicleNumber: "V-1025",
    registrationNumber: "NV-56A-4433",
    vehicleType: "Cargo Van",
    brand: "Ford",
    model: "Transit",
    manufacturingYear: 2022,
    capacity: 3500,
    fuelType: "Electric",
    purchaseDate: "2022-09-20",
    purchaseCost: 52000,
    insuranceExpiry: "2027-09-20",
    registrationExpiry: "2027-10-15",
    assignedDriverId: "d-3",
    assignedDriverName: "Elena Rodriguez",
    currentStatus: "In Service",
    notes: "Local last-mile delivery vehicle. EV charging level 2."
  },
  {
    id: "v-5",
    vehicleNumber: "V-6701",
    registrationNumber: "OR-34K-8822",
    vehicleType: "Box Truck",
    brand: "Hino",
    model: "268",
    manufacturingYear: 2020,
    capacity: 10000,
    fuelType: "Diesel",
    purchaseDate: "2020-03-05",
    purchaseCost: 75000,
    insuranceExpiry: "2026-03-05", // Past! Alert triggering
    registrationExpiry: "2026-04-10", // Past! Alert triggering
    assignedDriverId: undefined,
    assignedDriverName: undefined,
    currentStatus: "Inactive",
    notes: "Requires inspection before redeployment."
  }
];

const initialDrivers: Driver[] = [
  {
    id: "d-1",
    fullName: "Alexander Wright",
    employeeId: "EMP-0881",
    mobile: "+1 (555) 309-8812",
    email: "a.wright@transitops.com",
    address: "742 Evergreen Terrace, Springfield, OR",
    licenseNumber: "DL-CA908811",
    licenseCategory: "Class A CDL",
    licenseExpiry: "2028-09-22",
    experience: 12,
    emergencyContact: "Sarah Wright (Wife) - +1 (555) 309-8813",
    assignedVehicleId: "v-1",
    assignedVehicleNumber: "V-9081",
    driverStatus: "Active"
  },
  {
    id: "d-2",
    fullName: "Marcus Sterling",
    employeeId: "EMP-1022",
    mobile: "+1 (555) 441-2093",
    email: "m.sterling@transitops.com",
    address: "891 Whispering Pines, Las Vegas, NV",
    licenseNumber: "DL-NV102299",
    licenseCategory: "Class A CDL",
    licenseExpiry: "2026-11-15", // Warn expiry
    experience: 8,
    emergencyContact: "Linda Sterling (Mother) - +1 (555) 441-2094",
    assignedVehicleId: "v-2",
    assignedVehicleNumber: "V-4491",
    driverStatus: "Active"
  },
  {
    id: "d-3",
    fullName: "Elena Rodriguez",
    employeeId: "EMP-2041",
    mobile: "+1 (555) 781-4492",
    email: "e.rodriguez@transitops.com",
    address: "412 Oakwood Blvd, Los Angeles, CA",
    licenseNumber: "DL-CA204481",
    licenseCategory: "Class C CDL",
    licenseExpiry: "2029-01-30",
    experience: 5,
    emergencyContact: "Roberto Rodriguez (Father) - +1 (555) 781-4495",
    assignedVehicleId: "v-4",
    assignedVehicleNumber: "V-1025",
    driverStatus: "Available"
  },
  {
    id: "d-4",
    fullName: "David Chen",
    employeeId: "EMP-0419",
    mobile: "+1 (555) 120-9932",
    email: "d.chen@transitops.com",
    address: "18 Pine Needle Rd, Seattle, WA",
    licenseNumber: "DL-WA041988",
    licenseCategory: "Class B CDL",
    licenseExpiry: "2026-06-18", // Already expired (July 2026)
    experience: 15,
    emergencyContact: "Yuki Chen (Sister) - +1 (555) 120-9935",
    assignedVehicleId: undefined,
    assignedVehicleNumber: undefined,
    driverStatus: "On Leave"
  },
  {
    id: "d-5",
    fullName: "Tyrone Washington",
    employeeId: "EMP-1502",
    mobile: "+1 (555) 601-3382",
    email: "t.washington@transitops.com",
    address: "558 MLK Drive, Atlanta, GA",
    licenseNumber: "DL-GA150290",
    licenseCategory: "Class A CDL",
    licenseExpiry: "2027-10-12",
    experience: 7,
    emergencyContact: "Kendra Washington (Wife) - +1 (555) 601-3383",
    assignedVehicleId: undefined,
    assignedVehicleNumber: undefined,
    driverStatus: "Available"
  }
];

const initialTrips: Trip[] = [
  {
    id: "t-1001",
    tripId: "TRIP-2026-1001",
    pickupLocation: "Port of Los Angeles, CA",
    destination: "Dallas Logistics Center, TX",
    driverId: "d-1",
    driverName: "Alexander Wright",
    vehicleId: "v-1",
    vehicleNumber: "V-9081",
    cargoType: "Electronics",
    cargoWeight: 18500,
    departureDate: "2026-07-10T08:00:00Z",
    expectedArrival: "2026-07-13T18:00:00Z",
    estimatedDistance: 2250,
    estimatedFuel: 680,
    priority: "High",
    remarks: "Time-critical delivery for retail distribution launch.",
    status: "On Route"
  },
  {
    id: "t-1002",
    tripId: "TRIP-2026-1002",
    pickupLocation: "Cold Storage Facility, Seattle, WA",
    destination: "Supermarket Depot, Denver, CO",
    driverId: "d-2",
    driverName: "Marcus Sterling",
    vehicleId: "v-2",
    vehicleNumber: "V-4491",
    cargoType: "Frozen Foods",
    cargoWeight: 9800,
    departureDate: "2026-07-12T06:00:00Z",
    expectedArrival: "2026-07-15T12:00:00Z",
    estimatedDistance: 2100,
    estimatedFuel: 540,
    priority: "Medium",
    remarks: "Keep reefer temperature locked at -18°C.",
    status: "Dispatched"
  },
  {
    id: "t-1003",
    tripId: "TRIP-2026-1003",
    pickupLocation: "Warehouse A, Las Vegas, NV",
    destination: "Retail Outlet, Phoenix, AZ",
    driverId: "d-3",
    driverName: "Elena Rodriguez",
    vehicleId: "v-4",
    vehicleNumber: "V-1025",
    cargoType: "General Retail Parcels",
    cargoWeight: 2200,
    departureDate: "2026-07-14T09:00:00Z",
    expectedArrival: "2026-07-14T17:00:00Z",
    estimatedDistance: 480,
    estimatedFuel: 120,
    priority: "Low",
    remarks: "Standard depot transfer.",
    status: "Pending"
  },
  {
    id: "t-1004",
    tripId: "TRIP-2026-1004",
    pickupLocation: "Steel Mill, Portland, OR",
    destination: "Construction Site, Salt Lake City, UT",
    driverId: "d-1",
    driverName: "Alexander Wright",
    vehicleId: "v-1",
    vehicleNumber: "V-9081",
    cargoType: "Structural Steel Beams",
    cargoWeight: 21000,
    departureDate: "2026-07-02T07:00:00Z",
    expectedArrival: "2026-07-04T16:00:00Z",
    estimatedDistance: 1200,
    estimatedFuel: 420,
    priority: "High",
    remarks: "Oversized load escort required for first 200 miles.",
    status: "Completed"
  }
];

const initialMaintenance: MaintenanceRecord[] = [
  {
    id: "m-1",
    vehicleId: "v-4",
    vehicleNumber: "V-1025",
    serviceType: "Scheduled Servicing (30k miles)",
    workshop: "Metro EV Center",
    serviceDate: "2026-07-12",
    estimatedCompletion: "2026-07-13",
    cost: 450,
    technician: "Gary Peterson",
    notes: "EV battery cell health check and tyre rotation.",
    status: "Scheduled"
  },
  {
    id: "m-2",
    vehicleId: "v-1",
    vehicleNumber: "V-9081",
    serviceType: "Engine Diagnostics & Brake Change",
    workshop: "Apex Diesel Solutions",
    serviceDate: "2026-06-15",
    estimatedCompletion: "2026-06-17",
    cost: 2800,
    technician: "Danielle Miller",
    notes: "Replaced front brake drums. Resolved check engine code P0401.",
    status: "Completed"
  }
];

const initialFuelEntries: FuelEntry[] = [
  {
    id: "f-1",
    vehicleId: "v-1",
    vehicleNumber: "V-9081",
    driverId: "d-1",
    driverName: "Alexander Wright",
    date: "2026-07-10",
    fuelQuantity: 320,
    fuelCost: 1120,
    odometerReading: 128500,
    fuelStation: "Pilot Travel Center #231"
  },
  {
    id: "f-2",
    vehicleId: "v-2",
    vehicleNumber: "V-4491",
    driverId: "d-2",
    driverName: "Marcus Sterling",
    date: "2026-07-11",
    fuelQuantity: 180,
    fuelCost: 648,
    odometerReading: 89400,
    fuelStation: "Love's Travel Stop #512"
  }
];

const initialExpenses: ExpenseRecord[] = [
  {
    id: "e-1",
    expenseType: "Tolls",
    vehicleId: "v-1",
    vehicleNumber: "V-9081",
    amount: 145,
    vendor: "EZ-Pass Interoperability",
    description: "Cross-state tolls during TRIP-2026-1001",
    date: "2026-07-11",
    receiptUrl: "/receipts/e-1.jpg"
  },
  {
    id: "e-2",
    expenseType: "Permits",
    vehicleId: "v-1",
    vehicleNumber: "V-9081",
    amount: 350,
    vendor: "Nevada DOT",
    description: "Oversized cargo permit for TRIP-1004",
    date: "2026-07-02",
    receiptUrl: "/receipts/e-2.jpg"
  }
];

const initialUsers: AppUser[] = [
  {
    id: "u-1",
    name: "Sarah Jenkins",
    email: "s.jenkins@transitops.com",
    role: "Administrator",
    status: "Active",
    createdAt: "2025-01-15"
  },
  {
    id: "u-2",
    name: "Brandon Miller",
    email: "b.miller@transitops.com",
    role: "Dispatcher",
    status: "Active",
    createdAt: "2025-06-20"
  },
  {
    id: "u-3",
    name: "Lori Collins",
    email: "l.collins@transitops.com",
    role: "Fleet Manager",
    status: "Active",
    createdAt: "2025-10-10"
  },
  {
    id: "u-4",
    name: "David Chen",
    email: "d.chen@transitops.com",
    role: "Safety Officer",
    status: "Active",
    createdAt: "2026-02-01"
  },
  {
    id: "u-5",
    name: "Marcus Sterling",
    email: "m.sterling@transitops.com",
    role: "Financial Analyst",
    status: "Active",
    createdAt: "2026-03-12"
  }
];

const initialRoles: Role[] = [
  {
    id: "role-admin",
    name: "Administrator",
    description: "Full system control with absolute permissions across all operational modules.",
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      fleet: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      drivers: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      trips: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      maintenance: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      fuel: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      settings: { view: true, create: true, edit: true, delete: true, approve: true, export: true }
    }
  },
  {
    id: "role-fleet-mgr",
    name: "Fleet Manager",
    description: "Full access to Fleet, Drivers, Maintenance, and Analytics reports. Restricted from Trips and Finances.",
    permissions: {
      dashboard: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      fleet: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      drivers: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      trips: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      maintenance: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      fuel: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    }
  },
  {
    id: "role-dispatcher",
    name: "Dispatcher",
    description: "Access to Dashboard and Trips (Full). View-only access to Fleet. Restricted from all other modules.",
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      fleet: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      drivers: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      trips: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      maintenance: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      fuel: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    }
  },
  {
    id: "role-safety-off",
    name: "Safety Officer",
    description: "Full access to Drivers. View-only access to Trips. Restricted from all other modules.",
    permissions: {
      dashboard: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      fleet: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      drivers: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      trips: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      maintenance: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      fuel: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    }
  },
  {
    id: "role-fin-analyst",
    name: "Financial Analyst",
    description: "Full access to Fuel/Expenses and Analytics reports. View-only access to Fleet. Restricted from all other modules.",
    permissions: {
      dashboard: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      fleet: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
      drivers: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      trips: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      maintenance: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
      fuel: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      reports: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
      settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
    }
  }
];

export interface OrganizationSettings {
  companyName: string;
  taxId: string;
  currency: string;
  timezone: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  logoUrl?: string;
  enableSmsNotifications: boolean;
  enableEmailAlerts: boolean;
  maintWarningThresholdDays: number;
}

const initialOrgSettings: OrganizationSettings = {
  companyName: "TransitOps Global Logistics",
  taxId: "TX-990812-B",
  currency: "USD ($)",
  timezone: "America/Los_Angeles",
  supportEmail: "ops-alert@transitops.com",
  supportPhone: "+1 (800) 555-FLT1",
  address: "100 Logistics Blvd, Suite 400, Los Angeles, CA 90001",
  logoUrl: undefined,
  enableSmsNotifications: true,
  enableEmailAlerts: true,
  maintWarningThresholdDays: 30
};

// Database utility with local storage sync
export class TransitOpsDB {
  static getVehicles(): Vehicle[] {
    const val = localStorage.getItem("to_vehicles");
    if (!val) {
      this.saveVehicles(initialVehicles);
      return initialVehicles;
    }
    return JSON.parse(val);
  }
  static saveVehicles(data: Vehicle[]) {
    localStorage.setItem("to_vehicles", JSON.stringify(data));
  }

  static getDrivers(): Driver[] {
    const val = localStorage.getItem("to_drivers");
    if (!val) {
      this.saveDrivers(initialDrivers);
      return initialDrivers;
    }
    return JSON.parse(val);
  }
  static saveDrivers(data: Driver[]) {
    localStorage.setItem("to_drivers", JSON.stringify(data));
  }

  static getTrips(): Trip[] {
    const val = localStorage.getItem("to_trips");
    if (!val) {
      this.saveTrips(initialTrips);
      return initialTrips;
    }
    return JSON.parse(val);
  }
  static saveTrips(data: Trip[]) {
    localStorage.setItem("to_trips", JSON.stringify(data));
  }

  static getMaintenance(): MaintenanceRecord[] {
    const val = localStorage.getItem("to_maintenance");
    if (!val) {
      this.saveMaintenance(initialMaintenance);
      return initialMaintenance;
    }
    return JSON.parse(val);
  }
  static saveMaintenance(data: MaintenanceRecord[]) {
    localStorage.setItem("to_maintenance", JSON.stringify(data));
  }

  static getFuelEntries(): FuelEntry[] {
    const val = localStorage.getItem("to_fuel");
    if (!val) {
      this.saveFuelEntries(initialFuelEntries);
      return initialFuelEntries;
    }
    return JSON.parse(val);
  }
  static saveFuelEntries(data: FuelEntry[]) {
    localStorage.setItem("to_fuel", JSON.stringify(data));
  }

  static getExpenses(): ExpenseRecord[] {
    const val = localStorage.getItem("to_expenses");
    if (!val) {
      this.saveExpenses(initialExpenses);
      return initialExpenses;
    }
    return JSON.parse(val);
  }
  static saveExpenses(data: ExpenseRecord[]) {
    localStorage.setItem("to_expenses", JSON.stringify(data));
  }

  static getUsers(): AppUser[] {
    const val = localStorage.getItem("to_users_v4");
    if (!val) {
      this.saveUsers(initialUsers);
      return initialUsers;
    }
    return JSON.parse(val);
  }
  static saveUsers(data: AppUser[]) {
    localStorage.setItem("to_users_v4", JSON.stringify(data));
  }

  static getRoles(): Role[] {
    const val = localStorage.getItem("to_roles_v4");
    if (!val) {
      this.saveRoles(initialRoles);
      return initialRoles;
    }
    return JSON.parse(val);
  }
  static saveRoles(data: Role[]) {
    localStorage.setItem("to_roles_v4", JSON.stringify(data));
  }

  static getOrgSettings(): OrganizationSettings {
    const val = localStorage.getItem("to_settings");
    if (!val) {
      this.saveOrgSettings(initialOrgSettings);
      return initialOrgSettings;
    }
    return JSON.parse(val);
  }
  static saveOrgSettings(data: OrganizationSettings) {
    localStorage.setItem("to_settings", JSON.stringify(data));
  }

  // Reset database helper
  static resetDB() {
    this.saveVehicles(initialVehicles);
    this.saveDrivers(initialDrivers);
    this.saveTrips(initialTrips);
    this.saveMaintenance(initialMaintenance);
    this.saveFuelEntries(initialFuelEntries);
    this.saveExpenses(initialExpenses);
    this.saveUsers(initialUsers);
    this.saveRoles(initialRoles);
    this.saveOrgSettings(initialOrgSettings);
  }
}
