import React from 'react';
import { render, screen } from '@testing-library/react';
import { TreatmentDisplayControl } from '../TreatmentDisplayControl';
import { usePatientUUID } from '../../../hooks/usePatientUUID';
import { useTreatments } from '../../../hooks/useTreatments';
import { NotificationProvider } from '../../../providers/NotificationProvider';
import {
  mockPatientUUID,
  mockFormattedTreatments,
  mockFormattedTreatmentWithMissingFields
} from '../../../__mocks__/treatmentMocks';

// Mock hooks
jest.mock('../../../hooks/usePatientUUID');
jest.mock('../../../hooks/useTreatments');

const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<typeof usePatientUUID>;
const mockedUseTreatments = useTreatments as jest.MockedFunction<typeof useTreatments>;

describe('TreatmentDisplayControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <NotificationProvider>
        <TreatmentDisplayControl />
      </NotificationProvider>
    );

  it('should call usePatientUUID to get patient UUID', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: mockFormattedTreatments,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    renderComponent();

    expect(usePatientUUID).toHaveBeenCalled();
  });

  it('should call useTreatments with the correct patient UUID', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: mockFormattedTreatments,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    renderComponent();

    expect(useTreatments).toHaveBeenCalledWith(mockPatientUUID);
  });

  it('should display formatted treatments correctly', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: mockFormattedTreatments,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    renderComponent();

    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('should handle missing optional fields', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: [mockFormattedTreatmentWithMissingFields],
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    renderComponent();

    expect(screen.getByText('Test Medication')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: [],
      loading: true,
      error: null,
      refetch: jest.fn()
    });

    renderComponent();

    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: [],
      loading: false,
      error: new Error('Failed to fetch treatments'),
      refetch: jest.fn()
    });

    renderComponent();

    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
  });

  it('should handle empty state', () => {
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    renderComponent();

    expect(screen.getByTestId('expandable-data-table-empty')).toBeInTheDocument();
    expect(screen.getByText('No treatments found')).toBeInTheDocument();
  });

  it('should refetch treatments when patient UUID changes', () => {
    const refetchMock = jest.fn();
    const newUUID = 'new-patient-uuid';

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseTreatments.mockReturnValue({
      treatments: mockFormattedTreatments,
      loading: false,
      error: null,
      refetch: refetchMock
    });

    const { rerender } = renderComponent();

    mockedUsePatientUUID.mockReturnValue(newUUID);
    rerender(
      <NotificationProvider>
        <TreatmentDisplayControl />
      </NotificationProvider>
    );

    expect(useTreatments).toHaveBeenCalledWith(newUUID);
  });
});
