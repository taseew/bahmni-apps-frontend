import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    priority: 'STAT',
    provider: 'Dr. Smith',
    startDate: '2024-01-01T10:00:00',
    endDate: '2024-01-07T10:00:00',
    duration: '7 days',
    frequency: '4 times per day',
    route: 'Oral',
    doseQuantity: '500 mg',
    category: 'Pain Management',
    method: 'Swallow whole',
    notes: ['Take with food', 'Avoid alcohol'],
    dosageInstructions: 'Take 1 tablet every 6 hours',
  },
  {
    id: '2',
    drugName: 'Amoxicillin',
    status: 'Completed',
    priority: 'ROUTINE',
    provider: 'Dr. Jones',
    startDate: '2024-02-01T10:00:00',
    endDate: '2024-02-14T10:00:00',
    duration: '14 days',
    frequency: '3 times per day',
    route: 'Oral',
    doseQuantity: '500 mg',
    method: 'Take with water',
    dosageInstructions: 'Take 1 capsule three times a day',
  },
];

describe('TreatmentDisplayControl', () => {
  beforeEach(() => {
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
  });

  it('renders loading state correctly', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: true,
      error: null,
    });

    render(<TreatmentDisplayControl />);
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const error = new Error('Failed to fetch treatments');
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: false,
      error,
    });

    render(<TreatmentDisplayControl />);
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: false,
      error: null,
    });

    render(<TreatmentDisplayControl />);
    expect(
      screen.getByTestId('expandable-data-table-empty'),
    ).toBeInTheDocument();
    expect(screen.getByText('No treatments found')).toBeInTheDocument();
  });

  describe('Data Display', () => {
    beforeEach(() => {
      (useTreatments as jest.Mock).mockReturnValue({
        treatments: mockTreatments,
        loading: false,
        error: null,
      });
    });

    it('renders basic treatment data correctly', () => {
      render(<TreatmentDisplayControl />);
      expect(screen.getByTestId('treatments-table')).toBeInTheDocument();
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
    });

    it('renders status tags with correct colors', () => {
      render(<TreatmentDisplayControl />);
      const activeTag = screen.getByText('Active').closest('div');
      const completedTag = screen.getByText('Completed').closest('div');

      expect(activeTag).toHaveClass('green');
      expect(completedTag).toHaveClass('blue');
    });

    it('renders priority tags correctly', () => {
      render(<TreatmentDisplayControl />);
      const statTag = screen.getByText('STAT').closest('div');
      const routineTag = screen.getByText('ROUTINE').closest('div');

      expect(statTag).toHaveClass('red');
      expect(routineTag).toHaveClass('blue');
    });

    it('renders dosage information correctly', () => {
      render(<TreatmentDisplayControl />);
      expect(screen.getByText('500 mg')).toBeInTheDocument();
      expect(screen.getByText('4 times per day')).toBeInTheDocument();
      expect(screen.getByText('Oral')).toBeInTheDocument();
    });

    it('renders expanded content with all sections', async () => {
      render(<TreatmentDisplayControl />);
      const expandButton = screen.getAllByRole('button')[0];
      fireEvent.click(expandButton);

      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Pain Management')).toBeInTheDocument();
      expect(screen.getByText('Take with food')).toBeInTheDocument();
      expect(screen.getByText('Avoid alcohol')).toBeInTheDocument();
      expect(screen.getByText('Swallow whole')).toBeInTheDocument();
    });
  });

  it('renders with custom title', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: mockTreatments,
      loading: false,
      error: null,
    });

    const customTitle = 'Custom Treatment Title';
    render(<TreatmentDisplayControl tableTitle={customTitle} />);
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('renders with custom aria label', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: mockTreatments,
      loading: false,
      error: null,
    });

    const customAriaLabel = 'Custom aria label';
    render(<TreatmentDisplayControl ariaLabel={customAriaLabel} />);
    expect(screen.getByLabelText(customAriaLabel)).toBeInTheDocument();
  });
});
