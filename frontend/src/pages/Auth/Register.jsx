import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Layout/Navbar';
import { MAREQO_WEREDA } from '../../utils/woredas';
import { kebelesAPI } from '../../services/api';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [kebeles, setKebeles] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: { role: 'resident' }
  });

  useEffect(() => {
    kebelesAPI.getAll().then((response) => setKebeles(response.data.data || [])).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const payload = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
      role: 'resident',
      kebele: data.kebele
    };

    try {
      await registerUser(payload);
      navigate('/resident/dashboard');
    } catch (error) {
      // handled in auth context
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f2]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-8 shadow-sm">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-700 font-semibold">Resident registration</span>
            <h1 className="mt-4 text-3xl md:text-4xl font-display text-slate-900">
              Create your resident account to report issues and follow updates.
            </h1>
            <p className="mt-4 text-slate-600">
              Officers and administrators are onboarded by woreda leadership to keep every account verified.
            </p>

            <div className="mt-6 bg-white/80 border border-amber-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">With a resident account you can</h2>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li>Submit reports with photos and location details</li>
                <li>Track status updates and resolution timelines</li>
                <li>See official resources and upcoming events</li>
              </ul>
            </div>

            <div className="mt-6 text-sm text-slate-600">
              Need an officer or admin account? Contact your woreda office to get onboarded.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full name</label>
                <input
                  type="text"
                  className="input mt-1"
                  {...register('fullName', { required: 'Full name is required' })}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  className="input mt-1"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Phone (optional)</label>
                <input
                  type="tel"
                  className="input mt-1"
                  {...register('phone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Kebele</label>
                <select
                  className="input mt-1"
                  {...register('kebele', { required: 'Please select your kebele' })}
                >
                  <option value="">Select your kebele</option>
                  {kebeles.map((kebele) => (
                    <option key={kebele._id} value={kebele._id}>
                      {kebele.name} ({kebele.code})
                    </option>
                  ))}
                </select>
                {errors.kebele && <p className="mt-1 text-sm text-red-600">{errors.kebele.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    className="input mt-1"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' }
                    })}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Confirm password</label>
                  <input
                    type="password"
                    className="input mt-1"
                    {...register('confirmPassword', { required: 'Please confirm password' })}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
                Registering as a resident of <strong>{MAREQO_WEREDA}</strong>. Officers and administrators are created by woreda leadership.
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white py-3 rounded-xl font-semibold hover:from-amber-500 hover:to-orange-600 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-700 font-semibold hover:text-amber-600">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
