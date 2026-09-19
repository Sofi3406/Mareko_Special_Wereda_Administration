export const REPORT_FILTER_YEARS = [2026, 2027, 2028, 2029, 2030];

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

export const defaultReportYear = () => {
  const current = new Date().getFullYear();
  return REPORT_FILTER_YEARS.includes(current)
    ? String(current)
    : String(REPORT_FILTER_YEARS[0]);
};

export const isReportInYear = (dateValue, year) => {
  if (!dateValue) return false;
  const created = new Date(dateValue);
  if (Number.isNaN(created.getTime())) return false;
  return created.getFullYear() === Number(year);
};

export const filterReportsByYear = (reports, year) =>
  (reports || []).filter((report) => isReportInYear(report.createdAt, year));

export const buildMonthlyReportTrend = (reports, year) =>
  MONTH_LABELS.map((month, index) => ({
    date: month,
    value: filterReportsByYear(reports, year).filter((report) => {
      const created = new Date(report.createdAt);
      return created.getMonth() === index;
    }).length
  }));
