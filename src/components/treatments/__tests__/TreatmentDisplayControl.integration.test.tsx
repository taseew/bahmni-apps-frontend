import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TreatmentDisplayControl from '../TreatmentDisplayControl';
import { getMedicationRequests } from '@services/treatmentService';
import { usePatientUUID } from '@hooks/usePatientUUID';

// Mock dependencies
jest.mock('@services/treatmentService');
jest.mock('@hooks/usePatientUUID');
jest.mock('@hooks/useNotification', () => ({
  useNotification: () => ({
    addNotification: jest.fn()
  })
}));

// Do not mock ExpandableDataTable for integration test
jest.mock('@components/expandableDataTable/ExpandableDataTable', () => {
  const actual = jest.requireActual('@components/expandableDataTable/ExpandableDataTable');
  return actual;
});

describe('TreatmentDisplayControl Integration', () => {
  const mockPatientUUID = 'test-patient-uuid';
  const mockMedicationRequests = [
    {
      resourceType: 'MedicationRequest',
      id: '123',
      meta: {
        versionId: '1',
        lastUpdated: '2025-04-03T09:53:54.000+00:00'
      },
      status: 'active',
      intent: 'order',
      priority: 'routine',
      medicationReference: {
        reference: 'Medication/123',
        type: 'Medication',
        display: 'Paracetamol 650 mg'
      },
      subject: {
        reference: 'Patient/456',
        type: 'Patient',
        display: 'Test Patient'
      },
      encounter: {
        reference: 'Encounter/789',
        type: 'Encounter'
      },
      authoredOn: '2025-04-03T09:53:54+00:00',
      requester: {
        reference: 'Practitioner/abc',
        type: 'Practitioner',
        display: 'Dr. Test'
      },
      dosageInstruction: [
        {
          text: '{"instructions":"As directed"}',
          timing: {
            event: ['2025-04-03T09:53:53+00:00'],
            repeat: {
              duration: 2,
              durationUnit: 'd'
            },
            code: {
              coding: [
                {
                  code: 'd46b7993-5e07-11ef-8f7c-0242ac120002',
                  display: 'Thrice a day'
                }
              ],
              text: 'Thrice a day'
            }
          },
          asNeededBoolean: false,
          route: {
            coding: [
              {
                code: 'd4634f75-5e07-11ef-8f7c-0242ac120002',
                display: 'Oral'
              }
            ],
            text: 'Oral'
          },
          doseAndRate: [
            {
              doseQuantity: {
                value: 2,
                unit: 'Tablet',
                system: 'http://snomed.info/sct',
                code: '385055001'
              }
            }
          ]
        }
      ]
    },
    {
      resourceType: 'MedicationRequest',
      id: '456',
      meta: {
        versionId: '1',
        lastUpdated: '2025-04-03T09:53:54.000+00:00'
      },
      status: 'completed',
      intent: 'order',
      priority: 'urgent',
      medicationReference: {
        reference: 'Medication/456',
        type: 'Medication',
        display: 'Aspirin 100 mg'
      },
      subject: {
        reference: 'Patient/456',
        type: 'Patient',
        display: 'Test Patient'
      },
      encounter: {
        reference: 'Encounter/789',
        type: 'Encounter'
      },
      authoredOn: '2025-04-03T09:53:54+00:00',
      requester: {
        reference: 'Practitioner/abc',
        type: 'Practitioner',
        display: 'Dr. Test'
      },
      dosageInstruction: [
        {
          text: 'Take with food',
          timing: {
            event: ['2025-04-03T09:53:53+00:00'],
            repeat: {
              duration: 5,
              durationUnit: 'd'
            },
            code: {
              coding: [
                {
                  code: 'd46b3ffe-5e07-11ef-8f7c-0242ac120002',
                  display: 'Once a day'
                }
              ],
              text: 'Once a day'
            }
          },
          asNeededBoolean: false,
          route: {
            coding: [
              {
                code: 'd4634f75-5e07-11ef-8f7c-0242ac120002',
                display: 'Oral'
              }
            ],
            text: 'Oral'
          },
          doseAndRate: [
            {
              doseQuantity: {
                value: 1,
                unit: 'Tablet',
                system: 'http://snomed.info/sct',
                code: '385055001'
              }
            }
          ]
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
    (getMedicationRequests as jest.Mock).mockResolvedValue(mockMedicationRequests);
  });

  it('should fetch and display treatments', async () => {
    render(<TreatmentDisplayControl />);

    // Wait for data to load
    await waitFor(() => {
      expect(getMedicationRequests).toHaveBeenCalledWith(mockPatientUUID);
    });

    // Check if medication names are displayed
    await waitFor(() => {
      expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
      expect(screen.getByText('Aspirin 100 mg')).toBeInTheDocument();
    });

    // Check if status tags are displayed
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    // Check if priority tags are displayed
    await waitFor(() => {
      expect(screen.getByText('ROUTINE')).toBeInTheDocument();
      expect(screen.getByText('URGENT')).toBeInTheDocument();
    });

    // Check if dosage information is displayed
    await waitFor(() => {
      expect(screen.getByText('Thrice a day')).toBeInTheDocument();
      expect(screen.getByText('Once a day')).toBeInTheDocument();
      expect(screen.getByText('2 Tablet')).toBeInTheDocument();
      expect(screen.getByText('1 Tablet')).toBeInTheDocument();
    });
  });

  it('should display empty state when no treatments are found', async () => {
    (getMedicationRequests as jest.Mock).mockResolvedValue([]);

    render(<TreatmentDisplayControl />);

    await waitFor(() => {
      expect(screen.getByText('No treatments found')).toBeInTheDocument();
    });
  });

  it('should display error state when API fails', async () => {
    const error = new Error('API Error');
    (getMedicationRequests as jest.Mock).mockRejectedValue(error);

    render(<TreatmentDisplayControl />);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  it('should display loading state initially', async () => {
    // Delay the API response to ensure loading state is visible
    (getMedicationRequests as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockMedicationRequests), 100);
      });
    });

    render(<TreatmentDisplayControl />);

    // Check for loading state
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    });
  });
});
