import React from 'react';
import { render, screen } from '@testing-library/react';
import { TreatmentDisplayControl } from '../TreatmentDisplayControl';
import { usePatientUUID } from '../../../hooks/usePatientUUID';
import { useTreatments } from '../../../hooks/useTreatments';

// Mock hooks
jest.mock('../../../hooks/usePatientUUID');
jest.mock('../../../hooks/useTreatments');

const mockPatientUUID = 'test-patient-uuid';
const mockTreatments = [
  {
    id: '1',
    drugName: 'Paracetamol',
    status: 'Active',
    provider: 'Dr. Smith',
    startDate: '2024-01-01T10:00:00',
    endDate: '2024-01-07T10:00:00',
    duration: '7 days',
    dosageInstructions: 'Take 1 tablet every 6 hours'
  },
  {
    id: '2',
    drugName: 'Amoxicillin',
    status: 'Completed',
    provider: 'Dr. Jones',
    startDate: '2024-02-01T10:00:00',
    endDate: '2024-02-14T10:00:00',
    duration: '14 days',
    dosageInstructions: 'Take 1 capsule three times a day'
  }
];

describe('TreatmentDisplayControl', () => {
  beforeEach(() => {
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
  });

  it('renders loading state correctly', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: true,
      error: null
    });

    render(<TreatmentDisplayControl />);
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const error = new Error('Failed to fetch treatments');
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: false,
      error
    });

    render(<TreatmentDisplayControl />);
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: false,
      error: null
    });

    render(<TreatmentDisplayControl />);
    expect(screen.getByTestId('expandable-data-table-empty')).toBeInTheDocument();
    expect(screen.getByText('No treatments found')).toBeInTheDocument();
  });

  it('renders treatments data correctly', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: mockTreatments,
      loading: false,
      error: null
    });

    render(<TreatmentDisplayControl />);
    expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: mockTreatments,
      loading: false,
      error: null
    });

    const customTitle = 'Custom Treatment Title';
    render(<TreatmentDisplayControl tableTitle={customTitle} />);
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('renders with custom aria label', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: mockTreatments,
      loading: false,
      error: null
    });

    const customAriaLabel = 'Custom aria label';
    render(<TreatmentDisplayControl ariaLabel={customAriaLabel} />);
    expect(screen.getByLabelText(customAriaLabel)).toBeInTheDocument();
  });
});
