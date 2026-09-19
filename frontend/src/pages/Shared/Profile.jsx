import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const roleLabels = {
    resident: 'Resident',
    officer: 'Officer',
    woreda_admin: 'Woreda Admin',
    super_admin: 'Mareqo Special Wereda Super Admin'
  };

  const profileForm = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  });

  const passwordForm = useForm();

  const handleProfileSubmit = async (data) => {
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', {
        message: 'Passwords do not match'
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(data.currentPassword, data.newPassword);
      passwordForm.reset();
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-6 py-7 shadow-sm sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
              Profile
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Manage your account
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Update your personal details and secure your account.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-orange-500 text-xl font-semibold text-white shadow-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-950">{user?.fullName || 'User'}</p>
              <p className="text-sm text-slate-600">{user?.email || 'No email on file'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Role</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {roleLabels[user?.role] || 'Member'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Woreda</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {user?.woreda || 'Not set'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Department</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {user?.department || 'Not assigned'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-semibold text-slate-950">Personal details</h2>
            <p className="mt-1 text-sm text-slate-500">Edit the details shown on your account profile.</p>
          </div>

          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full name</label>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
                {...profileForm.register('fullName', { required: 'Full name is required' })}
              />
              {profileForm.formState.errors.fullName && (
                <p className="mt-1.5 text-sm text-red-600">
                  {profileForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
                {...profileForm.register('email', { required: 'Email is required' })}
              />
              {profileForm.formState.errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {profileForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                type="tel"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
                {...profileForm.register('phone')}
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-amber-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-semibold text-slate-950">Change password</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a strong password to keep your account secure.</p>
          </div>

          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Current password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
                {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-1.5 text-sm text-red-600">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">New password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
                {...passwordForm.register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1.5 text-sm text-red-600">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
                {...passwordForm.register('confirmPassword', { required: 'Confirm password is required' })}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:from-amber-400 hover:to-orange-300 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
