import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TreatmentDisplayControl } from '../TreatmentDisplayControl';
import { getMedicationRequests } from '../../../services/treatmentService';
import { usePatientUUID } from '../../../hooks/usePatientUUID';

// Mock the API service and usePatientUUID hook
jest.mock('../../../services/treatmentService');
jest.mock('../../../hooks/usePatientUUID');

const mockPatientUUID = 'test-patient-uuid';
const mockFhirResponse = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 2,
  entry: [
    {
      resource: {
        resourceType: 'MedicationRequest',
        id: '1',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '123456',
              display: 'Paracetamol'
            }
          ],
          text: 'Paracetamol 500mg'
        },
        subject: {
          reference: `Patient/${mockPatientUUID}`,
          type: 'Patient'
        },
        authoredOn: '2024-01-01T10:00:00',
        requester: {
          reference: 'Practitioner/1',
          type: 'Practitioner',
          display: 'Dr. Smith'
        },
        dosageInstruction: [
          {
            timing: {
              repeat: {
                duration: 7,
                durationUnit: 'days',
                boundsPeriod: {
                  start: '2024-01-01T10:00:00',
                  end: '2024-01-07T10:00:00'
                }
              }
            },
            text: 'Take 1 tablet every 6 hours'
          }
        ]
      }
    },
    {
      resource: {
        resourceType: 'MedicationRequest',
        id: '2',
        status: 'completed',
        intent: 'order',
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '789012',
              display: 'Amoxicillin'
            }
          ],
          text: 'Amoxicillin 500mg'
        },
        subject: {
          reference: `Patient/${mockPatientUUID}`,
          type: 'Patient'
        },
        authoredOn: '2024-02-01T10:00:00',
        requester: {
          reference: 'Practitioner/2',
          type: 'Practitioner',
          display: 'Dr. Jones'
        },
        dosageInstruction: [
          {
            timing: {
              repeat: {
                duration: 14,
                durationUnit: 'days',
                boundsPeriod: {
                  start: '2024-02-01T10:00:00',
                  end: '2024-02-14T10:00:00'
                }
              }
            },
            text: 'Take 1 capsule three times a day'
          }
        ]
      }
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

  it('fetches and displays treatment data correctly', async () => {
    render(<TreatmentDisplayControl />);

    // Check loading state
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('expandable-table-skeleton')).not.toBeInTheDocument();
    });

    // Verify API call
    expect(getMedicationRequests).toHaveBeenCalledWith(mockPatientUUID);

    // Check rendered data
    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
  });

  it('handles API error correctly', async () => {
    const error = new Error('Failed to fetch treatments');
    (getMedicationRequests as jest.Mock).mockRejectedValue(error);

    render(<TreatmentDisplayControl />);

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
      total: 0
    });

    render(<TreatmentDisplayControl />);

    await waitFor(() => {
      expect(screen.getByTestId('expandable-data-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No treatments found')).toBeInTheDocument();
    });
  });
});
