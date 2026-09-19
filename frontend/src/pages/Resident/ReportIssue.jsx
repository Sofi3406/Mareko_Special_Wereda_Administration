import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { reportsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const ReportIssue = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm();

  const categorySelection = watch('category');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('category', data.category);
      if (data.customCategory) {
        formData.append('customCategory', data.customCategory);
      }
      formData.append('description', data.description);
      formData.append('location', data.location || '');

      if (data.images?.length) {
        Array.from(data.images).forEach((file) => {
          formData.append('images', file);
        });
      }

      await reportsAPI.create(formData);
      toast.success('Report submitted successfully');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 px-6 py-8 text-white shadow-xl md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
              Issue submission
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Report a community issue</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-50/85 md:text-base">
              Share the details clearly so the right department can respond quickly and track the issue properly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[300px] md:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Required fields</p>
              <p className="mt-1 text-2xl font-semibold">3</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Optional</p>
              <p className="mt-1 text-sm font-medium text-amber-100">Images and location</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50 md:p-8">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Submission form</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Tell us what happened</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Title</label>
            <input
              className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              placeholder="Short summary of the issue"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="mt-1 text-sm text-rose-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Category</label>
            <select
              className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              {...register('category', { required: 'Category is required' })}
            >
              <option value="">Select category</option>
              <option value="Water">Water</option>
              <option value="Road">Road</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Electricity">Electricity</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-rose-600">{errors.category.message}</p>}
          </div>

          {categorySelection === 'Other' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700">Category type</label>
              <input
                className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                placeholder="Describe the category"
                {...register('customCategory', {
                  required: 'Category type is required',
                  minLength: { value: 2, message: 'Enter at least 2 characters' }
                })}
              />
              {errors.customCategory && (
                <p className="mt-1 text-sm text-rose-600">{errors.customCategory.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700">Location</label>
            <input
              className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              placeholder="Optional location or landmark"
              {...register('location')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              rows="6"
              className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              placeholder="Describe the issue, what you noticed, and when it started"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && <p className="mt-1 text-sm text-rose-600">{errors.description.message}</p>}
          </div>

          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4">
            <label className="block text-sm font-semibold text-slate-700">Supporting images (optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-500"
              {...register('images')}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-transform hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit report'}
          </button>
        </form>

        <div className="h-fit rounded-3xl border border-amber-100 bg-white p-6 shadow-lg shadow-amber-50 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Tips</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Make your report easier to resolve</h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              Include a short title and a clear description of the problem.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              Add a location or landmark so the responsible team can find it faster.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              Attach photos if possible. Visual evidence helps speed up review and response.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
