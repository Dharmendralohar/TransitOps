import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, ArrowUpDown, ChevronLeft, ChevronRight, 
  MoreVertical, Eye, Edit2, Trash2, Fuel, DollarSign, Paperclip
} from 'lucide-react';
import { FuelEntry, ExpenseRecord, Vehicle, Driver } from '../data/database';
import { AddEditFuelModal, AddEditExpenseModal, ExpenseDetailsModal } from '../components/modals/FuelModals';
import { DeleteConfirmDialog } from '../components/modals/GlobalDialogs';

interface FuelExpensesViewProps {
  fuel: FuelEntry[];
  expenses: ExpenseRecord[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onUpdateFuel: (data: FuelEntry[]) => void;
  onUpdateExpenses: (data: ExpenseRecord[]) => void;
}

export const FuelExpensesView: React.FC<FuelExpensesViewProps> = ({
  fuel,
  expenses,
  vehicles,
  drivers,
  onUpdateFuel,
  onUpdateExpenses,
}) => {
  // Tabs: 'fuel' or 'expenses'
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');

  // Modal triggers
  const [selectedFuel, setSelectedFuel] = useState<FuelEntry | undefined>(undefined);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | undefined>(undefined);

  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isExpenseDetailsOpen, setIsExpenseDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 5;

  // Open Actions
  const handleOpenAddFuel = () => {
    setSelectedFuel(undefined);
    setIsFuelOpen(true);
  };

  const handleOpenEditFuel = (f: FuelEntry) => {
    setSelectedFuel(f);
    setIsFuelOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenAddExpense = () => {
    setSelectedExpense(undefined);
    setIsExpenseOpen(true);
  };

  const handleOpenEditExpense = (e: ExpenseRecord) => {
    setSelectedExpense(e);
    setIsExpenseOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenExpenseDetails = (e: ExpenseRecord) => {
    setSelectedExpense(e);
    setIsExpenseDetailsOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenDelete = (item: FuelEntry | ExpenseRecord) => {
    if (activeTab === 'fuel') {
      setSelectedFuel(item as FuelEntry);
    } else {
      setSelectedExpense(item as ExpenseRecord);
    }
    setIsDeleteOpen(true);
    setActiveMenuId(null);
  };

  // Sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered & Sorted Lists
  const processedFuel = useMemo(() => {
    if (activeTab !== 'fuel') return [];
    return fuel
      .filter((f) => {
        return (
          f.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
          f.driverName.toLowerCase().includes(search.toLowerCase()) ||
          f.fuelStation.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => {
        if (sortField === 'fuelCost') {
          return sortOrder === 'asc' ? a.fuelCost - b.fuelCost : b.fuelCost - a.fuelCost;
        }
        if (sortField === 'fuelQuantity') {
          return sortOrder === 'asc' ? a.fuelQuantity - b.fuelQuantity : b.fuelQuantity - a.fuelQuantity;
        }
        return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      });
  }, [fuel, search, sortField, sortOrder, activeTab]);

  const processedExpenses = useMemo(() => {
    if (activeTab !== 'expenses') return [];
    return expenses
      .filter((e) => {
        return (
          e.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
          e.expenseType.toLowerCase().includes(search.toLowerCase()) ||
          e.vendor.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => {
        if (sortField === 'amount') {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
        return sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      });
  }, [expenses, search, sortField, sortOrder, activeTab]);

  const listLength = activeTab === 'fuel' ? processedFuel.length : processedExpenses.length;
  const totalPages = Math.ceil(listLength / limit) || 1;

  // Paginated lists
  const paginatedList = useMemo(() => {
    const offset = (page - 1) * limit;
    return activeTab === 'fuel'
      ? processedFuel.slice(offset, offset + limit)
      : processedExpenses.slice(offset, offset + limit);
  }, [processedFuel, processedExpenses, activeTab, page]);

  // CRUD handlers
  const handleSaveFuel = (newFuel: FuelEntry) => {
    if (selectedFuel) {
      onUpdateFuel(fuel.map(f => f.id === newFuel.id ? newFuel : f));
    } else {
      onUpdateFuel([...fuel, newFuel]);
    }
  };

  const handleSaveExpense = (newExp: ExpenseRecord) => {
    if (selectedExpense) {
      onUpdateExpenses(expenses.map(e => e.id === newExp.id ? newExp : e));
    } else {
      onUpdateExpenses([...expenses, newExp]);
    }
  };

  const handleDeleteConfirm = () => {
    if (activeTab === 'fuel' && selectedFuel) {
      onUpdateFuel(fuel.filter(f => f.id !== selectedFuel.id));
    } else if (activeTab === 'expenses' && selectedExpense) {
      onUpdateExpenses(expenses.filter(e => e.id !== selectedExpense.id));
    }
    setIsDeleteOpen(false);
  };

  return (
    <div className="space-y-4 h-full flex flex-col text-xs">
      
      {/* Sub tabs Navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => {
            setActiveTab('fuel');
            setSearch('');
            setPage(1);
            setSortField('date');
          }}
          className={`flex items-center gap-1.5 px-4 py-3 font-bold border-b-2 transition ${
            activeTab === 'fuel' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fuel size={14} /> Refueling Logs
        </button>
        <button
          onClick={() => {
            setActiveTab('expenses');
            setSearch('');
            setPage(1);
            setSortField('date');
          }}
          className={`flex items-center gap-1.5 px-4 py-3 font-bold border-b-2 transition ${
            activeTab === 'expenses' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign size={14} /> Expense Registry
        </button>
      </div>

      {/* Action Toolbar */}
      <div className="flex justify-between items-center">
        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'fuel' ? 'Search station, truck...' : 'Search category, vendor...'}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Add Actions */}
        {activeTab === 'fuel' ? (
          <button
            onClick={handleOpenAddFuel}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition"
          >
            <Plus size={16} /> Log Refueling
          </button>
        ) : (
          <button
            onClick={handleOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition"
          >
            <Plus size={16} /> Log Expense
          </button>
        )}
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/30">
        <table className="w-full text-left border-collapse min-w-[800px]">
          {activeTab === 'fuel' ? (
            // Refueling logs layout
            <>
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none">
                  <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('date')}>
                    Filling Date <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4">Vehicle ID</th>
                  <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('fuelQuantity')}>
                    Volume (Liters) <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('fuelCost')}>
                    Fuel Cost (USD) <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4">Odometer Reading</th>
                  <th className="p-4">Station / vendor</th>
                  <th className="p-4">Operator</th>
                  <th className="p-4 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No refueling entries found.
                    </td>
                  </tr>
                ) : (
                  (paginatedList as FuelEntry[]).map((f) => (
                    <tr 
                      key={f.id} 
                      className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-all text-slate-300"
                    >
                      <td className="p-4 font-mono font-medium">{f.date}</td>
                      <td className="p-4 font-bold text-slate-200">Truck {f.vehicleNumber}</td>
                      <td className="p-4 font-semibold">{f.fuelQuantity.toLocaleString()} L</td>
                      <td className="p-4 font-semibold text-slate-100">${f.fuelCost.toLocaleString()}</td>
                      <td className="p-4 font-mono">{f.odometerReading.toLocaleString()} KM</td>
                      <td className="p-4 font-medium">{f.fuelStation}</td>
                      <td className="p-4">{f.driverName}</td>
                      <td className="p-4 text-center relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === f.id ? null : f.id)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === f.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-4 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-premium z-30 py-1.5 animate-fade-in text-left">
                              <button
                                onClick={() => handleOpenEditFuel(f)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                              >
                                <Edit2 size={12} /> Edit Entry
                              </button>
                              <div className="border-t border-slate-800 my-1" />
                              <button
                                onClick={() => handleOpenDelete(f)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition"
                              >
                                <Trash2 size={12} /> Delete Entry
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          ) : (
            // Expense registry layout
            <>
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none">
                  <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('date')}>
                    Date <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4">Expense Category</th>
                  <th className="p-4">Vehicle ID</th>
                  <th className="p-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('amount')}>
                    Amount (USD) <ArrowUpDown size={12} className="inline ml-1" />
                  </th>
                  <th className="p-4">Vendor / Merchant</th>
                  <th className="p-4">Attachment</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No expense records logged.
                    </td>
                  </tr>
                ) : (
                  (paginatedList as ExpenseRecord[]).map((e) => (
                    <tr 
                      key={e.id} 
                      className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-all text-slate-300"
                    >
                      <td className="p-4 font-mono font-medium">{e.date}</td>
                      <td className="p-4 font-bold text-slate-200">{e.expenseType}</td>
                      <td className="p-4 font-mono font-medium">Truck {e.vehicleNumber}</td>
                      <td className="p-4 font-semibold text-slate-100">${e.amount.toLocaleString()}</td>
                      <td className="p-4 font-medium">{e.vendor}</td>
                      <td className="p-4">
                        {e.receiptUrl ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <Paperclip size={10} /> Receipt
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">None</span>
                        )}
                      </td>
                      <td className="p-4 truncate max-w-[200px] text-slate-400">{e.description}</td>
                      <td className="p-4 text-center relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === e.id ? null : e.id)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === e.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-4 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-premium z-30 py-1.5 animate-fade-in text-left">
                              <button
                                onClick={() => handleOpenExpenseDetails(e)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                              >
                                <Eye size={12} /> View Details
                              </button>
                              <button
                                onClick={() => handleOpenEditExpense(e)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                              >
                                <Edit2 size={12} /> Edit Details
                              </button>
                              <div className="border-t border-slate-800 my-1" />
                              <button
                                onClick={() => handleOpenDelete(e)}
                                className="w-full px-4 py-2 hover:bg-slate-800 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition"
                              >
                                <Trash2 size={12} /> Delete Record
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between p-2 select-none">
        <span className="text-slate-400">
          Showing {listLength === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, listLength)} of {listLength} entries
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
      <AddEditFuelModal
        isOpen={isFuelOpen}
        onClose={() => setIsFuelOpen(false)}
        entry={selectedFuel}
        vehicles={vehicles}
        drivers={drivers}
        onSave={handleSaveFuel}
      />

      <AddEditExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        expense={selectedExpense}
        vehicles={vehicles}
        onSave={handleSaveExpense}
      />

      {selectedExpense && (
        <ExpenseDetailsModal
          isOpen={isExpenseDetailsOpen}
          onClose={() => setIsExpenseDetailsOpen(false)}
          expense={selectedExpense}
        />
      )}

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={activeTab === 'fuel' ? `Fuel Log (${selectedFuel?.date})` : `Expense Record (${selectedExpense?.expenseType})`}
        itemType={activeTab === 'fuel' ? 'Fuel Entry' : 'Expense Record'}
      />
    </div>
  );
};
