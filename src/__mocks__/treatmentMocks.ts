import { FhirMedicationRequest, FormattedTreatment } from '../types/treatment';

export const mockPatientUUID = 'test-patient-uuid';

export const mockFhirMedicationRequests: FhirMedicationRequest[] = [
  {
    resourceType: 'MedicationRequest',
    id: '1',
    status: 'active',
    intent: 'order',
    priority: 'stat',
    medicationReference: {
      reference: 'Medication/1',
      type: 'Medication',
      display: 'Paracetamol 500mg',
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
          },
          event: ['2024-01-01T10:00:00'],
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '229799001',
                display: '4 times per day',
              },
            ],
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
        text: '{"instructions": "Take 1 tablet every 6 hours"}',
      },
    ],
  },
];

export const mockFormattedTreatments: FormattedTreatment[] = [
  {
    id: '1',
    drugName: 'Paracetamol 500mg',
    status: 'Active',
    priority: 'STAT',
    provider: 'Dr. Smith',
    startDate: '2024-01-01T10:00:00',
    duration: '7 days',
    frequency: '4 times per day',
    route: 'Oral',
    doseQuantity: '500 mg',
    method: 'Swallow whole',
    dosageInstructions: 'Take 1 tablet every 6 hours',
  },
];

export const mockFhirMedicationRequestWithMissingFields: FhirMedicationRequest =
  {
    resourceType: 'MedicationRequest',
    id: '2',
    status: 'active',
    intent: 'order',
    medicationReference: {
      reference: 'Medication/1',
      type: 'Medication',
      display: 'Paracetamol 500mg',
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
          },
          event: ['2024-01-01T10:00:00'],
        },
      },
    ],
  };

export const mockFormattedTreatmentWithMissingFields: FormattedTreatment = {
  id: '2',
  drugName: 'Test Medication',
  status: 'Active',
  provider: 'Dr. Smith',
  startDate: '2024-01-01T10:00:00',
  duration: '7 days',
  dosageInstructions: '',
};
