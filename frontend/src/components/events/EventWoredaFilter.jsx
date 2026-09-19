import React from 'react';
import { PortalField } from '../portal/PortalPageShell';
import {
  EVENT_WOREA_FILTER_ALL,
  SUBCITY_EVENT_WOREDA,
  WOREDA_LIST,
  formatEventWoredaFilterLabel
} from '../../utils/woredas';

const EventWoredaFilter = ({
  label = 'Filter by woreda',
  value,
  onChange,
  className = '',
  disabled = false,
  showAll = true,
  showSubcity = true,
  woredaOptions = WOREDA_LIST
}) => (
  <PortalField label={label}>
    <select
      className={`input mt-0 ${className}`.trim()}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {showAll && (
        <option value={EVENT_WOREA_FILTER_ALL}>{formatEventWoredaFilterLabel(EVENT_WOREA_FILTER_ALL)}</option>
      )}
      {showSubcity && (
        <option value={SUBCITY_EVENT_WOREDA}>{formatEventWoredaFilterLabel(SUBCITY_EVENT_WOREDA)}</option>
      )}
      {woredaOptions.map((woreda) => (
        <option key={woreda} value={woreda}>
          {woreda}
        </option>
      ))}
    </select>
  </PortalField>
);

export default EventWoredaFilter;
