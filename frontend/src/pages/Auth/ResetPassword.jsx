import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(token, data.password);
      navigate('/login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
        <p className="text-gray-600 mt-2">Create a new secure password.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              className="input mt-1"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              className="input mt-1"
              {...register('confirmPassword', { required: 'Confirm password is required' })}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-amber-600 to-orange-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-orange-600 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
