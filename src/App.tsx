import React, { useState, useEffect } from 'react';
import { 
  Truck, Users, Navigation, Wrench, Fuel, BarChart2, Settings, Shield,
  Bell, Search, HelpCircle, LogOut, Key, User, Menu, X, ArrowUpRight,
  MoreVertical, Mail
} from 'lucide-react';
import { TransitOpsDB, Vehicle, Driver, Trip, MaintenanceRecord, FuelEntry, ExpenseRecord, AppUser, Role, OrganizationSettings } from './data/database';
import { ToastProvider, useToast } from './components/Toast';

// Views
import { DashboardOverview } from './views/DashboardOverview';
import { VehiclesView } from './views/VehiclesView';
import { DriversView } from './views/DriversView';
import { TripsView } from './views/TripsView';
import { MaintenanceView } from './views/MaintenanceView';
import { FuelExpensesView } from './views/FuelExpensesView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { RBACView } from './views/RBACView';

// Global Overlays
import { CommandPaletteDialog } from './components/modals/GlobalDialogs';
import { EditProfileModal, ChangePasswordModal, ForgotPasswordModal } from './components/modals/AuthModals';

// Modals triggers from command palette
import { AddEditVehicleModal } from './components/modals/VehicleModals';
import { AddEditDriverModal } from './components/modals/DriverModals';
import { CreateEditTripModal } from './components/modals/TripModals';
import { ScheduleEditMaintenanceModal } from './components/modals/MaintenanceModals';
import { AddEditFuelModal, AddEditExpenseModal } from './components/modals/FuelModals';

