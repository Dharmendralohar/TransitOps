import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, ArrowUpDown, ChevronLeft, ChevronRight, 
  MoreVertical, Eye, Edit2, CheckCircle, Trash2, Calendar, Wrench
} from 'lucide-react';
import { MaintenanceRecord, Vehicle } from '../data/database';
import { ScheduleEditMaintenanceModal, MarkCompletedModal, ViewServiceHistoryModal } from '../components/modals/MaintenanceModals';
import { DeleteConfirmDialog } from '../components/modals/GlobalDialogs';

interface MaintenanceViewProps {
  maintenance: MaintenanceRecord[];
  vehicles: Vehicle[];
  onUpdateMaintenance: (data: MaintenanceRecord[]) => void;
  onUpdateVehicles: (data: Vehicle[]) => void;
  rolePermissions?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
  };
  currencySymbol?: string;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  vehicles,
  onUpdateMaintenance,
  onUpdateVehicles,
  rolePermissions,
  currencySymbol = '$',
}) => {
  const canCreate = rolePermissions ? rolePermissions.create : true;
  const canEdit = rolePermissions ? rolePermissions.edit : true;
  const canDelete = rolePermissions ? rolePermissions.delete : true;
  // Modal states
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | undefined>(undefined);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<'serviceDate' | 'cost'>('serviceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 5;

  // Open Actions
  const handleOpenAdd = () => {
    setSelectedRecord(undefined);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (m: MaintenanceRecord) => {
    setSelectedRecord(m);
    setIsAddEditOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDetails = (m: MaintenanceRecord) => {
    setSelectedRecord(m);
    setIsDetailsOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenComplete = (m: MaintenanceRecord) => {
    setSelectedRecord(m);
    setIsCompleteOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDelete = (m: MaintenanceRecord) => {
    setSelectedRecord(m);
    setIsDeleteOpen(true);
    setActiveMenuId(null);
  };

  // Sorting
  const handleSort = (field: 'serviceDate' | 'cost') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted
  const processedRecords = useMemo(() => {
    return maintenance
      .filter((m) => {
        const matchesSearch = 
          m.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
          m.serviceType.toLowerCase().includes(search.toLowerCase()) ||
          m.workshop.toLowerCase().includes(search.toLowerCase()) ||
          m.technician.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter ? m.status === statusFilter : true;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === 'cost') {
          return sortOrder === 'asc' ? a.cost - b.cost : b.cost - a.cost;
        }
        return sortOrder === 'asc' ? a.serviceDate.localeCompare(b.serviceDate) : b.serviceDate.localeCompare(a.serviceDate);
      });
  }, [maintenance, search, statusFilter, sortField, sortOrder]);

  // Paginated List
  const paginatedRecords = useMemo(() => {
    const offset = (page - 1) * limit;
    return processedRecords.slice(offset, offset + limit);
  }, [processedRecords, page]);

  const totalPages = Math.ceil(processedRecords.length / limit) || 1;

  // CRUD events
  const handleSaveRecord = (recordData: MaintenanceRecord) => {
    if (selectedRecord) {
      // Edit
      const updated = maintenance.map(m => m.id === recordData.id ? recordData : m);
      onUpdateMaintenance(updated);
    } else {
      // Add
      onUpdateMaintenance([...maintenance, recordData]);
    }

    // Set Vehicle Status to In Service if maintenance is Scheduled
    if (recordData.status === 'Scheduled') {
      onUpdateVehicles(vehicles.map(v => v.id === recordData.vehicleId ? { ...v, currentStatus: 'In Service' as const } : v));
    } else {
      onUpdateVehicles(vehicles.map(v => v.id === recordData.vehicleId ? { ...v, currentStatus: 'Available' as const } : v));
    }
  };

  const handleDeleteRecord = () => {
    if (!selectedRecord) return;
    
    // Free vehicle back to available if delete an active scheduled maintenance
    if (selectedRecord.status === 'Scheduled') {
      onUpdateVehicles(vehicles.map(v => v.id === selectedRecord.vehicleId ? { ...v, currentStatus: 'Available' as const } : v));
    }

    const updated = maintenance.filter(m => m.id !== selectedRecord.id);
    onUpdateMaintenance(updated);
    setIsDeleteOpen(false);
  };

  const handleCompleteRecord = (finalCost: number, finalNotes: string) => {
    if (!selectedRecord) return;

    // Complete ticket
    const updated = maintenance.map(m => 
      m.id === selectedRecord.id 
        ? { ...m, status: 'Completed' as const, cost: finalCost, notes: finalNotes } 
        : m
    );
    onUpdateMaintenance(updated);

    // Make vehicle available again
    onUpdateVehicles(vehicles.map(v => v.id === selectedRecord.vehicleId ? { ...v, currentStatus: 'Available' as const } : v));
  };

  const statusColors = {
    Scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
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
              placeholder="Search truck, service, garage..."
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
            <option value="">All Tickets</option>
            <option value="Scheduled">Scheduled (Active)</option>
            <option value="Completed">Completed (History)</option>
          </select>
        </div>

        {/* Schedule Button */}
        {canCreate && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition shadow-premium"
          >
            <Plus size={16} /> Schedule Service
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/30">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none">
              <th className="p-4">Vehicle ID</th>
              <th className="p-4">Service Type</th>
              <th className="p-4">Workshop / garage</th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('serviceDate')}>
                Service Date <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('cost')}>
                Cost (USD) <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="p-4">Technician</th>
              <th className="p-4">Status</th>
              <th className="p-4 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No maintenance tickets logged.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((m) => (
                <tr 
                  key={m.id} 
                  className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-all text-slate-300"
                >
                  <td className="p-4 font-bold text-slate-200">Truck {m.vehicleNumber}</td>
                  <td className="p-4 font-medium">{m.serviceType}</td>
                  <td className="p-4">{m.workshop}</td>
                  <td className="p-4 font-mono">{m.serviceDate}</td>
                  <td className="p-4 font-semibold text-slate-100">{currencySymbol}{m.cost.toLocaleString()}</td>
                  <td className="p-4 font-medium">{m.technician}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[m.status]}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4 text-center relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === m.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-4 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-premium z-30 py-1.5 animate-fade-in text-left">
                          <button
                            onClick={() => handleOpenDetails(m)}
                            className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Eye size={12} /> View Report
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                              >
                                <Edit2 size={12} /> Edit Details
                              </button>
                              {m.status === 'Scheduled' && (
                                <button
                                  onClick={() => handleOpenComplete(m)}
                                  className="w-full px-4 py-2 hover:bg-slate-800 text-emerald-400 flex items-center gap-2 transition"
                                >
                                  <CheckCircle size={12} /> Mark Resolved
                                </button>
                              )}
                            </>
                          )}
                          {canDelete && (
                            <>
                              <div className="border-t border-slate-800 my-1" />
                              <button
                                onClick={() => handleOpenDelete(m)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition"
                              >
                                <Trash2 size={12} /> Delete Ticket
                              </button>
                            </>
                          )}
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
          Showing {processedRecords.length === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, processedRecords.length)} of {processedRecords.length} tickets
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
      <ScheduleEditMaintenanceModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        record={selectedRecord}
        vehicles={vehicles}
        onSave={handleSaveRecord}
        currencySymbol={currencySymbol}
      />

      {selectedRecord && (
        <>
          <ViewServiceHistoryModal
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            record={selectedRecord}
            currencySymbol={currencySymbol}
          />

          <MarkCompletedModal
            isOpen={isCompleteOpen}
            onClose={() => setIsCompleteOpen(false)}
            record={selectedRecord}
            onComplete={handleCompleteRecord}
            currencySymbol={currencySymbol}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteRecord}
            itemName={`${selectedRecord.serviceType} (Truck ${selectedRecord.vehicleNumber})`}
            itemType="Maintenance Record"
          />
        </>
      )}
    </div>
  );
};
