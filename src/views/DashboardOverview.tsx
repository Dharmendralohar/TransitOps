import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Activity, Truck, Users, Navigation, Wrench, 
  AlertTriangle, ShieldAlert, ChevronRight, Fuel, DollarSign,
  Play, CheckCircle, Clock, FileText
} from 'lucide-react';
import { Vehicle, Driver, Trip, MaintenanceRecord, FuelEntry, ExpenseRecord } from '../data/database';

interface DashboardProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuel: FuelEntry[];
  expenses: ExpenseRecord[];
  onNavigate: (view: string) => void;
}

export const DashboardOverview: React.FC<DashboardProps> = ({
  vehicles,
  drivers,
  trips,
  maintenance,
  fuel,
  expenses,
  onNavigate,
}) => {
  // Filters State
  const [search, setSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  // Interactive Stats Calculation (Actual counts from database)
  const activeVehiclesVal = vehicles.filter(v => v.currentStatus === 'Active').length;
  const availableVehiclesVal = vehicles.filter(v => v.currentStatus === 'Available').length;
  const maintVehiclesVal = vehicles.filter(v => v.currentStatus === 'In Service').length;

  const activeTripsVal = trips.filter(t => t.status === 'On Route' || t.status === 'Dispatched').length;
  const pendingTripsVal = trips.filter(t => t.status === 'Pending').length;
  const driversDutyVal = drivers.filter(d => d.driverStatus === 'Active' || d.driverStatus === 'On Trip').length;
  
  // Utilization formula
  const totalVehiclesCount = vehicles.length;
  const utilizationVal = totalVehiclesCount > 0 
    ? Math.min(100, Math.round((activeVehiclesVal / totalVehiclesCount) * 100)) 
    : 0;

  // Warning calculations
  const expiredCDLs = drivers.filter(d => {
    const days = Math.ceil((new Date(d.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return days <= 0;
  });

  const warningVehicles = vehicles.filter(v => {
    const daysIns = Math.ceil((new Date(v.insuranceExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    const daysReg = Math.ceil((new Date(v.registrationExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysIns <= 30 || daysReg <= 30;
  });

  const urgentWarningsCount = expiredCDLs.length + warningVehicles.length;

  // Recent Trips combine mockup list + database list
  const mockupRecentTrips = [
    { tripId: 'TR001', vehicleNumber: 'VAN-05', driverName: 'Alex', status: 'On Trip', eta: '45 min' },
    { tripId: 'TR002', vehicleNumber: 'TRK-12', driverName: 'John', status: 'Completed', eta: '--' },
    { tripId: 'TR003', vehicleNumber: 'MINI-08', driverName: 'Priya', status: 'Dispatched', eta: 'In 10m' },
    { tripId: 'TR004', vehicleNumber: '--', driverName: '--', status: 'Draft', eta: 'Awaiting vehicle' },
  ];

  const databaseRecentTrips = trips.map(t => ({
    tripId: t.tripId,
    vehicleNumber: t.vehicleNumber,
    driverName: t.driverName,
    status: t.status === 'On Route' ? 'On Trip' : t.status === 'Completed' ? 'Completed' : t.status === 'Dispatched' ? 'Dispatched' : 'Draft',
    eta: t.status === 'On Route' ? '30 min' : t.status === 'Dispatched' ? 'In 15m' : t.status === 'Completed' ? '--' : 'Awaiting vehicle'
  }));

  const allRecentTrips = useMemo(() => {
    const combined = [...databaseRecentTrips, ...mockupRecentTrips];
    
    // Apply filters
    return combined.filter(trip => {
      // Search filter
      if (search) {
        const query = search.toLowerCase();
        const matchesSearch = 
          trip.tripId.toLowerCase().includes(query) ||
          trip.vehicleNumber.toLowerCase().includes(query) ||
          trip.driverName.toLowerCase().includes(query) ||
          trip.status.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Vehicle Type filter
      if (vehicleTypeFilter !== 'All') {
        const type = vehicleTypeFilter.toLowerCase();
        const matchesType = trip.vehicleNumber.toLowerCase().includes(type);
        if (!matchesType && trip.vehicleNumber !== '--') return false;
      }

      // Status filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Active' && trip.status !== 'On Trip' && trip.status !== 'Dispatched') return false;
        if (statusFilter === 'Available' && trip.status !== 'Completed') return false;
        if (statusFilter === 'In Service' && trip.status !== 'Draft') return false;
      }

      // Region Filter (mock region logic based on tripId / vehicle IDs)
      if (regionFilter !== 'All') {
        if (regionFilter === 'West' && !trip.vehicleNumber.includes('05') && !trip.vehicleNumber.includes('12')) return false;
        if (regionFilter === 'East' && !trip.vehicleNumber.includes('08')) return false;
      }

      return true;
    });
  }, [trips, search, vehicleTypeFilter, statusFilter, regionFilter]);

  // Vehicle Status counts for progress bar
  const statusCounts = useMemo(() => {
    const retired = vehicles.filter(v => v.currentStatus === 'Retired').length;
    const total = availableVehiclesVal + activeVehiclesVal + maintVehiclesVal + retired;
    return {
      available: { count: availableVehiclesVal, pct: total > 0 ? (availableVehiclesVal / total) * 100 : 0 },
      onTrip: { count: activeVehiclesVal, pct: total > 0 ? (activeVehiclesVal / total) * 100 : 0 },
      inShop: { count: maintVehiclesVal, pct: total > 0 ? (maintVehiclesVal / total) * 100 : 0 },
      retired: { count: retired, pct: total > 0 ? (retired / total) * 100 : 0 }
    };
  }, [availableVehiclesVal, activeVehiclesVal, maintVehiclesVal, vehicles]);

  return (
    <div className="space-y-6 overflow-y-auto h-full pb-8 pr-1 no-scrollbar text-xs">
      
      {/* 1. Header Bar */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('trips')}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition text-xs shadow-premium"
          >
            <Plus size={14} /> Dispatch
          </button>
          <div className="flex items-center gap-2 border-l border-slate-850 pl-3">
            <span className="text-slate-300 font-bold text-xs">Rohan K.</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-premium uppercase">
              RK
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters Row */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-900/20 p-4 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Vehicle Type:</span>
          <select 
            value={vehicleTypeFilter} 
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 font-bold focus:outline-none text-xs"
          >
            <option value="All">All</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Mini">Mini</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 font-bold focus:outline-none text-xs"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Available">Available</option>
            <option value="In Service">In Service</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Region:</span>
          <select 
            value={regionFilter} 
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 font-bold focus:outline-none text-xs"
          >
            <option value="All">All</option>
            <option value="West">West Coast</option>
            <option value="East">East Coast</option>
            <option value="Midwest">Midwest</option>
          </select>
        </div>
      </div>

      {/* 3. Top Banner Warning Panel */}
      {urgentWarningsCount > 0 && (
        <div className="flex items-start justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <div className="flex gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-500">Urgent Fleet Compliance Alerts ({urgentWarningsCount})</h4>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Action required: {expiredCDLs.length} operators CDL license expired/due for validation, and {warningVehicles.length} trucks have DMV registrations or insurance policies expiring within 30 days.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {expiredCDLs.length > 0 && (
              <button
                onClick={() => onNavigate('drivers')}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl font-bold transition whitespace-nowrap"
              >
                Resolve Drivers
              </button>
            )}
            {warningVehicles.length > 0 && (
              <button
                onClick={() => onNavigate('fleet')}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl font-bold transition whitespace-nowrap"
              >
                Inspect Trucks
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. 7 Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-900 border-l-4 border-indigo-500 p-4 rounded-xl shadow-premium">
          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Active Vehicles</span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{activeVehiclesVal}</h3>
        </div>

        <div className="bg-slate-900 border-l-4 border-emerald-500 p-4 rounded-xl shadow-premium">
          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Available Vehicles</span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{availableVehiclesVal}</h3>
        </div>

        <div className="bg-slate-900 border-l-4 border-amber-500 p-4 rounded-xl shadow-premium">
          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">In Maintenance</span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{String(maintVehiclesVal).padStart(2, '0')}</h3>
        </div>

        <div className="bg-slate-900 border-l-4 border-indigo-500 p-4 rounded-xl shadow-premium">
          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Active Trips</span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{activeTripsVal}</h3>
        </div>

        <div className="bg-slate-900 border-l-4 border-sky-400 p-4 rounded-xl shadow-premium">
          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Pending Trips</span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{String(pendingTripsVal).padStart(2, '0')}</h3>
        </div>

        <div className="bg-slate-900 border-l-4 border-indigo-500 p-4 rounded-xl shadow-premium">
          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Drivers On Duty</span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{driversDutyVal}</h3>
        </div>

        <div className="bg-slate-900 border-l-4 border-emerald-500 p-4 rounded-xl shadow-premium">
          <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Fleet Utilization</span>
          <h3 className="text-xl font-black text-slate-100 mt-1">{utilizationVal}%</h3>
        </div>
      </div>

      {/* 5. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Trips Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity size={16} className="text-brand-500" /> Recent Trips
            </h3>
            <button 
              onClick={() => onNavigate('trips')}
              className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-0.5 transition"
            >
              View All Trips <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold select-none text-[10px]">
                  <th className="pb-3 pt-2">Trip</th>
                  <th className="pb-3 pt-2">Vehicle</th>
                  <th className="pb-3 pt-2">Driver</th>
                  <th className="pb-3 pt-2">Status</th>
                  <th className="pb-3 pt-2">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {allRecentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No matching trips found.</td>
                  </tr>
                ) : (
                  allRecentTrips.map((trip, idx) => (
                    <tr key={`${trip.tripId}-${idx}`} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 font-bold text-slate-200">{trip.tripId}</td>
                      <td className="py-3 text-slate-300">{trip.vehicleNumber}</td>
                      <td className="py-3 text-slate-350">{trip.driverName}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
                          trip.status === 'On Trip' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : trip.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : trip.status === 'Dispatched'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            trip.status === 'On Trip' ? 'bg-blue-400' : trip.status === 'Completed' ? 'bg-emerald-400' : trip.status === 'Dispatched' ? 'bg-indigo-400' : 'bg-slate-400'
                          }`} />
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-400">{trip.eta}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Vehicle Status Progress Bars */}
        <div className="glass-panel p-5 rounded-2xl space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Truck size={16} className="text-brand-500" /> Vehicle Status
            </h3>
          </div>

          <div className="space-y-4">
            {/* Available */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-300">Available</span>
                <span className="text-slate-400">{statusCounts.available.count} Vehicles</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${statusCounts.available.pct}%` }}
                />
              </div>
            </div>

            {/* On Trip */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-300">On Trip</span>
                <span className="text-slate-400">{statusCounts.onTrip.count} Vehicles</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${statusCounts.onTrip.pct}%` }}
                />
              </div>
            </div>

            {/* In Shop */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-300">In Shop</span>
                <span className="text-slate-400">{statusCounts.inShop.count} Vehicles</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${statusCounts.inShop.pct}%` }}
                />
              </div>
            </div>

            {/* Retired */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-300">Retired</span>
                <span className="text-slate-400">{statusCounts.retired.count} Vehicles</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${statusCounts.retired.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
