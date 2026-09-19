import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { analyticsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { CHART_PALETTE, getPaletteColor } from '../../utils/chartColors';
import {
  PortalPage,
  PortalHero,
  PortalLoading,
  PortalStatGrid,
  PortalPanel,
  PortalPrimaryButton,
  PortalOutlineButton,
  PortalField,
  statusToClass
} from '../../components/portal/PortalPageShell';
import { defaultReportYear, REPORT_FILTER_YEARS } from '../../utils/reportYearFilter';

const REPORTS_SERIES_COLOR = '#d97706';
const RESOLVED_SERIES_COLOR = '#16a34a';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [selectedYear, setSelectedYear] = useState(defaultReportYear);
  const [selectedWoreda, setSelectedWoreda] = useState('all');
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getDashboard({
        year: selectedYear,
        woreda: selectedWoreda
      });
      setAnalytics(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const response = await analyticsAPI.getRealtime();
      setRealtimeData(response.data.data);
    } catch (error) {
      // Keep previous realtime values if refresh fails.
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedWoreda]);

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const woredaOptions = useMemo(() => {
    const fromPerformance = (analytics?.woredaPerformance || [])
      .map((item) => item.woreda)
      .filter(Boolean);
    return ['all', ...new Set(fromPerformance)];
  }, [analytics]);

  const summary = analytics?.summary || {};

  if (loading && !analytics) {
    return (
      <PortalPage>
        <PortalHero
          eyebrow="Super Admin · Mareqo Wereda"
          title="Mareqo Wereda administration"
          description="Monitor residents, services, reports, departments, and performance across Mareqo Wereda."
        />
        <PortalLoading />
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalHero
        eyebrow="Super Admin · Mareqo Wereda"
        title="Mareqo Wereda administration"
        description={`Track citizen services, community reports, resolution performance, and activity for ${selectedYear}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PortalOutlineButton type="button" onClick={fetchAnalytics}>
              Refresh data
            </PortalOutlineButton>
          </div>
        }
      />

      <div className="officer-form-panel">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <PortalField label="Woreda">
            <select
              className="input mt-0"
              value={selectedWoreda}
              onChange={(e) => setSelectedWoreda(e.target.value)}
            >
              {woredaOptions.map((woreda) => (
                <option key={woreda} value={woreda}>
                  {woreda === 'all' ? 'All woredas' : woreda}
                </option>
              ))}
            </select>
          </PortalField>
          <div className="flex items-end">
            <PortalPrimaryButton type="button" onClick={fetchAnalytics} className="w-full sm:w-auto">
              Apply filters
            </PortalPrimaryButton>
          </div>
        </div>
      </div>

      <PortalStatGrid
        stats={[
          { label: 'Total reports', value: summary.totalReports || 0, percent: 100 },
          { label: 'Resolution rate', value: `${summary.resolutionRate || 0}%`, percent: summary.resolutionRate || 0 },
          { label: 'Total users', value: summary.totalUsers || 0, percent: 100 },
          {
            label: 'Avg. resolution',
            value: `${summary.averageResolutionDays || 0} days`,
            percent: Math.min((summary.averageResolutionDays || 0) * 10, 100)
          }
        ]}
      />

      {realtimeData && (
        <div className="officer-hero !p-5">
          <div className="officer-hero__inner !flex-row !items-center !justify-between">
            <div>
              <p className="officer-hero__eyebrow">Live activity</p>
              <h2 className="officer-hero__title !mt-2 !text-xl">Real-time overview</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              Live
            </span>
          </div>
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ['Reports last hour', realtimeData.reportsLastHour],
              ['Reports today', realtimeData.reportsToday],
              ['Active users today', realtimeData.activeUsersToday],
              ['Pending reports', realtimeData.pendingReports]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-amber-100/80">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{value ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <PortalLoading />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="officer-chart-panel">
              <h2 className="officer-chart-panel__title">Reports by category</h2>
              {(analytics?.reportsByCategory || []).length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No category data yet.</p>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.reportsByCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Reports" radius={[6, 6, 0, 0]}>
                        {analytics.reportsByCategory.map((entry, index) => (
                          <Cell key={entry._id || index} fill={getPaletteColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="officer-chart-panel">
              <h2 className="officer-chart-panel__title">Resolution trend</h2>
              {(analytics?.trendData || []).length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No trend data yet.</p>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="reports"
                        name="Total reports"
                        stroke={REPORTS_SERIES_COLOR}
                        fill={REPORTS_SERIES_COLOR}
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved"
                        stroke={RESOLVED_SERIES_COLOR}
                        fill={RESOLVED_SERIES_COLOR}
                        fillOpacity={0.25}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="officer-chart-panel">
              <h2 className="officer-chart-panel__title">Woreda performance</h2>
              {(analytics?.woredaPerformance || []).length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No woreda data yet.</p>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.woredaPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis dataKey="woreda" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalReports" name="Total reports" radius={[4, 4, 0, 0]}>
                        {analytics.woredaPerformance.map((entry, index) => (
                          <Cell key={`reports-${entry.woreda || index}`} fill={getPaletteColor(index)} />
                        ))}
                      </Bar>
                      <Bar dataKey="resolutionRate" name="Resolution %" radius={[4, 4, 0, 0]}>
                        {analytics.woredaPerformance.map((entry, index) => (
                          <Cell
                            key={`rate-${entry.woreda || index}`}
                            fill={getPaletteColor(index + 3)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="officer-chart-panel">
              <h2 className="officer-chart-panel__title">Department performance</h2>
              {(analytics?.departmentPerformance || []).length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No department data yet.</p>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.departmentPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ department, percent }) =>
                          `${department}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={90}
                        dataKey="totalReports"
                      >
                        {analytics.departmentPerformance.map((entry, index) => (
                          <Cell key={entry.department} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <PortalPanel title="Recent reports">
            {(analytics?.recentReports || []).length === 0 ? (
              <p className="text-sm text-slate-500">No recent reports.</p>
            ) : (
              <div className="officer-table-wrap overflow-x-auto">
                <table className="officer-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Woreda</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentReports.map((report) => (
                      <tr key={report._id}>
                        <td className="text-slate-500">{report._id.slice(-6)}</td>
                        <td>{report.title}</td>
                        <td>{report.category}</td>
                        <td>{report.woreda}</td>
                        <td>
                          <span className={statusToClass(report.status)}>{report.status}</span>
                        </td>
                        <td className="text-slate-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PortalPanel>
        </>
      )}
    </PortalPage>
  );
};

export default AnalyticsDashboard;
