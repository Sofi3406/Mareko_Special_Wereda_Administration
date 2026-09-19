import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  OfficerPage,
  OfficerHero,
  OfficerLoading,
  OfficerFormPanel,
  OfficerField,
  OfficerPrimaryButton,
  OfficerEmpty
} from '../../components/officer/OfficerPageShell';

const PostUpdates = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getByDepartment(user?.department);
      setReports(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport || !message.trim()) {
      toast.error('Please select a report and enter a message');
      return;
    }

    setSubmitting(true);
    try {
      await reportsAPI.postUpdate(selectedReport, { message: message.trim() });
      toast.success('Update posted');
      setMessage('');
    } catch (error) {
      toast.error('Unable to post update');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user?.department]);

  if (loading) {
    return (
      <OfficerPage className="max-w-3xl">
        <OfficerHero
          eyebrow="Resident communication"
          title="Post report updates"
          description="Share clarifications and progress notes with residents."
        />
        <OfficerLoading />
      </OfficerPage>
    );
  }

  return (
    <OfficerPage className="max-w-3xl">
      <OfficerHero
        eyebrow="Resident communication"
        title="Post report updates"
        description="Share clarifications for residents and keep them informed about how their reports are being handled."
      />

      {reports.length === 0 ? (
        <OfficerEmpty message="No department reports available to update." />
      ) : (
        <OfficerFormPanel title="New update" onSubmit={handleSubmit}>
          <OfficerField label="Select report">
            <select
              className="input mt-0"
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <option value="">Choose a report</option>
              {reports.map((report) => (
                <option key={report._id} value={report._id}>
                  {report.title}
                </option>
              ))}
            </select>
          </OfficerField>

          <OfficerField label="Update message">
            <textarea
              rows={5}
              className="input mt-0"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide a clear update for residents — include next steps or timelines when possible."
            />
          </OfficerField>

          <OfficerPrimaryButton type="submit" disabled={submitting} className="!w-full">
            {submitting ? 'Posting…' : 'Post update'}
          </OfficerPrimaryButton>
        </OfficerFormPanel>
      )}
    </OfficerPage>
  );
};

export default PostUpdates;
