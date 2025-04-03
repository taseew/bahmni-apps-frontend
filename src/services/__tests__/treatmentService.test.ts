import {
  formatStatus,
  getDrugName,
  getDosageInstructions,
  calculateDuration,
  formatDosageDetails,
  transformFhirToTreatment,
  formatTreatments,
  getMedicationRequests,
  getPatientMedicationRequestBundle
} from '../treatmentService';
import { get } from '../api';
import { FhirMedicationRequest } from '../../types/treatment';
import notificationService from '../notificationService';

// Mock dependencies
jest.mock('../api');
jest.mock('../notificationService');

describe('Treatment Service', () => {
  // Sample medication request for testing
  const mockMedicationRequest: FhirMedicationRequest = {
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
    ],
    dispenseRequest: {
      validityPeriod: {
        start: '2025-04-03T09:53:54+00:00'
      },
      numberOfRepeatsAllowed: 0,
      quantity: {
        value: 12,
        unit: 'Tablet',
        system: 'http://snomed.info/sct',
        code: '385055001'
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientMedicationRequestBundle', () => {
    it('should call get with the correct URL', async () => {
      const patientUUID = 'test-uuid';
      (get as jest.Mock).mockResolvedValueOnce({ entry: [] });

      await getPatientMedicationRequestBundle(patientUUID);

      expect(get).toHaveBeenCalledWith('/openmrs/ws/fhir2/R4/MedicationRequest?patient=test-uuid');
    });
  });

  describe('getMedicationRequests', () => {
    it('should return an empty array when no entries are found', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ entry: [] });

      const result = await getMedicationRequests('test-uuid');

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      const result = await getMedicationRequests('test-uuid');

      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });

    it('should extract resources from bundle entries', async () => {
      const mockBundle = {
        entry: [
          { resource: mockMedicationRequest },
          { resource: { ...mockMedicationRequest, id: '456' } }
        ]
      };
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getMedicationRequests('test-uuid');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('123');
      expect(result[1].id).toBe('456');
    });
  });

  describe('formatStatus', () => {
    it('should format active status correctly', () => {
      expect(formatStatus('active')).toBe('Active');
    });

    it('should format on-hold status correctly', () => {
      expect(formatStatus('on-hold')).toBe('On Hold');
    });

    it('should handle unknown status', () => {
      expect(formatStatus('unknown-status')).toBe('Unknown');
    });

    it('should handle null or undefined status', () => {
      expect(formatStatus('')).toBe('Unknown');
      expect(formatStatus(undefined as any)).toBe('Unknown');
    });
  });

  describe('getDrugName', () => {
    it('should get drug name from medicationReference', () => {
      expect(getDrugName(mockMedicationRequest)).toBe('Paracetamol 650 mg');
    });

    it('should get drug name from medicationCodeableConcept text', () => {
      const request = {
        ...mockMedicationRequest,
        medicationReference: undefined,
        medicationCodeableConcept: {
          text: 'Aspirin 100 mg'
        }
      };
      expect(getDrugName(request)).toBe('Aspirin 100 mg');
    });

    it('should get drug name from medicationCodeableConcept coding', () => {
      const request = {
        ...mockMedicationRequest,
        medicationReference: undefined,
        medicationCodeableConcept: {
          text: '',
          coding: [
            {
              system: 'test',
              code: 'test',
              display: 'Ibuprofen 400 mg'
            }
          ]
        }
      };
      expect(getDrugName(request)).toBe('Ibuprofen 400 mg');
    });

    it('should return Unknown Medication when no name is found', () => {
      const request = {
        ...mockMedicationRequest,
        medicationReference: undefined,
        medicationCodeableConcept: undefined
      };
      expect(getDrugName(request)).toBe('Unknown Medication');
    });
  });

  describe('getDosageInstructions', () => {
    it('should parse JSON instructions', () => {
      expect(getDosageInstructions(mockMedicationRequest)).toBe('As directed');
    });

    it('should handle non-JSON text', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {
            text: 'Take with food'
          }
        ]
      };
      expect(getDosageInstructions(request)).toBe('Take with food');
    });

    it('should handle missing text', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {
            text: undefined
          }
        ]
      };
      expect(getDosageInstructions(request)).toBe('-');
    });

    it('should handle missing dosageInstruction', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: undefined
      };
      expect(getDosageInstructions(request)).toBe('-');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration with days unit', () => {
      expect(calculateDuration(mockMedicationRequest)).toBe('2 day(s)');
    });

    it('should handle different duration units', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {
            timing: {
              repeat: {
                duration: 3,
                durationUnit: 'wk'
              }
            }
          }
        ]
      };
      expect(calculateDuration(request)).toBe('3 week(s)');
    });

    it('should handle missing duration', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {
            timing: {
              repeat: {}
            }
          }
        ]
      };
      expect(calculateDuration(request)).toBe('-');
    });

    it('should handle missing timing', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {}
        ]
      };
      expect(calculateDuration(request)).toBe('-');
    });
  });

  describe('formatDosageDetails', () => {
    it('should format all dosage details correctly', () => {
      const result = formatDosageDetails(mockMedicationRequest);
      expect(result).toEqual({
        frequency: 'Thrice a day',
        route: 'Oral',
        doseQuantity: '2 Tablet',
        instruction: 'As directed'
      });
    });

    it('should handle missing frequency', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {
            ...mockMedicationRequest.dosageInstruction![0],
            timing: {
              ...mockMedicationRequest.dosageInstruction![0].timing,
              code: undefined
            }
          }
        ]
      };
      const result = formatDosageDetails(request);
      expect(result.frequency).toBe('-');
    });

    it('should handle missing route', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {
            ...mockMedicationRequest.dosageInstruction![0],
            route: undefined
          }
        ]
      };
      const result = formatDosageDetails(request);
      expect(result.route).toBe('-');
    });

    it('should handle missing doseQuantity', () => {
      const request = {
        ...mockMedicationRequest,
        dosageInstruction: [
          {
            ...mockMedicationRequest.dosageInstruction![0],
            doseAndRate: undefined
          }
        ]
      };
      const result = formatDosageDetails(request);
      expect(result.doseQuantity).toBe('-');
    });
  });

  describe('transformFhirToTreatment', () => {
    it('should transform FHIR medication request to treatment', () => {
      const result = transformFhirToTreatment(mockMedicationRequest);
      expect(result).toEqual({
        id: '123',
        drugName: 'Paracetamol 650 mg',
        status: 'Active',
        priority: 'ROUTINE',
        provider: 'Dr. Test',
        startDate: expect.any(String),
        duration: '2 day(s)',
        frequency: 'Thrice a day',
        route: 'Oral',
        doseQuantity: '2 Tablet',
        instruction: 'As directed',
        encounter: 'Encounter/789',
        category: 'Medication'
      });
    });

    it('should handle missing optional fields', () => {
      const request = {
        ...mockMedicationRequest,
        requester: undefined,
        encounter: undefined
      };
      const result = transformFhirToTreatment(request);
      expect(result.provider).toBe('-');
      expect(result.encounter).toBe('-');
    });
  });

  describe('formatTreatments', () => {
    it('should format an array of medication requests', () => {
      const requests = [
        mockMedicationRequest,
        { ...mockMedicationRequest, id: '456' }
      ];
      const result = formatTreatments(requests);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('123');
      expect(result[1].id).toBe('456');
    });

    it('should handle errors gracefully', () => {
      const error = new Error('Transformation Error');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create a request that will cause an error during transformation
      const badRequest = {} as FhirMedicationRequest;

      const result = formatTreatments([badRequest]);

      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });
});
