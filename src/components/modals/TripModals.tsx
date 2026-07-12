import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { Trip, Driver, Vehicle } from '../../data/database';
import { useToast } from '../Toast';
import { MapPin, Navigation, Calendar, User, Truck, ShieldAlert, CheckCircle, Package } from 'lucide-react';

// 1. Create / Edit Trip Modal
interface CreateEditTripProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: Trip; // If present, editing
  allTrips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onSave: (trip: Trip) => void;
}

export const CreateEditTripModal: React.FC<CreateEditTripProps> = ({
  isOpen,
  onClose,
  trip,
  allTrips,
  drivers,
  vehicles,
  onSave,
}) => {
  const toast = useToast();

  const [tripId, setTripId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [cargoWeight, setCargoWeight] = useState<number>(0);
  const [departureDate, setDepartureDate] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [estimatedFuel, setEstimatedFuel] = useState<number>(0);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Dispatched' | 'On Route' | 'Completed' | 'Cancelled'>('Pending');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (trip) {
      setTripId(trip.tripId);
      setPickupLocation(trip.pickupLocation);
      setDestination(trip.destination);
      setDriverId(trip.driverId || '');
      setVehicleId(trip.vehicleId || '');
      setCargoType(trip.cargoType);
      setCargoWeight(trip.cargoWeight);
      
      // Formatting date-time for datetime-local inputs
      const formatDT = (dStr: string) => {
        try {
          return new Date(dStr).toISOString().slice(0, 16);
        } catch {
          return '';
        }
      };
      setDepartureDate(formatDT(trip.departureDate));
      setExpectedArrival(formatDT(trip.expectedArrival));
      setEstimatedDistance(trip.estimatedDistance);
      setEstimatedFuel(trip.estimatedFuel);
      setPriority(trip.priority);
      setRemarks(trip.remarks);
      setStatus(trip.status);
    } else {
      setTripId(`TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setPickupLocation('');
      setDestination('');
      setDriverId('');
      setVehicleId('');
      setCargoType('');
      setCargoWeight(5000);
      
      // Initial dates
      const depDate = new Date();
      depDate.setHours(depDate.getHours() + 2);
      const arrDate = new Date();
      arrDate.setDate(arrDate.getDate() + 2);
      
      setDepartureDate(depDate.toISOString().slice(0, 16));
      setExpectedArrival(arrDate.toISOString().slice(0, 16));
      setEstimatedDistance(500);
      setEstimatedFuel(150);
      setPriority('Medium');
      setRemarks('');
      setStatus('Pending');
    }
    setErrors({});
  }, [trip, isOpen]);

  const checkDirty = () => {
    if (!trip) {
      return !!(pickupLocation || destination || driverId || vehicleId || cargoType);
    }
    return (
      pickupLocation !== trip.pickupLocation ||
      destination !== trip.destination ||
      driverId !== (trip.driverId || '') ||
      vehicleId !== (trip.vehicleId || '') ||
      cargoType !== trip.cargoType ||
      cargoWeight !== trip.cargoWeight ||
      new Date(departureDate).getTime() !== new Date(trip.departureDate).getTime() ||
      new Date(expectedArrival).getTime() !== new Date(trip.expectedArrival).getTime() ||
      estimatedDistance !== trip.estimatedDistance ||
      estimatedFuel !== trip.estimatedFuel ||
      priority !== trip.priority ||
      remarks !== trip.remarks ||
      status !== trip.status
    );
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!pickupLocation.trim()) errs.pickupLocation = 'Pickup site is required';
    if (!destination.trim()) errs.destination = 'Destination site is required';
    if (!cargoType.trim()) errs.cargoType = 'Cargo type is required';
    if (cargoWeight <= 0) errs.cargoWeight = 'Weight must be greater than 0';

    // Dates chronological check
    if (!departureDate) {
      errs.departureDate = 'Departure date/time is required';
    }
    if (!expectedArrival) {
      errs.expectedArrival = 'Arrival date/time is required';
    }
    if (departureDate && expectedArrival && departureDate >= expectedArrival) {
      errs.expectedArrival = 'Expected arrival must be chronologically after departure';
    }

    if (estimatedDistance <= 0) errs.estimatedDistance = 'Distance estimate is required';
    if (estimatedFuel <= 0) errs.estimatedFuel = 'Fuel estimate is required';

    // Selected vehicle capacity check
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      if (cargoWeight > selectedVehicle.capacity) {
        errs.cargoWeight = `Cargo weight exceeds vehicle payload capacity of ${selectedVehicle.capacity.toLocaleString()} KG`;
      }
    }

    // Driver availability check (no duplicate active trips)
    if (driverId) {
      const activeTripForDriver = allTrips.find(
        t => t.driverId === driverId && 
             (t.status === 'Dispatched' || t.status === 'On Route') && 
             t.id !== trip?.id
      );
      if (activeTripForDriver) {
        errs.driverId = `Driver is already deployed on active trip ${activeTripForDriver.tripId}`;
      }
    }

    // Vehicle availability check (no duplicate active trips)
    if (vehicleId) {
      const activeTripForVehicle = allTrips.find(
        t => t.vehicleId === vehicleId && 
             (t.status === 'Dispatched' || t.status === 'On Route') && 
             t.id !== trip?.id
      );
      if (activeTripForVehicle) {
        errs.vehicleId = `Vehicle is already active in trip ${activeTripForVehicle.tripId}`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Validation Error', 'Correct highlighted dispatcher warnings.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const selectedDriver = drivers.find(d => d.id === driverId);
      const selectedVehicle = vehicles.find(v => v.id === vehicleId);

      const newTrip: Trip = {
        id: trip?.id || `t-${Math.random().toString(36).substring(2, 9)}`,
        tripId,
        pickupLocation,
        destination,
        driverId: driverId || undefined,
        driverName: selectedDriver ? selectedDriver.fullName : undefined,
        vehicleId: vehicleId || undefined,
        vehicleNumber: selectedVehicle ? selectedVehicle.vehicleNumber : undefined,
        cargoType,
        cargoWeight,
        departureDate: new Date(departureDate).toISOString(),
        expectedArrival: new Date(expectedArrival).toISOString(),
        estimatedDistance,
        estimatedFuel,
        priority,
        remarks,
        status,
      };

      onSave(newTrip);
      toast.success(
        trip ? 'Trip Dispatch Updated' : 'Trip Dispatched Successfully',
        `${tripId} route from ${pickupLocation} to ${destination} saved.`
      );
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const isValid = pickupLocation && destination && cargoType && cargoWeight > 0 && driverId && vehicleId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trip ? `Modify Dispatch: ${trip.tripId}` : 'Schedule New Cargo Dispatch Route'}
      size="lg"
      isDirty={checkDirty()}
      themeType="trips"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trip ID */}
          <div className="space-y-1">
            <label className="form-label">Trip ID</label>
            <input
              type="text"
              className="form-input"
              value={tripId}
              disabled
            />
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="form-label">Priority</label>
            <select
              className="form-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="form-label">Dispatch Status</label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="Pending">Pending / Ready</option>
              <option value="Dispatched">Dispatched</option>
              <option value="On Route">On Route</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup */}
          <div className="space-y-1">
            <label className="form-label">Pickup Location *</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                className={`form-input pl-9 ${errors.pickupLocation ? 'border-rose-500' : ''}`}
                placeholder="e.g. Warehouse 4, Seattle, WA"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
            </div>
            {errors.pickupLocation && <p className="text-[10px] text-rose-500 font-medium">{errors.pickupLocation}</p>}
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <label className="form-label">Destination *</label>
            <div className="relative">
              <Navigation size={14} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                className={`form-input pl-9 ${errors.destination ? 'border-rose-500' : ''}`}
                placeholder="e.g. Retail Depot, Portland, OR"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            {errors.destination && <p className="text-[10px] text-rose-500 font-medium">{errors.destination}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Driver Selection */}
          <div className="space-y-1 col-span-1 md:col-span-1">
            <label className="form-label">Select Driver *</label>
            <select
              className={`form-input ${errors.driverId ? 'border-rose-500' : ''}`}
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Choose Driver...</option>
              {drivers
                .filter(d => d.driverStatus === 'Available' || d.id === trip?.driverId)
                .map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} ({d.employeeId})</option>
                ))}
            </select>
            {errors.driverId && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.driverId}</p>}
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-1 col-span-1 md:col-span-1">
            <label className="form-label">Select Vehicle *</label>
            <select
              className={`form-input ${errors.vehicleId ? 'border-rose-500' : ''}`}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Choose Vehicle...</option>
              {vehicles
                .filter(v => v.currentStatus === 'Available' || v.id === trip?.vehicleId)
                .map(v => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.brand} - Max: {v.capacity.toLocaleString()} KG)
                  </option>
                ))}
            </select>
            {errors.vehicleId && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.vehicleId}</p>}
          </div>

          {/* Cargo Type */}
          <div className="space-y-1">
            <label className="form-label">Cargo Commodity Type *</label>
            <input
              type="text"
              className={`form-input ${errors.cargoType ? 'border-rose-500' : ''}`}
              placeholder="e.g. Dry Groceries, Medical"
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
            />
            {errors.cargoType && <p className="text-[10px] text-rose-500 font-medium">{errors.cargoType}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cargo Weight */}
          <div className="space-y-1">
            <label className="form-label">Cargo Weight (KG) *</label>
            <input
              type="number"
              className={`form-input ${errors.cargoWeight ? 'border-rose-500' : ''}`}
              value={cargoWeight}
              onChange={(e) => setCargoWeight(parseFloat(e.target.value) || 0)}
            />
            {selectedVehicle && (
              <span className="text-[9px] text-slate-500 mt-1 block">
                Chassis Max Payload: {selectedVehicle.capacity.toLocaleString()} KG
              </span>
            )}
            {errors.cargoWeight && <p className="text-[10px] text-rose-500 font-medium mt-1">{errors.cargoWeight}</p>}
          </div>

          {/* Departure Date */}
          <div className="space-y-1">
            <label className="form-label">Departure Date/Time *</label>
            <input
              type="datetime-local"
              className="form-input"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
          </div>

          {/* Expected Arrival */}
          <div className="space-y-1">
            <label className="form-label">Expected Arrival Date/Time *</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.expectedArrival ? 'border-rose-500' : ''}`}
              value={expectedArrival}
              onChange={(e) => setExpectedArrival(e.target.value)}
            />
            {errors.expectedArrival && <p className="text-[10px] text-rose-500 font-medium mt-1">{errors.expectedArrival}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Est Distance */}
          <div className="space-y-1">
            <label className="form-label">Estimated Distance (KM)</label>
            <input
              type="number"
              className="form-input"
              value={estimatedDistance}
              onChange={(e) => setEstimatedDistance(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Est Fuel */}
          <div className="space-y-1">
            <label className="form-label">Estimated Fuel Cost/Usage (Liters)</label>
            <input
              type="number"
              className="form-input"
              value={estimatedFuel}
              onChange={(e) => setEstimatedFuel(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1">
          <label className="form-label">Remarks / Special Instructions</label>
          <textarea
            className="form-input h-16 resize-none"
            placeholder="Type any hazardous warning instructions, routing permits or delivery contact names..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
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
            {isSubmitting ? 'Saving Route...' : trip ? 'Update Dispatch' : 'Dispatch Cargo'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 2. View Trip Details Modal
interface ViewTripDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onEdit: () => void;
  onUpdateStatus: () => void;
}

export const ViewTripDetailsModal: React.FC<ViewTripDetailsProps> = ({
  isOpen,
  onClose,
  trip,
  onEdit,
  onUpdateStatus,
}) => {
  const statusColors = {
    Pending: 'bg-slate-500/10 text-slate-400 border-slate-550',
    Dispatched: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'On Route': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const priorityColors = {
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const formatDateStr = (dStr: string) => {
    return new Date(dStr).toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cargo Dispatch Route: ${trip.tripId}`} size="md" themeType="trips">
      <div className="space-y-6 text-xs">
        {/* Status/Priority Panels */}
        <div className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <span className={`px-2.5 py-1 rounded-full border font-bold ${statusColors[trip.status]}`}>
            {trip.status}
          </span>
          <span className={`px-2.5 py-1 rounded-full border font-bold flex items-center gap-1 ${priorityColors[trip.priority]}`}>
            <ShieldAlert size={12} /> {trip.priority} Priority
          </span>
        </div>

        {/* Route Tracking Grid */}
        <div className="relative p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <div className="w-0.5 h-12 bg-slate-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Origin Pickup Location</span>
                <p className="text-slate-200 font-bold mt-0.5">{trip.pickupLocation}</p>
                <span className="text-[10px] text-slate-500">{formatDateStr(trip.departureDate)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Destination Cargo Delivery</span>
                <p className="text-slate-200 font-bold mt-0.5">{trip.destination}</p>
                <span className="text-[10px] text-slate-500">{formatDateStr(trip.expectedArrival)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Crew & Truck Allocation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><User size={12} /> Deployed Driver</span>
            <p className="text-slate-200 font-bold">{trip.driverName || 'No Driver Assigned'}</p>
          </div>
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><Truck size={12} /> Assigned Vehicle</span>
            <p className="text-slate-200 font-bold">{trip.vehicleNumber || 'No Truck Assigned'}</p>
          </div>
        </div>

        {/* Cargo Detail */}
        <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Package size={12} /> Cargo Specifications
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 text-[10px]">Commodity type</span>
              <p className="text-slate-200 font-semibold mt-0.5">{trip.cargoType}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">Payload weight</span>
              <p className="text-slate-200 font-semibold mt-0.5">{trip.cargoWeight.toLocaleString()} KG</p>
            </div>
          </div>
        </div>

        {/* Distance & Fuel Estimates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase">Estimated Route Distance</span>
            <p className="text-slate-200 font-bold">{trip.estimatedDistance.toLocaleString()} KM</p>
          </div>
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase">Estimated Diesel Requirement</span>
            <p className="text-slate-200 font-bold">{trip.estimatedFuel.toLocaleString()} Liters</p>
          </div>
        </div>

        {/* Special Instructions */}
        {trip.remarks && (
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase">Remarks / Instructions</span>
            <p className="text-slate-300 italic leading-relaxed">{trip.remarks}</p>
          </div>
        )}

        <ModalFooter>
          <button
            onClick={onUpdateStatus}
            className="px-4 py-2 font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-xl transition"
          >
            Update Route Status
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            Edit Details
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

// 3. Update Trip Status Modal
interface UpdateTripStatusProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onUpdate: (status: 'Pending' | 'Dispatched' | 'On Route' | 'Completed' | 'Cancelled') => void;
}

export const UpdateTripStatusModal: React.FC<UpdateTripStatusProps> = ({
  isOpen,
  onClose,
  trip,
  onUpdate,
}) => {
  const [status, setStatus] = useState<'Pending' | 'Dispatched' | 'On Route' | 'Completed' | 'Cancelled'>(trip.status);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setStatus(trip.status);
  }, [trip, isOpen]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      onUpdate(status);
      toast.success('Route State Advanced', `${trip.tripId} status is now: ${status}.`);
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Dispatch Progress: ${trip.tripId}`} size="sm" themeType="trips">
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="form-label">Current Route Stage</label>
          <select
            className="form-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="Pending">Pending Dispatch</option>
            <option value="Dispatched">Dispatched (At Depot)</option>
            <option value="On Route">On Route (In Transit)</option>
            <option value="Completed">Completed / Handed Over</option>
            <option value="Cancelled">Cancelled</option>
          </select>
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
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition flex items-center gap-1.5"
          >
            Update Status
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};
