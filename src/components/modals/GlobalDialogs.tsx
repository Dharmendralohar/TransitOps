import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { 
  CheckCircle, AlertCircle, AlertTriangle, Loader2, Upload, 
  FileText, Search, Clock, Calendar, Check, ShieldAlert, ArrowRight
} from 'lucide-react';
import { useToast } from '../Toast';

// 1. Success Dialog
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const SuccessDialog: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center py-4">
      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-4">
        <CheckCircle size={48} className="animate-bounce" />
      </div>
      <p className="text-sm text-slate-300 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition"
      >
        Dismiss
      </button>
    </div>
  </Modal>
);

// 2. Error Dialog
export const ErrorDialog: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center py-4">
      <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full mb-4">
        <AlertCircle size={48} className="animate-pulse" />
      </div>
      <p className="text-sm text-slate-300 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl transition"
      >
        Go Back
      </button>
    </div>
  </Modal>
);

// 3. Warning Dialog
export const WarningDialog: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center py-4">
      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
        <AlertTriangle size={48} />
      </div>
      <p className="text-sm text-slate-300 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition"
      >
        Acknowledge
      </button>
    </div>
  </Modal>
);

// 4. Loading Dialog
export const LoadingDialog: React.FC<{ isOpen: boolean; message: string }> = ({ isOpen, message }) => (
  <Modal isOpen={isOpen} onClose={() => {}} title="Processing" size="sm" closeOnOutsideClick={false}>
    <div className="flex flex-col items-center text-center py-8">
      <Loader2 size={40} className="animate-spin text-brand-500 mb-4" />
      <p className="text-sm font-medium text-slate-300">{message}</p>
      <p className="text-xs text-slate-500 mt-2">Please do not refresh or close this tab...</p>
    </div>
  </Modal>
);

