import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { Role } from '../../data/database';
import { useToast } from '../Toast';
import { Shield, Copy, Check } from 'lucide-react';

interface AddEditRoleProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role; // If present, editing
  onSave: (role: Role) => void;
}

export const AddEditRoleModal: React.FC<AddEditRoleProps> = ({
  isOpen,
  onClose,
  role,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
    } else {
      setName('');
      setDescription('');
    }
    setError('');
  }, [role, isOpen]);

  const checkDirty = () => {
    if (!role) return !!(name || description);
    return name !== role.name || description !== role.description;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Default blank permission template for new roles
      const defaultPermissions = role?.permissions || {
        dashboard: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
        fleet: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
        drivers: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
        trips: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
        maintenance: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
        fuel: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
        reports: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
        settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
      };

      onSave({
        id: role?.id || `role-${Math.random().toString(36).substring(2, 9)}`,
        name,
        description,
        permissions: defaultPermissions
      });

      toast.success(
        role ? 'Role Registry Updated' : 'Role Created Successfully',
        `${name} role profiles initialized.`
      );
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={role ? `Edit Role: ${role.name}` : 'Create Security Role'} size="sm" isDirty={checkDirty()} themeType="settings">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="form-label">Role Designation *</label>
          <div className="relative">
            <Shield size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="e.g. Yard Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">Description / Mandate</label>
          <textarea
            className="form-input h-20 resize-none"
            placeholder="Type roles, operational boundaries, or access limits..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

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
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            {loading ? 'Saving...' : role ? 'Save Profile' : 'Add Role'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 2. Clone Role Modal
interface CloneRoleProps {
  isOpen: boolean;
  onClose: () => void;
  roleToClone: Role;
  onClone: (newName: string, description: string, permissions: Role['permissions']) => void;
}

export const CloneRoleModal: React.FC<CloneRoleProps> = ({
  isOpen,
  onClose,
  roleToClone,
  onClone,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    setName(`Copy of ${roleToClone.name}`);
    setDescription(`Cloned from ${roleToClone.name}. ${roleToClone.description}`);
    setError('');
  }, [roleToClone, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onClone(name, description, JSON.parse(JSON.stringify(roleToClone.permissions)));
      toast.success('Role Cloned Successfully', `Permissions copied to new role: ${name}.`);
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Clone Role Profile: ${roleToClone.name}`} size="sm" themeType="settings">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex gap-3 text-brand-400">
          <Copy size={20} className="mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-200">Copy Permission Schema</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">
              This action duplicates all granular permissions from {roleToClone.name} to the new role instantly.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="form-label">New Role Title *</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">Description</label>
          <textarea
            className="form-input h-16 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
            className="px-4 py-2 font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            {loading ? 'Duplicating...' : 'Confirm Clone'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
