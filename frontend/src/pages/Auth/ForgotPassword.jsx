import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(data.email);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900">Forgot password</h1>
        <p className="text-gray-600 mt-2">Enter your email to receive a reset link.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="input mt-1"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-amber-600 to-orange-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-orange-600 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
