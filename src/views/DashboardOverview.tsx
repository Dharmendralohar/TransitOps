import React from 'react';
import { 
  Truck, Users, Navigation, Wrench, Fuel, DollarSign, 
  AlertTriangle, ShieldAlert, ChevronRight, Activity, ArrowUpRight
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
  // Aggregate Stats
  const activeVehicles = vehicles.filter(v => v.currentStatus === 'Active').length;
  const availableVehicles = vehicles.filter(v => v.currentStatus === 'Available').length;
  const inServiceVehicles = vehicles.filter(v => v.currentStatus === 'In Service').length;
  
  const activeDrivers = drivers.filter(d => d.driverStatus === 'Active' || d.driverStatus === 'Available').length;
  
  const activeTrips = trips.filter(t => t.status === 'On Route' || t.status === 'Dispatched');
  const pendingTrips = trips.filter(t => t.status === 'Pending').length;

  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalFuelCost = fuel.reduce((sum, f) => sum + f.fuelCost, 0);
  const totalExpensesCost = expenses.reduce((sum, e) => sum + e.amount, 0);

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

  return (
    <div className="space-y-6 overflow-y-auto h-full pb-8 pr-1 no-scrollbar text-xs">
      {/* Top Banner Warning Panel */}
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

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles Registry Card */}
        <div 
          onClick={() => onNavigate('fleet')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-4 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Fleet Chassis</span>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Truck size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-100">{vehicles.length} Total</h3>
            <p className="text-slate-500 text-[10px] mt-1">
              {activeVehicles} Active • {availableVehicles} Parked • {inServiceVehicles} In Shop
            </p>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(activeVehicles / (vehicles.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Drivers Card */}
        <div 
          onClick={() => onNavigate('drivers')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-4 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Drivers Directory</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-100">{drivers.length} Active</h3>
            <p className="text-slate-500 text-[10px] mt-1">
              {activeDrivers} Available Operators CDL verified
            </p>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(activeDrivers / (drivers.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Trips Card */}
        <div 
          onClick={() => onNavigate('trips')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-4 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Trips & Dispatch</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Navigation size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-100">{activeTrips.length} Ongoing</h3>
            <p className="text-slate-500 text-[10px] mt-1">
              {pendingTrips} Cargo manifests pending driver checkout
            </p>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(activeTrips.length / (trips.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Costs Card */}
        <div 
          onClick={() => onNavigate('fuel')}
          className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-4 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Fleet Opex Costs</span>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-100">${(totalMaintenanceCost + totalFuelCost + totalExpensesCost).toLocaleString()}</h3>
            <p className="text-slate-500 text-[10px] mt-1">
              Fuel: ${totalFuelCost.toLocaleString()} • Maint: ${totalMaintenanceCost.toLocaleString()}
            </p>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(totalFuelCost / ((totalMaintenanceCost + totalFuelCost + totalExpensesCost) || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Dispatches & Operational Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left ongoing dispatches card */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity size={16} className="text-brand-500" /> Active Dispatch Control Center
            </h3>
            <button 
              onClick={() => onNavigate('trips')}
              className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-0.5 transition"
            >
              View Dispatcher <ChevronRight size={14} />
            </button>
          </div>

          {activeTrips.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Navigation size={32} className="mx-auto opacity-20 mb-2" />
              <p className="text-xs">No active transit routes on tracking board.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip) => (
                <div 
                  key={trip.id}
                  className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl transition flex flex-col md:flex-row justify-between md:items-center gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{trip.tripId}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        trip.status === 'On Route' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-slate-400 font-medium">
                      {trip.pickupLocation} ➔ {trip.destination}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-slate-500">
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Operator</span>
                      <strong className="text-slate-300 font-semibold">{trip.driverName || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Chassis</span>
                      <strong className="text-slate-300 font-semibold">{trip.vehicleNumber || 'Unassigned'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side maintenance scheduler overview */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Wrench size={16} className="text-brand-500" /> Maintenance Schedule
            </h3>
            <button 
              onClick={() => onNavigate('maintenance')}
              className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-0.5 transition"
            >
              View Shop <ChevronRight size={14} />
            </button>
          </div>

          {maintenance.filter(m => m.status === 'Scheduled').length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Wrench size={32} className="mx-auto opacity-20 mb-2" />
              <p className="text-xs">No pending garage jobs scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenance
                .filter(m => m.status === 'Scheduled')
                .slice(0, 3)
                .map((m) => (
                  <div 
                    key={m.id}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-200 font-bold">{m.vehicleNumber} ({m.serviceType})</strong>
                      <span className="text-[10px] text-brand-400 font-bold">${m.cost}</span>
                    </div>
                    <p className="text-slate-400">Date: {m.serviceDate} at {m.workshop}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
