import React, { useState } from 'react';
import { 
  Plus, Edit2, Copy, Trash2, Shield, Settings, Eye, Info
} from 'lucide-react';
import { Role } from '../data/database';
import { AddEditRoleModal, CloneRoleModal } from '../components/modals/RBACModals';
import { RolePermissionsMatrixModal } from '../components/modals/SettingsModals';
import { DeleteConfirmDialog } from '../components/modals/GlobalDialogs';

interface RBACViewProps {
  roles: Role[];
  onUpdateRoles: (roles: Role[]) => void;
}

export const RBACView: React.FC<RBACViewProps> = ({
  roles,
  onUpdateRoles,
}) => {
  // Modal triggers
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleOpenAdd = () => {
    setSelectedRole(undefined);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (r: Role) => {
    setSelectedRole(r);
    setIsAddEditOpen(true);
  };

  const handleOpenClone = (r: Role) => {
    setSelectedRole(r);
    setIsCloneOpen(true);
  };

  const handleOpenMatrix = (r: Role) => {
    setSelectedRole(r);
    setIsMatrixOpen(true);
  };

  const handleOpenDelete = (r: Role) => {
    setSelectedRole(r);
    setIsDeleteOpen(true);
  };

  // CRUD handlers
  const handleSaveRole = (roleData: Role) => {
    if (selectedRole) {
      onUpdateRoles(roles.map(r => r.id === roleData.id ? roleData : r));
    } else {
      onUpdateRoles([...roles, roleData]);
    }
  };

  const handleCloneRole = (newName: string, description: string, permissions: Role['permissions']) => {
    const cloned: Role = {
      id: `role-${Math.random().toString(36).substring(2, 9)}`,
      name: newName,
      description,
      permissions
    };
    onUpdateRoles([...roles, cloned]);
  };

  const handleDeleteConfirm = () => {
    if (!selectedRole) return;
    onUpdateRoles(roles.filter(r => r.id !== selectedRole.id));
    setIsDeleteOpen(false);
  };

  return (
    <div className="space-y-4 h-full flex flex-col text-xs">
      
      {/* Information Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex gap-3 text-slate-400">
        <Info size={16} className="text-brand-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          Manage system consoles security clearances. Role authorizations determine what tabs and CRUD actions (viewing, dispatching, deleting) operators can run.
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition"
        >
          <Plus size={16} /> Create Role
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1 pb-4 no-scrollbar">
        {roles.map(r => (
          <div key={r.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4 border border-slate-800 hover:border-slate-700 transition">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="p-2 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg">
                  <Shield size={16} />
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RBAC SECURE</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">{r.name}</h4>
              <p className="text-slate-400 leading-relaxed font-medium min-h-[32px]">{r.description}</p>
            </div>

            {/* Actions Grid */}
            <div className="border-t border-slate-800/60 pt-4 flex gap-1.5 justify-end">
              <button
                onClick={() => handleOpenMatrix(r)}
                title="Configure Permissions Matrix"
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => handleOpenClone(r)}
                title="Clone Role Template"
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => handleOpenEdit(r)}
                title="Edit Description"
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition"
              >
                <Edit2 size={12} />
              </button>
              {r.name !== 'Administrator' && (
                <button
                  onClick={() => handleOpenDelete(r)}
                  title="Remove Role"
                  className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals attachments */}
      <AddEditRoleModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        role={selectedRole}
        onSave={handleSaveRole}
      />

      {selectedRole && (
        <>
          <CloneRoleModal
            isOpen={isCloneOpen}
            onClose={() => setIsCloneOpen(false)}
            roleToClone={selectedRole}
            onClone={handleCloneRole}
          />

          <RolePermissionsMatrixModal
            isOpen={isMatrixOpen}
            onClose={() => setIsMatrixOpen(false)}
            role={selectedRole}
            onSave={handleSaveRole}
          />

          <DeleteConfirmDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDeleteConfirm}
            itemName={selectedRole.name}
            itemType="Security Role"
          />
        </>
      )}
    </div>
  );
};
