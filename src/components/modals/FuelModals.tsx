import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { FuelEntry, ExpenseRecord, Vehicle, Driver } from '../../data/database';
import { useToast } from '../Toast';
import { Fuel, DollarSign, Calendar, Landmark, Paperclip, Eye } from 'lucide-react';
import { FileUploadDialog, ImagePreviewDialog } from './GlobalDialogs';

// 1. Add / Edit Fuel Entry Modal
interface AddEditFuelProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: FuelEntry; // If present, editing
  vehicles: Vehicle[];
  drivers: Driver[];
  onSave: (entry: FuelEntry) => void;
}

export const AddEditFuelModal: React.FC<AddEditFuelProps> = ({
  isOpen,
  onClose,
  entry,
  vehicles,
  drivers,
  onSave,
}) => {
  const toast = useToast();

  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [date, setDate] = useState('');
  const [fuelQuantity, setFuelQuantity] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [odometerReading, setOdometerReading] = useState<number>(0);
  const [fuelStation, setFuelStation] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setVehicleId(entry.vehicleId);
      setDriverId(entry.driverId);
      setDate(entry.date);
      setFuelQuantity(entry.fuelQuantity);
      setFuelCost(entry.fuelCost);
      setOdometerReading(entry.odometerReading);
      setFuelStation(entry.fuelStation);
    } else {
      setVehicleId('');
      setDriverId('');
      setDate(new Date().toISOString().split('T')[0]);
      setFuelQuantity(150);
      setFuelCost(525);
      setOdometerReading(120000);
      setFuelStation('');
    }
    setErrors({});
  }, [entry, isOpen]);

  const checkDirty = () => {
    if (!entry) {
      return !!(vehicleId || driverId || fuelStation);
    }
    return (
      vehicleId !== entry.vehicleId ||
      driverId !== entry.driverId ||
      date !== entry.date ||
      fuelQuantity !== entry.fuelQuantity ||
      fuelCost !== entry.fuelCost ||
      odometerReading !== entry.odometerReading ||
      fuelStation !== entry.fuelStation
    );
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!vehicleId) errs.vehicleId = 'Vehicle Selection is required';
    if (!driverId) errs.driverId = 'Driver Selection is required';
    if (!date) errs.date = 'Filling date is required';
    if (fuelQuantity <= 0) errs.fuelQuantity = 'Fuel quantity must be greater than 0';
    if (fuelCost <= 0) errs.fuelCost = 'Fuel cost must be greater than 0';
    if (odometerReading <= 0) errs.odometerReading = 'Odometer reading must be greater than 0';
    if (!fuelStation.trim()) errs.fuelStation = 'Fuel station name is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Validation Warning', 'Verify fuel entry data.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const selectedVehicle = vehicles.find(v => v.id === vehicleId);
      const selectedDriver = drivers.find(d => d.id === driverId);

      const newEntry: FuelEntry = {
        id: entry?.id || `f-${Math.random().toString(36).substring(2, 9)}`,
        vehicleId,
        vehicleNumber: selectedVehicle ? selectedVehicle.vehicleNumber : 'Unknown',
        driverId,
        driverName: selectedDriver ? selectedDriver.fullName : 'Unknown',
        date,
        fuelQuantity,
        fuelCost,
        odometerReading,
        fuelStation,
      };

      onSave(newEntry);
      toast.success(
        entry ? 'Fuel Entry Updated' : 'Fuel Entry Added',
        `Logged ${fuelQuantity}L ($${fuelCost}) refuel for Truck ${newEntry.vehicleNumber}.`
      );
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const isValid = vehicleId && driverId && fuelQuantity > 0 && fuelCost > 0 && odometerReading > 0 && fuelStation;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Edit Refueling Log' : 'Add Refueling Log'}
      size="md"
      isDirty={checkDirty()}
      themeType="fuel"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle */}
          <div className="space-y-1">
            <label className="form-label">Vehicle *</label>
            <select
              className={`form-input ${errors.vehicleId ? 'border-rose-500' : ''}`}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Select Truck...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.brand} {v.model})</option>
              ))}
            </select>
            {errors.vehicleId && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.vehicleId}</p>}
          </div>

          {/* Driver */}
          <div className="space-y-1">
            <label className="form-label">Driver *</label>
            <select
              className={`form-input ${errors.driverId ? 'border-rose-500' : ''}`}
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Select Operator...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.fullName} ({d.employeeId})</option>
              ))}
            </select>
            {errors.driverId && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.driverId}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date */}
          <div className="space-y-1">
            <label className="form-label">Refueling Date *</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="form-label">Fuel Volume (Liters) *</label>
            <input
              type="number"
              className={`form-input ${errors.fuelQuantity ? 'border-rose-500' : ''}`}
              value={fuelQuantity}
              onChange={(e) => setFuelQuantity(parseFloat(e.target.value) || 0)}
            />
            {errors.fuelQuantity && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.fuelQuantity}</p>}
          </div>

          {/* Fuel Cost */}
          <div className="space-y-1">
            <label className="form-label">Fuel Cost (USD) *</label>
            <input
              type="number"
              className={`form-input ${errors.fuelCost ? 'border-rose-500' : ''}`}
              value={fuelCost}
              onChange={(e) => setFuelCost(parseFloat(e.target.value) || 0)}
            />
            {errors.fuelCost && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.fuelCost}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Odometer */}
          <div className="space-y-1">
            <label className="form-label">Odometer Reading (KM) *</label>
            <input
              type="number"
              className={`form-input ${errors.odometerReading ? 'border-rose-500' : ''}`}
              value={odometerReading}
              onChange={(e) => setOdometerReading(parseInt(e.target.value) || 0)}
            />
            {errors.odometerReading && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.odometerReading}</p>}
          </div>

          {/* Fuel Station */}
          <div className="space-y-1">
            <label className="form-label">Fuel Station / Vendor *</label>
            <input
              type="text"
              className={`form-input ${errors.fuelStation ? 'border-rose-500' : ''}`}
              placeholder="e.g. Love's Stop #23"
              value={fuelStation}
              onChange={(e) => setFuelStation(e.target.value)}
            />
            {errors.fuelStation && <p className="text-[10px] text-rose-500 font-semibold">{errors.fuelStation}</p>}
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-5 py-2 font-medium bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition flex items-center gap-1.5"
          >
            {isSubmitting ? 'Saving...' : entry ? 'Save Changes' : 'Log Refueling'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 2. Add / Edit Expense Modal
interface AddEditExpenseProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: ExpenseRecord; // If present, editing
  vehicles: Vehicle[];
  onSave: (expense: ExpenseRecord) => void;
}

