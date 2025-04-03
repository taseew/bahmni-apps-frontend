/**
 * FHIR R4 MedicationRequest resource types
 */
export interface FhirMedicationRequest {
  readonly resourceType: 'MedicationRequest';
  readonly id: string;
  readonly status: 'active' | 'completed' | 'stopped' | 'cancelled';
  readonly intent: 'order' | 'plan';
  readonly medicationCodeableConcept?: {
    readonly coding: ReadonlyArray<{
      readonly system: string;
      readonly code: string;
      readonly display: string;
    }>;
    readonly text: string;
  };
  readonly subject: {
    readonly reference: string;
    readonly type: 'Patient';
  };
  readonly authoredOn: string;
  readonly requester: {
    readonly reference: string;
    readonly type: 'Practitioner';
    readonly display: string;
  };
  readonly dosageInstruction: ReadonlyArray<{
    readonly timing: {
      readonly repeat?: {
        readonly duration?: number;
        readonly durationUnit?: string;
        readonly boundsPeriod?: {
          readonly start: string;
          readonly end?: string;
        };
      };
    };
    readonly text?: string;
  }>;
  readonly encounter?: {
    readonly reference: string;
    readonly type: 'Encounter';
  };
}

/**
 * FHIR R4 Bundle containing MedicationRequest resources
 */
export interface FhirMedicationRequestBundle {
  readonly resourceType: 'Bundle';
  readonly type: 'searchset';
  readonly total: number;
  readonly entry?: ReadonlyArray<{
    readonly resource: FhirMedicationRequest;
  }>;
}

/**
 * Formatted treatment data for UI consumption
 */
export interface FormattedTreatment {
  readonly id: string;
  readonly drugName: string;
  readonly status: 'Active' | 'Completed' | 'Stopped' | 'Cancelled';
  readonly provider: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly duration: string;
  readonly dosageInstructions?: string;
  readonly visitInfo?: {
    readonly uuid: string;
    readonly startDateTime: string;
  };
}

/**
 * Props for TreatmentDisplayControl component
 */
export interface TreatmentDisplayControlProps {
  readonly tableTitle?: string;
  readonly ariaLabel?: string;
  readonly className?: string;
}
