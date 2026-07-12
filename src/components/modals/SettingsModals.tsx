import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { OrganizationSettings, AppUser, Role } from '../../data/database';
import { useToast } from '../Toast';
import { Settings, Shield, Mail, Phone, Users, ShieldAlert, Check } from 'lucide-react';
import { FileUploadDialog } from './GlobalDialogs';

// 1. Organization & Profile Settings Modal
interface OrgSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OrganizationSettings;
  onSave: (settings: OrganizationSettings) => void;
}

export const OrgSettingsModal: React.FC<OrgSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const toast = useToast();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [taxId, setTaxId] = useState(settings.taxId);
  const [currency, setCurrency] = useState(settings.currency);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [address, setAddress] = useState(settings.address);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  
  const [enableSmsNotifications, setEnableSmsNotifications] = useState(settings.enableSmsNotifications);
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(settings.enableEmailAlerts);
  const [maintWarningThresholdDays, setMaintWarningThresholdDays] = useState(settings.maintWarningThresholdDays);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCompanyName(settings.companyName);
    setTaxId(settings.taxId);
    setCurrency(settings.currency);
    setTimezone(settings.timezone);
    setSupportEmail(settings.supportEmail);
    setSupportPhone(settings.supportPhone);
    setAddress(settings.address);
    setLogoUrl(settings.logoUrl || '');
    setEnableSmsNotifications(settings.enableSmsNotifications);
    setEnableEmailAlerts(settings.enableEmailAlerts);
    setMaintWarningThresholdDays(settings.maintWarningThresholdDays);
  }, [settings, isOpen]);

  const isDirty = 
    companyName !== settings.companyName ||
    taxId !== settings.taxId ||
    currency !== settings.currency ||
    timezone !== settings.timezone ||
    supportEmail !== settings.supportEmail ||
    supportPhone !== settings.supportPhone ||
    address !== settings.address ||
    logoUrl !== (settings.logoUrl || '') ||
    enableSmsNotifications !== settings.enableSmsNotifications ||
    enableEmailAlerts !== settings.enableEmailAlerts ||
    maintWarningThresholdDays !== settings.maintWarningThresholdDays;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Validation Error', 'Company Name is required.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onSave({
        companyName,
        taxId,
        currency,
        timezone,
        supportEmail,
        supportPhone,
        address,
        logoUrl: logoUrl || undefined,
        enableSmsNotifications,
        enableEmailAlerts,
        maintWarningThresholdDays,
      });
      toast.success('Settings Synced', 'Global organization profile updated successfully.');
      setLoading(false);
      onClose();
    }, 1200);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Organization Profile Settings" size="lg" isDirty={isDirty} themeType="settings">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Logo Section */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Settings className="text-slate-500" size={24} />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-200">Company Logo Banner</h4>
                <p className="text-slate-500 text-[10px]">Displayed on invoices, driver notes, and exports</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-lg font-semibold transition"
            >
              Upload Logo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-1">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            {/* Tax Registration ID */}
            <div className="space-y-1">
              <label className="form-label">Federal EIN / Tax Registration</label>
              <input
                type="text"
                className="form-input"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency */}
            <div className="space-y-1">
              <label className="form-label">Currency Symbol</label>
              <select
                className="form-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
                <option>CAD (C$)</option>
                <option>AUD (A$)</option>
                <option>JPY (¥)</option>
                <option>INR (₹)</option>
                <option>CNY (¥)</option>
                <option>CHF (CHF)</option>
                <option>NZD (NZ$)</option>
                <option>SGD (S$)</option>
                <option>HKD (HK$)</option>
                <option>MXN (Mex$)</option>
                <option>BRL (R$)</option>
                <option>ZAR (R$)</option>
                <option>RUB (₽)</option>
                <option>SEK (kr)</option>
                <option>NOK (kr)</option>
                <option>TRY (₺)</option>
                <option>KRW (₩)</option>
                <option>AED (AED)</option>
                <option>SAR (SR)</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="space-y-1">
              <label className="form-label">Timezone Settings</label>
              <select
                className="form-input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option>America/Los_Angeles</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Tokyo</option>
                <option>Asia/Kolkata</option>
                <option>UTC</option>
                <option>Asia/Dubai</option>
                <option>Australia/Sydney</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Support Email */}
            <div className="space-y-1">
              <label className="form-label">Operations Alert Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  className="form-input pl-9"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Support Phone */}
            <div className="space-y-1">
              <label className="form-label">Hotline Contact Support</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  className="form-input pl-9"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="form-label">Office Address</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Warning & Alerts switches */}
          <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Notification Rules & Thresholds
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-950 border-slate-800"
                  checked={enableEmailAlerts}
                  onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                />
                <span className="text-slate-300">Enable Email Reports</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-950 border-slate-800"
                  checked={enableSmsNotifications}
                  onChange={(e) => setEnableSmsNotifications(e.target.checked)}
                />
                <span className="text-slate-300">Enable SMS Dispatch Notices</span>
              </label>

              <div className="space-y-1">
                <label className="form-label !mb-0 text-[10px]">License warning threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="form-input !py-1 max-w-[80px]"
                    value={maintWarningThresholdDays}
                    onChange={(e) => setMaintWarningThresholdDays(parseInt(e.target.value) || 30)}
                  />
                  <span className="text-slate-400">Days</span>
                </div>
              </div>
            </div>
          </div>

          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
            >
              {loading ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <FileUploadDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={(url) => setLogoUrl(url)}
      />
    </>
  );
};

