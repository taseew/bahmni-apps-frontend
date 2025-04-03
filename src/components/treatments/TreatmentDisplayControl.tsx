import React from 'react';
import { Tag, SkeletonText } from '@carbon/react';
import { Treatment, TreatmentDisplayControlProps } from '@types/treatment';
import { useTreatments } from '@hooks/useTreatments';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { ExpandableDataTable } from '../expandableDataTable/ExpandableDataTable';

type TagType =
  | 'red'
  | 'magenta'
  | 'purple'
  | 'blue'
  | 'green'
  | 'cyan'
  | 'gray'
  | 'teal'
  | 'cool-gray'
  | 'warm-gray'
  | 'high-contrast'
  | 'outline';

/**
 * Get the appropriate tag type based on treatment status
 * @param status - The treatment status
 * @returns The tag type for the status
 */
const getTagType = (status: string): TagType => {
  switch (status) {
    case 'Active':
      return 'green';
    case 'On Hold':
      return 'purple';
    case 'Cancelled':
      return 'red';
    case 'Completed':
      return 'blue';
    case 'Stopped':
      return 'red';
    case 'Draft':
      return 'cyan';
    default:
      return 'gray';
  }
};

/**
 * Get the appropriate tag type based on treatment priority
 * @param priority - The treatment priority
 * @returns The tag type for the priority
 */
const getPriorityTag = (
  priority: string,
): { type: TagType; label: string } | null => {
  if (!priority) return null;

  switch (priority.toUpperCase()) {
    case 'STAT':
      return { type: 'red', label: 'STAT' };
    case 'ASAP':
      return { type: 'magenta', label: 'ASAP' };
    case 'URGENT':
      return { type: 'purple', label: 'URGENT' };
    case 'ROUTINE':
      return { type: 'blue', label: 'ROUTINE' };
    default:
      return { type: 'blue', label: priority };
  }
};

/**
 * Treatment Display Control Component
 * Displays patient treatment information in an expandable table
 */
const TreatmentDisplayControl: React.FC<TreatmentDisplayControlProps> = ({
  tableTitle = 'Treatments',
  ariaLabel = 'Treatments table',
}) => {
  const patientUUID = usePatientUUID();
  const { treatments, loading, error } = useTreatments(patientUUID);

  // Define table headers
  const headers = [
    { key: 'drugName', header: 'Medication' },
    { key: 'status', header: 'Status' },
    { key: 'priority', header: 'Priority' },
    { key: 'provider', header: 'Provider' },
    { key: 'startDate', header: 'Start Date' },
    { key: 'duration', header: 'Duration' },
    { key: 'frequency', header: 'Frequency' },
    { key: 'route', header: 'Route' },
    { key: 'doseQuantity', header: 'Dose' },
    { key: 'instruction', header: 'Instructions' },
  ];

  // Function to render cell content
  const renderCell = (row: Treatment, cellId: string) => {
    switch (cellId) {
      case 'drugName':
        return row.drugName;
      case 'status':
        return <Tag type={getTagType(row.status)}>{row.status}</Tag>;
      case 'priority': {
        const priorityTag = getPriorityTag(row.priority);
        return priorityTag ? (
          <Tag type={priorityTag.type}>{priorityTag.label}</Tag>
        ) : (
          '-'
        );
      }
      case 'provider':
        return row.provider || '-';
      case 'startDate':
        return row.startDate || '-';
      case 'duration':
        return row.duration || '-';
      case 'frequency':
        return row.frequency || '-';
      case 'route':
        return row.route || '-';
      case 'doseQuantity':
        return row.doseQuantity || '-';
      case 'instruction':
        return row.instruction || '-';
      default:
        return '-';
    }
  };

  // Function to render expanded content (if needed)
  const renderExpandedContent = (row: Treatment) => {
    // For now, we don't have expanded content
    return undefined;
  };

  return (
    <div
      style={{ width: '100%', paddingTop: '1rem' }}
      data-testid="treatment-display-control"
    >
      <ExpandableDataTable
        tableTitle={tableTitle}
        ariaLabel={ariaLabel}
        headers={headers}
        rows={treatments}
        renderCell={(row, cellId) => renderCell(row as Treatment, cellId)}
        renderExpandedContent={(row) => renderExpandedContent(row as Treatment)}
        emptyStateMessage="No treatments found"
      />
    </div>
  );
};

export default TreatmentDisplayControl;
