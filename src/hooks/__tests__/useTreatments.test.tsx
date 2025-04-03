import { renderHook, waitFor } from '@testing-library/react';
import { useTreatments } from '../useTreatments';
import { getMedicationRequests } from '../../services/treatmentService';
import { useNotification } from '../useNotification';

// Mock dependencies
jest.mock('../../services/treatmentService');
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
    }
  ]
};

describe('useTreatments', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({ addNotification: mockAddNotification });
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useTreatments(mockPatientUUID));

    expect(result.current).toEqual({
      treatments: [],
      loading: true,
      error: null,
      refetch: expect.any(Function)
    });
  });

  it('fetches and transforms treatments data', async () => {
    (getMedicationRequests as jest.Mock).mockResolvedValue(mockFhirResponse);

    const { result } = renderHook(() => useTreatments(mockPatientUUID));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.treatments).toHaveLength(1);
    expect(result.current.treatments[0]).toEqual({
      id: '1',
      drugName: 'Paracetamol 500mg',
      status: 'Active',
      provider: 'Dr. Smith',
      startDate: expect.any(String),
      endDate: expect.any(String),
      duration: '7 days',
      dosageInstructions: 'Take 1 tablet every 6 hours'
    });
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    const error = new Error('Failed to fetch treatments');
    (getMedicationRequests as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useTreatments(mockPatientUUID));

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
    const { result } = renderHook(() => useTreatments(null));

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
      { initialProps: mockPatientUUID }
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

    const { result } = renderHook(() => useTreatments(mockPatientUUID));

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
