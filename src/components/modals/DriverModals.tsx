import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { Driver, Vehicle } from '../../data/database';
import { useToast } from '../Toast';
import { User, Phone, ShieldAlert, Award, Briefcase, FileSignature, MapPin } from 'lucide-react';

// 1. Add / Edit Driver Modal
interface AddEditDriverProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver; // If present, editing
  allDrivers: Driver[];
  vehicles: Vehicle[];
  onSave: (driver: Driver) => void;
}

export const AddEditDriverModal: React.FC<AddEditDriverProps> = ({
  isOpen,
  onClose,
  driver,
  allDrivers,
  vehicles,
  onSave,
}) => {
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Class A CDL');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [experience, setExperience] = useState<number>(0);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [driverStatus, setDriverStatus] = useState<'Active' | 'On Leave' | 'Suspended' | 'Available'>('Available');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (driver) {
      setFullName(driver.fullName);
      setEmployeeId(driver.employeeId);
      setMobile(driver.mobile);
      setEmail(driver.email);
      setAddress(driver.address);
      setLicenseNumber(driver.licenseNumber);
      setLicenseCategory(driver.licenseCategory);
      setLicenseExpiry(driver.licenseExpiry);
      setExperience(driver.experience);
      setEmergencyContact(driver.emergencyContact);
      setAssignedVehicleId(driver.assignedVehicleId || '');
      setDriverStatus(driver.driverStatus);
    } else {
      setFullName('');
      setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
      setMobile('');
      setEmail('');
      setAddress('');
      setLicenseNumber('');
      setLicenseCategory('Class A CDL');
      setLicenseExpiry('');
      setExperience(2);
      setEmergencyContact('');
      setAssignedVehicleId('');
      setDriverStatus('Available');
    }
    setErrors({});
  }, [driver, isOpen]);

  const checkDirty = () => {
    if (!driver) {
      return !!(fullName || mobile || email || address || licenseNumber || licenseExpiry || emergencyContact);
    }
    return (
      fullName !== driver.fullName ||
      mobile !== driver.mobile ||
      email !== driver.email ||
      address !== driver.address ||
      licenseNumber !== driver.licenseNumber ||
      licenseCategory !== driver.licenseCategory ||
      licenseExpiry !== driver.licenseExpiry ||
      experience !== driver.experience ||
      emergencyContact !== driver.emergencyContact ||
      assignedVehicleId !== (driver.assignedVehicleId || '') ||
      driverStatus !== driver.driverStatus
    );
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!fullName.trim()) errs.fullName = 'Full Name is required';
    
    // Unique Email check (exclude current driver)
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Invalid email format';
    } else {
      const emailDup = allDrivers.some(d => d.email.toLowerCase() === email.trim().toLowerCase() && d.id !== driver?.id);
      if (emailDup) errs.email = 'Email is already registered to another driver';
    }

    // Unique Mobile check
    if (!mobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else {
      const mobileDup = allDrivers.some(d => d.mobile === mobile.trim() && d.id !== driver?.id);
      if (mobileDup) errs.mobile = 'Mobile number already in use by another operator';
    }

    // Unique License check
    if (!licenseNumber.trim()) {
      errs.licenseNumber = 'License ID is required';
    } else {
      const licDup = allDrivers.some(d => d.licenseNumber.toUpperCase() === licenseNumber.trim().toUpperCase() && d.id !== driver?.id);
      if (licDup) errs.licenseNumber = 'License Number is already registered';
    }

    if (!licenseExpiry) {
      errs.licenseExpiry = 'License Expiry is required';
    } else {
      const daysLeft = Math.ceil((new Date(licenseExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (daysLeft <= 0) {
        errs.licenseExpiry = 'Cannot add driver with expired license';
      }
    }

    if (experience < 0) errs.experience = 'Experience cannot be negative';
    if (!emergencyContact.trim()) errs.emergencyContact = 'Emergency contact details are required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Validation Warning', 'Verify fields marked in red.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const selectedVehicle = vehicles.find(v => v.id === assignedVehicleId);
      
      const newDriver: Driver = {
        id: driver?.id || `d-${Math.random().toString(36).substring(2, 9)}`,
        fullName,
        employeeId,
        mobile,
        email,
        address,
        licenseNumber: licenseNumber.toUpperCase(),
        licenseCategory,
        licenseExpiry,
        experience,
        emergencyContact,
        assignedVehicleId: assignedVehicleId || undefined,
        assignedVehicleNumber: selectedVehicle ? selectedVehicle.vehicleNumber : undefined,
        driverStatus,
      };

      onSave(newDriver);
      toast.success(
        driver ? 'Operator Profile Saved' : 'Operator Registered',
        `${fullName} CDL profile linked under ID ${employeeId}.`
      );
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const isValid = fullName && email && mobile && licenseNumber && licenseExpiry && emergencyContact;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? `Edit Driver: ${driver.fullName} (${driver.employeeId})` : 'Register New Fleet Operator'}
      size="lg"
      isDirty={checkDirty()}
      themeType="drivers"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className={`form-input ${errors.fullName ? 'border-rose-500' : ''}`}
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {errors.fullName && <p className="text-[10px] text-rose-500 font-semibold">{errors.fullName}</p>}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'border-rose-500' : ''}`}
              placeholder="j.doe@transitops.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-[10px] text-rose-500 font-semibold">{errors.email}</p>}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="form-label">Mobile Number *</label>
            <input
              type="text"
              className={`form-input ${errors.mobile ? 'border-rose-500' : ''}`}
              placeholder="+1 (555) 000-0000"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            {errors.mobile && <p className="text-[10px] text-rose-500 font-semibold">{errors.mobile}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* License Number */}
          <div className="space-y-1">
            <label className="form-label">License Number (CDL) *</label>
            <input
              type="text"
              className={`form-input uppercase ${errors.licenseNumber ? 'border-rose-500' : ''}`}
              placeholder="e.g. DL-CA908811"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
            {errors.licenseNumber && <p className="text-[10px] text-rose-500 font-semibold">{errors.licenseNumber}</p>}
          </div>

          {/* License Category */}
          <div className="space-y-1">
            <label className="form-label">License Category</label>
            <select
              className="form-input"
              value={licenseCategory}
              onChange={(e) => setLicenseCategory(e.target.value)}
            >
              <option>Class A CDL</option>
              <option>Class B CDL</option>
              <option>Class C CDL</option>
              <option>Standard Operators</option>
            </select>
          </div>

          {/* License Expiry */}
          <div className="space-y-1">
            <label className="form-label">License Expiration *</label>
            <input
              type="date"
              className={`form-input ${errors.licenseExpiry ? 'border-rose-500' : ''}`}
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
            />
            {errors.licenseExpiry && <p className="text-[10px] text-rose-500 font-semibold">{errors.licenseExpiry}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Experience */}
          <div className="space-y-1">
            <label className="form-label">Commercial Experience (Years)</label>
            <input
              type="number"
              className="form-input"
              value={experience}
              onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Assigned Vehicle */}
          <div className="space-y-1">
            <label className="form-label">Assigned Truck</label>
            <select
              className="form-input"
              value={assignedVehicleId}
              onChange={(e) => setAssignedVehicleId(e.target.value)}
            >
              <option value="">None / Unassigned</option>
              {vehicles
                .filter(v => v.currentStatus === 'Available' || v.id === driver?.assignedVehicleId)
                .map(v => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.brand} {v.model})</option>
                ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="form-label">Operational Status</label>
            <select
              className="form-input"
              value={driverStatus}
              onChange={(e) => setDriverStatus(e.target.value as any)}
            >
              <option value="Available">Available / Active</option>
              <option value="Active">On Duty / In Trip</option>
              <option value="On Leave">On Leave / Vacation</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address */}
          <div className="space-y-1">
            <label className="form-label">Residential Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="123 Road, State, City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-1">
            <label className="form-label">Emergency Contact (Name / Phone) *</label>
            <input
              type="text"
              className={`form-input ${errors.emergencyContact ? 'border-rose-500' : ''}`}
              placeholder="e.g. Sarah Wright (Wife) - +1 (555) 309-8813"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
            {errors.emergencyContact && <p className="text-[10px] text-rose-500 font-semibold">{errors.emergencyContact}</p>}
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
            {isSubmitting ? 'Registering...' : driver ? 'Save Profile' : 'Register Operator'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 2. Driver Details Modal
interface DriverDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onEdit: () => void;
  onAssignVehicle: () => void;
  onRenewLicense: () => void;
}

export const DriverDetailsModal: React.FC<DriverDetailsProps> = ({
  isOpen,
  onClose,
  driver,
  onEdit,
  onAssignVehicle,
  onRenewLicense,
}) => {
  const statusColors = {
    Active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'On Leave': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const isLicenseNearExpiry = () => {
    const daysLeft = Math.ceil((new Date(driver.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft <= 30;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Operator Dossier: ${driver.fullName}`} size="md" themeType="drivers">
      <div className="space-y-6 text-xs">
        {/* Header Summary */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{driver.fullName}</h3>
              <p className="text-slate-400 text-xs">Emp ID: {driver.employeeId}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${statusColors[driver.driverStatus]}`}>
            {driver.driverStatus}
          </span>
        </div>

        {/* Contact Specs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1"><Phone size={10} /> Mobile Phone</span>
            <p className="text-slate-200 font-bold">{driver.mobile}</p>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">Email Address</span>
            <p className="text-slate-200 font-bold truncate">{driver.email}</p>
          </div>
        </div>

        {/* Professional Profile */}
        <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Briefcase size={12} /> CDL Accreditation & Experience
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400 flex items-center gap-1"><Award size={10} /> Classification</span>
              <strong className="text-slate-200">{driver.licenseCategory}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/50 pl-2">
              <span className="text-slate-400">CDL License ID</span>
              <strong className="text-slate-200">{driver.licenseNumber}</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Road Experience</span>
              <strong className="text-slate-200">{driver.experience} Years</strong>
            </div>
          </div>
        </div>

        {/* Expiration warning block */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compliance Status</h4>
          <div className={`flex items-center justify-between p-3 border rounded-xl ${
            isLicenseNearExpiry() ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 bg-slate-900/40'
          }`}>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">License Expiration Date</span>
              <p className="text-slate-200 font-bold">{driver.licenseExpiry}</p>
            </div>
            {isLicenseNearExpiry() ? (
              <button
                onClick={onRenewLicense}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg font-bold flex items-center gap-1 transition animate-pulse"
              >
                <ShieldAlert size={12} /> Renew Now
              </button>
            ) : (
              <button
                onClick={onRenewLicense}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
              >
                Trigger Renewal
              </button>
            )}
          </div>
        </div>

        {/* Vehicle Assignment & Emergency */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Allocation & Emergency Info</h4>
          <div className="space-y-2">
            {/* Vehicle */}
            <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Allocated Fleet Vehicle</span>
                <p className="text-slate-200 font-bold mt-0.5">
                  {driver.assignedVehicleNumber ? `Truck ${driver.assignedVehicleNumber}` : 'Unassigned'}
                </p>
              </div>
              <button
                onClick={onAssignVehicle}
                className="px-3 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-lg font-semibold transition"
              >
                {driver.assignedVehicleId ? 'Reassign Truck' : 'Assign Truck'}
              </button>
            </div>

            {/* Emergency Contact */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Primary Emergency Contact</span>
              <p className="text-slate-200 font-semibold">{driver.emergencyContact}</p>
            </div>

            {/* Address */}
            {driver.address && (
              <div className="p-3 bg-slate-900/60 border border-slate-805 rounded-xl space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1"><MapPin size={10} /> Residence Address</span>
                <p className="text-slate-300">{driver.address}</p>
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={onEdit}
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            Edit Operator Profile
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            Close
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// 3. Assign Vehicle Modal
interface AssignVehicleProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  vehicles: Vehicle[];
  onAssign: (vehicleId: string | undefined) => void;
}

export const AssignVehicleModal: React.FC<AssignVehicleProps> = ({
  isOpen,
  onClose,
  driver,
  vehicles,
  onAssign,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState(driver.assignedVehicleId || '');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setSelectedVehicleId(driver.assignedVehicleId || '');
  }, [driver, isOpen]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      onAssign(selectedVehicleId ? selectedVehicleId : undefined);
      const vehicleObj = vehicles.find(v => v.id === selectedVehicleId);
      toast.success(
        'Vehicle Allocation Saved',
        vehicleObj ? `Truck ${vehicleObj.vehicleNumber} successfully allocated to ${driver.fullName}` : `Operator ${driver.fullName} unassigned.`
      );
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Allocate Vehicle: ${driver.fullName}`} size="sm" themeType="drivers">
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="form-label">Select Truck</label>
          <select
            className="form-input"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
          >
            <option value="">Unassigned (None)</option>
            {vehicles
              .filter(v => v.currentStatus === 'Available' || v.id === driver.assignedVehicleId)
              .map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} ({v.brand} {v.model}) • {v.vehicleType}
                </option>
              ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">
            Only available or unassigned active trucks are listed.
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
            {loading ? 'Allocating...' : 'Confirm Allocation'}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// 4. License Renewal Modal
interface LicenseRenewalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onRenew: (expiryDate: string, licenseNo: string) => void;
}

