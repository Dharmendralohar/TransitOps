import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { Vehicle, Driver, Trip, MaintenanceRecord, FuelEntry, ExpenseRecord } from '../../data/database';
import { useToast } from '../Toast';
import { Truck, Calendar, DollarSign, UserCheck, ShieldAlert, FileText, ClipboardList } from 'lucide-react';

// 1. Add / Edit Vehicle Modal
interface AddEditVehicleProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle; // If present, we are editing
  allVehicles: Vehicle[];
  drivers: Driver[];
  onSave: (vehicle: Vehicle) => void;
}

export const AddEditVehicleModal: React.FC<AddEditVehicleProps> = ({
  isOpen,
  onClose,
  vehicle,
  allVehicles,
  drivers,
  onSave,
}) => {
  const toast = useToast();
  
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Heavy Duty Hauler');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState<number>(new Date().getFullYear());
  const [capacity, setCapacity] = useState<number>(0);
  const [fuelType, setFuelType] = useState('Diesel');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [registrationExpiry, setRegistrationExpiry] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'Active' | 'In Service' | 'Available' | 'Inactive'>('Available');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load fields on open / edit change
  useEffect(() => {
    if (vehicle) {
      setVehicleNumber(vehicle.vehicleNumber);
      setRegistrationNumber(vehicle.registrationNumber);
      setVehicleType(vehicle.vehicleType);
      setBrand(vehicle.brand);
      setModel(vehicle.model);
      setManufacturingYear(vehicle.manufacturingYear);
      setCapacity(vehicle.capacity);
      setFuelType(vehicle.fuelType);
      setPurchaseDate(vehicle.purchaseDate);
      setPurchaseCost(vehicle.purchaseCost);
      setInsuranceExpiry(vehicle.insuranceExpiry);
      setRegistrationExpiry(vehicle.registrationExpiry);
      setAssignedDriverId(vehicle.assignedDriverId || '');
      setCurrentStatus(vehicle.currentStatus);
      setNotes(vehicle.notes);
    } else {
      // Clear for new vehicle
      setVehicleNumber(`V-${Math.floor(1000 + Math.random() * 9000)}`);
      setRegistrationNumber('');
      setVehicleType('Heavy Duty Hauler');
      setBrand('');
      setModel('');
      setManufacturingYear(new Date().getFullYear());
      setCapacity(15000);
      setFuelType('Diesel');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchaseCost(120000);
      setInsuranceExpiry('');
      setRegistrationExpiry('');
      setAssignedDriverId('');
      setCurrentStatus('Available');
      setNotes('');
    }
    setErrors({});
  }, [vehicle, isOpen]);

  // Dirty State Checker
  const checkDirty = () => {
    if (!vehicle) {
      return !!(registrationNumber || brand || model || insuranceExpiry || registrationExpiry || notes);
    }
    return (
      vehicleNumber !== vehicle.vehicleNumber ||
      registrationNumber !== vehicle.registrationNumber ||
      vehicleType !== vehicle.vehicleType ||
      brand !== vehicle.brand ||
      model !== vehicle.model ||
      manufacturingYear !== vehicle.manufacturingYear ||
      capacity !== vehicle.capacity ||
      fuelType !== vehicle.fuelType ||
      purchaseDate !== vehicle.purchaseDate ||
      purchaseCost !== vehicle.purchaseCost ||
      insuranceExpiry !== vehicle.insuranceExpiry ||
      registrationExpiry !== vehicle.registrationExpiry ||
      assignedDriverId !== (vehicle.assignedDriverId || '') ||
      currentStatus !== vehicle.currentStatus ||
      notes !== vehicle.notes
    );
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    const today = new Date().toISOString().split('T')[0];

    if (!vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle ID is required';
    
    // Reg number validation (Must be unique, ignoring self if editing)
    if (!registrationNumber.trim()) {
      errs.registrationNumber = 'Registration plate number is required';
    } else {
      const isDuplicate = allVehicles.some(
        v => v.registrationNumber.toLowerCase() === registrationNumber.trim().toLowerCase() && v.id !== vehicle?.id
      );
      if (isDuplicate) {
        errs.registrationNumber = 'Registration plate must be unique. Already exists in fleet registry';
      }
    }

    if (!brand.trim()) errs.brand = 'Brand/Manufacturer is required';
    if (!model.trim()) errs.model = 'Model is required';
    if (manufacturingYear < 1990 || manufacturingYear > new Date().getFullYear() + 1) {
      errs.manufacturingYear = 'Invalid manufacturing year';
    }
    
    if (capacity <= 0) {
      errs.capacity = 'Capacity must be greater than 0';
    }
    
    if (purchaseCost <= 0) {
      errs.purchaseCost = 'Purchase Cost must be greater than 0';
    }

    // Expiry dates cannot be in the past
    if (!insuranceExpiry) {
      errs.insuranceExpiry = 'Insurance expiry date is required';
    } else if (insuranceExpiry < today) {
      errs.insuranceExpiry = 'Insurance expiry date cannot be in the past';
    }

    if (!registrationExpiry) {
      errs.registrationExpiry = 'Registration expiry date is required';
    } else if (registrationExpiry < today) {
      errs.registrationExpiry = 'Registration expiry date cannot be in the past';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Validation Error', 'Please check highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      const selectedDriver = drivers.find(d => d.id === assignedDriverId);
      
      const newVehicle: Vehicle = {
        id: vehicle?.id || `v-${Math.random().toString(36).substring(2, 9)}`,
        vehicleNumber,
        registrationNumber: registrationNumber.toUpperCase(),
        vehicleType,
        brand,
        model,
        manufacturingYear,
        capacity,
        fuelType,
        purchaseDate,
        purchaseCost,
        insuranceExpiry,
        registrationExpiry,
        assignedDriverId: assignedDriverId || undefined,
        assignedDriverName: selectedDriver ? selectedDriver.fullName : undefined,
        currentStatus,
        notes,
      };

      onSave(newVehicle);
      toast.success(
        vehicle ? 'Vehicle Profile Updated' : 'Vehicle Registry Added',
        `${brand} ${model} [${vehicleNumber}] successfully registered.`
      );
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const isValid = registrationNumber && brand && model && capacity > 0 && purchaseCost > 0 && insuranceExpiry && registrationExpiry;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? `Edit Vehicle Profile: ${vehicle.vehicleNumber}` : 'Add New Vehicle to Fleet'}
      size="lg"
      isDirty={checkDirty()}
      themeType="fleet"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehicle Number */}
          <div className="space-y-1">
            <label className="form-label">Vehicle ID</label>
            <input
              type="text"
              className="form-input"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              disabled={!!vehicle} // Keep ID locked once created
            />
          </div>

          {/* Registration Number */}
          <div className="space-y-1">
            <label className="form-label">Registration Plate *</label>
            <input
              type="text"
              className={`form-input uppercase ${errors.registrationNumber ? 'border-rose-500' : ''}`}
              placeholder="e.g. TX-89B-8812"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
            {errors.registrationNumber && <p className="text-[10px] text-rose-500 font-medium">{errors.registrationNumber}</p>}
          </div>

          {/* Vehicle Type */}
          <div className="space-y-1">
            <label className="form-label">Vehicle Type</label>
            <select
              className="form-input"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option>Heavy Duty Hauler</option>
              <option>Refrigerated Box Truck</option>
              <option>Flatbed Truck</option>
              <option>Cargo Van</option>
              <option>Box Truck</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Brand */}
          <div className="space-y-1">
            <label className="form-label">Brand/Manufacturer *</label>
            <input
              type="text"
              className={`form-input ${errors.brand ? 'border-rose-500' : ''}`}
              placeholder="e.g. Freightliner, Volvo"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
            {errors.brand && <p className="text-[10px] text-rose-500 font-medium">{errors.brand}</p>}
          </div>

          {/* Model */}
          <div className="space-y-1">
            <label className="form-label">Model *</label>
            <input
              type="text"
              className={`form-input ${errors.model ? 'border-rose-500' : ''}`}
              placeholder="e.g. Cascadia, VNL 860"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            {errors.model && <p className="text-[10px] text-rose-500 font-medium">{errors.model}</p>}
          </div>

          {/* Manufacturing Year */}
          <div className="space-y-1">
            <label className="form-label">Manufacturing Year</label>
            <input
              type="number"
              className="form-input"
              value={manufacturingYear}
              onChange={(e) => setManufacturingYear(parseInt(e.target.value) || 0)}
            />
            {errors.manufacturingYear && <p className="text-[10px] text-rose-500 font-medium">{errors.manufacturingYear}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Capacity */}
          <div className="space-y-1">
            <label className="form-label">Payload Capacity (KG) *</label>
            <input
              type="number"
              className={`form-input ${errors.capacity ? 'border-rose-500' : ''}`}
              value={capacity}
              onChange={(e) => setCapacity(parseFloat(e.target.value) || 0)}
            />
            {errors.capacity && <p className="text-[10px] text-rose-500 font-medium">{errors.capacity}</p>}
          </div>

          {/* Fuel Type */}
          <div className="space-y-1">
            <label className="form-label">Fuel System</label>
            <select
              className="form-input"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              <option>Diesel</option>
              <option>Petrol</option>
              <option>Electric</option>
              <option>CNG</option>
            </select>
          </div>

          {/* Purchase Cost */}
          <div className="space-y-1">
            <label className="form-label">Purchase Value (USD) *</label>
            <input
              type="number"
              className={`form-input ${errors.purchaseCost ? 'border-rose-500' : ''}`}
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
            />
            {errors.purchaseCost && <p className="text-[10px] text-rose-500 font-medium">{errors.purchaseCost}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Purchase Date */}
          <div className="space-y-1">
            <label className="form-label">Purchase Date</label>
            <input
              type="date"
              className="form-input"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          {/* Insurance Expiry */}
          <div className="space-y-1">
            <label className="form-label">Insurance Expiry *</label>
            <input
              type="date"
              className={`form-input ${errors.insuranceExpiry ? 'border-rose-500' : ''}`}
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
            />
            {errors.insuranceExpiry && <p className="text-[10px] text-rose-500 font-medium">{errors.insuranceExpiry}</p>}
          </div>

          {/* Registration Expiry */}
          <div className="space-y-1">
            <label className="form-label">Registration Expiry *</label>
            <input
              type="date"
              className={`form-input ${errors.registrationExpiry ? 'border-rose-500' : ''}`}
              value={registrationExpiry}
              onChange={(e) => setRegistrationExpiry(e.target.value)}
            />
            {errors.registrationExpiry && <p className="text-[10px] text-rose-500 font-medium">{errors.registrationExpiry}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assigned Driver */}
          <div className="space-y-1">
            <label className="form-label">Assigned Driver</label>
            <select
              className="form-input"
              value={assignedDriverId}
              onChange={(e) => setAssignedDriverId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {drivers
                .filter(d => d.driverStatus === 'Available' || d.id === vehicle?.assignedDriverId)
                .map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} ({d.employeeId})</option>
                ))}
            </select>
          </div>

          {/* Current Status */}
          <div className="space-y-1">
            <label className="form-label">Current Status</label>
            <select
              className="form-input"
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as any)}
            >
              <option value="Active">Active / On Duty</option>
              <option value="Available">Available / Parked</option>
              <option value="In Service">In Service / Maintenance</option>
              <option value="Inactive">Inactive / Out of Order</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="form-label">Operational Notes</label>
          <textarea
            className="form-input h-20 resize-none"
            placeholder="Type any maintenance history note, routing limitations, or cargo constraints..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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
            {isSubmitting ? 'Registering...' : vehicle ? 'Save Profile' : 'Add Vehicle'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 2. View Vehicle Details Modal
interface ViewVehicleDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onEdit?: () => void;
  onAssignDriver?: () => void;
}

