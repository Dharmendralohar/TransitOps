import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../Modal';
import { useToast } from '../Toast';
import { KeyRound, Mail, User, Phone, Check } from 'lucide-react';

// 1. Forgot Password Modal
interface ForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success('Password Reset Link Sent', `Check your email inbox at ${email}`);
      setEmail('');
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forgot Password" size="sm" isDirty={!!email} themeType="auth">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center pb-2">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-full w-fit mx-auto mb-3">
            <KeyRound size={28} />
          </div>
          <p className="text-xs text-slate-400">
            Enter your registered email address below, and we'll transmit a secure link to reset your account password.
          </p>
        </div>

        <div className="space-y-1">
          <label className="form-label">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="email"
              className={`form-input pl-10 ${error ? 'border-rose-500/80 focus:ring-rose-500' : ''}`}
              placeholder="e.g. pilot@transitops.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
            />
          </div>
          {error && <p className="text-[10px] font-semibold text-rose-500 mt-1">{error}</p>}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            {loading ? 'Transmitting...' : 'Send Reset Link'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 2. Change Password Modal
interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordProps> = ({ isOpen, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const isDirty = !!(oldPassword || newPassword || confirmPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!oldPassword) newErrors.old = 'Current password is required';
    if (!newPassword) {
      newErrors.new = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.new = 'Password must be at least 6 characters long';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success('Password Changed Successfully', 'Your security profile has been updated.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" size="sm" isDirty={isDirty} themeType="auth">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              setErrors(prev => ({ ...prev, old: '' }));
            }}
          />
          {errors.old && <p className="text-[10px] font-semibold text-rose-500 mt-1">{errors.old}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrors(prev => ({ ...prev, new: '' }));
            }}
          />
          {errors.new && <p className="text-[10px] font-semibold text-rose-500 mt-1">{errors.new}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors(prev => ({ ...prev, confirm: '' }));
            }}
          />
          {errors.confirm && <p className="text-[10px] font-semibold text-rose-500 mt-1">{errors.confirm}</p>}
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// 3. Edit Profile Modal
interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; email: string; phone?: string };
  onUpdate: (updatedUser: { name: string; email: string; phone?: string }) => void;
}

export const EditProfileModal: React.FC<EditProfileProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdate,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setPhone(currentUser.phone || '');
  }, [currentUser, isOpen]);

  const isDirty = name !== currentUser.name || email !== currentUser.email || phone !== (currentUser.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onUpdate({ name, email, phone });
      toast.success('Profile Updated', 'Your profile details have been synced.');
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" size="sm" isDirty={isDirty} themeType="auth">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="form-label">Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Sarah Jenkins"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors(prev => ({ ...prev, name: '' }));
              }}
            />
          </div>
          {errors.name && <p className="text-[10px] font-semibold text-rose-500 mt-1">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="email"
              className="form-input pl-10"
              placeholder="s.jenkins@transitops.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: '' }));
              }}
            />
          </div>
          {errors.email && <p className="text-[10px] font-semibold text-rose-500 mt-1">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <label className="form-label">Mobile Number</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              className="form-input pl-10"
              placeholder="+1 (555) 019-9923"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition flex items-center gap-1.5"
          >
            {loading ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
