import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, ArrowUpDown, ChevronLeft, ChevronRight, 
  MoreVertical, Eye, Edit2, Play, CheckCircle, XCircle, Trash2, Calendar
} from 'lucide-react';
import { Trip, Driver, Vehicle } from '../data/database';
import { CreateEditTripModal, ViewTripDetailsModal, UpdateTripStatusModal } from '../components/modals/TripModals';
import { DeleteConfirmDialog } from '../components/modals/GlobalDialogs';
import { useToast } from '../components/Toast';

interface TripsViewProps {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onUpdateTrips: (data: Trip[]) => void;
  onUpdateDrivers: (data: Driver[]) => void;
  onUpdateVehicles: (data: Vehicle[]) => void;
}

export const TripsView: React.FC<TripsViewProps> = ({
  trips,
  drivers,
  vehicles,
  onUpdateTrips,
  onUpdateDrivers,
  onUpdateVehicles,
}) => {
  const toast = useToast();

  // Modal states
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>(undefined);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortField, setSortField] = useState<'tripId' | 'departureDate'>('tripId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 5;

  // Open Actions
  const handleOpenAdd = () => {
    setSelectedTrip(undefined);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (t: Trip) => {
    setSelectedTrip(t);
    setIsAddEditOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDetails = (t: Trip) => {
    setSelectedTrip(t);
    setIsDetailsOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenStatus = (t: Trip) => {
    setSelectedTrip(t);
    setIsStatusOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDelete = (t: Trip) => {
    setSelectedTrip(t);
    setIsDeleteOpen(true);
    setActiveMenuId(null);
  };

  const handleCompleteTrip = (t: Trip) => {
    // Set trip completed
    const updatedTrips = trips.map(item => {
      if (item.id === t.id) {
        return { ...item, status: 'Completed' as const };
      }
      return item;
    });

    // Make driver & vehicle available
    const updatedDrivers = drivers.map(d => 
      d.id === t.driverId ? { ...d, driverStatus: 'Available' as const } : d
    );
    const updatedVehicles = vehicles.map(v => 
      v.id === t.vehicleId ? { ...v, currentStatus: 'Available' as const } : v
    );

    onUpdateTrips(updatedTrips);
    onUpdateDrivers(updatedDrivers);
    onUpdateVehicles(updatedVehicles);
    setActiveMenuId(null);
    toast.success('Trip Completed', `Dispatch ${t.tripId} reached destination successfully.`);
  };

  const handleCancelTrip = (t: Trip) => {
    const updatedTrips = trips.map(item => {
      if (item.id === t.id) {
        return { ...item, status: 'Cancelled' as const };
      }
      return item;
    });

    // Make driver & vehicle available
    const updatedDrivers = drivers.map(d => 
      d.id === t.driverId ? { ...d, driverStatus: 'Available' as const } : d
    );
    const updatedVehicles = vehicles.map(v => 
      v.id === t.vehicleId ? { ...v, currentStatus: 'Available' as const } : v
    );

    onUpdateTrips(updatedTrips);
    onUpdateDrivers(updatedDrivers);
    onUpdateVehicles(updatedVehicles);
    setActiveMenuId(null);
    toast.warning('Trip Cancelled', `Dispatch ${t.tripId} has been cancelled.`);
  };

  // Sorting
  const handleSort = (field: 'tripId' | 'departureDate') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted
  const processedTrips = useMemo(() => {
    return trips
      .filter((t) => {
        const matchesSearch = 
          t.tripId.toLowerCase().includes(search.toLowerCase()) ||
          t.pickupLocation.toLowerCase().includes(search.toLowerCase()) ||
          t.destination.toLowerCase().includes(search.toLowerCase()) ||
          (t.driverName && t.driverName.toLowerCase().includes(search.toLowerCase())) ||
          (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(search.toLowerCase()));
        
        const matchesStatus = statusFilter ? t.status === statusFilter : true;
        const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
  }, [trips, search, statusFilter, priorityFilter, sortField, sortOrder]);

  // Paginated List
  const paginatedTrips = useMemo(() => {
    const offset = (page - 1) * limit;
    return processedTrips.slice(offset, offset + limit);
  }, [processedTrips, page]);

  const totalPages = Math.ceil(processedTrips.length / limit) || 1;

  // CRUD events
  const handleSaveTrip = (tripData: Trip) => {
    if (selectedTrip) {
      // Edit
      const updated = trips.map(t => t.id === tripData.id ? tripData : t);
      onUpdateTrips(updated);
    } else {
      // Add
      onUpdateTrips([...trips, tripData]);
    }

    // Advance driver & vehicle statuses based on dispatch status
    if (tripData.driverId) {
      const dStatus = (tripData.status === 'Completed' || tripData.status === 'Cancelled') ? 'Available' : 'Active';
      onUpdateDrivers(drivers.map(d => d.id === tripData.driverId ? { ...d, driverStatus: dStatus } : d));
    }
    if (tripData.vehicleId) {
      const vStatus = (tripData.status === 'Completed' || tripData.status === 'Cancelled') ? 'Available' : 'Active';
      onUpdateVehicles(vehicles.map(v => v.id === tripData.vehicleId ? { ...v, currentStatus: vStatus } : v));
    }
  };

  const handleDeleteTrip = () => {
    if (!selectedTrip) return;
    
    // Free associated assets if the trip was active
    if (selectedTrip.status === 'On Route' || selectedTrip.status === 'Dispatched') {
      if (selectedTrip.driverId) {
        onUpdateDrivers(drivers.map(d => d.id === selectedTrip.driverId ? { ...d, driverStatus: 'Available' } : d));
      }
      if (selectedTrip.vehicleId) {
        onUpdateVehicles(vehicles.map(v => v.id === selectedTrip.vehicleId ? { ...v, currentStatus: 'Available' } : v));
      }
    }

    const updated = trips.filter(t => t.id !== selectedTrip.id);
    onUpdateTrips(updated);
    setIsDeleteOpen(false);
  };

  const handleUpdateStatus = (newStatus: 'Pending' | 'Dispatched' | 'On Route' | 'Completed' | 'Cancelled') => {
    if (!selectedTrip) return;
    
    const updated = trips.map(t => t.id === selectedTrip.id ? { ...t, status: newStatus } : t);
    onUpdateTrips(updated);

    // Free/Lock driver & vehicle
    const assetStatus = (newStatus === 'Completed' || newStatus === 'Cancelled') ? 'Available' : 'Active';
    if (selectedTrip.driverId) {
      onUpdateDrivers(drivers.map(d => d.id === selectedTrip.driverId ? { ...d, driverStatus: assetStatus as any } : d));
    }
    if (selectedTrip.vehicleId) {
      onUpdateVehicles(vehicles.map(v => v.id === selectedTrip.vehicleId ? { ...v, currentStatus: assetStatus as any } : v));
    }
  };

  const statusColors = {
    Pending: 'bg-slate-500/10 text-slate-400 border-slate-550',
    Dispatched: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'On Route': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const priorityColors = {
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold',
    Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold',
  };

  return (
    <div className="space-y-4 h-full flex flex-col text-xs">
      
      {/* Route Timeline Widget */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <h3 className="font-bold text-slate-100 flex items-center gap-1.5"><Play size={14} className="text-brand-500" /> Route Tracking board</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trips.filter(t => t.status === 'On Route').slice(0, 3).map(t => (
            <div key={t.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">{t.tripId}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold">On Route</span>
              </div>
              <div className="flex gap-2 items-center text-[10px]">
                <span className="text-slate-400 font-bold">{t.pickupLocation.split(',')[0]}</span>
                <span className="text-slate-500">➔</span>
                <span className="text-emerald-400 font-bold">{t.destination.split(',')[0]}</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-brand-500 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
          {trips.filter(t => t.status === 'On Route').length === 0 && (
            <div className="col-span-3 text-center py-4 text-slate-500">
              No routes in-transit currently.
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search origin, driver, truck..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Dispatched">Dispatched</option>
            <option value="On Route">On Route</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Schedule trip Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition shadow-premium"
        >
          <Plus size={16} /> Dispatch Route
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/30">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none">
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('tripId')}>
                Trip ID <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4">Cargo / Weight</th>
              <th className="p-4">Origin Pickup</th>
              <th className="p-4">Destination</th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('departureDate')}>
                Departure Date <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4">Deploy Driver</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrips.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No cargo dispatches tracked.
                </td>
              </tr>
            ) : (
              paginatedTrips.map((t) => (
                <tr 
                  key={t.id} 
                  className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-all text-slate-300"
                >
                  <td className="p-4 font-bold text-slate-200">{t.tripId}</td>
                  <td className="p-4">{t.cargoType} <span className="text-[10px] text-slate-500 block font-semibold">{t.cargoWeight.toLocaleString()} KG</span></td>
                  <td className="p-4 font-medium">{t.pickupLocation}</td>
                  <td className="p-4 font-medium">{t.destination}</td>
                  <td className="p-4 font-mono font-medium">
                    {new Date(t.departureDate).toLocaleString()}
                  </td>
                  <td className="p-4">{t.driverName || <span className="text-slate-500 italic">Unassigned</span>}</td>
                  <td className="p-4 font-mono font-bold">{t.vehicleNumber ? `Truck ${t.vehicleNumber}` : <span className="text-slate-500 italic">None</span>}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${priorityColors[t.priority]}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-center relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === t.id ? null : t.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === t.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-4 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-premium z-35 py-1.5 animate-fade-in text-left">
                          <button
                            onClick={() => handleOpenDetails(t)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Eye size={12} /> View Details
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Edit2 size={12} /> Edit Details
                          </button>
                          <button
                            onClick={() => handleOpenStatus(t)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Calendar size={12} /> Update Status
                          </button>
                          {(t.status === 'On Route' || t.status === 'Dispatched') && (
                            <>
                              <button
                                onClick={() => handleCompleteTrip(t)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-emerald-400 flex items-center gap-2 transition"
                              >
                                <CheckCircle size={12} /> Complete Route
                              </button>
                              <button
                                onClick={() => handleCancelTrip(t)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-rose-455 flex items-center gap-2 transition"
                              >
                                <XCircle size={12} /> Cancel Dispatch
                              </button>
                            </>
                          )}
                          <div className="border-t border-slate-800 my-1" />
                          <button
                            onClick={() => handleOpenDelete(t)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition"
                          >
                            <Trash2 size={12} /> Delete Dispatch
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-2 select-none">
        <span className="text-slate-400">
          Showing {processedTrips.length === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, processedTrips.length)} of {processedTrips.length} routes
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-50 text-slate-300 rounded-xl transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-50 text-slate-300 rounded-xl transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Modals attachments */}
      <CreateEditTripModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        trip={selectedTrip}
        allTrips={trips}
        drivers={drivers}
        vehicles={vehicles}
        onSave={handleSaveTrip}
      />

      {selectedTrip && (
        <>
          <ViewTripDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            trip={selectedTrip}
            onEdit={() => {
              setIsDetailsOpen(false);
              handleOpenEdit(selectedTrip);
            }}
            onUpdateStatus={() => {
              setIsDetailsOpen(false);
              handleOpenStatus(selectedTrip);
            }}
          />

          <UpdateTripStatusModal
            isOpen={isStatusOpen}
            onClose={() => setIsStatusOpen(false)}
            trip={selectedTrip}
            onUpdate={handleUpdateStatus}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteTrip}
            itemName={selectedTrip.tripId}
            itemType="Trip"
          />
        </>
      )}
    </div>
  );
};
