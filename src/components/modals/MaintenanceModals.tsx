import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { MaintenanceRecord, Vehicle } from '../../data/database';
import { useToast } from '../Toast';
import { Wrench, Calendar, DollarSign, UserCheck, AlertTriangle } from 'lucide-react';

// 1. Schedule / Edit Maintenance Modal
interface ScheduleEditMaintenanceProps {
  isOpen: boolean;
  onClose: () => void;
  record?: MaintenanceRecord; // If present, editing
  vehicles: Vehicle[];
  onSave: (record: MaintenanceRecord) => void;
}

export const ScheduleEditMaintenanceModal: React.FC<ScheduleEditMaintenanceProps> = ({
  isOpen,
  onClose,
  record,
  vehicles,
  onSave,
}) => {
  const toast = useToast();

  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Scheduled Servicing (30k miles)');
  const [workshop, setWorkshop] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Scheduled' | 'Completed'>('Scheduled');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setVehicleId(record.vehicleId);
      setServiceType(record.serviceType);
      setWorkshop(record.workshop);
      setServiceDate(record.serviceDate);
      setEstimatedCompletion(record.estimatedCompletion);
      setCost(record.cost);
      setTechnician(record.technician);
      setNotes(record.notes);
      setStatus(record.status);
    } else {
      setVehicleId('');
      setServiceType('Scheduled Servicing (30k miles)');
      setWorkshop('');
      setServiceDate(new Date().toISOString().split('T')[0]);
      setEstimatedCompletion(new Date().toISOString().split('T')[0]);
      setCost(350);
      setTechnician('');
      setNotes('');
      setStatus('Scheduled');
    }
    setErrors({});
  }, [record, isOpen]);

  const checkDirty = () => {
    if (!record) {
      return !!(vehicleId || workshop || technician || notes);
    }
    return (
      vehicleId !== record.vehicleId ||
      serviceType !== record.serviceType ||
      workshop !== record.workshop ||
      serviceDate !== record.serviceDate ||
      estimatedCompletion !== record.estimatedCompletion ||
      cost !== record.cost ||
      technician !== record.technician ||
      notes !== record.notes ||
      status !== record.status
    );
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!vehicleId) errs.vehicleId = 'Vehicle Selection is required';
    if (!workshop.trim()) errs.workshop = 'Workshop name is required';
    if (!serviceDate) errs.serviceDate = 'Service date is required';
    if (!estimatedCompletion) {
      errs.estimatedCompletion = 'Estimated completion date is required';
    } else if (serviceDate && estimatedCompletion && estimatedCompletion < serviceDate) {
      errs.estimatedCompletion = 'Completion date cannot be before start date';
    }
    if (cost <= 0) errs.cost = 'Cost estimate must be greater than 0';
    if (!technician.trim()) errs.technician = 'Technician name is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Validation Error', 'Verify maintenance logs details.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const selectedVehicle = vehicles.find(v => v.id === vehicleId);
      
      const newRecord: MaintenanceRecord = {
        id: record?.id || `m-${Math.random().toString(36).substring(2, 9)}`,
        vehicleId,
        vehicleNumber: selectedVehicle ? selectedVehicle.vehicleNumber : 'Unknown',
        serviceType,
        workshop,
        serviceDate,
        estimatedCompletion,
        cost,
        technician,
        notes,
        status,
      };

      onSave(newRecord);
      toast.success(
        record ? 'Maintenance Log Updated' : 'Maintenance Scheduled',
        `${serviceType} logged for Truck ${newRecord.vehicleNumber}.`
      );
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const isValid = vehicleId && workshop && technician && cost > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={record ? `Modify Servicing Task` : 'Schedule Fleet Maintenance / Service'}
      size="md"
      isDirty={checkDirty()}
      themeType="maintenance"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle */}
          <div className="space-y-1">
            <label className="form-label">Target Truck *</label>
            <select
              className={`form-input ${errors.vehicleId ? 'border-rose-500' : ''}`}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!!record}
            >
              <option value="">Select Vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.brand} {v.model})</option>
              ))}
            </select>
            {errors.vehicleId && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.vehicleId}</p>}
          </div>

          {/* Service Type */}
          <div className="space-y-1">
            <label className="form-label">Service Type</label>
            <select
              className="form-input"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option>Scheduled Servicing (30k miles)</option>
              <option>Oil & Filter Replacement</option>
              <option>Brake Inspection / Overhaul</option>
              <option>Tire Rotation & Alignment</option>
              <option>Electrical System Diagnostics</option>
              <option>HVAC / Reefer Unit Servicing</option>
              <option>Chassis DMV Annual Inspection</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Workshop */}
          <div className="space-y-1">
            <label className="form-label">Workshop / Service Center *</label>
            <input
              type="text"
              className={`form-input ${errors.workshop ? 'border-rose-500' : ''}`}
              placeholder="e.g. Apex Diesel Services"
              value={workshop}
              onChange={(e) => setWorkshop(e.target.value)}
            />
            {errors.workshop && <p className="text-[10px] text-rose-500 font-semibold">{errors.workshop}</p>}
          </div>

          {/* Technician */}
          <div className="space-y-1">
            <label className="form-label">Technician In-Charge *</label>
            <input
              type="text"
              className={`form-input ${errors.technician ? 'border-rose-500' : ''}`}
              placeholder="e.g. Frank Miller"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
            />
            {errors.technician && <p className="text-[10px] text-rose-500 font-semibold">{errors.technician}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Service Date */}
          <div className="space-y-1">
            <label className="form-label">Service Date *</label>
            <input
              type="date"
              className="form-input"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>

          {/* Est Completion */}
          <div className="space-y-1">
            <label className="form-label">Est. Completion *</label>
            <input
              type="date"
              className={`form-input ${errors.estimatedCompletion ? 'border-rose-500' : ''}`}
              value={estimatedCompletion}
              onChange={(e) => setEstimatedCompletion(e.target.value)}
            />
            {errors.estimatedCompletion && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.estimatedCompletion}</p>}
          </div>

          {/* Cost */}
          <div className="space-y-1">
            <label className="form-label">Cost (USD) *</label>
            <input
              type="number"
              className={`form-input ${errors.cost ? 'border-rose-500' : ''}`}
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
            />
            {errors.cost && <p className="text-[10px] text-rose-500 font-semibold mt-1">{errors.cost}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {/* Status */}
          <div className="space-y-1">
            <label className="form-label">Task Status</label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed / Resolved</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="form-label">Diagnostics / Work Notes</label>
          <textarea
            className="form-input h-16 resize-none"
            placeholder="Describe faults found, parts replaced, brake pad wear ratings..."
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
            {isSubmitting ? 'Logging...' : record ? 'Save Job' : 'Schedule Job'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 2. Mark Completed Modal
interface MarkCompletedProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaintenanceRecord;
  onComplete: (cost: number, notes: string) => void;
}

export const MarkCompletedModal: React.FC<MarkCompletedProps> = ({
  isOpen,
  onClose,
  record,
  onComplete,
}) => {
  const [cost, setCost] = useState(record.cost);
  const [notes, setNotes] = useState(record.notes || '');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setCost(record.cost);
    setNotes(record.notes || '');
  }, [record, isOpen]);

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cost <= 0) {
      toast.error('Validation Warning', 'Service cost must be greater than 0.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onComplete(cost, notes);
      toast.success('Maintenance Completed', `Truck ${record.vehicleNumber} is now marked back on active status.`);
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mark Maintenance Completed: ${record.vehicleNumber}`} size="sm" themeType="maintenance">
      <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex gap-3 text-emerald-500">
          <Wrench size={20} className="mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-200">{record.serviceType}</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Input the final garage invoice cost and technician resolution reports.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="form-label">Final Invoice Amount (USD) *</label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="number"
              className="form-input pl-8"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="form-label">Work Resolution Summary</label>
          <textarea
            className="form-input h-20 resize-none"
            placeholder="e.g. Replaced oil filter, verified battery holds charge, tires torqued to specs."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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
            className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
          >
            {loading ? 'Processing...' : 'Complete & Close Ticket'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 3. View Service History Modal
interface ViewServiceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaintenanceRecord;
}

export const ViewServiceHistoryModal: React.FC<ViewServiceHistoryProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Garage Invoice Report: ${record.vehicleNumber}`} size="sm" themeType="maintenance">
      <div className="space-y-5 text-xs">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Service Type</span>
              <h4 className="text-sm font-bold text-slate-100 mt-0.5">{record.serviceType}</h4>
            </div>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
              record.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {record.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-350 border-t border-slate-800/60 pt-3">
            <div>
              <span className="text-slate-500 text-[10px]">Service Center</span>
              <p className="text-slate-200 font-semibold mt-0.5">{record.workshop}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">Technician In-charge</span>
              <p className="text-slate-200 font-semibold mt-0.5">{record.technician}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><Calendar size={12} /> Service Date</span>
            <p className="text-slate-200 font-bold">{record.serviceDate}</p>
          </div>
          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1"><DollarSign size={12} /> Invoice Total</span>
            <p className="text-slate-200 font-bold">${record.cost.toLocaleString()}</p>
          </div>
        </div>

        {record.notes && (
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-500 uppercase">Work resolution logs</span>
            <p className="text-slate-300 italic leading-relaxed">{record.notes}</p>
          </div>
        )}

        <ModalFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            Close Report
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};
