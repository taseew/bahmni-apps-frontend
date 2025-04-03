import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TreatmentDisplayControl } from '../TreatmentDisplayControl';
import { getMedicationRequests, transformFhirMedicationData } from '../../../services/treatmentService';
import { usePatientUUID } from '../../../hooks/usePatientUUID';
import { NotificationProvider } from '../../../providers/NotificationProvider';
import { mockPatientUUID, mockFhirMedicationRequests } from '../../../__mocks__/treatmentMocks';

// Mock the API service and usePatientUUID hook
jest.mock('../../../services/treatmentService', () => ({
  getMedicationRequests: jest.fn(),
  transformFhirMedicationData: jest.fn().mockImplementation((data) => {
    return data.map((item: any) => ({
      id: item.id,
      drugName: item.medicationReference?.display ?? 'Unknown',
      status: item.status === 'active' ? 'Active' : 'Completed',
      priority: item.priority?.toUpperCase(),
      provider: item.requester.display,
      startDate: item.authoredOn,
      duration: '7 days',
      frequency: '4 times per day',
      route: 'Oral',
      method: 'Swallow whole',
      doseQuantity: '500 mg',
      dosageInstructions: 'Take 1 tablet every 6 hours'
    }))
  })
}));
jest.mock('../../../hooks/usePatientUUID');

const mockFhirResponse = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 1,
  entry: [
    {
      resource: mockFhirMedicationRequests[0]
    }
  ]
};

describe('TreatmentDisplayControl Integration', () => {
  beforeEach(() => {
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
    (getMedicationRequests as jest.Mock).mockResolvedValue(mockFhirResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <NotificationProvider>
        <TreatmentDisplayControl />
      </NotificationProvider>
    );

  it('fetches and displays treatment data correctly', async () => {
    renderComponent();

    // Check loading state
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();

    // Wait for data to load and verify basic data
    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    });

    // Verify API call
    expect(getMedicationRequests).toHaveBeenCalledWith(mockPatientUUID);

    // Check status and priority tags
    const activeTag = screen.getByText('Active').closest('div');
    const statTag = screen.getByText('STAT').closest('div');

    expect(activeTag).toHaveClass('cds--tag--green');
    expect(statTag).toHaveClass('cds--tag--red');

    // Check dosage information
    const doseElements = screen.getAllByText('500 mg');
    const frequencyElements = screen.getAllByText('4 times per day');
    const routeElements = screen.getAllByText('Oral');

    expect(doseElements[0]).toBeInTheDocument();
    expect(frequencyElements[0]).toBeInTheDocument();
    expect(routeElements[0]).toBeInTheDocument();
  });

  it('handles API error correctly', async () => {
    const error = new Error('Failed to fetch treatments');
    (getMedicationRequests as jest.Mock).mockRejectedValue(error);

    renderComponent();

    // Check loading state
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    });
  });

  it('handles empty response correctly', async () => {
    (getMedicationRequests as jest.Mock).mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByTestId('expandable-data-table-empty'),
      ).toBeInTheDocument();
      expect(screen.getByText('No treatments found')).toBeInTheDocument();
    });
  });
});
