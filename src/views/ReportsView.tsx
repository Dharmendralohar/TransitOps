import React, { useState, useMemo } from 'react';
import { 
  Filter, Download, Calendar, BarChart2, TrendingUp, DollarSign, Fuel, Wrench
} from 'lucide-react';
import { Vehicle, Driver, Trip, MaintenanceRecord, FuelEntry, ExpenseRecord } from '../data/database';
import { ReportFiltersModal, ExportModal } from '../components/modals/ReportModals';

interface ReportsViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuel: FuelEntry[];
  expenses: ExpenseRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  vehicles,
  drivers,
  trips,
  maintenance,
  fuel,
  expenses,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    startDate: '',
    endDate: '',
    driverId: '',
    vehicleId: '',
    status: '',
    expenseType: '',
  });

  // Calculate filtered registries
  const filteredFuel = useMemo(() => {
    return fuel.filter(f => {
      if (activeFilters.vehicleId && f.vehicleId !== activeFilters.vehicleId) return false;
      if (activeFilters.driverId && f.driverId !== activeFilters.driverId) return false;
      if (activeFilters.startDate && f.date < activeFilters.startDate) return false;
      if (activeFilters.endDate && f.date > activeFilters.endDate) return false;
      return true;
    });
  }, [fuel, activeFilters]);

  const filteredMaint = useMemo(() => {
    return maintenance.filter(m => {
      if (activeFilters.vehicleId && m.vehicleId !== activeFilters.vehicleId) return false;
      if (activeFilters.startDate && m.serviceDate < activeFilters.startDate) return false;
      if (activeFilters.endDate && m.serviceDate > activeFilters.endDate) return false;
      if (activeFilters.status && m.status !== activeFilters.status) return false;
      return true;
    });
  }, [maintenance, activeFilters]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (activeFilters.vehicleId && e.vehicleId !== activeFilters.vehicleId) return false;
      if (activeFilters.expenseType && e.expenseType !== activeFilters.expenseType) return false;
      if (activeFilters.startDate && e.date < activeFilters.startDate) return false;
      if (activeFilters.endDate && e.date > activeFilters.endDate) return false;
      return true;
    });
  }, [expenses, activeFilters]);

  // Aggregate OPEX costs
  const opexFuel = filteredFuel.reduce((sum, f) => sum + f.fuelCost, 0);
  const opexMaint = filteredMaint.reduce((sum, m) => sum + m.cost, 0);
  const opexOther = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOpex = opexFuel + opexMaint + opexOther;

  // Chart Percentages
  const pctFuel = totalOpex > 0 ? (opexFuel / totalOpex) * 100 : 0;
  const pctMaint = totalOpex > 0 ? (opexMaint / totalOpex) * 100 : 0;
  const pctOther = totalOpex > 0 ? (opexOther / totalOpex) * 100 : 0;

  return (
    <div className="space-y-6 overflow-y-auto h-full pb-8 pr-1 no-scrollbar text-xs">
      
      {/* Top Banner Toolbar */}
      <div className="flex justify-between items-center bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar size={14} />
          <span>
            {activeFilters.startDate || 'All Time'} ➔ {activeFilters.endDate || 'Present'}
          </span>
          {Object.values(activeFilters).some(x => x !== '') && (
            <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold text-[9px]">
              Filters Active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 rounded-xl font-bold transition"
          >
            <Filter size={14} /> Filter Query
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition"
          >
            <Download size={14} /> Export Document
          </button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Fuel size={20} />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Refueling Cost</span>
            <h3 className="text-xl font-black text-slate-100 mt-0.5">${opexFuel.toLocaleString()}</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">{filteredFuel.length} refuels logged</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Wrench size={20} />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Servicing & Garage Cost</span>
            <h3 className="text-xl font-black text-slate-100 mt-0.5">${opexMaint.toLocaleString()}</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">{filteredMaint.length} repair tickets</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tolls & Other OPEX</span>
            <h3 className="text-xl font-black text-slate-100 mt-0.5">${opexOther.toLocaleString()}</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">{filteredExpenses.length} expense slips</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: OPEX allocation breakdown */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <TrendingUp size={16} className="text-brand-500" /> OPEX Cost Allocation
          </h3>
          <p className="text-slate-400">Granular allocation mapping of operational costs across categories.</p>
          
          <div className="relative pt-6 pb-2">
            {/* Horizontal Segmented Bar Chart */}
            <div className="w-full bg-slate-900 h-6 rounded-full overflow-hidden flex">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-full hover:brightness-110 transition-all" 
                style={{ width: `${pctFuel}%` }} 
                title={`Fuel Cost: ${pctFuel.toFixed(1)}%`}
              />
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full hover:brightness-110 transition-all" 
                style={{ width: `${pctMaint}%` }} 
                title={`Maintenance: ${pctMaint.toFixed(1)}%`}
              />
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full hover:brightness-110 transition-all" 
                style={{ width: `${pctOther}%` }} 
                title={`Tolls/Permits: ${pctOther.toFixed(1)}%`}
              />
            </div>

            {/* Labels legends */}
            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center p-2.5 bg-slate-900/40 border border-slate-850 rounded-xl">
                <span className="flex items-center gap-2 text-slate-300 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Fuel Quantity
                </span>
                <span className="text-slate-200 font-bold">${opexFuel.toLocaleString()} ({pctFuel.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-900/40 border border-slate-850 rounded-xl">
                <span className="flex items-center gap-2 text-slate-300 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maintenance Shop
                </span>
                <span className="text-slate-200 font-bold">${opexMaint.toLocaleString()} ({pctMaint.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-900/40 border border-slate-850 rounded-xl">
                <span className="flex items-center gap-2 text-slate-300 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tolls / Slips
                </span>
                <span className="text-slate-200 font-bold">${opexOther.toLocaleString()} ({pctOther.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Monthly Cost Bars */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <BarChart2 size={16} className="text-brand-500" /> Monthly Spending Trends (Q3-Q4)
          </h3>
          <p className="text-slate-400">Monthly progression of fuel vs mechanical workshop bills.</p>

          <div className="h-56 flex items-end justify-between gap-4 pt-8 border-b border-slate-800 pb-2 px-4">
            {/* Bar 1 - Jul */}
            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex gap-1.5 items-end h-full">
                <div className="w-4 bg-indigo-500/80 rounded-t-md hover:bg-indigo-500 transition-all" style={{ height: '70%' }} title="Fuel: $4,500" />
                <div className="w-4 bg-amber-500/80 rounded-t-md hover:bg-amber-500 transition-all" style={{ height: '30%' }} title="Maint: $1,900" />
              </div>
              <span className="text-slate-500 font-bold text-[10px]">July</span>
            </div>

            {/* Bar 2 - Aug */}
            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex gap-1.5 items-end h-full">
                <div className="w-4 bg-indigo-500/80 rounded-t-md hover:bg-indigo-500 transition-all" style={{ height: '80%' }} title="Fuel: $5,200" />
                <div className="w-4 bg-amber-500/80 rounded-t-md hover:bg-amber-500 transition-all" style={{ height: '45%' }} title="Maint: $2,800" />
              </div>
              <span className="text-slate-500 font-bold text-[10px]">August</span>
            </div>

            {/* Bar 3 - Sep */}
            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex gap-1.5 items-end h-full">
                <div className="w-4 bg-indigo-500/80 rounded-t-md hover:bg-indigo-500 transition-all" style={{ height: '65%' }} title="Fuel: $4,200" />
                <div className="w-4 bg-amber-500/80 rounded-t-md hover:bg-amber-500 transition-all" style={{ height: '20%' }} title="Maint: $1,200" />
              </div>
              <span className="text-slate-500 font-bold text-[10px]">September</span>
            </div>

            {/* Bar 4 - Oct */}
            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex gap-1.5 items-end h-full">
                <div className="w-4 bg-indigo-500/80 rounded-t-md hover:bg-indigo-500 transition-all" style={{ height: '85%' }} title="Fuel: $5,500" />
                <div className="w-4 bg-amber-500/80 rounded-t-md hover:bg-amber-500 transition-all" style={{ height: '60%' }} title="Maint: $3,900" />
              </div>
              <span className="text-slate-500 font-bold text-[10px]">October</span>
            </div>

            {/* Bar 5 - Nov */}
            <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex gap-1.5 items-end h-full">
                <div className="w-4 bg-indigo-500/80 rounded-t-md hover:bg-indigo-500 transition-all" style={{ height: '90%' }} title="Fuel: $6,000" />
                <div className="w-4 bg-amber-500/80 rounded-t-md hover:bg-amber-500 transition-all" style={{ height: '35%' }} title="Maint: $2,100" />
              </div>
              <span className="text-slate-500 font-bold text-[10px]">November</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals attachments */}
      <ReportFiltersModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        drivers={drivers}
        vehicles={vehicles}
        onApply={setActiveFilters}
      />

      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        reportName="fleet_opex_analytics_report"
      />
    </div>
  );
};