// 2. User Add / Edit Modal
interface AddEditUserProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AppUser; // If present, editing
  roles: Role[];
  onSave: (user: AppUser) => void;
}

export const AddEditUserModal: React.FC<AddEditUserProps> = ({
  isOpen,
  onClose,
  user,
  roles,
  onSave,
}) => {
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
    } else {
      setName('');
      setEmail('');
      setRole('Viewer');
      setStatus('Active');
    }
    setError('');
  }, [user, isOpen]);

  const checkDirty = () => {
    if (!user) {
      return !!(name || email);
    }
    return (
      name !== user.name ||
      email !== user.email ||
      role !== user.role ||
      status !== user.status
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onSave({
        id: user?.id || `u-${Math.random().toString(36).substring(2, 9)}`,
        name,
        email,
        role,
        status,
        createdAt: user?.createdAt || new Date().toISOString().split('T')[0],
      });
      toast.success(
        user ? 'Operator Profile Synced' : 'Console Account Created',
        `${name} assigned under the role: ${role}`
      );
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit System Operator' : 'Add Console User'} size="sm" isDirty={checkDirty()} themeType="settings">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Name */}
        <div className="space-y-1">
          <label className="form-label">Full Name *</label>
          <div className="relative">
            <Users size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="e.g. Brandon Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="form-label">Email Address *</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="email"
              className="form-input pl-9"
              placeholder="e.g. b.miller@transitops.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Role */}
        <div className="space-y-1">
          <label className="form-label">RBAC Security Role</label>
          <select
            className="form-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="form-label">Operator Account Status</label>
          <select
            className="form-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="Active">Active Console Operator</option>
            <option value="Inactive">Suspended / Deactivated</option>
          </select>
        </div>

        {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition flex items-center gap-1"
          >
            {loading ? 'Saving...' : user ? 'Save Changes' : 'Create Operator'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 3. Role Permissions matrix Modal
interface RolePermissionsMatrixProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  onSave: (role: Role) => void;
}

export const RolePermissionsMatrixModal: React.FC<RolePermissionsMatrixProps> = ({
  isOpen,
  onClose,
  role,
  onSave,
}) => {
  const [permissions, setPermissions] = useState(role.permissions);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setPermissions(role.permissions);
  }, [role, isOpen]);

  const handleToggle = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export') => {
    setPermissions(prev => {
      const modObj = prev[module];
      return {
        ...prev,
        [module]: {
          ...modObj,
          [action]: !modObj[action]
        }
      };
    });
  };

  const handleSaveMatrix = () => {
    setLoading(true);
    setTimeout(() => {
      onSave({
        ...role,
        permissions
      });
      toast.success('Matrix Configured', `Permissions matrix updated for role: ${role.name}.`);
      setLoading(false);
      onClose();
    }, 1200);
  };

  const modules = Object.keys(permissions);
  const actions: Array<'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'> = [
    'view', 'create', 'edit', 'delete', 'approve', 'export'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`RBAC Security Matrix: ${role.name}`} size="xl" themeType="settings">
      <div className="space-y-4 text-xs">
        <p className="text-slate-400">
          Configure precise console accessibility and functional parameters for operators registered under <strong className="text-slate-200">{role.name}</strong>.
        </p>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="p-3 font-semibold text-slate-400 uppercase tracking-widest text-[9px]">Module Name</th>
                {actions.map(act => (
                  <th key={act} className="p-3 font-semibold text-slate-400 uppercase tracking-widest text-[9px] text-center">{act}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map(mod => (
                <tr key={mod} className="border-b border-slate-800/80 hover:bg-slate-900/35 transition">
                  <td className="p-3 font-bold text-slate-200 capitalize">{mod}</td>
                  {actions.map(act => (
                    <td key={act} className="p-3 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-slate-900 border-slate-800"
                        checked={permissions[mod][act]}
                        onChange={() => handleToggle(mod, act)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ModalFooter>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 font-medium text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveMatrix}
            disabled={loading}
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            {loading ? 'Saving Matrix...' : 'Save Matrix Permissions'}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};