// 5. Delete Confirmation Dialog
interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${itemType}?`} size="sm">
    <div className="flex flex-col items-center text-center py-2">
      <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full mb-4">
        <ShieldAlert size={36} />
      </div>
      <h3 className="text-base font-bold text-slate-100 mb-1">Confirm Permanent Deletion</h3>
      <p className="text-sm text-slate-400 mb-6">
        Are you sure you want to delete the {itemType} <strong className="text-slate-200">"{itemName}"</strong>? This action cannot be undone.
      </p>
      <div className="flex w-full gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl transition"
        >
          Confirm Delete
        </button>
      </div>
    </div>
  </Modal>
);

// 6. Image Preview Modal
interface ImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption: string;
}

export const ImagePreviewDialog: React.FC<ImagePreviewProps> = ({ isOpen, onClose, imageUrl, caption }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Image Preview" size="lg">
    <div className="flex flex-col items-center">
      <div className="w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 max-h-[60vh]">
        <img
          src={imageUrl}
          alt={caption}
          className="max-w-full max-h-[50vh] object-contain rounded-lg"
          onError={(e) => {
            // Fallback placeholder
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80";
          }}
        />
      </div>
      <p className="text-sm text-slate-400 mt-4 text-center italic">{caption}</p>
    </div>
  </Modal>
);

// 7. File Upload Modal
interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (url: string) => void;
  allowedTypes?: string[];
}

export const FileUploadDialog: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  allowedTypes = ['.pdf', '.jpg', '.png'],
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      toast.error("Invalid file format", `Allowed formats: ${allowedTypes.join(', ')}`);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    let curr = 0;
    const interval = setInterval(() => {
      curr += 20;
      setProgress(curr);
      if (curr >= 100) {
        clearInterval(interval);
        setUploading(false);
        toast.success("File uploaded successfully", file.name);
        onUploadSuccess(`/uploads/${file.name}`);
        setFile(null);
        setProgress(0);
        onClose();
      }
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document/Receipt" size="md">
      <div className="space-y-5">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive ? 'border-brand-500 bg-brand-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <input
            type="file"
            id="file-upload-input"
            className="hidden"
            accept={allowedTypes.join(',')}
            onChange={handleChange}
            disabled={uploading}
          />
          <div className="p-4 bg-slate-800/80 rounded-full text-brand-400 mb-4">
            <Upload size={28} />
          </div>
          <p className="text-sm text-slate-200 font-semibold mb-1">
            Drag and drop your file here, or{' '}
            <label htmlFor="file-upload-input" className="text-brand-400 hover:text-brand-300 cursor-pointer">
              browse files
            </label>
          </p>
          <p className="text-xs text-slate-500">
            Supports {allowedTypes.join(', ').toUpperCase()} files up to 10MB
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="p-2 bg-slate-800 text-brand-400 rounded-lg">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!uploading && (
              <button
                onClick={() => setFile(null)}
                className="text-xs text-rose-500 hover:text-rose-400 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Uploading document...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <ModalFooter>
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition flex items-center gap-1.5"
          >
            {uploading && <Loader2 size={14} className="animate-spin" />}
            Start Upload
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// 8. Activity Timeline / History Modal
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  user: string;
  description: string;
  tag?: string;
  tagType?: 'info' | 'success' | 'warn' | 'error';
}

interface ActivityTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  events: TimelineEvent[];
}

export const ActivityTimelineModal: React.FC<ActivityTimelineProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  events,
}) => {
  const badgeClasses = {
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div>
        {subtitle && <p className="text-xs text-slate-500 mb-6">{subtitle}</p>}
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock size={36} className="mx-auto opacity-30 mb-2" />
            <p className="text-xs">No activity logs recorded for this item.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 ml-3 space-y-8 py-2">
            {events.map((event) => (
              <div key={event.id} className="relative">
                {/* Bullet */}
                <div className="absolute -left-[31px] top-1.5 p-1 bg-slate-900 border border-slate-700 text-slate-400 rounded-full">
                  <Clock size={10} />
                </div>
                
                {/* Content */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{event.title}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar size={10} /> {event.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Logged by: <strong className="text-slate-400">{event.user}</strong></span>
                    {event.tag && (
                      <span className={`px-1.5 py-0.5 rounded border font-semibold ${badgeClasses[event.tagType || 'info']}`}>
                        {event.tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <ModalFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
          >
            Close History
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// 9. Command Palette Modal (CMD+K Advanced Search)
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, itemId?: string) => void;
  vehicles: any[];
  drivers: any[];
  trips: any[];
}

export const AdvancedSearchPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  vehicles,
  drivers,
  trips,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    vehicles: any[];
    drivers: any[];
    trips: any[];
  }>({ vehicles: [], drivers: [], trips: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ vehicles: [], drivers: [], trips: [] });
      return;
    }
    const q = query.toLowerCase();

    const filteredVehicles = vehicles.filter(
      v => v.vehicleNumber.toLowerCase().includes(q) || 
           v.registrationNumber.toLowerCase().includes(q) ||
           v.brand.toLowerCase().includes(q) ||
           v.model.toLowerCase().includes(q)
    ).slice(0, 3);

    const filteredDrivers = drivers.filter(
      d => d.fullName.toLowerCase().includes(q) || 
           d.employeeId.toLowerCase().includes(q) ||
           d.licenseNumber.toLowerCase().includes(q)
    ).slice(0, 3);

    const filteredTrips = trips.filter(
      t => t.tripId.toLowerCase().includes(q) || 
           t.pickupLocation.toLowerCase().includes(q) ||
           t.destination.toLowerCase().includes(q)
    ).slice(0, 3);

    setResults({
      vehicles: filteredVehicles,
      drivers: filteredDrivers,
      trips: filteredTrips
    });
  }, [query, vehicles, drivers, trips]);

  // Handle keydown for Cmd+K in global App.tsx
  const handleItemClick = (view: string, id?: string) => {
    onNavigate(view, id);
    setQuery('');
    onClose();
  };

  const totalResults = results.vehicles.length + results.drivers.length + results.trips.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Search Command Palette" size="md">
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            placeholder="Type vehicle, driver name, ID, license, or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
          {!query.trim() && (
            <div className="text-center py-8 text-slate-500">
              <Search size={32} className="mx-auto opacity-20 mb-2" />
              <p className="text-xs">Search anything in the fleet ecosystem...</p>
              <div className="flex justify-center gap-2 mt-4 text-[10px]">
                <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded">Esc</kbd> to close
              </div>
            </div>
          )}

          {query.trim() && totalResults === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-xs">No records found matching "{query}"</p>
            </div>
          )}

          {query.trim() && results.vehicles.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1.5">Vehicles</h4>
              <div className="space-y-1">
                {results.vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleItemClick('fleet', v.id)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-slate-800/80 rounded-xl text-left transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{v.vehicleNumber} ({v.brand} {v.model})</div>
                      <div className="text-[10px] text-slate-400">Reg: {v.registrationNumber} • {v.vehicleType}</div>
                    </div>
                    <ArrowRight size={14} className="text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && results.drivers.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1.5">Drivers</h4>
              <div className="space-y-1">
                {results.drivers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleItemClick('drivers', d.id)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-slate-800/80 rounded-xl text-left transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{d.fullName}</div>
                      <div className="text-[10px] text-slate-400">Emp ID: {d.employeeId} • {d.mobile}</div>
                    </div>
                    <ArrowRight size={14} className="text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && results.trips.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1.5">Trips</h4>
              <div className="space-y-1">
                {results.trips.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleItemClick('trips', t.id)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-slate-800/80 rounded-xl text-left transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{t.tripId}</div>
                      <div className="text-[10px] text-slate-400">{t.pickupLocation} → {t.destination}</div>
                    </div>
                    <ArrowRight size={14} className="text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

interface CommandPaletteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (commandId: string) => void;
}

export const CommandPaletteDialog: React.FC<CommandPaletteDialogProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
}) => {
  const [query, setQuery] = useState('');
  
  const commands = [
    { id: 'add_vehicle', title: 'Register Truck / Vehicle', category: 'Actions', desc: 'Add a new vehicle to the registry' },
    { id: 'add_driver', title: 'Register Driver / Operator', category: 'Actions', desc: 'Add a new operator profiles with license details' },
    { id: 'dispatch_trip', title: 'Dispatch New Trip / Route', category: 'Actions', desc: 'Schedule cargo dispatch and assign assets' },
    { id: 'schedule_maint', title: 'Schedule Maintenance Service', category: 'Actions', desc: 'Book vehicle repairs with a workshop' },
    { id: 'log_fuel', title: 'Log Vehicle Refueling', category: 'Actions', desc: 'Record liters, cost, and odometer reading' },
    { id: 'log_expense', title: 'Log Administrative Expense', category: 'Actions', desc: 'Record tolls, permits, or washes with receipt' },
    
    { id: 'nav_dashboard', title: 'Navigate to Dashboard', category: 'Navigation', desc: 'View live analytics and alerts' },
    { id: 'nav_fleet', title: 'Navigate to Fleet Registry', category: 'Navigation', desc: 'View active trucks and specifications' },
    { id: 'nav_drivers', title: 'Navigate to Drivers', category: 'Navigation', desc: 'View driver profiles and CDLs' },
    { id: 'nav_trips', title: 'Navigate to Trips & Dispatch', category: 'Navigation', desc: 'Track active cargo dispatches' },
    { id: 'nav_maintenance', title: 'Navigate to Maintenance Shop', category: 'Navigation', desc: 'Review scheduled and completed servicing' },
    { id: 'nav_fuel', title: 'Navigate to Fuel & Expenses', category: 'Navigation', desc: 'Monitor OPEX spending logs' },
    { id: 'nav_reports', title: 'Navigate to Analytics Reports', category: 'Navigation', desc: 'Review cost trend charts and export reports' },
    { id: 'nav_settings', title: 'Navigate to Console Settings', category: 'Navigation', desc: 'Manage company profile and operators' },
    { id: 'nav_rbac', title: 'Navigate to RBAC Security', category: 'Navigation', desc: 'Configure permissions matrix and access control' },
  ];

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      c => c.title.toLowerCase().includes(q) || 
           c.category.toLowerCase().includes(q) ||
           c.desc.toLowerCase().includes(q)
    );
  }, [query]);

  // Handle ESC or click outside is managed by Modal.
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="TransitOps Command Console" size="md">
      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-505 focus:outline-none focus:border-brand-500 transition-all font-mono"
            placeholder="Search action, page navigation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-xs font-semibold">No commands found matching "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onSelectCommand(cmd.id);
                    setQuery('');
                  }}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-900/60 border border-transparent hover:border-slate-800 rounded-xl text-left transition"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        cmd.category === 'Actions' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      }`}>
                        {cmd.category}
                      </span>
                      {cmd.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">{cmd.desc}</div>
                  </div>
                  <ArrowRight size={14} className="text-slate-600 hover:text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

