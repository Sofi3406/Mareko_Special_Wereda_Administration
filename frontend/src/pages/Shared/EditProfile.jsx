import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

const EditProfile = () => {
  const { user, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  });

  useEffect(() => {
    profileForm.reset({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  }, [user, profileForm]);

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

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-6 py-7 shadow-sm sm:px-8">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
          Edit profile
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Update your details
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Keep your account information accurate and current.
        </p>
      </div>

      <div className="max-w-2xl rounded-3xl border border-amber-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Personal details</h2>
            <p className="mt-1 text-sm text-slate-500">Update the name, email, and phone linked to your account.</p>
          </div>
          <div className="hidden rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 sm:block">
            Secure profile update
          </div>
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
    </div>
  );
};

export default EditProfile;
