import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Filter, ArrowUpDown, ChevronLeft, ChevronRight, 
  MoreVertical, Eye, Edit2, Copy, Trash2, UserPlus, History, ShieldAlert
} from 'lucide-react';
import { Vehicle, Driver, Trip, MaintenanceRecord, FuelEntry, ExpenseRecord } from '../data/database';
import { AddEditVehicleModal, ViewVehicleDetailsModal, AssignDriverModal, VehicleHistoryModal } from '../components/modals/VehicleModals';
import { DeleteConfirmDialog } from '../components/modals/GlobalDialogs';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuel: FuelEntry[];
  expenses: ExpenseRecord[];
  onUpdateVehicles: (data: Vehicle[]) => void;
  onUpdateDrivers: (data: Driver[]) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  drivers,
  trips,
  maintenance,
  fuel,
  expenses,
  onUpdateVehicles,
  onUpdateDrivers,
}) => {
  // Modal states
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [sortField, setSortField] = useState<'vehicleNumber' | 'capacity' | 'manufacturingYear'>('vehicleNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 5;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Open Actions
  const handleOpenAdd = () => {
    setSelectedVehicle(undefined);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsAddEditOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDetails = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsDetailsOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenAssign = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsAssignDriverOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenHistory = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsHistoryOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDelete = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsDeleteOpen(true);
    setActiveMenuId(null);
  };

  const handleDuplicate = (v: Vehicle) => {
    const duplicated: Vehicle = {
      ...v,
      id: `v-${Math.random().toString(36).substring(2, 9)}`,
      vehicleNumber: `${v.vehicleNumber}-DUP`,
      registrationNumber: `${v.registrationNumber}-DUP`,
      assignedDriverId: undefined,
      assignedDriverName: undefined,
      currentStatus: 'Available'
    };
    onUpdateVehicles([...vehicles, duplicated]);
    setActiveMenuId(null);
  };

  // Sorting
  const handleSort = (field: 'vehicleNumber' | 'capacity' | 'manufacturingYear') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Vehicles
  const processedVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        const matchesSearch = 
          v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
          v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
          v.brand.toLowerCase().includes(search.toLowerCase()) ||
          v.model.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter ? v.currentStatus === statusFilter : true;
        const matchesFuel = fuelFilter ? v.fuelType === fuelFilter : true;

        return matchesSearch && matchesStatus && matchesFuel;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [vehicles, search, statusFilter, fuelFilter, sortField, sortOrder]);

  // Paginated List
  const paginatedVehicles = useMemo(() => {
    const offset = (page - 1) * limit;
    return processedVehicles.slice(offset, offset + limit);
  }, [processedVehicles, page]);

  const totalPages = Math.ceil(processedVehicles.length / limit) || 1;

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedVehicles.map(v => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // CRUD events
  const handleSaveVehicle = (vehicleData: Vehicle) => {
    if (selectedVehicle) {
      // Edit
      const updated = vehicles.map(v => v.id === vehicleData.id ? vehicleData : v);
      onUpdateVehicles(updated);
      
      // Update matching driver if assigned
      if (vehicleData.assignedDriverId) {
        const updatedDrivers = drivers.map(d => {
          if (d.id === vehicleData.assignedDriverId) {
            return { ...d, assignedVehicleId: vehicleData.id, assignedVehicleNumber: vehicleData.vehicleNumber };
          }
          if (d.assignedVehicleId === vehicleData.id && d.id !== vehicleData.assignedDriverId) {
            return { ...d, assignedVehicleId: undefined, assignedVehicleNumber: undefined };
          }
          return d;
        });
        onUpdateDrivers(updatedDrivers);
      }
    } else {
      // Add
      onUpdateVehicles([...vehicles, vehicleData]);
    }
  };

  const handleDeleteVehicle = () => {
    if (!selectedVehicle) return;
    
    // Clear vehicle association on drivers
    const updatedDrivers = drivers.map(d => 
      d.assignedVehicleId === selectedVehicle.id 
        ? { ...d, assignedVehicleId: undefined, assignedVehicleNumber: undefined, driverStatus: 'Available' as any } 
        : d
    );
    onUpdateDrivers(updatedDrivers);

    const updated = vehicles.filter(v => v.id !== selectedVehicle.id);
    onUpdateVehicles(updated);
    setIsDeleteOpen(false);
  };

  const handleAssignDriver = (driverId: string | undefined) => {
    if (!selectedVehicle) return;

    const selectedDriver = drivers.find(d => d.id === driverId);

    // Update vehicle
    const updatedVehicles = vehicles.map(v => {
      if (v.id === selectedVehicle.id) {
        return {
          ...v,
          assignedDriverId: driverId,
          assignedDriverName: selectedDriver ? selectedDriver.fullName : undefined
        };
      }
      return v;
    });

    // Update driver link
    const updatedDrivers = drivers.map(d => {
      // Unlink driver currently assigned to this vehicle
      if (d.assignedVehicleId === selectedVehicle.id && d.id !== driverId) {
        return { ...d, assignedVehicleId: undefined, assignedVehicleNumber: undefined };
      }
      // Link new driver
      if (d.id === driverId) {
        return { ...d, assignedVehicleId: selectedVehicle.id, assignedVehicleNumber: selectedVehicle.vehicleNumber };
      }
      return d;
    });

    onUpdateVehicles(updatedVehicles);
    onUpdateDrivers(updatedDrivers);
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    // Clear associations
    const updatedDrivers = drivers.map(d => 
      selectedIds.includes(d.assignedVehicleId || '') 
        ? { ...d, assignedVehicleId: undefined, assignedVehicleNumber: undefined } 
        : d
    );
    onUpdateDrivers(updatedDrivers);

    const updated = vehicles.filter(v => !selectedIds.includes(v.id));
    onUpdateVehicles(updated);
    setSelectedIds([]);
  };

  const handleBulkStatusChange = (status: 'Active' | 'Available' | 'Inactive') => {
    if (selectedIds.length === 0) return;
    const updated = vehicles.map(v => 
      selectedIds.includes(v.id) ? { ...v, currentStatus: status } : v
    );
    onUpdateVehicles(updated);
    setSelectedIds([]);
  };

  // Check warnings for DMV Expiry
  const isExpiringSoon = (v: Vehicle) => {
    const today = new Date();
    const insDays = Math.ceil((new Date(v.insuranceExpiry).getTime() - today.getTime()) / (1000 * 3600 * 24));
    const regDays = Math.ceil((new Date(v.registrationExpiry).getTime() - today.getTime()) / (1000 * 3600 * 24));
    return insDays <= 30 || regDays <= 30;
  };

  const statusColors = {
    Active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'In Service': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Inactive: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-4 h-full flex flex-col text-xs">
      
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Search & Filter Inputs */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search ID, brand, plates..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Available">Available</option>
            <option value="In Service">In Service</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Fuel Filter */}
          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
            value={fuelFilter}
            onChange={(e) => {
              setFuelFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Fuels</option>
            <option value="Diesel">Diesel</option>
            <option value="Petrol">Petrol</option>
            <option value="Electric">Electric</option>
            <option value="CNG">CNG</option>
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition shadow-premium"
        >
          <Plus size={16} /> Register Truck
        </button>
      </div>

      {/* Bulk Action Controls */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl animate-fade-in">
          <span className="text-slate-300 font-medium">{selectedIds.length} vehicles selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange('Available')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              Set Available
            </button>
            <button
              onClick={() => handleBulkStatusChange('Inactive')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              Set Inactive
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg transition"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/30">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded text-brand-500 bg-slate-950 border-slate-800 w-4 h-4 focus:ring-brand-500"
                  onChange={handleSelectAll}
                  checked={paginatedVehicles.length > 0 && selectedIds.length === paginatedVehicles.length}
                />
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('vehicleNumber')}>
                Vehicle ID <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4">Reg Plate</th>
              <th className="p-4">Brand & Model</th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('capacity')}>
                Capacity (KG) <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('manufacturingYear')}>
                Year <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4">Assigned Driver</th>
              <th className="p-4">Status</th>
              <th className="p-4 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedVehicles.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  No vehicle profiles matched the search criteria.
                </td>
              </tr>
            ) : (
              paginatedVehicles.map((v) => (
                <tr 
                  key={v.id} 
                  className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-all text-slate-300"
                >
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded text-brand-500 bg-slate-950 border-slate-800 w-4 h-4 focus:ring-brand-500"
                      checked={selectedIds.includes(v.id)}
                      onChange={() => handleSelectOne(v.id)}
                    />
                  </td>
                  <td className="p-4 font-bold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      {v.vehicleNumber}
                      {isExpiringSoon(v) && (
                        <ShieldAlert size={14} className="text-amber-500 animate-pulse" title="Compliance warning: Registration or Insurance expiring soon" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-medium">{v.registrationNumber}</td>
                  <td className="p-4">{v.brand} {v.model} <span className="text-[10px] text-slate-500 block">{v.vehicleType}</span></td>
                  <td className="p-4 font-semibold">{v.capacity.toLocaleString()} KG</td>
                  <td className="p-4 font-medium">{v.manufacturingYear}</td>
                  <td className="p-4">{v.assignedDriverName || <span className="text-slate-500 italic">Unassigned</span>}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[v.currentStatus]}`}>
                      {v.currentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-center relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === v.id ? null : v.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === v.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-4 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-premium z-30 py-1.5 animate-fade-in text-left">
                          <button
                            onClick={() => handleOpenDetails(v)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Eye size={12} /> View Specs
                          </button>
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Edit2 size={12} /> Edit Profile
                          </button>
                          <button
                            onClick={() => handleDuplicate(v)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Copy size={12} /> Duplicate
                          </button>
                          <button
                            onClick={() => handleOpenAssign(v)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <UserPlus size={12} /> Assign Operator
                          </button>
                          <button
                            onClick={() => handleOpenHistory(v)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <History size={12} /> History Timeline
                          </button>
                          <div className="border-t border-slate-800 my-1" />
                          <button
                            onClick={() => handleOpenDelete(v)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition"
                          >
                            <Trash2 size={12} /> Delete Truck
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
          Showing {processedVehicles.length === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, processedVehicles.length)} of {processedVehicles.length} trucks
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

      {/* Modals Attachments */}
      <AddEditVehicleModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        vehicle={selectedVehicle}
        allVehicles={vehicles}
        drivers={drivers}
        onSave={handleSaveVehicle}
      />

      {selectedVehicle && (
        <>
          <ViewVehicleDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            vehicle={selectedVehicle}
            onEdit={() => {
              setIsDetailsOpen(false);
              handleOpenEdit(selectedVehicle);
            }}
            onAssignDriver={() => {
              setIsDetailsOpen(false);
              handleOpenAssign(selectedVehicle);
            }}
          />

          <AssignDriverModal
            isOpen={isAssignDriverOpen}
            onClose={() => setIsAssignDriverOpen(false)}
            vehicle={selectedVehicle}
            drivers={drivers}
            onAssign={handleAssignDriver}
          />

          <VehicleHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            vehicle={selectedVehicle}
            trips={trips}
            maintenance={maintenance}
            fuel={fuel}
            expenses={expenses}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteVehicle}
            itemName={selectedVehicle.vehicleNumber}
            itemType="Vehicle"
          />
        </>
      )}
    </div>
  );
};
