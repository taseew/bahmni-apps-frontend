import React from 'react';
import { ExpandableDataTable } from '../expandableDataTable/ExpandableDataTable';
import {
  TreatmentDisplayControlProps,
  FormattedTreatment,
} from '../../types/treatment';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useTreatments } from '../../hooks/useTreatments';
import { Tag, DataTableHeader } from '@carbon/react';

const headers: DataTableHeader[] = [
  { key: 'drugName', header: 'Medication' },
  { key: 'status', header: 'Status' },
  { key: 'priority', header: 'Priority' },
  { key: 'startDate', header: 'Start Date' },
  { key: 'duration', header: 'Duration' },
  { key: 'frequency', header: 'Frequency' },
  { key: 'route', header: 'Route' },
  { key: 'doseQuantity', header: 'Dose' },
  { key: 'instruction', header: 'Instructions' },
  { key: 'provider', header: 'Provider' },
];

const getTagType = (
  status: string,
): 'red' | 'green' | 'blue' | 'gray' | 'purple' | 'cyan' => {
  const statusMap: Record<
    string,
    'red' | 'green' | 'blue' | 'gray' | 'purple' | 'cyan'
  > = {
    Active: 'green',
    'On Hold': 'purple',
    Cancelled: 'red',
    Completed: 'blue',
    Stopped: 'red',
    Draft: 'cyan',
    Unknown: 'gray',
  };
  return statusMap[status] ?? 'gray';
};

const getPriorityTag = (priority?: string): React.ReactElement | null => {
  if (!priority) return null;

  const tagType: Record<string, 'red' | 'magenta' | 'purple' | 'blue'> = {
    STAT: 'red',
    ASAP: 'magenta',
    URGENT: 'purple',
    ROUTINE: 'blue',
  };

  return <Tag type={tagType[priority] ?? 'blue'}>{priority}</Tag>;
};

/**
 * TreatmentDisplayControl component displays patient treatment information
 * using an expandable data table format
 */
export const TreatmentDisplayControl: React.FC<
  TreatmentDisplayControlProps
> = ({
  tableTitle = 'Treatments',
  ariaLabel = 'Treatments table',
  className,
}) => {
  const patientUUID = usePatientUUID();
  const { treatments, loading, error } = useTreatments(patientUUID);

  const renderCell = (row: FormattedTreatment, cellId: string) => {
    switch (cellId) {
      case 'drugName':
        return row.drugName;
      case 'status':
        return <Tag type={getTagType(row.status)}>{row.status}</Tag>;
      case 'priority':
        return getPriorityTag(row.priority);
      case 'provider':
        return row.provider;
      case 'startDate':
        return row.startDate || '-';
      case 'duration':
        return row.duration;
      case 'frequency':
        return row.frequency || '-';
      case 'route':
        return row.route || '-';
      case 'doseQuantity':
        return row.doseQuantity || '-';
      case 'instruction':
        return row.dosageInstructions || '-';
    }
  };

  const renderExpandedContent = (row: FormattedTreatment) => undefined;

  return (
    <div
      style={{ width: '100%', paddingTop: '1rem' }}
      data-testid="treatments-table"
    >
      <ExpandableDataTable
        tableTitle={tableTitle}
        ariaLabel={ariaLabel}
        headers={headers}
        rows={treatments}
        loading={loading}
        error={error}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        className={className}
        emptyStateMessage="No treatments found"
      />
    </div>
  );
};
