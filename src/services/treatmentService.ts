import { get } from './api';
import { PATIENT_MEDICATION_REQUEST_URL } from '@constants/app';
import {
  FhirMedicationRequestBundle,
  FhirMedicationRequest,
  Treatment
} from '@types/treatment';
import { getFormattedError } from '@utils/common';
import { formatDateTime } from '@utils/date';
import notificationService from './notificationService';

/**
 * Fetches medication requests for a patient from FHIR API
 * @param patientUUID - The UUID of the patient
 * @returns Promise with the FHIR MedicationRequest Bundle
 */
export async function getPatientMedicationRequestBundle(
  patientUUID: string
): Promise<FhirMedicationRequestBundle> {
  return await get<FhirMedicationRequestBundle>(
    `${PATIENT_MEDICATION_REQUEST_URL(patientUUID)}`
  );
}

/**
 * Fetches and extracts medication requests for a patient
 * @param patientUUID - The UUID of the patient
 * @returns Array of FHIR MedicationRequest resources
 */
export async function getMedicationRequests(
  patientUUID: string
): Promise<FhirMedicationRequest[]> {
  try {
    const fhirMedicationBundle = await getPatientMedicationRequestBundle(patientUUID);
    return fhirMedicationBundle.entry?.map(entry => entry.resource) || [];
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Format the status of a medication request
 * @param status - The FHIR status string
 * @returns Formatted status string
 */
export function formatStatus(status: string): string {
  if (!status) return 'Unknown';

  // Map FHIR statuses to display-friendly values
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'on-hold': 'On Hold',
    'cancelled': 'Cancelled',
    'completed': 'Completed',
    'entered-in-error': 'Error',
    'stopped': 'Stopped',
    'draft': 'Draft',
    'unknown': 'Unknown'
  };

  return statusMap[status.toLowerCase()] || 'Unknown';
}

/**
 * Get the drug name from a medication request
 * @param medicationRequest - The FHIR MedicationRequest
 * @returns The drug name
 */
export function getDrugName(medicationRequest: FhirMedicationRequest): string {
  // Try to get name from medicationReference
  if (medicationRequest.medicationReference?.display) {
    return medicationRequest.medicationReference.display;
  }

  // Try to get name from medicationCodeableConcept
  if (medicationRequest.medicationCodeableConcept) {
    if (medicationRequest.medicationCodeableConcept.text) {
      return medicationRequest.medicationCodeableConcept.text;
    }

    if (medicationRequest.medicationCodeableConcept.coding?.[0]?.display) {
      return medicationRequest.medicationCodeableConcept.coding[0].display;
    }
  }

  return 'Unknown Medication';
}

/**
 * Get dosage instructions from a medication request
 * @param medicationRequest - The FHIR MedicationRequest
 * @returns The dosage instructions
 */
export function getDosageInstructions(medicationRequest: FhirMedicationRequest): string {
  const dosageInstruction = medicationRequest.dosageInstruction?.[0];

  if (!dosageInstruction?.text) {
    return '-';
  }

  try {
    // Try to parse JSON instructions
    const parsedInstructions = JSON.parse(dosageInstruction.text);
    return parsedInstructions.instructions || '-';
  } catch (e) {
    // If not JSON, use the text directly
    return dosageInstruction.text;
  }
}

/**
 * Calculate duration from FHIR MedicationRequest
 * @param medicationRequest - The FHIR MedicationRequest
 * @returns Formatted duration string
 */
export function calculateDuration(medicationRequest: FhirMedicationRequest): string {
  const dosageInstruction = medicationRequest.dosageInstruction?.[0];

  if (!dosageInstruction?.timing?.repeat?.duration) {
    return '-';
  }

  const duration = dosageInstruction.timing.repeat.duration;
  const unit = dosageInstruction.timing.repeat.durationUnit || 'd';

  // Map duration units to display-friendly values
  const unitMap: Record<string, string> = {
    's': 'second(s)',
    'min': 'minute(s)',
    'h': 'hour(s)',
    'd': 'day(s)',
    'wk': 'week(s)',
    'mo': 'month(s)',
    'a': 'year(s)'
  };

  const displayUnit = unitMap[unit] || unit;
  return `${duration} ${displayUnit}`;
}

/**
 * Format dosage details into a readable format
 * @param medicationRequest - The FHIR MedicationRequest
 * @returns Object with formatted dosage details
 */
export function formatDosageDetails(
  medicationRequest: FhirMedicationRequest
): {
  frequency: string;
  route: string;
  doseQuantity: string;
  instruction: string;
} {
  const dosageInstruction = medicationRequest.dosageInstruction?.[0];

  // Extract frequency
  const frequency = dosageInstruction?.timing?.code?.text ||
                   dosageInstruction?.timing?.code?.coding?.[0]?.display ||
                   '-';

  // Extract route
  const route = dosageInstruction?.route?.text ||
               dosageInstruction?.route?.coding?.[0]?.display ||
               '-';

  // Extract dose quantity
  const doseValue = dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.value;
  const doseUnit = dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.unit;
  const doseQuantity = doseValue && doseUnit ? `${doseValue} ${doseUnit}` : '-';

  // Extract instructions
  let instruction = '-';
  if (dosageInstruction?.text) {
    try {
      // Try to parse JSON instructions
      const parsedInstructions = JSON.parse(dosageInstruction.text);
      instruction = parsedInstructions.instructions || '-';
    } catch (e) {
      // If not JSON, use the text directly
      instruction = dosageInstruction.text;
    }
  }

  return { frequency, route, doseQuantity, instruction };
}

/**
 * Transform FHIR MedicationRequest to Treatment
 * @param medicationRequest - The FHIR MedicationRequest
 * @returns Formatted Treatment object
 */
export function transformFhirToTreatment(medicationRequest: FhirMedicationRequest): Treatment {
  try {
    const { frequency, route, doseQuantity, instruction } = formatDosageDetails(medicationRequest);

    return {
      id: medicationRequest.id,
      drugName: getDrugName(medicationRequest),
      status: formatStatus(medicationRequest.status),
      priority: medicationRequest.priority?.toUpperCase() || 'ROUTINE',
      provider: medicationRequest.requester?.display || '-',
      startDate: formatDateTime(medicationRequest.authoredOn),
      duration: calculateDuration(medicationRequest),
      frequency,
      route,
      doseQuantity,
      instruction,
      encounter: medicationRequest.encounter?.reference || '-',
      category: 'Medication'
    };
  } catch (error) {
    console.error('Error transforming medication request:', error);
    throw error;
  }
}

/**
 * Format medication requests into treatments for display
 * @param medicationRequests - Array of FHIR MedicationRequest resources
 * @returns Array of formatted Treatment objects
 */
export function formatTreatments(medicationRequests: FhirMedicationRequest[]): Treatment[] {
  try {
    return medicationRequests.map(transformFhirToTreatment);
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