interface LoginViewProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter operator email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        if (found.status === 'Inactive') {
          setError('This console user account is currently Suspended / Inactive.');
          setLoading(false);
          return;
        }
        setError('');
        setLoading(false);
        onLogin(found);
      } else {
        setError('No active operator profile registered with this email.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      </div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-premium relative z-10 space-y-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-2 mb-2 justify-center">
          <div className="p-2.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl">
            <Truck size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">TRANSIT<span className="text-brand-500 font-extrabold">OPS</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fleet Management Console</p>
          </div>
        </div>

        <div className="space-y-1 text-center">
          <h2 className="text-lg font-bold text-slate-100">Sign in to console</h2>
          <p className="text-xs text-slate-400">Access role-based dispatcher, fleet and maintenance dashboards.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex gap-2 font-semibold">
            <span className="shrink-0 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="form-label">Operator Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="email"
                className="form-input pl-9"
                placeholder="s.jenkins@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="form-label">Access Password</label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                className="form-input pl-9"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <p className="text-[9px] text-slate-500 italic mt-0.5">Demo Mode: Enter any value to bypass verification.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loading ? 'Authenticating Operator...' : 'Authenticate Credentials'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
          <span className="relative bg-slate-900 px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quick Switcher Access</span>
        </div>

        {/* Dynamic Operator Quick Switcher Cards */}
        <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => {
                if (u.status === 'Inactive') {
                  setError('This console user account is currently Suspended / Inactive.');
                  return;
                }
                setEmail(u.email);
                setPassword('demo123');
                onLogin(u);
              }}
              className={`p-3 bg-slate-900/40 border hover:border-brand-500/30 hover:bg-brand-500/5 rounded-2xl flex items-center justify-between text-left transition ${
                u.status === 'Inactive' ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:border-slate-800' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-premium shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-xs">{u.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{u.email}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                u.role === 'Administrator' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                u.role === 'Dispatcher' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  const toast = useToast();

  // Database States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuel, setFuel] = useState<FuelEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Navigation Mobile Sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Security & Profile Switcher States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('to_logged_in_email');
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const email = localStorage.getItem('to_logged_in_email') || 's.jenkins@transitops.com';
    const dbUsers = TransitOpsDB.getUsers();
    const found = dbUsers.find(u => u.email === email);
    return found || dbUsers[0] || {
      id: 'u-1',
      name: 'Sarah Jenkins',
      email: 's.jenkins@transitops.com',
      role: 'Administrator',
      status: 'Active',
      createdAt: '2025-01-15'
    };
  });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Profile auth modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Command Palette
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Command-palette modal shortcut states
  const [cmdVehicleOpen, setCmdVehicleOpen] = useState(false);
  const [cmdDriverOpen, setCmdDriverOpen] = useState(false);
  const [cmdTripOpen, setCmdTripOpen] = useState(false);
  const [cmdMaintOpen, setCmdMaintOpen] = useState(false);
  const [cmdFuelOpen, setCmdFuelOpen] = useState(false);
  const [cmdExpenseOpen, setCmdExpenseOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    setVehicles(TransitOpsDB.getVehicles());
    setDrivers(TransitOpsDB.getDrivers());
    setTrips(TransitOpsDB.getTrips());
    setMaintenance(TransitOpsDB.getMaintenance());
    setFuel(TransitOpsDB.getFuelEntries());
    setExpenses(TransitOpsDB.getExpenses());
    setUsers(TransitOpsDB.getUsers());
    setRoles(TransitOpsDB.getRoles());
    setSettings(TransitOpsDB.getOrgSettings());
  }, []);

  // Keyboard shortcut Ctrl+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Database State Save Wrappers
  const updateVehicles = (data: Vehicle[]) => {
    setVehicles(data);
    TransitOpsDB.saveVehicles(data);
  };

  const updateDrivers = (data: Driver[]) => {
    setDrivers(data);
    TransitOpsDB.saveDrivers(data);
  };

  const updateTrips = (data: Trip[]) => {
    setTrips(data);
    TransitOpsDB.saveTrips(data);
  };

  const updateMaintenance = (data: MaintenanceRecord[]) => {
    setMaintenance(data);
    TransitOpsDB.saveMaintenance(data);
  };

  const updateFuel = (data: FuelEntry[]) => {
    setFuel(data);
    TransitOpsDB.saveFuelEntries(data);
  };

  const updateExpenses = (data: ExpenseRecord[]) => {
    setExpenses(data);
    TransitOpsDB.saveExpenses(data);
  };

  const updateUsers = (data: AppUser[]) => {
    setUsers(data);
    TransitOpsDB.saveUsers(data);
  };

  const updateRoles = (data: Role[]) => {
    setRoles(data);
    TransitOpsDB.saveRoles(data);
  };

  const updateSettings = (data: OrganizationSettings) => {
    setSettings(data);
    TransitOpsDB.saveOrgSettings(data);
  };

  // RBAC Permission check
  const activeRoleObject = roles.find(r => r.name === currentUser.role);
  
  const canViewModule = (moduleName: string): boolean => {
    if (!activeRoleObject) return true; // Fallback
    return activeRoleObject.permissions[moduleName]?.view ?? false;
  };

  // Notification Warning calculation
  const notificationsList = (() => {
    const notifs: Array<{ id: string; title: string; body: string; type: 'warning' | 'info' }> = [];
    
    // CDL Expiry Warnings
    drivers.forEach(d => {
      const days = Math.ceil((new Date(d.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (days <= 0) {
        notifs.push({
          id: `notif-d-exp-${d.id}`,
          title: `Operator License Expired`,
          body: `Driver ${d.fullName} (Emp ID: ${d.employeeId}) has an expired CDL.`,
          type: 'warning',
        });
      } else if (days <= 30) {
        notifs.push({
          id: `notif-d-warn-${d.id}`,
          title: `Operator CDL Expiry Impending`,
          body: `Driver ${d.fullName} license expires in ${days} days.`,
          type: 'warning',
        });
      }
    });

    // DMV plates warning
    vehicles.forEach(v => {
      const daysReg = Math.ceil((new Date(v.registrationExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (daysReg <= 30) {
        notifs.push({
          id: `notif-v-reg-${v.id}`,
          title: `DMV Plates Expiry Alert`,
          body: `Vehicle ${v.vehicleNumber} plates registration renewal due in ${daysReg} days.`,
          type: 'info',
        });
      }
    });

    return notifs;
  })();

  // Sidebar Tabs Config
  const sidebarTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} />, module: 'dashboard' },
    { id: 'fleet', label: 'Fleet Registry', icon: <Truck size={16} />, module: 'fleet' },
    { id: 'drivers', label: 'Drivers', icon: <Users size={16} />, module: 'drivers' },
    { id: 'trips', label: 'Trips & Dispatch', icon: <Navigation size={16} />, module: 'trips' },
    { id: 'maintenance', label: 'Maintenance shop', icon: <Wrench size={16} />, module: 'maintenance' },
    { id: 'fuel', label: 'Fuel & Expenses', icon: <Fuel size={16} />, module: 'fuel' },
    { id: 'reports', label: 'Analytics Reports', icon: <BarChart2 size={16} />, module: 'reports' },
    { id: 'settings', label: 'Console Settings', icon: <Settings size={16} />, module: 'settings' },
    { id: 'rbac', label: 'RBAC Security', icon: <Shield size={16} />, module: 'settings' },
  ];

  // Dynamically filter tabs according to active permissions
  const filteredSidebarTabs = sidebarTabs.filter(tab => canViewModule(tab.module));

  // Render Page Content
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            vehicles={vehicles}
            drivers={drivers}
            trips={trips}
            maintenance={maintenance}
            fuel={fuel}
            expenses={expenses}
            onNavigate={(view) => {
              if (canViewModule(view === 'settings' || view === 'rbac' ? 'settings' : view)) {
                setActiveTab(view);
              } else {
                toast.error('Access Denied', 'Your active role permissions restrict viewing this module.');
              }
            }}
          />
        );
      case 'fleet':
        return (
          <VehiclesView
            vehicles={vehicles}
            drivers={drivers}
            trips={trips}
            maintenance={maintenance}
            fuel={fuel}
            expenses={expenses}
            onUpdateVehicles={updateVehicles}
            onUpdateDrivers={updateDrivers}
          />
        );
      case 'drivers':
        return (
          <DriversView
            drivers={drivers}
            vehicles={vehicles}
            onUpdateDrivers={updateDrivers}
            onUpdateVehicles={updateVehicles}
          />
        );
      case 'trips':
        return (
          <TripsView
            trips={trips}
            drivers={drivers}
            vehicles={vehicles}
            onUpdateTrips={updateTrips}
            onUpdateDrivers={updateDrivers}
            onUpdateVehicles={updateVehicles}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceView
            maintenance={maintenance}
            vehicles={vehicles}
            onUpdateMaintenance={updateMaintenance}
            onUpdateVehicles={updateVehicles}
          />
        );
      case 'fuel':
        return (
          <FuelExpensesView
            fuel={fuel}
            expenses={expenses}
            vehicles={vehicles}
            drivers={drivers}
            onUpdateFuel={updateFuel}
            onUpdateExpenses={updateExpenses}
          />
        );
      case 'reports':
        return (
          <ReportsView
            vehicles={vehicles}
            drivers={drivers}
            trips={trips}
            maintenance={maintenance}
            fuel={fuel}
            expenses={expenses}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings || {
              companyName: "TransitOps Global Logistics",
              taxId: "TX-990812-B",
              currency: "USD ($)",
              timezone: "America/Los_Angeles",
              supportEmail: "ops-alert@transitops.com",
              supportPhone: "+1 (800) 555-FLT1",
              address: "100 Logistics Blvd, Suite 400, Los Angeles, CA 90001",
              enableSmsNotifications: true,
              enableEmailAlerts: true,
              maintWarningThresholdDays: 30
            }}
            users={users}
            roles={roles}
            onUpdateSettings={updateSettings}
            onUpdateUsers={updateUsers}
          />
        );
      case 'rbac':
        return (
          <RBACView
            roles={roles}
            onUpdateRoles={updateRoles}
          />
        );
      default:
        return <div className="p-8 text-center text-slate-500">View not constructed yet.</div>;
    }
  };

  const activeTabLabel = sidebarTabs.find(t => t.id === activeTab)?.label || 'Console Control';

  if (!isLoggedIn) {
    return (
      <LoginView
        users={users}
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          localStorage.setItem('to_logged_in_email', user.email);
          toast.success('Authentication Successful', `Welcome back, ${user.name}!`);
        }}
      />
    );
  }

  return (
    <div className="h-full w-full flex bg-slate-950 text-slate-100 overflow-hidden relative font-sans text-xs">
      
      {/* 1. SIDEBAR Navigation */}
      <aside className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-transform duration-300 z-40 fixed md:static inset-y-0 left-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Logo Header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-600 rounded-xl text-white">
                <Truck size={20} />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider text-slate-100 uppercase">TransitOps</h1>
                <span className="text-[9px] text-brand-400 font-bold uppercase tracking-widest">Fleet Control</span>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-200 md:hidden rounded-lg hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {filteredSidebarTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20 shadow-premium'
                    : 'text-slate-400 border border-transparent hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-850 bg-slate-900/60 relative">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-premium uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <div className="max-w-[120px]">
                <h4 className="font-bold text-slate-200 truncate">{currentUser.name}</h4>
                <span className="text-[9px] text-slate-500 block truncate">{currentUser.role}</span>
              </div>
            </div>
            <button 
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <MoreVertical size={16} />
            </button>
          </div>

          {/* Profile Dropdown popover */}
          {profileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-45" onClick={() => setProfileDropdownOpen(false)} />
              <div className="absolute bottom-16 right-4 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-premium py-2 z-50 animate-fade-in text-left">
                {/* Active Role Selector Switcher */}
                <div className="px-4 py-2 border-b border-slate-850 space-y-1 bg-slate-950/20">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Switch RBAC Role</span>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 font-bold focus:outline-none"
                    value={currentUser.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      setCurrentUser(prev => ({ ...prev, role: r }));
                      setProfileDropdownOpen(false);
                      toast.success('Access Role Switched', `Active security permissions adjusted to: ${r}`);
                    }}
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setIsEditProfileOpen(true);
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 text-slate-350 hover:text-white flex items-center gap-2 transition"
                >
                  <User size={12} /> Edit Profile
                </button>
                <button
                  onClick={() => {
                    setIsChangePasswordOpen(true);
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 text-slate-350 hover:text-white flex items-center gap-2 transition"
                >
                  <Key size={12} /> Change Password
                </button>
                <button
                  onClick={() => {
                    setIsForgotPasswordOpen(true);
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 hover:bg-slate-800 text-slate-350 hover:text-white flex items-center gap-2 transition"
                >
                  <HelpCircle size={12} /> Forgot Password
                </button>
                <div className="border-t border-slate-850 my-1" />
                <button
                  onClick={() => {
                    localStorage.removeItem('to_logged_in_email');
                    setIsLoggedIn(false);
                    setProfileDropdownOpen(false);
                    toast.warning('Account Logout', 'Sign-out triggered.');
                  }}
                  className="w-full px-4 py-2 hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 transition font-bold"
                >
                  <LogOut size={12} /> Sign Out Console
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 2. MAIN SCREEN CONTENT SHELL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Controls */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-450 hover:text-slate-200 md:hidden bg-slate-900 border border-slate-800 rounded-xl"
            >
              <Menu size={18} />
            </button>
            <h2 className="text-sm font-bold text-slate-200 capitalize tracking-wide">{activeTabLabel}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <button 
              onClick={() => setIsPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 transition text-[10px]"
            >
              <Search size={12} />
              <span>Search Command...</span>
              <kbd className="bg-slate-950 px-1.5 py-0.5 rounded text-[8px] border border-slate-850 font-mono">Ctrl+K</kbd>
            </button>

            {/* Notification Icon */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(prev => !prev)}
                className="p-2 text-slate-450 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition"
              >
                <Bell size={16} />
                {notificationsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-600 text-white rounded-full flex items-center justify-center text-[8px] font-black animate-pulse">
                    {notificationsList.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setNotifDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-850 rounded-2xl shadow-premium py-3 z-50 animate-fade-in text-left space-y-2">
                    <div className="px-4 pb-2 border-b border-slate-850 flex justify-between items-center">
                      <span className="font-bold text-slate-200">Alert Center</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{notificationsList.length} urgent warnings</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto no-scrollbar px-2 space-y-1">
                      {notificationsList.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-[10px]">
                          No pending compliance alerts!
                        </div>
                      ) : (
                        notificationsList.map(notif => (
                          <div 
                            key={notif.id}
                            className={`p-2.5 rounded-xl border text-[10px] space-y-1 transition ${
                              notif.type === 'warning' ? 'border-amber-500/20 bg-amber-500/5 text-amber-550' : 'border-slate-800 bg-slate-900/60 text-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-200">{notif.title}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                            </div>
                            <p className="text-slate-400 font-medium leading-relaxed">{notif.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* View content panel mounting point */}
        <main className="flex-1 overflow-hidden p-6 relative">
          {renderView()}
        </main>
      </div>

      {/* 3. CORE GLOBAL DIALOGS & OVERLAYS */}
      <CommandPaletteDialog
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectCommand={(cmd) => {
          setIsPaletteOpen(false);
          // Match and open corresponding modals
          if (cmd === 'add_vehicle') setCmdVehicleOpen(true);
          else if (cmd === 'add_driver') setCmdDriverOpen(true);
          else if (cmd === 'dispatch_trip') setCmdTripOpen(true);
          else if (cmd === 'schedule_maint') setCmdMaintOpen(true);
          else if (cmd === 'log_fuel') setCmdFuelOpen(true);
          else if (cmd === 'log_expense') setCmdExpenseOpen(true);
          else if (cmd.startsWith('nav_')) {
            const v = cmd.split('_')[1];
            if (canViewModule(v === 'settings' || v === 'rbac' ? 'settings' : v)) {
              setActiveTab(v);
            }
          }
        }}
      />

      {/* Auth Modals */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onUpdate={(updated) => {
          setCurrentUser(prev => ({ ...prev, ...updated }));
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      {/* Command Palette Shortcuts Trigger Modals */}
      <AddEditVehicleModal
        isOpen={cmdVehicleOpen}
        onClose={() => setCmdVehicleOpen(false)}
        allVehicles={vehicles}
        drivers={drivers}
        onSave={updateVehicles}
      />

      <AddEditDriverModal
        isOpen={cmdDriverOpen}
        onClose={() => setCmdDriverOpen(false)}
        allDrivers={drivers}
        vehicles={vehicles}
        onSave={updateDrivers}
      />

      <CreateEditTripModal
        isOpen={cmdTripOpen}
        onClose={() => setCmdTripOpen(false)}
        allTrips={trips}
        drivers={drivers}
        vehicles={vehicles}
        onSave={updateTrips}
      />

      <ScheduleEditMaintenanceModal
        isOpen={cmdMaintOpen}
        onClose={() => setCmdMaintOpen(false)}
        vehicles={vehicles}
        onSave={updateMaintenance}
      />

      <AddEditFuelModal
        isOpen={cmdFuelOpen}
        onClose={() => setCmdFuelOpen(false)}
        vehicles={vehicles}
        drivers={drivers}
        onSave={updateFuel}
      />

      <AddEditExpenseModal
        isOpen={cmdExpenseOpen}
        onClose={() => setCmdExpenseOpen(false)}
        vehicles={vehicles}
        onSave={updateExpenses}
      />

    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
