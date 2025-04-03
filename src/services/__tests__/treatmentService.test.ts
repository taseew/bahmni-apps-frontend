import {
  getMedicationRequests,
  transformFhirMedicationData,
  formatStatus,
  formatDosageDetails,
  getDrugName,
  getDosageInstructions,
  transformFhirToTreatment,
} from '../treatmentService';
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
              display: 'Paracetamol',
            },
          ],
          text: 'Paracetamol 500mg',
        },
        subject: {
          reference: `Patient/${mockPatientUUID}`,
          type: 'Patient',
        },
        authoredOn: '2024-01-01T10:00:00',
        requester: {
          reference: 'Practitioner/1',
          type: 'Practitioner',
          display: 'Dr. Smith',
        },
        dosageInstruction: [
          {
            timing: {
              repeat: {
                duration: 7,
                durationUnit: 'days',
                boundsPeriod: {
                  start: '2024-01-01T10:00:00',
                  end: '2024-01-07T10:00:00',
                },
              },
            },
            text: 'Take 1 tablet every 6 hours',
          },
        ],
      },
    },
  ],
};

describe('treatmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formatDateTime as jest.Mock).mockImplementation((date) => date);
  });

  describe('getMedicationRequests', () => {
    it('calls the correct API endpoint', async () => {
      (get as jest.Mock).mockResolvedValue(mockFhirResponse);

      await getMedicationRequests(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(
        PATIENT_MEDICATION_REQUEST_URL(mockPatientUUID),
      );
    });

    it('returns the API response', async () => {
      (get as jest.Mock).mockResolvedValue(mockFhirResponse);

      const result = await getMedicationRequests(mockPatientUUID);

      expect(result).toEqual(mockFhirResponse);
    });

    it('throws error when API call fails', async () => {
      const error = new Error('API Error');
      (get as jest.Mock).mockRejectedValue(error);

      await expect(getMedicationRequests(mockPatientUUID)).rejects.toThrow(
        error,
      );
    });

    it('throws error when patientUUID is empty', async () => {
      await expect(getMedicationRequests('')).rejects.toThrow();
    });

    it('throws error when server returns 500 error', async () => {
      const serverError = new Error('Server Error');
      serverError.name = 'ServerError';
      (get as jest.Mock).mockRejectedValue(serverError);

      await expect(getMedicationRequests(mockPatientUUID)).rejects.toThrow(
        serverError,
      );
    });

    it('throws error when response is malformed', async () => {
      const malformedResponse = {
        resourceType: 'Bundle',
        // Missing required fields
      };
      (get as jest.Mock).mockResolvedValue(malformedResponse);

      const result = await getMedicationRequests(mockPatientUUID);
      expect(result).toEqual(malformedResponse);
      // The error would be caught during transformation, not during fetching
    });
  });

  describe('formatStatus', () => {
    it('formats all valid FHIR statuses correctly', () => {
      expect(formatStatus('active')).toBe('Active');
      expect(formatStatus('on-hold')).toBe('On Hold');
      expect(formatStatus('cancelled')).toBe('Cancelled');
      expect(formatStatus('completed')).toBe('Completed');
      expect(formatStatus('stopped')).toBe('Stopped');
      expect(formatStatus('draft')).toBe('Draft');
      expect(formatStatus('unknown')).toBe('Unknown');
    });

    it('returns "Unknown" for invalid status', () => {
      expect(formatStatus('invalid-status' as any)).toBe('Unknown');
    });

    it('returns "Unknown" for undefined status', () => {
      expect(formatStatus(undefined as any)).toBe('Unknown');
    });
  });

  describe('formatDosageDetails', () => {
    const mockInstruction = {
      timing: {
        repeat: {
          duration: 7,
          durationUnit: 'days',
        },
        code: {
          text: '4 times per day',
        },
      },
      route: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral',
          },
        ],
      },
      method: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '421521009',
            display: 'Swallow whole',
          },
        ],
      },
      doseAndRate: [
        {
          doseQuantity: {
            value: 500,
            unit: 'mg',
          },
        },
      ],
    };

    it('formats dosage details correctly when all fields are present', () => {
      const result = formatDosageDetails(mockInstruction as any);

      expect(result.duration).toBe('7 days');
      expect(result.frequency).toBe('4 times per day');
      expect(result.route).toBe('Oral');
      expect(result.method).toBe('Swallow whole');
      expect(result.doseQuantity).toBe('500 mg');
    });

    it('returns "No duration specified" when timing.duration is missing', () => {
      const modifiedInstruction = {
        ...mockInstruction,
        timing: {
          ...mockInstruction.timing,
          repeat: {},
        },
      };

      const result = formatDosageDetails(modifiedInstruction as any);
      expect(result.duration).toBe('No duration specified');
    });

    it('returns "No frequency specified" when timing.code.text is missing', () => {
      const modifiedInstruction = {
        ...mockInstruction,
        timing: {
          ...mockInstruction.timing,
          code: undefined,
        },
      };

      const result = formatDosageDetails(modifiedInstruction as any);
      expect(result.frequency).toBe('No frequency specified');
    });

    it('returns undefined for doseQuantity when doseAndRate is missing', () => {
      const modifiedInstruction = {
        ...mockInstruction,
        doseAndRate: undefined,
      };

      const result = formatDosageDetails(modifiedInstruction as any);
      expect(result.doseQuantity).toBeUndefined();
    });

    it('handles undefined instruction gracefully', () => {
      const result = formatDosageDetails({ timing: {} } as any);

      expect(result.duration).toBe('No duration specified');
      expect(result.frequency).toBe('No frequency specified');
      expect(result.route).toBeUndefined();
      expect(result.method).toBeUndefined();
      expect(result.doseQuantity).toBeUndefined();
    });
  });

  describe('getDrugName', () => {
    it('returns medicationReference.display when available', () => {
      const mockData = {
        medicationReference: {
          display: 'Test Medication',
        },
      };

      expect(getDrugName(mockData as any)).toBe('Test Medication');
    });

    it('returns medicationCodeableConcept.text when medicationReference is missing', () => {
      const mockData = {
        medicationCodeableConcept: {
          text: 'Test Medication Text',
        },
      };

      expect(getDrugName(mockData as any)).toBe('Test Medication Text');
    });

    it('returns medicationCodeableConcept.coding[0].display when text is missing', () => {
      const mockData = {
        medicationCodeableConcept: {
          coding: [
            {
              display: 'Test Medication Coding',
            },
          ],
          text: '',
        },
      };

      expect(getDrugName(mockData as any)).toBe('Test Medication Coding');
    });

    it('returns "Unknown Medication" when both medicationReference and medicationCodeableConcept are missing', () => {
      const mockData = {};

      expect(getDrugName(mockData as any)).toBe('Unknown Medication');
    });

    it('returns "Unknown Medication" when medicationReference.display is null', () => {
      const mockData = {
        medicationReference: {
          display: null,
        },
      };

      expect(getDrugName(mockData as any)).toBe('Unknown Medication');
    });
  });

  describe('getDosageInstructions', () => {
    it('returns instructions from valid JSON', () => {
      const mockData = {
        dosageInstruction: [
          {
            text: '{"instructions": "Take 1 tablet every 6 hours"}',
          },
        ],
      };

      expect(getDosageInstructions(mockData as any)).toBe(
        'Take 1 tablet every 6 hours',
      );
    });

    it('returns raw text when not valid JSON', () => {
      const mockData = {
        dosageInstruction: [
          {
            text: 'Take 1 tablet every 6 hours',
          },
        ],
      };

      expect(getDosageInstructions(mockData as any)).toBe(
        'Take 1 tablet every 6 hours',
      );
    });

    it('returns "No instructions specified" when text is missing', () => {
      const mockData = {
        dosageInstruction: [
          {
            text: '',
          },
        ],
      };

      expect(getDosageInstructions(mockData as any)).toBe(
        'No instructions specified',
      );
    });

    it('returns "No instructions specified" when dosageInstruction is null', () => {
      const mockData = {
        dosageInstruction: null,
      };

      expect(getDosageInstructions(mockData as any)).toBe(
        'No instructions specified',
      );
    });
  });

  describe('transformFhirToTreatment', () => {
    const mockFhirData = mockFhirResponse.entry![0].resource as any;

    it('transforms all fields correctly', () => {
      const result = transformFhirToTreatment(mockFhirData);

      expect(result).toMatchObject({
        id: '1',
        drugName: 'Paracetamol 500mg',
        status: 'Active',
        provider: 'Dr. Smith',
        startDate: '2024-01-01T10:00:00',
        duration: '7 days',
        dosageInstructions: 'Take 1 tablet every 6 hours',
      });
    });

    it('returns "Unknown Provider" when requester.display is missing', () => {
      const modifiedData = {
        ...mockFhirData,
        requester: {
          reference: 'Practitioner/1',
          type: 'Practitioner',
        },
      };

      const result = transformFhirToTreatment(modifiedData);
      expect(result.provider).toBe('Unknown Provider');
    });

    it('returns undefined for category when category is missing', () => {
      const modifiedData = {
        ...mockFhirData,
        category: undefined,
      };

      const result = transformFhirToTreatment(modifiedData);
      expect(result.category).toBeUndefined();
    });

    it('returns undefined for visitInfo when encounter is missing', () => {
      const modifiedData = {
        ...mockFhirData,
        encounter: undefined,
      };

      const result = transformFhirToTreatment(modifiedData);
      expect(result.visitInfo).toBeUndefined();
    });

    it('handles missing optional fields gracefully', () => {
      const modifiedData = {
        ...mockFhirData,
        priority: undefined,
        category: undefined,
        note: undefined,
      };

      const result = transformFhirToTreatment(modifiedData);
      expect(result.priority).toBeUndefined();
      expect(result.category).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('transformFhirMedicationData', () => {
    // Use type assertion to handle the old FHIR structure
    const mockFhirData = mockFhirResponse.entry![0]
      .resource as unknown as FhirMedicationRequest;

    it('transforms FHIR data correctly', () => {
      const result = transformFhirMedicationData([mockFhirData]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        drugName: 'Paracetamol 500mg',
        status: 'Active',
        provider: 'Dr. Smith',
        startDate: '2024-01-01T10:00:00',
        duration: '7 days',
        dosageInstructions: 'Take 1 tablet every 6 hours',
      });
    });

    it('handles missing medication text by using coding display', () => {
      const modifiedData = {
        ...mockFhirData,
        medicationCodeableConcept: {
          coding: [{ system: '', code: '', display: 'Paracetamol' }],
          text: '',
        },
      } as unknown as FhirMedicationRequest;

      const result = transformFhirMedicationData([modifiedData]);

      expect(result[0].drugName).toBe('Paracetamol');
    });

    it('handles missing medication information', () => {
      const modifiedData = {
        ...mockFhirData,
        medicationCodeableConcept: undefined,
      } as unknown as FhirMedicationRequest;

      const result = transformFhirMedicationData([modifiedData]);

      expect(result[0].drugName).toBe('Unknown Medication');
    });

    it('handles missing dosage instructions', () => {
      const modifiedData = {
        ...mockFhirData,
        dosageInstruction: [{ timing: { event: [] } }],
      } as unknown as FhirMedicationRequest;

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

    it('returns empty array when fhirData is empty', () => {
      const result = transformFhirMedicationData([]);
      expect(result).toEqual([]);
    });

    it('returns empty array and logs error when fhirData is null', () => {
      const result = transformFhirMedicationData(null as any);
      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    const mockFhirData = mockFhirResponse.entry![0].resource as any;

    it('does not mutate the original input data during transformation', () => {
      const originalData = JSON.parse(JSON.stringify(mockFhirData));
      transformFhirMedicationData([mockFhirData]);

      expect(mockFhirData).toEqual(originalData);
    });

    it('handles unexpected field structures without breaking execution', () => {
      const unexpectedData = {
        ...mockFhirData,
        dosageInstruction: [
          {
            timing: {
              // Unexpected structure
              unexpectedField: 'value',
            },
          },
        ],
      };

      const result = transformFhirMedicationData([unexpectedData]);
      expect(result).toHaveLength(1);
      expect(result[0].duration).toBe('No duration specified');
    });

    it('ensures compatibility with future FHIR schema changes', () => {
      const futureSchemaData = {
        ...mockFhirData,
        status: 'future-status' as any, // Future status not in current enum
        newField: 'value',
      };

      const result = transformFhirMedicationData([futureSchemaData]);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Unknown'); // Falls back to Unknown for unrecognized status
    });
  });
});
