import { get } from './api';
import { FhirMedicationRequest, FhirMedicationRequestBundle, FormattedTreatment } from '../types/treatment';
import { formatDateTime } from '../utils/date';
import { getFormattedError } from '../utils/common';
import { notificationService } from './notificationService';
import { PATIENT_MEDICATION_REQUEST_URL } from '../constants/app';

/**
 * Fetches medication requests for a patient from FHIR API
 */
export async function getMedicationRequests(
  patientUUID: string
): Promise<FhirMedicationRequestBundle> {
  return await get<FhirMedicationRequestBundle>(PATIENT_MEDICATION_REQUEST_URL(patientUUID));
}

/**
 * Formats the status of a medication request
 */
function formatStatus(status: FhirMedicationRequest['status']): FormattedTreatment['status'] {
  const statusMap = {
    'active': 'Active',
    'completed': 'Completed',
    'stopped': 'Stopped',
    'cancelled': 'Cancelled'
  } as const;
  return statusMap[status];
}

/**
 * Formats the duration from dosage instructions
 */
function formatDuration(instructions: FhirMedicationRequest['dosageInstruction']): string {
  const duration = instructions[0]?.timing?.repeat?.duration;
  const unit = instructions[0]?.timing?.repeat?.durationUnit;

  return duration ? `${duration} ${unit}` : 'No duration specified';
}

/**
 * Transforms a single FHIR MedicationRequest to FormattedTreatment
 */
function transformFhirToTreatment(fhirData: FhirMedicationRequest): FormattedTreatment {
  return {
    id: fhirData.id,
    drugName: fhirData.medicationCodeableConcept?.text ??
              fhirData.medicationCodeableConcept?.coding[0]?.display ??
              'Unknown Medication',
    status: formatStatus(fhirData.status),
    provider: fhirData.requester.display,
    startDate: fhirData.authoredOn ? formatDateTime(fhirData.authoredOn) : '',
    endDate: fhirData.dosageInstruction[0]?.timing?.repeat?.boundsPeriod?.end ?
            formatDateTime(fhirData.dosageInstruction[0].timing.repeat.boundsPeriod.end) : '',
    duration: formatDuration(fhirData.dosageInstruction),
    dosageInstructions: fhirData.dosageInstruction[0]?.text ?? 'No instructions specified',
    visitInfo: fhirData.encounter ? {
      uuid: fhirData.encounter.reference,
      startDateTime: fhirData.authoredOn ? formatDateTime(fhirData.authoredOn) : ''
    } : undefined
  };
}

/**
 * Transforms FHIR MedicationRequest data to FormattedTreatment array
 */
export function transformFhirMedicationData(
  fhirData: FhirMedicationRequest[]
): FormattedTreatment[] {
  try {
    return fhirData
      .map(item => {
        try {
          return transformFhirToTreatment(item);
        } catch (error) {
          notificationService.showError(
            'Data Transform Error',
            `Failed to process treatment: ${item.id}`
          );
          return null;
        }
      })
      .filter((item): item is FormattedTreatment => item !== null);
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
