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
        resourceType: 'MedicationRequest' as const,
        id: '1',
        status: 'active',
        intent: 'order',
        priority: 'stat',
        medication: {
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
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
                code: 'pain-management',
                display: 'Pain Management'
              }
            ]
          }
        ],
        note: [
          { text: 'Take with food' },
          { text: 'Avoid alcohol' }
        ],
        dosageInstruction: [
          {
            timing: {
              repeat: {
                frequency: 4,
                period: 1,
                periodUnit: 'day',
                duration: 7,
                durationUnit: 'days',
                boundsPeriod: {
                  start: '2024-01-01T10:00:00',
                  end: '2024-01-07T10:00:00'
                }
              }
            },
            route: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '26643006',
                  display: 'Oral'
                }
              ]
            },
            method: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '421521009',
                  display: 'Swallow whole'
                }
              ]
            },
            doseAndRate: [
              {
                doseQuantity: {
                  value: 500,
                  unit: 'mg'
                }
              }
            ],
            text: 'Take 1 tablet every 6 hours'
          }
        ]
      }
    },
    {
      resource: {
        resourceType: 'MedicationRequest' as const,
        id: '2',
        status: 'completed',
        intent: 'order',
        priority: 'routine',
        medication: {
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
                frequency: 3,
                period: 1,
                periodUnit: 'day',
                duration: 14,
                durationUnit: 'days',
                boundsPeriod: {
                  start: '2024-02-01T10:00:00',
                  end: '2024-02-14T10:00:00'
                }
              }
            },
            route: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '26643006',
                  display: 'Oral'
                }
              ]
            },
            method: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '421521009',
                  display: 'Take with water'
                }
              ]
            },
            doseAndRate: [
              {
                doseQuantity: {
                  value: 500,
                  unit: 'mg'
                }
              }
            ],
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

    // Check basic data
    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();

    // Check status and priority tags
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('STAT')).toBeInTheDocument();
    expect(screen.getByText('ROUTINE')).toBeInTheDocument();

    // Check dosage information
    expect(screen.getByText('500 mg')).toBeInTheDocument();
    expect(screen.getByText('4 times per day')).toBeInTheDocument();
    expect(screen.getByText('Oral')).toBeInTheDocument();

    // Check expanded content
    const expandButton = screen.getAllByRole('button')[0];
    fireEvent.click(expandButton);

    expect(screen.getByText('Pain Management')).toBeInTheDocument();
    expect(screen.getByText('Take with food')).toBeInTheDocument();
    expect(screen.getByText('Avoid alcohol')).toBeInTheDocument();
    expect(screen.getByText('Swallow whole')).toBeInTheDocument();
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
