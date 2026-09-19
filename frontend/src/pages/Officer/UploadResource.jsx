import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { resourcesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  OfficerPage,
  OfficerHero,
  OfficerLoading,
  OfficerFormPanel,
  OfficerField,
  OfficerPrimaryButton,
  OfficerOutlineButton,
  OfficerPanel,
  OfficerEmpty
} from '../../components/officer/OfficerPageShell';

const UploadResource = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'Other',
    file: null
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const response = await resourcesAPI.getAll({ sort: '-createdAt', limit: 100 });
      setResources(response.data?.data || []);
    } catch (error) {
      toast.error('Unable to load uploaded resources');
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('category', data.category || 'Other');
      formData.append('file', data.file[0]);

      await resourcesAPI.create(formData);
      toast.success('Resource uploaded successfully');
      reset();
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to upload resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const myResources = useMemo(() => {
    return resources.filter((resource) => {
      const ownerId = typeof resource.uploadedBy === 'object'
        ? resource.uploadedBy?._id
        : resource.uploadedBy;

      return String(ownerId || '') === String(user?.id || user?._id || '');
    });
  }, [resources, user?.id, user?._id]);

  const handleOpenEdit = (resource) => {
    setEditingResource(resource);
    setEditForm({
      title: resource.title || '',
      description: resource.description || '',
      category: resource.category || 'Other',
      file: null
    });
  };

  const handleCloseEdit = () => {
    setEditingResource(null);
    setEditForm({ title: '', description: '', category: 'Other', file: null });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingResource) return;

    if (!editForm.title) {
      toast.error('Title is required');
      return;
    }

    const payload = new FormData();
    payload.append('title', editForm.title);
    payload.append('description', editForm.description || '');
    payload.append('category', editForm.category || 'Other');
    if (editForm.file) {
      payload.append('file', editForm.file);
    }

    try {
      await resourcesAPI.update(editingResource._id, payload);
      toast.success('Resource updated successfully');
      handleCloseEdit();
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to update resource');
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Delete this resource?')) return;

    try {
      await resourcesAPI.delete(resourceId);
      toast.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to delete resource');
    }
  };

  return (
    <OfficerPage className="max-w-3xl">
      <OfficerHero
        eyebrow="Knowledge sharing"
        title="Upload resource"
        description="Share documents, guides, and forms with residents in your department."
      />

      <OfficerFormPanel onSubmit={handleSubmit(onSubmit)}>
        <OfficerField label="Title" error={errors.title?.message}>
          <input className="input mt-0" {...register('title', { required: 'Title is required' })} />
        </OfficerField>

        <OfficerField label="Description">
          <textarea className="input mt-0" rows={4} {...register('description')} />
        </OfficerField>

        <OfficerField label="Category">
          <select className="input mt-0" {...register('category')}>
            <option value="Document">Document</option>
            <option value="Guide">Guide</option>
            <option value="Notice">Notice</option>
            <option value="Form">Form</option>
            <option value="Other">Other</option>
          </select>
        </OfficerField>

        <OfficerField label="File" error={errors.file?.message}>
          <div className="officer-file-drop">
            <input
              type="file"
              className="w-full text-sm text-slate-700"
              {...register('file', { required: 'File is required' })}
            />
          </div>
        </OfficerField>

        <OfficerPrimaryButton type="submit" disabled={isSubmitting} className="!w-full">
          {isSubmitting ? 'Uploading…' : 'Upload resource'}
        </OfficerPrimaryButton>
      </OfficerFormPanel>

      <OfficerPanel
        title="Your uploaded resources"
        headExtra={
          <OfficerOutlineButton type="button" onClick={fetchResources}>
            Refresh
          </OfficerOutlineButton>
        }
      >

        {loadingResources ? (
          <OfficerLoading />
        ) : myResources.length === 0 ? (
          <OfficerEmpty message="You have not uploaded any resources yet." />
        ) : (
          <div className="space-y-3">
            {myResources.map((resource) => (
              <div key={resource._id} className="officer-list-item">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{resource.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="officer-chip">{resource.category || 'Other'}</span>
                      <span className="officer-chip officer-chip--muted">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {resource.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <OfficerOutlineButton type="button" onClick={() => handleOpenEdit(resource)}>
                      Edit
                    </OfficerOutlineButton>
                    <button
                      type="button"
                      onClick={() => handleDelete(resource._id)}
                      className="officer-btn officer-btn--danger-outline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </OfficerPanel>

      {editingResource && (
        <div className="officer-modal-backdrop" role="dialog" aria-modal="true">
          <div className="officer-modal">
            <div className="officer-modal__head">
              <h2 className="text-lg font-semibold text-slate-900">Edit resource</h2>
              <OfficerOutlineButton type="button" onClick={handleCloseEdit}>
                Close
              </OfficerOutlineButton>
            </div>
            <form onSubmit={handleSaveEdit} className="officer-modal__body space-y-4">
              <OfficerField label="Title">
                <input
                  className="input mt-0"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </OfficerField>
              <OfficerField label="Description">
                <textarea
                  className="input mt-0"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </OfficerField>
              <OfficerField label="Category">
                <select
                  className="input mt-0"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <option value="Document">Document</option>
                  <option value="Guide">Guide</option>
                  <option value="Notice">Notice</option>
                  <option value="Form">Form</option>
                  <option value="Other">Other</option>
                </select>
              </OfficerField>
              <OfficerField label="Replace file (optional)">
                <div className="officer-file-drop">
                  <input
                    type="file"
                    className="w-full text-sm text-slate-700"
                    onChange={(e) => setEditForm({ ...editForm, file: e.target.files?.[0] || null })}
                  />
                </div>
              </OfficerField>
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <OfficerOutlineButton type="button" onClick={handleCloseEdit}>
                  Cancel
                </OfficerOutlineButton>
                <OfficerPrimaryButton type="submit">Save changes</OfficerPrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </OfficerPage>
  );
};

export default UploadResource;
