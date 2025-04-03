import React from 'react';
import { ExpandableDataTable } from '../expandableDataTable/ExpandableDataTable';
import { TreatmentDisplayControlProps, FormattedTreatment } from '../../types/treatment';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useTreatments } from '../../hooks/useTreatments';
import { Tag, DataTableHeader } from '@carbon/react';
import { formatDateTime } from '../../utils/date';

const headers: DataTableHeader[] = [
  { key: 'drugName', header: 'Medication' },
  { key: 'status', header: 'Status' },
  { key: 'provider', header: 'Provider' },
  { key: 'startDate', header: 'Start Date' },
  { key: 'endDate', header: 'End Date' },
  { key: 'duration', header: 'Duration' }
];

const getTagType = (status: string): 'red' | 'green' | 'blue' | 'gray' => {
  const statusMap: Record<string, 'red' | 'green' | 'blue' | 'gray'> = {
    'Active': 'green',
    'Completed': 'blue',
    'Stopped': 'red',
    'Cancelled': 'gray'
  };
  return statusMap[status] ?? 'gray';
};

/**
 * TreatmentDisplayControl component displays patient treatment information
 * using an expandable data table format
 */
export const TreatmentDisplayControl: React.FC<TreatmentDisplayControlProps> = ({
  tableTitle = 'Treatments',
  ariaLabel = 'Treatments table',
  className
}) => {
  const patientUUID = usePatientUUID();
  const { treatments, loading, error } = useTreatments(patientUUID);

  const renderCell = (row: FormattedTreatment, cellId: string) => {
    switch (cellId) {
      case 'drugName':
        return row.drugName;
      case 'status':
        return <Tag type={getTagType(row.status)}>{row.status}</Tag>;
      case 'provider':
        return row.provider;
      case 'startDate':
        return row.startDate || '-';
      case 'endDate':
        return row.endDate || '-';
      case 'duration':
        return row.duration;
      default:
        return null;
    }
  };

  const renderExpandedContent = (row: FormattedTreatment) => {
    if (!row.dosageInstructions) return undefined;

    return (
      <div className="expanded-content">
        <h4>Dosage Instructions</h4>
        <p>{row.dosageInstructions}</p>
      </div>
    );
  };

  return (
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
  );
};
