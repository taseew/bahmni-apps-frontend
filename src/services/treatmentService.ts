import { get } from './api';
import {
  FhirMedicationRequest,
  FhirMedicationRequestBundle,
  FormattedTreatment,
} from '../types/treatment';
import { formatDateTime } from '../utils/date';
import { getFormattedError } from '../utils/common';
import { notificationService } from './notificationService';
import { PATIENT_MEDICATION_REQUEST_URL } from '../constants/app';

/**
 * Fetches medication requests for a patient from FHIR API
 */
export async function getMedicationRequests(
  patientUUID: string,
): Promise<FhirMedicationRequestBundle> {
  return await get<FhirMedicationRequestBundle>(
    PATIENT_MEDICATION_REQUEST_URL(patientUUID),
  );
}

/**
 * Formats the status of a medication request
 */
function formatStatus(
  status: FhirMedicationRequest['status'],
): FormattedTreatment['status'] {
  const statusMap: Record<
    FhirMedicationRequest['status'],
    FormattedTreatment['status']
  > = {
    active: 'Active',
    'on-hold': 'On Hold',
    cancelled: 'Cancelled',
    completed: 'Completed',
    stopped: 'Stopped',
    draft: 'Draft',
    unknown: 'Unknown',
  };
  return statusMap[status];
}

/**
 * Formats dosage details from instructions
 */
function formatDosageDetails(
  instruction: FhirMedicationRequest['dosageInstruction'][0],
) {
  const timing = instruction.timing.repeat;
  const doseAndRate = instruction.doseAndRate?.[0];

  return {
    duration:
      timing?.duration && timing.durationUnit
        ? `${timing.duration} ${timing.durationUnit}`
        : 'No duration specified',
    frequency: instruction.timing.code?.text || 'No frequency specified',
    route: instruction.route?.coding[0]?.display,
    method: instruction.method?.coding[0]?.display,
    doseQuantity: doseAndRate?.doseQuantity
      ? `${doseAndRate.doseQuantity.value} ${doseAndRate.doseQuantity.unit}`
      : undefined,
  };
}

/**
 * Transforms a single FHIR MedicationRequest to FormattedTreatment
 */
function transformFhirToTreatment(
  fhirData: FhirMedicationRequest,
): FormattedTreatment {
  const dosageDetails = formatDosageDetails(fhirData.dosageInstruction[0]);

  return {
    id: fhirData.id,
    drugName: fhirData.medicationReference?.display ?? 'Unknown Medication',
    status: formatStatus(fhirData.status),
    priority: fhirData.priority?.toUpperCase(),
    provider: fhirData.requester.display ?? 'Unknown Provider',
    startDate: formatDateTime(fhirData.authoredOn),
    duration: dosageDetails.duration,
    frequency: dosageDetails.frequency,
    route: dosageDetails.route,
    method: dosageDetails.method,
    doseQuantity: dosageDetails.doseQuantity,
    category: fhirData.category?.[0]?.coding[0]?.display,
    notes: fhirData.note?.map((n) => n.text),
    dosageInstructions: JSON.parse(fhirData.dosageInstruction[0]?.text || '{}')[
      'instructions'
    ],
    visitInfo: fhirData.encounter
      ? {
          uuid: fhirData.encounter.reference,
          startDateTime: formatDateTime(fhirData.authoredOn),
        }
      : undefined,
  };
}

/**
 * Transforms FHIR MedicationRequest data to FormattedTreatment array
 */
export function transformFhirMedicationData(
  fhirData: FhirMedicationRequest[],
): FormattedTreatment[] {
  try {
    return fhirData
      .map((item) => {
        try {
          return transformFhirToTreatment(item);
        } catch (error) {
          notificationService.showError(
            'Data Transform Error',
            `Failed to process treatment: ${item.id}`,
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
