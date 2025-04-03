import React from 'react';
import { render, screen } from '@testing-library/react';
import TreatmentDisplayControl from '../TreatmentDisplayControl';
import { useTreatments } from '@hooks/useTreatments';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { ExpandableDataTable } from '@components/expandableDataTable/ExpandableDataTable';

// Mock dependencies
jest.mock('@hooks/useTreatments');
jest.mock('@hooks/usePatientUUID');
jest.mock('@components/expandableDataTable/ExpandableDataTable', () => ({
  ExpandableDataTable: jest.fn(() => <div data-testid="mock-expandable-table" />)
}));

describe('TreatmentDisplayControl', () => {
  const mockPatientUUID = 'test-patient-uuid';
  const mockTreatments = [
    {
      id: '123',
      drugName: 'Paracetamol 650 mg',
      status: 'Active',
      priority: 'ROUTINE',
      provider: 'Dr. Test',
      startDate: '2025-04-03 15:23:54',
      duration: '2 day(s)',
      frequency: 'Thrice a day',
      route: 'Oral',
      doseQuantity: '2 Tablet',
      instruction: 'As directed',
      encounter: 'Encounter/789',
      category: 'Medication'
    },
    {
      id: '456',
      drugName: 'Aspirin 100 mg',
      status: 'Active',
      priority: 'ROUTINE',
      provider: 'Dr. Test',
      startDate: '2025-04-03 15:23:54',
      duration: '5 day(s)',
      frequency: 'Once a day',
      route: 'Oral',
      doseQuantity: '1 Tablet',
      instruction: 'Take after food',
      encounter: 'Encounter/789',
      category: 'Medication'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: mockTreatments,
      loading: false,
      error: null,
      refetch: jest.fn()
    });
  });

  it('should render without crashing', () => {
    render(<TreatmentDisplayControl />);
    expect(screen.getByTestId('mock-expandable-table')).toBeInTheDocument();
  });

  it('should use the patient UUID from the hook', () => {
    render(<TreatmentDisplayControl />);
    expect(usePatientUUID).toHaveBeenCalled();
    expect(useTreatments).toHaveBeenCalledWith(mockPatientUUID);
  });

  it('should pass the correct props to ExpandableDataTable', () => {
    render(<TreatmentDisplayControl tableTitle="Custom Title" ariaLabel="Custom Label" />);

    expect(ExpandableDataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        tableTitle: 'Custom Title',
        ariaLabel: 'Custom Label',
        rows: mockTreatments,
        emptyStateMessage: 'No treatments found'
      }),
      expect.anything()
    );
  });

  it('should use default props when not provided', () => {
    render(<TreatmentDisplayControl />);

    expect(ExpandableDataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        tableTitle: 'Treatments',
        ariaLabel: 'Treatments table'
      }),
      expect.anything()
    );
  });

  it('should apply the provided className', () => {
    render(<TreatmentDisplayControl className="custom-class" />);

    const container = screen.getByTestId('mock-expandable-table').parentElement;
    expect(container).toHaveClass('treatment-display-control');
    expect(container).toHaveClass('custom-class');
  });

  it('should handle loading state', () => {
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: true,
      error: null,
      refetch: jest.fn()
    });

    render(<TreatmentDisplayControl />);

    expect(ExpandableDataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        loading: true
      }),
      expect.anything()
    );
  });

  it('should handle error state', () => {
    const error = new Error('Test error');
    (useTreatments as jest.Mock).mockReturnValue({
      treatments: [],
      loading: false,
      error,
      refetch: jest.fn()
    });

    render(<TreatmentDisplayControl />);

    expect(ExpandableDataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        error
      }),
      expect.anything()
    );
  });

  it('should pass the correct headers to ExpandableDataTable', () => {
    render(<TreatmentDisplayControl />);

    expect(ExpandableDataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.arrayContaining([
          expect.objectContaining({ key: 'drugName', header: 'Medication' }),
          expect.objectContaining({ key: 'status', header: 'Status' }),
          expect.objectContaining({ key: 'priority', header: 'Priority' }),
          expect.objectContaining({ key: 'provider', header: 'Provider' }),
          expect.objectContaining({ key: 'startDate', header: 'Start Date' }),
          expect.objectContaining({ key: 'duration', header: 'Duration' }),
          expect.objectContaining({ key: 'frequency', header: 'Frequency' }),
          expect.objectContaining({ key: 'route', header: 'Route' }),
          expect.objectContaining({ key: 'doseQuantity', header: 'Dose' }),
          expect.objectContaining({ key: 'instruction', header: 'Instructions' })
        ])
      }),
      expect.anything()
    );
  });

  it('should pass renderCell and renderExpandedContent functions', () => {
    render(<TreatmentDisplayControl />);

    expect(ExpandableDataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        renderCell: expect.any(Function),
        renderExpandedContent: expect.any(Function)
      }),
      expect.anything()
    );
  });
});
