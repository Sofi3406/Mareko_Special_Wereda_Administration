const { isSameWoreda } = require('./woreda');

const getReportDepartment = (report) => report.department || report.category;

const isOfficerDepartmentMatch = (officer, report) => {
  const reportDept = getReportDepartment(report);
  const officerDept = officer?.department;

  if (!reportDept || !officerDept) {
    return false;
  }

  if (reportDept !== officerDept) {
    return false;
  }

  if (officerDept === 'Other') {
    const officerCustom = (officer.customDepartment || '').trim().toLowerCase();
    const reportCustom = (report.customCategory || '').trim().toLowerCase();

    if (officerCustom || reportCustom) {
      return officerCustom === reportCustom;
    }
  }

  return true;
};

const isOfficerAllowedForReport = (officer, report) => {
  if (!officer || officer.role !== 'officer' || !report) {
    return false;
  }

  if (!officer.woreda || !report.woreda) {
    return false;
  }

  return isOfficerDepartmentMatch(officer, report) && isSameWoreda(officer.woreda, report.woreda);
};

const buildOfficerReportQuery = (officer) => {
  const department = officer.department;

  return {
    $or: [
      { department },
      { department: { $in: [null, ''] }, category: department }
    ]
  };
};

module.exports = {
  getReportDepartment,
  isOfficerDepartmentMatch,
  isOfficerAllowedForReport,
  buildOfficerReportQuery
};
