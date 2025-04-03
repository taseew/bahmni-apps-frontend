import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useTreatments } from '../useTreatments';
import { getMedicationRequests, transformFhirMedicationData } from '../../services/treatmentService';
import { useNotification } from '../useNotification';
import { NotificationProvider } from '../../providers/NotificationProvider';

// Mock dependencies
jest.mock('../../services/treatmentService', () => ({
  getMedicationRequests: jest.fn(),
  transformFhirMedicationData: jest.fn()
}));
jest.mock('../useNotification');

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
        medicationReference: {
          reference: 'Medication/1',
          type: 'Medication',
          display: 'Paracetamol 500mg'
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
                durationUnit: 'days'
              },
              event: ['2024-01-01T10:00:00'],
              code: {
                text: '4 times per day',
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '229799001',
                    display: '4 times per day'
                  }
                ]
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
            text: '{"instructions": "Take 1 tablet every 6 hours"}'
          }
        ]
      }
    }
  ]
};

describe('useTreatments', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({ addNotification: mockAddNotification });
  });

  // Create a wrapper with NotificationProvider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it('returns initial state', () => {
    const { result } = renderHook(() => useTreatments(mockPatientUUID), { wrapper });

    expect(result.current).toEqual({
      treatments: [],
      loading: true,
      error: null,
      refetch: expect.any(Function)
    });
  });

  it('fetches and transforms treatments data', async () => {
    const mockFormattedTreatment = {
      id: '1',
      drugName: 'Paracetamol 500mg',
      status: 'Active',
      priority: 'STAT',
      provider: 'Dr. Smith',
      startDate: '2024-01-01T10:00:00',
      duration: '7 days',
      frequency: '4 times per day',
      route: 'Oral',
      method: 'Swallow whole',
      doseQuantity: '500 mg',
      dosageInstructions: 'Take 1 tablet every 6 hours'
    };

    (getMedicationRequests as jest.Mock).mockResolvedValue(mockFhirResponse);
    (transformFhirMedicationData as jest.Mock).mockReturnValue([mockFormattedTreatment]);

    const { result } = renderHook(() => useTreatments(mockPatientUUID), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(transformFhirMedicationData).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '1' })])
    );
    expect(result.current.treatments).toHaveLength(1);
    expect(result.current.treatments[0]).toEqual(mockFormattedTreatment);
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    const error = new Error('Failed to fetch treatments');
    (getMedicationRequests as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useTreatments(mockPatientUUID), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.treatments).toHaveLength(0);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: expect.any(String),
      message: expect.any(String)
    });
  });

  it('handles null patientUUID', () => {
    const { result } = renderHook(() => useTreatments(null), { wrapper });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Invalid patient UUID'
    });
  });

  it('refetches data when patientUUID changes', async () => {
    const newPatientUUID = 'new-patient-uuid';
    (getMedicationRequests as jest.Mock).mockResolvedValue(mockFhirResponse);

    const { result, rerender } = renderHook(
      (patientUUID) => useTreatments(patientUUID),
      { initialProps: mockPatientUUID, wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getMedicationRequests).toHaveBeenCalledWith(mockPatientUUID);

    rerender(newPatientUUID);

    await waitFor(() => {
      expect(getMedicationRequests).toHaveBeenCalledWith(newPatientUUID);
    });
  });

  it('refetches data when refetch is called', async () => {
    (getMedicationRequests as jest.Mock).mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useTreatments(mockPatientUUID), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getMedicationRequests).toHaveBeenCalledTimes(1);

    result.current.refetch();

    await waitFor(() => {
      expect(getMedicationRequests).toHaveBeenCalledTimes(2);
    });
  });
});
