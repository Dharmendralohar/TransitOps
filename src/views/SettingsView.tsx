import React, { useState } from 'react';
import { 
  Building, Mail, Phone, MapPin, Users, Plus, Edit2, Trash2, 
  ToggleLeft, ToggleRight, Calendar, Landmark, Settings
} from 'lucide-react';
import { OrganizationSettings, AppUser, Role } from '../data/database';
import { OrgSettingsModal, AddEditUserModal } from '../components/modals/SettingsModals';
import { DeleteConfirmDialog } from '../components/modals/GlobalDialogs';

interface SettingsViewProps {
  settings: OrganizationSettings;
  users: AppUser[];
  roles: Role[];
  onUpdateSettings: (settings: OrganizationSettings) => void;
  onUpdateUsers: (users: AppUser[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users,
  roles,
  onUpdateSettings,
  onUpdateUsers,
}) => {
  // Tabs: 'profile' or 'users'
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'users'>('profile');

  // Modals
  const [selectedUser, setSelectedUser] = useState<AppUser | undefined>(undefined);
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleToggleUserStatus = (u: AppUser) => {
    const updatedStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    const updated = users.map(item => item.id === u.id ? { ...item, status: updatedStatus } : item);
    onUpdateUsers(updated);
  };

  const handleSaveUser = (userData: AppUser) => {
    if (selectedUser) {
      onUpdateUsers(users.map(u => u.id === userData.id ? userData : u));
    } else {
      onUpdateUsers([...users, userData]);
    }
  };

  const handleDeleteUserConfirm = () => {
    if (!selectedUser) return;
    onUpdateUsers(users.filter(u => u.id !== selectedUser.id));
    setIsDeleteOpen(false);
  };

  const statusColors = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Inactive: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-4 h-full flex flex-col text-xs">
      {/* Sub Tab Selection */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-3 font-bold border-b-2 transition ${
            activeSubTab === 'profile' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building size={14} /> Organization Profile
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-1.5 px-4 py-3 font-bold border-b-2 transition ${
            activeSubTab === 'users' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={14} /> Console Operators
        </button>
      </div>

      {/* Profile Overview */}
      {activeSubTab === 'profile' ? (
        <div className="space-y-6 overflow-y-auto max-w-2xl bg-slate-900/30 p-6 border border-slate-800/80 rounded-2xl">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building className="text-slate-500" size={32} />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">{settings.companyName}</h3>
                <p className="text-slate-400 text-xs mt-1">Tax EIN ID: {settings.taxId || 'Not Set'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOrgOpen(true)}
              className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-xl font-bold transition"
            >
              Modify configuration
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-6">
            <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1"><Landmark size={12} /> Currency symbol</span>
              <p className="text-slate-200 font-bold">{settings.currency}</p>
            </div>
            <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">Timezone settings</span>
              <p className="text-slate-200 font-bold">{settings.timezone}</p>
            </div>
            <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1"><Mail size={12} /> Operations alert email</span>
              <p className="text-slate-200 font-bold">{settings.supportEmail}</p>
            </div>
            <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1"><Phone size={12} /> hotline contact support</span>
              <p className="text-slate-200 font-bold">{settings.supportPhone}</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1"><MapPin size={12} /> Office address</span>
            <p className="text-slate-200 font-semibold">{settings.address}</p>
          </div>

          {/* Alarm limits */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5"><Settings size={14} className="text-brand-400" /> Notifications & alerts rules</h4>
            <div className="flex flex-wrap gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${settings.enableEmailAlerts ? 'bg-emerald-500' : 'bg-rose-500'}`} /> Email alerts: {settings.enableEmailAlerts ? 'Enabled' : 'Disabled'}
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${settings.enableSmsNotifications ? 'bg-emerald-500' : 'bg-rose-500'}`} /> SMS notifications: {settings.enableSmsNotifications ? 'Enabled' : 'Disabled'}
              </span>
              <span>
                Accreditation alert warning limit: <strong className="text-slate-200">{settings.maintWarningThresholdDays} Days</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        // Console Operators Table
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedUser(undefined);
                setIsUserOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition"
            >
              <Plus size={16} /> Create Operator
            </button>
          </div>

          <div className="flex-1 overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/30">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none">
                  <th className="p-4">Operator Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Security Role</th>
                  <th className="p-4">Register Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr 
                    key={u.id} 
                    className="border-b border-slate-800/60 hover:bg-slate-900/30 transition text-slate-300"
                  >
                    <td className="p-4 font-bold text-slate-200">{u.name}</td>
                    <td className="p-4 font-medium">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{u.createdAt}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[u.status]}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-center flex justify-center gap-1.5">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        title={u.status === 'Active' ? 'Deactivate operator account' : 'Reactivate operator account'}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg transition"
                      >
                        {u.status === 'Active' ? <ToggleRight className="text-emerald-400" size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setIsUserOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg transition"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals attachments */}
      <OrgSettingsModal
        isOpen={isOrgOpen}
        onClose={() => setIsOrgOpen(false)}
        settings={settings}
        onSave={onUpdateSettings}
      />

      <AddEditUserModal
        isOpen={isUserOpen}
        onClose={() => setIsUserOpen(false)}
        user={selectedUser}
        roles={roles}
        onSave={handleSaveUser}
      />

      {selectedUser && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteUserConfirm}
          itemName={selectedUser.name}
          itemType="User"
        />
      )}
    </div>
  );
};
