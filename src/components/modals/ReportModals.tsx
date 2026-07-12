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

        const fileName = `${reportName.replace(/\s+/g, '_')}_export.${format.toLowerCase()}`;
        let fileContent = '';
        let mimeType = 'text/plain';

        if (format === 'CSV') {
          mimeType = 'text/csv';
          fileContent = `"TRANSITOPS SYSTEM REPORT: COMPLETE FLEET & OPERATIONS AUDIT"\n`;
          fileContent += `"Company Name","${settings.companyName}"\n`;
          fileContent += `"Tax ID","${settings.taxId}"\n`;
          fileContent += `"Generated At","${new Date().toLocaleString()}"\n\n`;

          fileContent += `"1. VEHICLES REGISTRY"\n`;
          fileContent += `"ID","Vehicle Number","Plate Number","Type","Brand","Model","Year","Capacity (KG)","Fuel Type","Status","Notes"\n`;
          fileContent += vehicles.map(v => `"${v.id}","${v.vehicleNumber}","${v.registrationNumber}","${v.vehicleType}","${v.brand}","${v.model}",${v.manufacturingYear},${v.capacity},"${v.fuelType}","${v.currentStatus}","${(v.notes || '').replace(/"/g, '""')}"`).join('\n') + `\n\n`;

          fileContent += `"2. ACTIVE DRIVERS REGISTRY"\n`;
          fileContent += `"ID","Full Name","Employee ID","Mobile","Email","License Number","License Class","Expiry Date","Experience (Yrs)","Status"\n`;
          fileContent += drivers.map(d => `"${d.id}","${d.fullName}","${d.employeeId}","${d.mobile}","${d.email}","${d.licenseNumber}","${d.licenseCategory}","${d.licenseExpiry}",${d.experience},"${d.driverStatus}"`).join('\n') + `\n\n`;

          fileContent += `"3. DISPATCH TRIPS LOG"\n`;
          fileContent += `"ID","Trip ID","Origin","Destination","Driver","Vehicle","Cargo","Weight (KG)","Departure","Arrival","Distance (KM)","Fuel (L)","Priority","Status"\n`;
          fileContent += trips.map(t => `"${t.id}","${t.tripId}","${t.pickupLocation}","${t.destination}","${t.driverName || 'N/A'}","${t.vehicleNumber || 'N/A'}","${t.cargoType}",${t.cargoWeight},"${t.departureDate}","${t.expectedArrival}",${t.estimatedDistance},${t.estimatedFuel},"${t.priority}","${t.status}"`).join('\n') + `\n\n`;

          fileContent += `"4. MAINTENANCE LOG"\n`;
          fileContent += `"ID","Vehicle","Service Type","Workshop","Date","Est. Completion","Cost (USD)","Technician","Status","Notes"\n`;
          fileContent += maintenance.map(m => `"${m.id}","${m.vehicleNumber}","${m.serviceType}","${m.workshop}","${m.serviceDate}","${m.estimatedCompletion}",${m.cost},"${m.technician}","${m.status}","${(m.notes || '').replace(/"/g, '""')}"`).join('\n') + `\n\n`;

          fileContent += `"5. REFUELING RECEIPTS"\n`;
          fileContent += `"ID","Vehicle","Driver","Date","Quantity (L)","Cost (USD)","Station","Odometer"\n`;
          fileContent += fuel.map(f => `"${f.id}","${f.vehicleNumber}","${f.driverName}","${f.date}",${f.fuelQuantity},${f.fuelCost},"${f.fuelStation}",${f.odometerReading}`).join('\n') + `\n\n`;

          fileContent += `"6. OTHER EXPENSES"\n`;
          fileContent += `"ID","Expense Type","Vehicle","Amount (USD)","Vendor","Date","Description"\n`;
          fileContent += expenses.map(e => `"${e.id}","${e.expenseType}","${e.vehicleNumber}",${e.amount},"${e.vendor}","${e.date}","${(e.description || '').replace(/"/g, '""')}"`).join('\n');
        } else if (format === 'EXCEL') {
          mimeType = 'text/tab-separated-values';
          fileContent = `TRANSITOPS SYSTEM REPORT: COMPLETE FLEET & OPERATIONS AUDIT\n`;
          fileContent += `Company Name\t${settings.companyName}\n`;
          fileContent += `Tax ID\t${settings.taxId}\n`;
          fileContent += `Generated At\t${new Date().toLocaleString()}\n\n`;

          fileContent += `1. VEHICLES REGISTRY\n`;
          fileContent += `ID\tVehicle Number\tPlate Number\tType\tBrand\tModel\tYear\tCapacity (KG)\tFuel Type\tStatus\tNotes\n`;
          fileContent += vehicles.map(v => `${v.id}\t${v.vehicleNumber}\t${v.registrationNumber}\t${v.vehicleType}\t${v.brand}\t${v.model}\t${v.manufacturingYear}\t${v.capacity}\t${v.fuelType}\t${v.currentStatus}\t${v.notes || ''}`).join('\n') + `\n\n`;

          fileContent += `2. ACTIVE DRIVERS REGISTRY\n`;
          fileContent += `ID\tFull Name\tEmployee ID\tMobile\tEmail\tLicense Number\tLicense Class\tExpiry Date\tExperience (Yrs)\tStatus\n`;
          fileContent += drivers.map(d => `${d.id}\t${d.fullName}\t${d.employeeId}\t${d.mobile}\t${d.email}\t${d.licenseNumber}\t${d.licenseCategory}\t${d.licenseExpiry}\t${d.experience}\t${d.driverStatus}`).join('\n') + `\n\n`;

          fileContent += `3. DISPATCH TRIPS LOG\n`;
          fileContent += `ID\tTrip ID\tOrigin\tDestination\tDriver\tVehicle\tCargo\tWeight (KG)\tDeparture\tArrival\tDistance (KM)\tFuel (L)\tPriority\tStatus\n`;
          fileContent += trips.map(t => `${t.id}\t${t.tripId}\t${t.pickupLocation}\t${t.destination}\t${t.driverName || 'N/A'}\t${t.vehicleNumber || 'N/A'}\t${t.cargoType}\t${t.cargoWeight}\t${t.departureDate}\t${t.expectedArrival}\t${t.estimatedDistance}\t${t.estimatedFuel}\t${t.priority}\t${t.status}`).join('\n') + `\n\n`;

          fileContent += `4. MAINTENANCE LOG\n`;
          fileContent += `ID\tVehicle\tService Type\tWorkshop\tDate\tEst. Completion\tCost (USD)\tTechnician\tStatus\tNotes\n`;
          fileContent += maintenance.map(m => `${m.id}\t${m.vehicleNumber}\t${m.serviceType}\t${m.workshop}\t${m.serviceDate}\t${m.estimatedCompletion}\t${m.cost}\t${m.technician}\t${m.status}\t${m.notes || ''}`).join('\n') + `\n\n`;

          fileContent += `5. REFUELING RECEIPTS\n`;
          fileContent += `ID\tVehicle\tDriver\tDate\tQuantity (L)\tCost (USD)\tStation\tOdometer\n`;
          fileContent += fuel.map(f => `${f.id}\t${f.vehicleNumber}\t${f.driverName}\t${f.date}\t${f.fuelQuantity}\t${f.fuelCost}\t${f.fuelStation}\t${f.odometerReading}`).join('\n') + `\n\n`;

          fileContent += `6. OTHER EXPENSES\n`;
          fileContent += `ID\tExpense Type\tVehicle\tAmount (USD)\tVendor\tDate\tDescription\n`;
          fileContent += expenses.map(e => `${e.id}\t${e.expenseType}\t${e.vehicleNumber}\t${e.amount}\t${e.vendor}\t${e.date}\t${e.description || ''}`).join('\n');
        } else { // PDF (Plain-text high-fidelity structure representation)
          mimeType = 'text/plain';
          fileContent = `========================================================================================================================\n`;
          fileContent += `                                     TRANSITOPS GLOBAL LOGISTICS SYSTEMS AUDIT REPORT\n`;
          fileContent += `========================================================================================================================\n`;
          fileContent += `Company Name : ${settings.companyName}\n`;
          fileContent += `Tax ID       : ${settings.taxId}\n`;
          fileContent += `Support      : ${settings.supportEmail} | ${settings.supportPhone}\n`;
          fileContent += `Address      : ${settings.address}\n`;
          fileContent += `Generated At : ${new Date().toLocaleString()}\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n\n`;

          fileContent += `1. VEHICLE REGISTRY SUMMARY\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += `ID        | Number   | Plate        | Brand & Model                | Type                     | Status\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += vehicles.map(v => `${v.id.padEnd(9)} | ${v.vehicleNumber.padEnd(8)} | ${v.registrationNumber.padEnd(12)} | ${(v.brand + ' ' + v.model).padEnd(28)} | ${v.vehicleType.padEnd(24)} | ${v.currentStatus}`).join('\n') + `\n\n`;

          fileContent += `2. ACTIVE DRIVERS REGISTRY\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += `ID        | Full Name                | Employee ID | Mobile          | License Number | CDL Class    | Status\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += drivers.map(d => `${d.id.padEnd(9)} | ${d.fullName.padEnd(24)} | ${d.employeeId.padEnd(11)} | ${d.mobile.padEnd(15)} | ${d.licenseNumber.padEnd(14)} | ${d.licenseCategory.padEnd(12)} | ${d.driverStatus}`).join('\n') + `\n\n`;

          fileContent += `3. DISPATCH TRIPS LOG\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += `Trip ID         | Origin                         | Destination                    | Cargo      | Weight  | Status\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += trips.map(t => `${t.tripId.padEnd(15)} | ${t.pickupLocation.substring(0, 30).padEnd(30)} | ${t.destination.substring(0, 30).padEnd(30)} | ${t.cargoType.padEnd(10)} | ${(t.cargoWeight + ' kg').padEnd(7)} | ${t.status}`).join('\n') + `\n\n`;

          fileContent += `4. MAINTENANCE LOG\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += `Vehicle  | Service Type                             | Workshop                     | Date       | Cost     | Status\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += maintenance.map(m => `${m.vehicleNumber.padEnd(8)} | ${m.serviceType.substring(0, 40).padEnd(40)} | ${m.workshop.padEnd(28)} | ${m.serviceDate} | ${('$' + m.cost).padEnd(8)} | ${m.status}`).join('\n') + `\n\n`;

          fileContent += `5. REFUELING RECEIPTS\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += `Vehicle  | Driver                   | Date       | Quantity (L) | Cost (USD) | Station\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += fuel.map(f => `${f.vehicleNumber.padEnd(8)} | ${f.driverName.padEnd(24)} | ${f.date} | ${(f.fuelQuantity + ' L').padEnd(12)} | ${('$' + f.fuelCost).padEnd(10)} | ${f.fuelStation}`).join('\n') + `\n\n`;

          fileContent += `6. ADMINISTRATIVE & OPERATIONAL EXPENSES\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += `Vehicle  | Expense Type | Vendor                         | Amount     | Date       | Description\n`;
          fileContent += `------------------------------------------------------------------------------------------------------------------------\n`;
          fileContent += expenses.map(e => `${e.vehicleNumber.padEnd(8)} | ${e.expenseType.padEnd(12)} | ${e.vendor.padEnd(30)} | ${('$' + e.amount).padEnd(10)} | ${e.date} | ${e.description}`).join('\n') + `\n\n`;

          fileContent += `========================================================================================================================\n`;
          fileContent += `                                            END OF REPORT - TRANSITOPS LLC\n`;
          fileContent += `========================================================================================================================`;
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

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
