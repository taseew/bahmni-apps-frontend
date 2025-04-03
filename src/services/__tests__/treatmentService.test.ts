import { getMedicationRequests, transformFhirMedicationData } from '../treatmentService';
import { get } from '../api';
import { notificationService } from '../notificationService';
import { PATIENT_MEDICATION_REQUEST_URL } from '../../constants/app';
import { formatDateTime } from '../../utils/date';
import { FhirMedicationRequest } from '../../types/treatment';

// Mock dependencies
jest.mock('../api');
jest.mock('../notificationService');
jest.mock('../../utils/date');

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

describe('treatmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formatDateTime as jest.Mock).mockImplementation(date => date);
  });

  describe('getMedicationRequests', () => {
    it('calls the correct API endpoint', async () => {
      (get as jest.Mock).mockResolvedValue(mockFhirResponse);

      await getMedicationRequests(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(PATIENT_MEDICATION_REQUEST_URL(mockPatientUUID));
    });

    it('returns the API response', async () => {
      (get as jest.Mock).mockResolvedValue(mockFhirResponse);

      const result = await getMedicationRequests(mockPatientUUID);

      expect(result).toEqual(mockFhirResponse);
    });

    it('throws error when API call fails', async () => {
      const error = new Error('API Error');
      (get as jest.Mock).mockRejectedValue(error);

      await expect(getMedicationRequests(mockPatientUUID)).rejects.toThrow(error);
    });
  });

  describe('transformFhirMedicationData', () => {
    const mockFhirData = mockFhirResponse.entry![0].resource as FhirMedicationRequest;

    it('transforms FHIR data correctly', () => {
      const result = transformFhirMedicationData([mockFhirData]);

      expect(result).toEqual([
        {
          id: '1',
          drugName: 'Paracetamol 500mg',
          status: 'Active',
          provider: 'Dr. Smith',
          startDate: '2024-01-01T10:00:00',
          endDate: '2024-01-07T10:00:00',
          duration: '7 days',
          dosageInstructions: 'Take 1 tablet every 6 hours'
        }
      ]);
    });

    it('handles missing medication text by using coding display', () => {
      const modifiedData: FhirMedicationRequest = {
        ...mockFhirData,
        medicationCodeableConcept: {
          coding: [{ system: '', code: '', display: 'Paracetamol' }],
          text: ''
        }
      };

      const result = transformFhirMedicationData([modifiedData]);

      expect(result[0].drugName).toBe('Paracetamol');
    });

    it('handles missing medication information', () => {
      const modifiedData: FhirMedicationRequest = {
        ...mockFhirData,
        medicationCodeableConcept: undefined
      };

      const result = transformFhirMedicationData([modifiedData]);

      expect(result[0].drugName).toBe('Unknown Medication');
    });

    it('handles missing dosage instructions', () => {
      const modifiedData: FhirMedicationRequest = {
        ...mockFhirData,
        dosageInstruction: [{ timing: {} }]
      };

      const result = transformFhirMedicationData([modifiedData]);

      expect(result[0].duration).toBe('No duration specified');
      expect(result[0].dosageInstructions).toBe('No instructions specified');
    });

    it('shows notification on transformation error', () => {
      const invalidData = {} as any;

      transformFhirMedicationData([invalidData]);

      expect(notificationService.showError).toHaveBeenCalled();
    });

    it('filters out failed transformations and continues processing', () => {
      const validData = mockFhirData;
      const invalidData = {} as any;

      const result = transformFhirMedicationData([invalidData, validData]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
});