export const ViewVehicleDetailsModal: React.FC<ViewVehicleDetailsProps> = ({
  isOpen,
  onClose,
  vehicle,
  onEdit,
  onAssignDriver,
}) => {
  const statusColors = {
    Active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'In Service': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Inactive: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const isInsuranceNearExpiry = () => {
    const daysLeft = Math.ceil((new Date(vehicle.insuranceExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft <= 30;
  };

  const isRegNearExpiry = () => {
    const daysLeft = Math.ceil((new Date(vehicle.registrationExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft <= 30;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Vehicle Specifications: ${vehicle.vehicleNumber}`} size="md" themeType="fleet">
      <div className="space-y-6 text-xs">
        {/* Header Details Panel */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{vehicle.brand} {vehicle.model}</h3>
              <p className="text-slate-400 text-xs">Reg Plate: {vehicle.registrationNumber}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${statusColors[vehicle.currentStatus]}`}>
            {vehicle.currentStatus}
          </span>
        </div>

        {/* Technical Specs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Vehicle Category</span>
            <p className="text-slate-200 font-semibold">{vehicle.vehicleType}</p>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Manufacture Year</span>
            <p className="text-slate-200 font-semibold">{vehicle.manufacturingYear}</p>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Payload Capacity</span>
            <p className="text-slate-200 font-semibold">{vehicle.capacity.toLocaleString()} KG</p>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Fuel System</span>
            <p className="text-slate-200 font-semibold">{vehicle.fuelType}</p>
          </div>
        </div>

        {/* Purchase & Financials */}
        <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign size={12} /> Financial Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Purchase Date</span>
              <strong className="text-slate-200">{vehicle.purchaseDate}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50 pl-2">
              <span className="text-slate-400">Purchase Cost</span>
              <strong className="text-slate-200">${vehicle.purchaseCost.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Expiry Alerts & Driver */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} /> Compliance & Fleet Allocation
          </h4>
          <div className="space-y-2">
            {/* Driver */}
            <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Allocated Operator</span>
                <p className="text-slate-200 font-bold mt-0.5">
                  {vehicle.assignedDriverName || 'No Driver Assigned'}
                </p>
              </div>
              {onAssignDriver && (
                <button
                  onClick={onAssignDriver}
                  className="px-3 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-lg font-semibold transition"
                >
                  {vehicle.assignedDriverId ? 'Change Driver' : 'Assign Driver'}
                </button>
              )}
            </div>

            {/* Insurance Expiry */}
            <div className={`flex items-center justify-between p-3 border rounded-xl ${
              isInsuranceNearExpiry() ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900/40'
            }`}>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Insurance Policy Expiration</span>
                <p className="text-slate-200 font-bold mt-0.5">{vehicle.insuranceExpiry}</p>
              </div>
              {isInsuranceNearExpiry() && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  <ShieldAlert size={10} /> Renew Soon
                </span>
              )}
            </div>

            {/* Registration Expiry */}
            <div className={`flex items-center justify-between p-3 border rounded-xl ${
              isRegNearExpiry() ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-800 bg-slate-900/40'
            }`}>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Chassis DMV Registration Expiry</span>
                <p className="text-slate-200 font-bold mt-0.5">{vehicle.registrationExpiry}</p>
              </div>
              {isRegNearExpiry() && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                  <ShieldAlert size={10} /> Urgent Action
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {vehicle.notes && (
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Operational Logs / Notes</span>
            <p className="text-slate-300 italic leading-relaxed">{vehicle.notes}</p>
          </div>
        )}

        <ModalFooter>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
            >
              Edit Profile
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            Close
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// 3. Assign Driver Modal
interface AssignDriverProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  drivers: Driver[];
  onAssign: (driverId: string | undefined) => void;
}

export const AssignDriverModal: React.FC<AssignDriverProps> = ({
  isOpen,
  onClose,
  vehicle,
  drivers,
  onAssign,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState(vehicle.assignedDriverId || '');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setSelectedDriverId(vehicle.assignedDriverId || '');
  }, [vehicle, isOpen]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      onAssign(selectedDriverId ? selectedDriverId : undefined);
      const drv = drivers.find(d => d.id === selectedDriverId);
      toast.success(
        'Operator Assigned Successfully',
        drv ? `${drv.fullName} is now assigned to ${vehicle.vehicleNumber}` : `Vehicle ${vehicle.vehicleNumber} unassigned.`
      );
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Allocate Operator: ${vehicle.vehicleNumber}`} size="sm" themeType="fleet">
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
            <UserCheck size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-200">Current Assignment</h4>
            <p className="text-slate-400">{vehicle.assignedDriverName || 'No driver allocated to this vehicle.'}</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="form-label">Select Driver</label>
          <select
            className="form-input"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
          >
            <option value="">Unassigned (None)</option>
            {drivers
              .filter(d => d.driverStatus === 'Available' || d.driverStatus === 'Active' || d.id === vehicle.assignedDriverId)
              .map(d => (
                <option key={d.id} value={d.id}>
                  {d.fullName} (Exp: {d.experience}y • {d.licenseCategory}) {d.assignedVehicleNumber ? `[Currently on ${d.assignedVehicleNumber}]` : ''}
                </option>
              ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">
            Only active/available drivers are listed. Assigning a driver currently allocated elsewhere will hot-swap the vehicle assignments.
          </p>
        </div>

        <ModalFooter>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            {loading ? 'Saving...' : 'Confirm Assignment'}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// 4. Vehicle History Modal
interface VehicleHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuel: FuelEntry[];
  expenses: ExpenseRecord[];
}

export const VehicleHistoryModal: React.FC<VehicleHistoryProps> = ({
  isOpen,
  onClose,
  vehicle,
  trips,
  maintenance,
  fuel,
  expenses,
}) => {
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    // Compile history items
    const items: any[] = [];

    // Trips
    trips
      .filter(t => t.vehicleId === vehicle.id)
      .forEach(t => {
        items.push({
          id: t.id,
          date: t.departureDate.split('T')[0],
          title: `Trip Dispatched: ${t.tripId}`,
          user: t.driverName || 'System',
          description: `${t.pickupLocation} ➔ ${t.destination} • Cargo Weight: ${t.cargoWeight.toLocaleString()} KG`,
          tag: t.status,
          tagType: t.status === 'Completed' ? 'success' : t.status === 'Cancelled' ? 'error' : 'info'
        });
      });

    // Maintenance
    maintenance
      .filter(m => m.vehicleId === vehicle.id)
      .forEach(m => {
        items.push({
          id: m.id,
          date: m.serviceDate,
          title: `Maintenance: ${m.serviceType}`,
          user: m.technician,
          description: `Workshop: ${m.workshop} • Cost: $${m.cost} • Notes: ${m.notes}`,
          tag: m.status === 'Completed' ? 'Serviced' : 'Scheduled',
          tagType: m.status === 'Completed' ? 'success' : 'warn'
        });
      });

    // Fuel Logs
    fuel
      .filter(f => f.vehicleId === vehicle.id)
      .forEach(f => {
        items.push({
          id: f.id,
          date: f.date,
          title: `Fuel Purchase`,
          user: f.driverName,
          description: `Filled ${f.fuelQuantity}L at ${f.fuelStation} • Cost: $${f.fuelCost} • Odometer: ${f.odometerReading.toLocaleString()} km`,
          tag: 'Refuel',
          tagType: 'info'
        });
      });

    // Expense Logs
    expenses
      .filter(e => e.vehicleId === vehicle.id)
      .forEach(e => {
        items.push({
          id: e.id,
          date: e.date,
          title: `Expense Logged: ${e.expenseType}`,
          user: 'Finance Officer',
          description: `Amount: $${e.amount} • Vendor: ${e.vendor} • Desc: ${e.description}`,
          tag: 'Expense',
          tagType: 'warn'
        });
      });

    // Sort items by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryItems(items);
  }, [vehicle, trips, maintenance, fuel, expenses, isOpen]);

  const tagColors = {
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Operations History: ${vehicle.vehicleNumber}`} size="lg" themeType="fleet">
      <div className="space-y-4 text-xs">
        <p className="text-slate-500">Timeline logs including trip dispatcher schedules, mechanical servicings, fuel fillings, and toll charges.</p>
        
        {historyItems.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <ClipboardList size={36} className="mx-auto opacity-35 mb-2" />
            <p>No operational logs tracked for this chassis yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 ml-3 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {historyItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[30px] top-1.5 w-3 h-3 bg-slate-900 border-2 border-brand-500 rounded-full group-hover:bg-brand-400 transition" />
                
                <div className="space-y-1 p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 rounded-xl transition">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-200">{item.title}</span>
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Calendar size={10} /> {item.date}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{item.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40 mt-1">
                    <span>Authorized by: <strong className="text-slate-400">{item.user}</strong></span>
                    <span className={`px-2 py-0.5 border rounded-full font-semibold ${tagColors[item.tagType as 'info' | 'success' | 'warn' | 'error']}`}>
                      {item.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ModalFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium bg-slate-800 hover:bg-slate-700 border border-slate-800 text-slate-300 rounded-xl transition"
          >
            Close History
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};
