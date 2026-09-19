import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { reportsAPI } from '../../services/api';
import { getLabelColor, getPaletteColor, TREND_LINE_COLOR } from '../../utils/chartColors';
import {
  defaultReportYear,
  filterReportsByYear,
  buildMonthlyReportTrend,
  REPORT_FILTER_YEARS
} from '../../utils/reportYearFilter';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalStatGrid,
  PortalPanel,
  PortalEmpty,
  PortalField,
  statusToClass
} from '../../components/portal/PortalPageShell';

const ColoredDot = ({ cx, cy, index }) => {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={getPaletteColor(index)}
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

const Analytics = () => {
  const [reports, setReports] = useState([]);
  const [selectedYear, setSelectedYear] = useState(defaultReportYear);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getMyReports();
      setReports(response.data.data || []);
    } catch (error) {
      toast.error('Unable to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const yearReports = useMemo(
    () => filterReportsByYear(reports, selectedYear),
    [reports, selectedYear]
  );

  const stats = useMemo(() => {
    const pending = yearReports.filter((r) => r.status === 'Pending').length;
    const inProgress = yearReports.filter((r) => r.status === 'In Progress').length;
    const resolved = yearReports.filter((r) => r.status === 'Resolved').length;
    const rejected = yearReports.filter((r) => r.status === 'Rejected').length;
    return { total: yearReports.length, pending, inProgress, resolved, rejected };
  }, [yearReports]);

  const categoryBreakdown = useMemo(() => {
    return yearReports.reduce((acc, report) => {
      const key = report.category || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [yearReports]);

  const statusData = useMemo(
    () => [
      { name: 'Pending', value: stats.pending },
      { name: 'In Progress', value: stats.inProgress },
      { name: 'Resolved', value: stats.resolved },
      { name: 'Rejected', value: stats.rejected }
    ],
    [stats]
  );

  const categoryData = useMemo(
    () => Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
    [categoryBreakdown]
  );

  const trendData = useMemo(
    () => buildMonthlyReportTrend(yearReports, selectedYear),
    [yearReports, selectedYear]
  );

  const resolutionStats = useMemo(() => {
    const resolvedReports = yearReports.filter((r) => r.status === 'Resolved');
    const totalResolvedDays = resolvedReports.reduce((sum, report) => {
      if (!report.resolvedAt || !report.createdAt) return sum;
      const resolvedAt = new Date(report.resolvedAt).getTime();
      const createdAt = new Date(report.createdAt).getTime();
      if (Number.isNaN(resolvedAt) || Number.isNaN(createdAt)) return sum;
      return sum + Math.max((resolvedAt - createdAt) / (1000 * 60 * 60 * 24), 0);
    }, 0);

    return {
      resolutionRate: yearReports.length ? (resolvedReports.length / yearReports.length) * 100 : 0,
      avgResolutionDays: resolvedReports.length ? totalResolvedDays / resolvedReports.length : 0
    };
  }, [yearReports]);

  const recentReports = useMemo(() => yearReports.slice(0, 8), [yearReports]);
  const total = Math.max(stats.total, 1);

  if (loading) {
    return (
      <PortalPage>
        <PortalHero
          eyebrow="Insights"
          title="Analytics"
          description="Detailed report analytics for your woreda."
        />
        <PortalLoading />
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Insights"
        title="Analytics"
        description={`Track report volume, resolution performance, and category trends for ${selectedYear}.`}
      />

      <div className="officer-form-panel">
        <div className="grid grid-cols-1 gap-4 sm:max-w-xs">
          <PortalField label="Report year">
            <select
              className="input mt-0"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {REPORT_FILTER_YEARS.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </PortalField>
        </div>
      </div>

      <PortalStatGrid
        columns={4}
        stats={[
          { label: 'Total reports', value: stats.total, percent: 100 },
          { label: 'Pending', value: stats.pending, percent: (stats.pending / total) * 100 },
          { label: 'In progress', value: stats.inProgress, percent: (stats.inProgress / total) * 100 },
          { label: 'Resolved', value: stats.resolved, percent: (stats.resolved / total) * 100 }
        ]}
      />

      <PortalStatGrid
        columns={4}
        stats={[
          { label: 'Rejected', value: stats.rejected, percent: (stats.rejected / total) * 100 },
          {
            label: 'Resolution rate',
            value: `${resolutionStats.resolutionRate.toFixed(1)}%`,
            percent: resolutionStats.resolutionRate
          },
          {
            label: 'Avg resolution days',
            value: resolutionStats.avgResolutionDays.toFixed(1),
            percent: Math.min(resolutionStats.avgResolutionDays * 10, 100)
          },
          { label: 'Categories', value: categoryData.length, percent: 100 }
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="officer-chart-panel">
          <h2 className="officer-chart-panel__title">Reports by status</h2>
          {statusData.every((item) => item.value === 0) ? (
            <p className="mt-4 text-sm text-slate-500">No status data yet.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Reports" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={getLabelColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="officer-chart-panel">
          <h2 className="officer-chart-panel__title">Reports by category</h2>
          {categoryData.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No category data yet.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Reports" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={getPaletteColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="officer-chart-panel lg:col-span-2">
          <h2 className="officer-chart-panel__title">Reports over time ({selectedYear})</h2>
          {trendData.every((item) => item.value === 0) ? (
            <p className="mt-4 text-sm text-slate-500">No recent reports.</p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={4} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Monthly reports"
                    stroke={TREND_LINE_COLOR}
                    strokeWidth={2.5}
                    dot={<ColoredDot />}
                    activeDot={{ r: 7, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <PortalPanel title="Recent reports">
          {recentReports.length === 0 ? (
            <PortalEmpty message="No reports submitted yet." />
          ) : (
            <ul className="space-y-3">
              {recentReports.map((report) => (
                <li key={report._id} className="officer-list-item">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={statusToClass(report.status)}>{report.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PortalPanel>
      </div>
    </PortalPage>
  );
};

export default Analytics;