export const LicenseRenewalModal: React.FC<LicenseRenewalProps> = ({
  isOpen,
  onClose,
  driver,
  onRenew,
}) => {
  const [expiryDate, setExpiryDate] = useState(driver.licenseExpiry);
  const [licenseNo, setLicenseNo] = useState(driver.licenseNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    setExpiryDate(driver.licenseExpiry);
    setLicenseNo(driver.licenseNumber);
    setError('');
  }, [driver, isOpen]);

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiryDate) {
      setError('Please set the new license expiration date');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (expiryDate <= today) {
      setError('New expiry date must be in the future.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onRenew(expiryDate, licenseNo.toUpperCase());
      toast.success('CDL Renewal Completed', `Operator ${driver.fullName}'s license extended to ${expiryDate}.`);
      setLoading(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`CDL Accreditation Renewal: ${driver.fullName}`} size="sm" themeType="drivers">
      <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex gap-3 text-amber-500">
          <FileSignature size={20} className="mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-200">Regulatory Requirement</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Confirm that a copy of the updated medical examiner's certificate and CDL copy has been received and verified.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="form-label">License Number</label>
          <input
            type="text"
            className="form-input uppercase"
            value={licenseNo}
            onChange={(e) => setLicenseNo(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="form-label">New License Expiry Date</label>
          <input
            type="date"
            className="form-input"
            value={expiryDate}
            onChange={(e) => {
              setExpiryDate(e.target.value);
              setError('');
            }}
          />
          {error && <p className="text-[10px] text-rose-500 font-semibold mt-1">{error}</p>}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            {loading ? 'Processing...' : 'Verify & Renew'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