export const AddEditExpenseModal: React.FC<AddEditExpenseProps> = ({
  isOpen,
  onClose,
  expense,
  vehicles,
  onSave,
}) => {
  const toast = useToast();

  const [expenseType, setExpenseType] = useState('Tolls');
  const [vehicleId, setVehicleId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setExpenseType(expense.expenseType);
      setVehicleId(expense.vehicleId);
      setAmount(expense.amount);
      setVendor(expense.vendor);
      setDescription(expense.description);
      setDate(expense.date);
      setReceiptUrl(expense.receiptUrl || '');
    } else {
      setExpenseType('Tolls');
      setVehicleId('');
      setAmount(45);
      setVendor('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptUrl('');
    }
    setErrors({});
  }, [expense, isOpen]);

  const checkDirty = () => {
    if (!expense) {
      return !!(vehicleId || vendor || description || receiptUrl);
    }
    return (
      expenseType !== expense.expenseType ||
      vehicleId !== expense.vehicleId ||
      amount !== expense.amount ||
      vendor !== expense.vendor ||
      description !== expense.description ||
      date !== expense.date ||
      receiptUrl !== (expense.receiptUrl || '')
    );
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!vehicleId) errs.vehicleId = 'Vehicle is required';
    if (amount <= 0) errs.amount = 'Amount must be greater than 0';
    if (!vendor.trim()) errs.vendor = 'Vendor is required';
    if (!date) errs.date = 'Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Validation Warning', 'Verify expense details.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const selectedVehicle = vehicles.find(v => v.id === vehicleId);

      const newExpense: ExpenseRecord = {
        id: expense?.id || `e-${Math.random().toString(36).substring(2, 9)}`,
        expenseType,
        vehicleId,
        vehicleNumber: selectedVehicle ? selectedVehicle.vehicleNumber : 'Unknown',
        amount,
        vendor,
        description,
        date,
        receiptUrl: receiptUrl || undefined,
      };

      onSave(newExpense);
      toast.success(
        expense ? 'Expense Updated' : 'Expense Logged',
        `Logged $${amount} toll/permit expense for Truck ${newExpense.vehicleNumber}.`
      );
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const isValid = vehicleId && amount > 0 && vendor && date;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={expense ? 'Edit Fleet Expense Record' : 'Record Fleet Expense'}
        size="md"
        isDirty={checkDirty()}
        themeType="fuel"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Expense Type */}
            <div className="space-y-1">
              <label className="form-label">Expense Category</label>
              <select
                className="form-input"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
              >
                <option>Tolls</option>
                <option>Permits</option>
                <option>Washing / Detailing</option>
                <option>Lodging / Food</option>
                <option>Repairs / Spares</option>
                <option>Parking Fees</option>
                <option>Other</option>
              </select>
            </div>

            {/* Vehicle */}
            <div className="space-y-1">
              <label className="form-label">Vehicle *</label>
              <select
                className={`form-input ${errors.vehicleId ? 'border-rose-500' : ''}`}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">Select Truck...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.brand} {v.model})</option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.vehicleId}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="form-label">Amount (USD) *</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  className={`form-input pl-8 ${errors.amount ? 'border-rose-500' : ''}`}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              {errors.amount && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor */}
            <div className="space-y-1">
              <label className="form-label">Vendor / Merchant Name *</label>
              <input
                type="text"
                className={`form-input ${errors.vendor ? 'border-rose-500' : ''}`}
                placeholder="e.g. EZ-Pass, Love's Lodging"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
              {errors.vendor && <p className="text-[10px] text-rose-500 font-semibold">{errors.vendor}</p>}
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="form-label">Expense Date *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="form-label">Description / Remarks</label>
            <textarea
              className="form-input h-16 resize-none"
              placeholder="Detail reasons for toll bypass, overnight lodging stops..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Receipt Link Button */}
          <div className="space-y-1">
            <label className="form-label">Receipt Document Attachment</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-semibold transition"
              >
                <Paperclip size={14} />
                {receiptUrl ? 'Replace Receipt Document' : 'Attach Receipt / File'}
              </button>
              {receiptUrl && (
                <span className="text-[10px] text-slate-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg font-medium">
                  Document attached successfully!
                </span>
              )}
            </div>
          </div>

          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-5 py-2 font-medium bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : expense ? 'Save Changes' : 'Log Expense'}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <FileUploadDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={(url) => setReceiptUrl(url)}
      />
    </>
  );
};

