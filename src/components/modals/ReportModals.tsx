import React, { useState } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { Driver, Vehicle, TransitOpsDB } from '../../data/database';
import { useToast } from '../Toast';
import { Filter, Download, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react';

// 1. Report Filters Modal
interface ReportFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  vehicles: Vehicle[];
  onApply: (filters: {
    startDate: string;
    endDate: string;
    driverId: string;
    vehicleId: string;
    status: string;
    expenseType: string;
  }) => void;
}

export const ReportFiltersModal: React.FC<ReportFiltersProps> = ({
  isOpen,
  onClose,
  drivers,
  vehicles,
  onApply,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [status, setStatus] = useState('');
  const [expenseType, setExpenseType] = useState('');

  const handleApply = () => {
    onApply({ startDate, endDate, driverId, vehicleId, status, expenseType });
    onClose();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setDriverId('');
    setVehicleId('');
    setStatus('');
    setExpenseType('');
    onApply({ startDate: '', endDate: '', driverId: '', vehicleId: '', status: '', expenseType: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Reporting Filters" size="md" themeType="settings">
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle */}
          <div className="space-y-1">
            <label className="form-label">Filter by Vehicle</label>
            <select
              className="form-input"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.brand} {v.model})</option>
              ))}
            </select>
          </div>

          {/* Driver */}
          <div className="space-y-1">
            <label className="form-label">Filter by Driver</label>
            <select
              className="form-input"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.fullName} ({d.employeeId})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status */}
          <div className="space-y-1">
            <label className="form-label">Trip Dispatch Status</label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>Dispatched</option>
              <option>On Route</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>

          {/* Expense Type */}
          <div className="space-y-1">
            <label className="form-label">Expense Category</label>
            <select
              className="form-input"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
            >
              <option value="">All Categories</option>
              <option>Tolls</option>
              <option>Permits</option>
              <option>Washing / Detailing</option>
              <option>Lodging / Food</option>
              <option>Repairs / Spares</option>
              <option>Parking Fees</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={handleClear}
            className="px-4 py-2 font-semibold text-slate-400 hover:text-slate-200"
          >
            Clear Filters
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition flex items-center gap-1.5"
          >
            <Filter size={14} /> Apply Filters
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// 2. Export Modal
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, reportName }) => {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF');
  const [progress, setProgress] = useState(0);

  const handleExportStart = () => {
    setExporting(true);
    let curr = 0;
    const interval = setInterval(() => {
      curr += 25;
      setProgress(curr);
      if (curr >= 100) {
        clearInterval(interval);
        setExporting(false);

        // Fetch live database values
        const vehicles = TransitOpsDB.getVehicles();
        const drivers = TransitOpsDB.getDrivers();
        const trips = TransitOpsDB.getTrips();
        const maintenance = TransitOpsDB.getMaintenance();
        const fuel = TransitOpsDB.getFuelEntries();
        const expenses = TransitOpsDB.getExpenses();
        const settings = TransitOpsDB.getOrgSettings();

        const getCurrencySymbol = (c: string) => {
          const match = c.match(/\(([^)]+)\)/);
          return match ? match[1] : '$';
        };
        const symbol = getCurrencySymbol(settings?.currency || 'USD ($)');

        let fileContent = '';
        let mimeType = 'text/plain';
        let fileExtension = 'txt';

        if (format === 'CSV') {
          mimeType = 'text/csv;charset=utf-8;';
          fileExtension = 'csv';

          const esc = (val: any) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          };

          fileContent = `"TRANSITOPS SYSTEM REPORT: COMPLETE FLEET & OPERATIONS AUDIT"\n`;
          fileContent += `"Company Name",${esc(settings.companyName)}\n`;
          fileContent += `"Tax ID",${esc(settings.taxId)}\n`;
          fileContent += `"Generated At",${esc(new Date().toLocaleString())}\n\n`;

          fileContent += `"1. VEHICLES REGISTRY"\n`;
          fileContent += `"ID","Vehicle Number","Plate Number","Type","Brand","Model","Year","Capacity (KG)","Fuel Type","Status","Notes"\n`;
          fileContent += vehicles.map(v => `${esc(v.id)},${esc(v.vehicleNumber)},${esc(v.registrationNumber)},${esc(v.vehicleType)},${esc(v.brand)},${esc(v.model)},${esc(v.manufacturingYear)},${esc(v.capacity)},${esc(v.fuelType)},${esc(v.currentStatus)},${esc(v.notes)}`).join('\n') + `\n\n`;

          fileContent += `"2. ACTIVE DRIVERS REGISTRY"\n`;
          fileContent += `"ID","Full Name","Employee ID","Mobile","Email","License Number","License Class","Expiry Date","Experience (Yrs)","Status"\n`;
          fileContent += drivers.map(d => `${esc(d.id)},${esc(d.fullName)},${esc(d.employeeId)},${esc(d.mobile)},${esc(d.email)},${esc(d.licenseNumber)},${esc(d.licenseCategory)},${esc(d.licenseExpiry)},${esc(d.experience)},${esc(d.driverStatus)}`).join('\n') + `\n\n`;

          fileContent += `"3. DISPATCH TRIPS LOG"\n`;
          fileContent += `"ID","Trip ID","Origin","Destination","Driver","Vehicle","Cargo","Weight (KG)","Departure","Arrival","Distance (KM)","Fuel (L)","Priority","Status"\n`;
          fileContent += trips.map(t => `${esc(t.id)},${esc(t.tripId)},${esc(t.pickupLocation)},${esc(t.destination)},${esc(t.driverName)},${esc(t.vehicleNumber)},${esc(t.cargoType)},${esc(t.cargoWeight)},${esc(t.departureDate)},${esc(t.expectedArrival)},${esc(t.estimatedDistance)},${esc(t.estimatedFuel)},${esc(t.priority)},${esc(t.status)}`).join('\n') + `\n\n`;

          fileContent += `"4. MAINTENANCE LOG"\n`;
          fileContent += `"ID","Vehicle Number","Service Type","Workshop","Date","Est. Completion","Cost (${symbol})","Technician","Status","Notes"\n`;
          fileContent += maintenance.map(m => `${esc(m.id)},${esc(m.vehicleNumber)},${esc(m.serviceType)},${esc(m.workshop)},${esc(m.serviceDate)},${esc(m.estimatedCompletion)},${esc(m.cost)},${esc(m.technician)},${esc(m.status)},${esc(m.notes)}`).join('\n') + `\n\n`;

          fileContent += `"5. REFUELING RECEIPTS"\n`;
          fileContent += `"ID","Vehicle Number","Driver","Date","Quantity (L)","Cost (${symbol})","Station","Odometer"\n`;
          fileContent += fuel.map(f => `${esc(f.id)},${esc(f.vehicleNumber)},${esc(f.driverName)},${esc(f.date)},${esc(f.fuelQuantity)},${esc(f.fuelCost)},${esc(f.fuelStation)},${esc(f.odometerReading)}`).join('\n') + `\n\n`;

          fileContent += `"6. OTHER EXPENSES"\n`;
          fileContent += `"ID","Expense Type","Vehicle Number","Amount (${symbol})","Vendor","Date","Description"\n`;
          fileContent += expenses.map(e => `${esc(e.id)},${esc(e.expenseType)},${esc(e.vehicleNumber)},${esc(e.amount)},${esc(e.vendor)},${esc(e.date)},${esc(e.description)}`).join('\n');
        } else if (format === 'EXCEL') {
          mimeType = 'application/vnd.ms-excel';
          fileExtension = 'xlsx';

          const tableStyle = `
            <style>
              body { font-family: Arial, sans-serif; }
              h2 { color: #1e3a8a; margin-top: 20px; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
              th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
              td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            </style>
          `;

          fileContent = `
            <html xmlns:o="urn:schemas-microsoft-excel:office:office" xmlns:x="urn:schemas-microsoft-excel:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta charset="utf-8">
              ${tableStyle}
            </head>
            <body>
              <h1>TRANSITOPS SYSTEM REPORT: COMPLETE FLEET & OPERATIONS AUDIT</h1>
              <table>
                <tr><td>Company Name:</td><td>${settings.companyName}</td></tr>
                <tr><td>Tax ID:</td><td>${settings.taxId || 'N/A'}</td></tr>
                <tr><td>Generated At:</td><td>${new Date().toLocaleString()}</td></tr>
              </table>

              <h2>1. VEHICLES REGISTRY</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle Number</th>
                    <th>Plate Number</th>
                    <th>Type</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th>Capacity (KG)</th>
                    <th>Fuel Type</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${vehicles.map(v => `
                    <tr>
                      <td>${v.id}</td>
                      <td><b>${v.vehicleNumber}</b></td>
                      <td>${v.registrationNumber}</td>
                      <td>${v.vehicleType}</td>
                      <td>${v.brand}</td>
                      <td>${v.model}</td>
                      <td>${v.manufacturingYear}</td>
                      <td>${v.capacity}</td>
                      <td>${v.fuelType}</td>
                      <td>${v.currentStatus}</td>
                      <td>${v.notes || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <h2>2. ACTIVE DRIVERS REGISTRY</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Employee ID</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>License Number</th>
                    <th>Class</th>
                    <th>Expiry Date</th>
                    <th>Experience (Yrs)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${drivers.map(d => `
                    <tr>
                      <td>${d.id}</td>
                      <td><b>${d.fullName}</b></td>
                      <td>${d.employeeId}</td>
                      <td>${d.mobile}</td>
                      <td>${d.email}</td>
                      <td>${d.licenseNumber}</td>
                      <td>${d.licenseCategory}</td>
                      <td>${d.licenseExpiry}</td>
                      <td>${d.experience}</td>
                      <td>${d.driverStatus}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <h2>3. DISPATCH TRIPS LOG</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Trip ID</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Cargo</th>
                    <th>Weight (KG)</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Distance (KM)</th>
                    <th>Fuel (L)</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${trips.map(t => `
                    <tr>
                      <td>${t.id}</td>
                      <td><b>${t.tripId}</b></td>
                      <td>${t.pickupLocation}</td>
                      <td>${t.destination}</td>
                      <td>${t.driverName || 'N/A'}</td>
                      <td>${t.vehicleNumber || 'N/A'}</td>
                      <td>${t.cargoType}</td>
                      <td>${t.cargoWeight}</td>
                      <td>${t.departureDate}</td>
                      <td>${t.expectedArrival}</td>
                      <td>${t.estimatedDistance}</td>
                      <td>${t.estimatedFuel}</td>
                      <td>${t.priority}</td>
                      <td>${t.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <h2>4. MAINTENANCE LOG</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle Number</th>
                    <th>Service Type</th>
                    <th>Workshop</th>
                    <th>Date</th>
                    <th>Est. Completion</th>
                    <th>Cost (${symbol})</th>
                    <th>Technician</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${maintenance.map(m => `
                    <tr>
                      <td>${m.id}</td>
                      <td><b>${m.vehicleNumber}</b></td>
                      <td>${m.serviceType}</td>
                      <td>${m.workshop}</td>
                      <td>${m.serviceDate}</td>
                      <td>${m.estimatedCompletion}</td>
                      <td>${m.cost}</td>
                      <td>${m.technician}</td>
                      <td>${m.status}</td>
                      <td>${m.notes || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <h2>5. REFUELING RECEIPTS</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle Number</th>
                    <th>Driver</th>
                    <th>Date</th>
                    <th>Quantity (L)</th>
                    <th>Cost (${symbol})</th>
                    <th>Station</th>
                    <th>Odometer</th>
                  </tr>
                </thead>
                <tbody>
                  ${fuel.map(f => `
                    <tr>
                      <td>${f.id}</td>
                      <td><b>${f.vehicleNumber}</b></td>
                      <td>${f.driverName}</td>
                      <td>${f.date}</td>
                      <td>${f.fuelQuantity}</td>
                      <td>${f.fuelCost}</td>
                      <td>${f.fuelStation}</td>
                      <td>${f.odometerReading}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <h2>6. OTHER EXPENSES</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Expense Type</th>
                    <th>Vehicle Number</th>
                    <th>Amount (${symbol})</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${expenses.map(e => `
                    <tr>
                      <td>${e.id}</td>
                      <td><b>${e.expenseType}</b></td>
                      <td>${e.vehicleNumber}</td>
                      <td>${e.amount}</td>
                      <td>${e.vendor}</td>
                      <td>${e.date}</td>
                      <td>${e.description || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
            </html>
          `;
        } else { // PDF Printable Document Window
          mimeType = 'text/html';
          fileExtension = 'html';

          fileContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TransitOps Operations & Fleet Audit Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 30px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .company-details {
      margin-top: 10px;
      font-size: 12px;
      color: #64748b;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a8a;
      margin-top: 30px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      padding: 8px;
      text-align: left;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      text-align: left;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 40px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="header-title">TransitOps Operations & Fleet Audit Report</h1>
    <div class="company-details">
      <strong>Company:</strong> ${settings.companyName} &nbsp;|&nbsp; 
      <strong>Tax ID:</strong> ${settings.taxId || 'N/A'} &nbsp;|&nbsp; 
      <strong>Email:</strong> ${settings.supportEmail} &nbsp;|&nbsp; 
      <strong>Phone:</strong> ${settings.supportPhone}<br>
      <strong>Generated At:</strong> ${new Date().toLocaleString()}
    </div>
  </div>

  <div class="section-title">1. VEHICLES REGISTRY</div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Vehicle Number</th>
        <th>Plate Number</th>
        <th>Type</th>
        <th>Brand</th>
        <th>Model</th>
        <th>Year</th>
        <th>Capacity (KG)</th>
        <th>Fuel Type</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${vehicles.map(v => `
        <tr>
          <td>${v.id}</td>
          <td><strong>${v.vehicleNumber}</strong></td>
          <td>${v.registrationNumber}</td>
          <td>${v.vehicleType}</td>
          <td>${v.brand}</td>
          <td>${v.model}</td>
          <td>${v.manufacturingYear}</td>
          <td>${v.capacity.toLocaleString()}</td>
          <td>${v.fuelType}</td>
          <td>${v.currentStatus}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">2. ACTIVE DRIVERS REGISTRY</div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Full Name</th>
        <th>Employee ID</th>
        <th>Mobile</th>
        <th>Email</th>
        <th>License Number</th>
        <th>Class</th>
        <th>Expiry Date</th>
        <th>Experience (Yrs)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${drivers.map(d => `
        <tr>
          <td>${d.id}</td>
          <td><strong>${d.fullName}</strong></td>
          <td>${d.employeeId}</td>
          <td>${d.mobile}</td>
          <td>${d.email}</td>
          <td>${d.licenseNumber}</td>
          <td>${d.licenseCategory}</td>
          <td>${d.licenseExpiry}</td>
          <td>${d.experience}</td>
          <td>${d.driverStatus}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">3. DISPATCH TRIPS LOG</div>
  <table>
    <thead>
      <tr>
        <th>Trip ID</th>
        <th>Origin</th>
        <th>Destination</th>
        <th>Driver</th>
        <th>Vehicle</th>
        <th>Cargo</th>
        <th>Weight (KG)</th>
        <th>Departure</th>
        <th>Arrival</th>
        <th>Distance (KM)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${trips.map(t => `
        <tr>
          <td><strong>${t.tripId}</strong></td>
          <td>${t.pickupLocation}</td>
          <td>${t.destination}</td>
          <td>${t.driverName || 'N/A'}</td>
          <td>${t.vehicleNumber || 'N/A'}</td>
          <td>${t.cargoType}</td>
          <td>${t.cargoWeight.toLocaleString()}</td>
          <td>${t.departureDate}</td>
          <td>${t.expectedArrival}</td>
          <td>${t.estimatedDistance.toLocaleString()}</td>
          <td>${t.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">4. MAINTENANCE LOG</div>
  <table>
    <thead>
      <tr>
        <th>Vehicle</th>
        <th>Service Type</th>
        <th>Workshop</th>
        <th>Date</th>
        <th>Est. Completion</th>
        <th>Cost</th>
        <th>Technician</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${maintenance.map(m => `
        <tr>
          <td><strong>Truck ${m.vehicleNumber}</strong></td>
          <td>${m.serviceType}</td>
          <td>${m.workshop}</td>
          <td>${m.serviceDate}</td>
          <td>${m.estimatedCompletion}</td>
          <td>${symbol}${m.cost.toLocaleString()}</td>
          <td>${m.technician}</td>
          <td>${m.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">5. REFUELING RECEIPTS</div>
  <table>
    <thead>
      <tr>
        <th>Vehicle</th>
        <th>Driver</th>
        <th>Date</th>
        <th>Quantity (L)</th>
        <th>Cost</th>
        <th>Station</th>
        <th>Odometer</th>
      </tr>
    </thead>
    <tbody>
      ${fuel.map(f => `
        <tr>
          <td><strong>Truck ${f.vehicleNumber}</strong></td>
          <td>${f.driverName}</td>
          <td>${f.date}</td>
          <td>${f.fuelQuantity.toLocaleString()} L</td>
          <td>${symbol}${f.fuelCost.toLocaleString()}</td>
          <td>${f.fuelStation}</td>
          <td>${f.odometerReading.toLocaleString()} KM</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">6. OTHER EXPENSES</div>
  <table>
    <thead>
      <tr>
        <th>Vehicle</th>
        <th>Expense Type</th>
        <th>Vendor</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(e => `
        <tr>
          <td><strong>Truck ${e.vehicleNumber}</strong></td>
          <td>${e.expenseType}</td>
          <td>${e.vendor}</td>
          <td>${symbol}${e.amount.toLocaleString()}</td>
          <td>${e.date}</td>
          <td>${e.description || 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    TransitOps Intelligent Fleet Operations Management System - Confidential Audit Report
  </div>
</body>
</html>
          `;
        }

        const fileName = `${reportName.replace(/\s+/g, '_')}_export.${fileExtension}`;

        if (format === 'PDF') {
          // Open new window for print layout
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(fileContent);
            printWindow.document.close();
            // Automatically open print dialog
            setTimeout(() => {
              try {
                printWindow.print();
              } catch (e) {
                console.error(e);
              }
            }, 500);
          } else {
            toast.error('Pop-up Blocked', 'Please allow pop-ups to open the print layout.');
          }

          // Also download as HTML backup
          const blob = new Blob([fileContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${reportName.replace(/\s+/g, '_')}_export.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // Download XLSX or CSV
          const blob = new Blob([fileContent], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        toast.success(
          'Document Export Successful',
          `Downloaded "${fileName}" containing active database records.`
        );
        setProgress(0);
        onClose();
      }
    }, 400);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compile & Export Document" size="sm" themeType="settings">
      <div className="space-y-5 text-xs">
        {!exporting ? (
          <>
            <p className="text-slate-400">Choose your desired output layout format. High-resolution files are generated directly on the client.</p>
            <div className="grid grid-cols-3 gap-3">
              {/* PDF */}
              <button
                onClick={() => setFormat('PDF')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition ${
                  format === 'PDF' ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <FileText size={24} />
                <span className="font-bold">PDF Format</span>
              </button>

              {/* Excel */}
              <button
                onClick={() => setFormat('EXCEL')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition ${
                  format === 'EXCEL' ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <FileSpreadsheet size={24} />
                <span className="font-bold">Excel Sheet</span>
              </button>

              {/* CSV */}
              <button
                onClick={() => setFormat('CSV')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition ${
                  format === 'CSV' ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <FileSpreadsheet size={24} />
                <span className="font-bold">CSV Comma</span>
              </button>
            </div>

            <ModalFooter>
              <button
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleExportStart}
                className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition flex items-center gap-1.5"
              >
                <Download size={14} /> Start Download
              </button>
            </ModalFooter>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <Loader2 size={36} className="animate-spin text-brand-500" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200">Formatting Report Layout...</h4>
              <p className="text-slate-500 text-[10px]">Processing data structures into {format} file format</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
