import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, ArrowUpDown, ChevronLeft, ChevronRight, 
  MoreVertical, Eye, Edit2, Trash2, Link, FileSignature, ShieldAlert
} from 'lucide-react';
import { Driver, Vehicle } from '../data/database';
import { AddEditDriverModal, DriverDetailsModal, AssignVehicleModal, LicenseRenewalModal } from '../components/modals/DriverModals';
import { DeleteConfirmDialog } from '../components/modals/GlobalDialogs';

interface DriversViewProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onUpdateDrivers: (data: Driver[]) => void;
  onUpdateVehicles: (data: Vehicle[]) => void;
}

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  vehicles,
  onUpdateDrivers,
  onUpdateVehicles,
}) => {
  // Modal states
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>(undefined);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignVehicleOpen, setIsAssignVehicleOpen] = useState(false);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sortField, setSortField] = useState<'fullName' | 'experience'>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 5;

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Open Actions
  const handleOpenAdd = () => {
    setSelectedDriver(undefined);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setSelectedDriver(d);
    setIsAddEditOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDetails = (d: Driver) => {
    setSelectedDriver(d);
    setIsDetailsOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenAssign = (d: Driver) => {
    setSelectedDriver(d);
    setIsAssignVehicleOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenRenewal = (d: Driver) => {
    setSelectedDriver(d);
    setIsRenewalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDelete = (d: Driver) => {
    setSelectedDriver(d);
    setIsDeleteOpen(true);
    setActiveMenuId(null);
  };

  // Sorting
  const handleSort = (field: 'fullName' | 'experience') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Drivers
  const processedDrivers = useMemo(() => {
    return drivers
      .filter((d) => {
        const matchesSearch = 
          d.fullName.toLowerCase().includes(search.toLowerCase()) ||
          d.employeeId.toLowerCase().includes(search.toLowerCase()) ||
          d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
          d.mobile.includes(search);
        
        const matchesStatus = statusFilter ? d.driverStatus === statusFilter : true;
        const matchesClass = classFilter ? d.licenseCategory === classFilter : true;

        return matchesSearch && matchesStatus && matchesClass;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [drivers, search, statusFilter, classFilter, sortField, sortOrder]);

  // Paginated List
  const paginatedDrivers = useMemo(() => {
    const offset = (page - 1) * limit;
    return processedDrivers.slice(offset, offset + limit);
  }, [processedDrivers, page]);

  const totalPages = Math.ceil(processedDrivers.length / limit) || 1;

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedDrivers.map(d => d.id));
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
  const handleSaveDriver = (driverData: Driver) => {
    if (selectedDriver) {
      // Edit
      const updated = drivers.map(d => d.id === driverData.id ? driverData : d);
      onUpdateDrivers(updated);

      // Update matching vehicle if linked
      if (driverData.assignedVehicleId) {
        const updatedVehicles = vehicles.map(v => {
          if (v.id === driverData.assignedVehicleId) {
            return { ...v, assignedDriverId: driverData.id, assignedDriverName: driverData.fullName };
          }
          if (v.assignedDriverId === driverData.id && v.id !== driverData.assignedVehicleId) {
            return { ...v, assignedDriverId: undefined, assignedDriverName: undefined };
          }
          return v;
        });
        onUpdateVehicles(updatedVehicles);
      }
    } else {
      // Add
      onUpdateDrivers([...drivers, driverData]);
    }
  };

  const handleDeleteDriver = () => {
    if (!selectedDriver) return;

    // Clear driver association on vehicles
    const updatedVehicles = vehicles.map(v => 
      v.assignedDriverId === selectedDriver.id 
        ? { ...v, assignedDriverId: undefined, assignedDriverName: undefined, currentStatus: 'Available' as any } 
        : v
    );
    onUpdateVehicles(updatedVehicles);

    const updated = drivers.filter(d => d.id !== selectedDriver.id);
    onUpdateDrivers(updated);
    setIsDeleteOpen(false);
  };

  const handleAssignVehicle = (vehicleId: string | undefined) => {
    if (!selectedDriver) return;

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);

    // Update driver
    const updatedDrivers = drivers.map(d => {
      if (d.id === selectedDriver.id) {
        return {
          ...d,
          assignedVehicleId: vehicleId,
          assignedVehicleNumber: selectedVehicle ? selectedVehicle.vehicleNumber : undefined
        };
      }
      return d;
    });

    // Update vehicle links
    const updatedVehicles = vehicles.map(v => {
      // Unlink vehicle currently assigned to this driver
      if (v.assignedDriverId === selectedDriver.id && v.id !== vehicleId) {
        return { ...v, assignedDriverId: undefined, assignedDriverName: undefined };
      }
      // Link new vehicle
      if (v.id === vehicleId) {
        return { ...v, assignedDriverId: selectedDriver.id, assignedDriverName: selectedDriver.fullName };
      }
      return v;
    });

    onUpdateDrivers(updatedDrivers);
    onUpdateVehicles(updatedVehicles);
  };

  const handleRenewLicense = (expiryDate: string, licenseNo: string) => {
    if (!selectedDriver) return;
    const updated = drivers.map(d => 
      d.id === selectedDriver.id 
        ? { ...d, licenseExpiry: expiryDate, licenseNumber: licenseNo, driverStatus: 'Available' as any } 
        : d
    );
    onUpdateDrivers(updated);
  };

  // Bulk actions
  const handleBulkStatusChange = (status: 'Available' | 'On Leave' | 'Suspended') => {
    if (selectedIds.length === 0) return;
    const updated = drivers.map(d => 
      selectedIds.includes(d.id) ? { ...d, driverStatus: status } : d
    );
    onUpdateDrivers(updated);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    // Clear vehicle association
    const updatedVehicles = vehicles.map(v => 
      selectedIds.includes(v.assignedDriverId || '') 
        ? { ...v, assignedDriverId: undefined, assignedDriverName: undefined } 
        : v
    );
    onUpdateVehicles(updatedVehicles);

    const updated = drivers.filter(d => !selectedIds.includes(d.id));
    onUpdateDrivers(updated);
    setSelectedIds([]);
  };

  const isLicenseExpired = (d: Driver) => {
    const today = new Date();
    const days = Math.ceil((new Date(d.licenseExpiry).getTime() - today.getTime()) / (1000 * 3600 * 24));
    return days <= 30;
  };

  const statusColors = {
    Active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'On Leave': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-4 h-full flex flex-col text-xs">
      
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search Name, Emp ID, DL..."
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
            <option value="Available">Available</option>
            <option value="Active">On Duty</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none"
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option>Class A CDL</option>
            <option>Class B CDL</option>
            <option>Class C CDL</option>
            <option>Standard Operators</option>
          </select>
        </div>

        {/* Add Driver Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition shadow-premium"
        >
          <Plus size={16} /> Register Operator
        </button>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl animate-fade-in">
          <span className="text-slate-300 font-medium">{selectedIds.length} operators selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange('Available')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              Set Available
            </button>
            <button
              onClick={() => handleBulkStatusChange('On Leave')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              Set On Leave
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

      {/* Table */}
      <div className="flex-1 overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/30">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded text-brand-500 bg-slate-950 border-slate-800 w-4 h-4 focus:ring-brand-500"
                  onChange={handleSelectAll}
                  checked={paginatedDrivers.length > 0 && selectedIds.length === paginatedDrivers.length}
                />
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('fullName')}>
                Driver Name <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4">Employee ID</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">CDL Accreditation</th>
              <th className="p-4">License Expiration</th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('experience')}>
                Experience <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4">Allocated Truck</th>
              <th className="p-4">Status</th>
              <th className="p-4 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDrivers.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No operator profiles found.
                </td>
              </tr>
            ) : (
              paginatedDrivers.map((d) => (
                <tr 
                  key={d.id} 
                  className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-all text-slate-300"
                >
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded text-brand-500 bg-slate-950 border-slate-800 w-4 h-4 focus:ring-brand-500"
                      checked={selectedIds.includes(d.id)}
                      onChange={() => handleSelectOne(d.id)}
                    />
                  </td>
                  <td className="p-4 font-bold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      {d.fullName}
                      {isLicenseExpired(d) && (
                        <ShieldAlert size={14} className="text-amber-500 animate-pulse" title="Warning: License expiring soon or already expired" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-mono font-medium">{d.employeeId}</td>
                  <td className="p-4 font-medium">{d.mobile}</td>
                  <td className="p-4">{d.licenseCategory} <span className="text-[10px] text-slate-500 block font-mono">DL: {d.licenseNumber}</span></td>
                  <td className="p-4 font-mono">{d.licenseExpiry}</td>
                  <td className="p-4 font-semibold">{d.experience} Years</td>
                  <td className="p-4 font-bold">{d.assignedVehicleNumber ? `Truck ${d.assignedVehicleNumber}` : <span className="text-slate-500 italic">None</span>}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[d.driverStatus]}`}>
                      {d.driverStatus}
                    </span>
                  </td>
                  <td className="p-4 text-center relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === d.id ? null : d.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === d.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-4 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-premium z-30 py-1.5 animate-fade-in text-left">
                          <button
                            onClick={() => handleOpenDetails(d)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Eye size={12} /> View Dossier
                          </button>
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Edit2 size={12} /> Edit Profile
                          </button>
                          <button
                            onClick={() => handleOpenAssign(d)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Link size={12} /> Link Vehicle
                          </button>
                          <button
                            onClick={() => handleOpenRenewal(d)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <FileSignature size={12} /> Renew CDL
                          </button>
                          <div className="border-t border-slate-800 my-1" />
                          <button
                            onClick={() => handleOpenDelete(d)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition"
                          >
                            <Trash2 size={12} /> Delete Operator
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
          Showing {processedDrivers.length === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, processedDrivers.length)} of {processedDrivers.length} operators
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
      <AddEditDriverModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        driver={selectedDriver}
        allDrivers={drivers}
        vehicles={vehicles}
        onSave={handleSaveDriver}
      />

      {selectedDriver && (
        <>
          <DriverDetailsModal
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            driver={selectedDriver}
            onEdit={() => {
              setIsDetailsOpen(false);
              handleOpenEdit(selectedDriver);
            }}
            onAssignVehicle={() => {
              setIsDetailsOpen(false);
              handleOpenAssign(selectedDriver);
            }}
            onRenewLicense={() => {
              setIsDetailsOpen(false);
              handleOpenRenewal(selectedDriver);
            }}
          />

          <AssignVehicleModal
            isOpen={isAssignVehicleOpen}
            onClose={() => setIsAssignVehicleOpen(false)}
            driver={selectedDriver}
            vehicles={vehicles}
            onAssign={handleAssignVehicle}
          />

          <LicenseRenewalModal
            isOpen={isRenewalOpen}
            onClose={() => setIsRenewalOpen(false)}
            driver={selectedDriver}
            onRenew={handleRenewLicense}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteDriver}
            itemName={selectedDriver.fullName}
            itemType="Driver"
          />
        </>
      )}
    </div>
  );
};