// 3. Expense Details Modal
interface ExpenseDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseRecord;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsProps> = ({
  isOpen,
  onClose,
  expense,
}) => {
  const [imgPreviewOpen, setImgPreviewOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Expense Details: ${expense.expenseType}`} size="sm" themeType="fuel">
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Logged Amount</span>
            <h2 className="text-2xl font-black text-slate-100 mt-1">${expense.amount.toLocaleString()}</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Paid to: {expense.vendor}</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-500">Fleet Chassis</span>
              <strong className="text-slate-200">{expense.vehicleNumber}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-500">Transaction Date</span>
              <strong className="text-slate-200">{expense.date}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-500">Expense Type</span>
              <strong className="text-slate-200">{expense.expenseType}</strong>
            </div>
          </div>

          {expense.description && (
            <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
              <span className="text-slate-500 text-[9px] uppercase font-bold">Details / Remarks</span>
              <p className="text-slate-350 italic mt-0.5 leading-relaxed">{expense.description}</p>
            </div>
          )}

          {expense.receiptUrl && (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-slate-300">Receipt Attachment</span>
              <button
                onClick={() => setImgPreviewOpen(true)}
                className="flex items-center gap-1 px-3 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-lg transition"
              >
                <Eye size={12} /> View Document
              </button>
            </div>
          )}

          <ModalFooter>
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              Close
            </button>
          </ModalFooter>
        </div>
      </Modal>

      {expense.receiptUrl && (
        <ImagePreviewDialog
          isOpen={imgPreviewOpen}
          onClose={() => setImgPreviewOpen(false)}
          imageUrl="https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80" // Fallback high res mockup
          caption={`Receipt for ${expense.expenseType} - $${expense.amount} paid to ${expense.vendor}`}
        />
      )}
    </>
  );
};
