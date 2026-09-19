import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';
import {
  OfficerPage,
  OfficerHero,
  OfficerLoading,
  OfficerEmpty,
  OfficerField,
  OfficerPrimaryButton,
  OfficerOutlineButton,
  statusToClass
} from '../../components/officer/OfficerPageShell';

const ManageReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getByDepartment(user?.department);
      setReports(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load department reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (reportId) => {
    try {
      await reportsAPI.update(reportId, {
        status,
        updateMessage: message
      });
      toast.success('Report updated');
      setUpdating(null);
      setMessage('');
      setStatus('');
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Unable to update report');
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user?.department]);

  if (loading) {
    return (
      <OfficerPage>
        <OfficerHero
          eyebrow="Case management"
          title="Manage reports"
          description="Review resident submissions and update status with clear messages."
        />
        <OfficerLoading />
      </OfficerPage>
    );
  }

  return (
    <OfficerPage>
      <OfficerHero
        eyebrow="Case management"
        title="Manage reports"
        description="Update report status and notify residents when progress is made on their submissions."
      />

      {reports.length === 0 ? (
        <OfficerEmpty message="No reports assigned to your department." />
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <article key={report._id} className="officer-report-card">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{report.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {report.description || 'No description provided.'}
                  </p>
                </div>
                <div className="shrink-0 md:text-right">
                  <span className={statusToClass(report.status)}>{report.status}</span>
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Resident:</span>{' '}
                    {report.residentId?.fullName || 'Resident'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {report.images?.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
                    Supporting images
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {report.images.map((image, index) => {
                      const imageUrl = getMediaUrl(image);

                      return (
                        <a
                          key={`${report._id}-image-${index}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-xl border border-amber-100 bg-amber-50/50"
                        >
                          <img
                            src={imageUrl}
                            alt={`Supporting image ${index + 1}`}
                            className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <OfficerOutlineButton
                  type="button"
                  onClick={() => {
                    setUpdating(report._id);
                    setStatus(report.status);
                  }}
                >
                  Update status
                </OfficerOutlineButton>
              </div>

              {updating === report._id && (
                <div className="officer-update-box">
                  <p className="mb-3 text-sm font-semibold text-amber-900">Update this report</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <OfficerField label="Status">
                      <select className="input mt-0" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </OfficerField>
                    <OfficerField label="Update message">
                      <input
                        className="input mt-0"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Optional message for the resident"
                      />
                    </OfficerField>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <OfficerPrimaryButton type="button" onClick={() => handleUpdate(report._id)}>
                      Save update
                    </OfficerPrimaryButton>
                    <OfficerOutlineButton type="button" onClick={() => setUpdating(null)}>
                      Cancel
                    </OfficerOutlineButton>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </OfficerPage>
  );
};

export default ManageReports;
