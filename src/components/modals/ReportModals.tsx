import React, { useState } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { Driver, Vehicle } from '../../data/database';
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

        // Generate and trigger download
        const fileName = `${reportName.replace(/\s+/g, '_')}_export.${format.toLowerCase()}`;
        let fileContent = '';
        let mimeType = 'text/plain';

        if (format === 'CSV') {
          mimeType = 'text/csv';
          fileContent = `Report Name,${reportName}\nGenerated At,${new Date().toLocaleString()}\nModule,TransitOps Fleet Management\n\n`;
          fileContent += `Metric,Value\nTotal Fleet Vehicles,5\nActive Drivers,3\nCompleted Trips,4\nScheduled Maintenance,2\n`;
        } else if (format === 'EXCEL') {
          mimeType = 'text/csv';
          fileContent = `Report: ${reportName}\tGenerated At: ${new Date().toLocaleString()}\n`;
          fileContent += `Metric\tValue\nTotal Fleet Vehicles\t5\nActive Drivers\t3\nCompleted Trips\t4\nScheduled Maintenance\t2\n`;
        } else { // PDF
          mimeType = 'text/plain';
          fileContent = `==================================================\n`;
          fileContent += `TRANSITOPS GLOBAL LOGISTICS - ANALYTICS REPORT\n`;
          fileContent += `==================================================\n`;
          fileContent += `Report Name: ${reportName}\n`;
          fileContent += `Generated At: ${new Date().toLocaleString()}\n\n`;
          fileContent += `SUMMARY METRICS:\n`;
          fileContent += `- Total Fleet Vehicles: 5\n`;
          fileContent += `- Active Drivers: 3\n`;
          fileContent += `- Completed Trips: 4\n`;
          fileContent += `- Scheduled Maintenance: 2\n\n`;
          fileContent += `This is a high-fidelity generated preview of the TransitOps analytics report.`;
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
          `Downloaded "${fileName}" to your device.`
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
