/**
 * Common FHIR elements
 */
interface Reference {
  readonly reference: string;
  readonly type: string;
  readonly display?: string;
}

interface Coding {
  readonly system: string;
  readonly code: string;
  readonly display: string;
}

interface CodeableConcept {
  readonly coding: ReadonlyArray<Coding>;
  readonly text?: string;
}

interface Timing {
  readonly repeat?: {
    readonly duration?: number;
    readonly durationUnit?: string;
  };
  readonly event: ReadonlyArray<string>;
  readonly code?: CodeableConcept;
}

interface DoseAndRate {
  readonly type?: CodeableConcept;
  readonly doseQuantity?: {
    readonly value: number;
    readonly unit: string;
  };
}

/**
 * FHIR R4 MedicationRequest resource types
 */
export interface FhirMedicationRequest {
  readonly resourceType: 'MedicationRequest';
  readonly id: string;
  readonly status:
    | 'active'
    | 'on-hold'
    | 'cancelled'
    | 'completed'
    | 'stopped'
    | 'draft'
    | 'unknown';
  readonly intent:
    | 'proposal'
    | 'plan'
    | 'order'
    | 'original-order'
    | 'reflex-order'
    | 'filler-order'
    | 'instance-order'
    | 'option';
  readonly priority?: 'routine' | 'urgent' | 'asap' | 'stat';

  // Medication can be either a reference or a CodeableConcept
  readonly medicationReference?: Reference;

  readonly subject: Reference & { readonly type: 'Patient' };
  readonly encounter?: Reference & { readonly type: 'Encounter' };
  readonly authoredOn: string;
  readonly requester: Reference & { readonly type: 'Practitioner' };

  readonly category?: ReadonlyArray<CodeableConcept>;
  readonly note?: ReadonlyArray<{ readonly text: string }>;

  readonly dosageInstruction: ReadonlyArray<{
    readonly timing: Timing;
    readonly route?: CodeableConcept;
    readonly method?: CodeableConcept;
    readonly doseAndRate?: ReadonlyArray<DoseAndRate>;
    readonly text?: string;
  }>;
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
  readonly status:
    | 'Active'
    | 'On Hold'
    | 'Cancelled'
    | 'Completed'
    | 'Stopped'
    | 'Draft'
    | 'Unknown';
  readonly priority?: string;
  readonly provider: string;
  readonly startDate: string;
  readonly duration: string;
  readonly frequency?: string;
  readonly route?: string;
  readonly method?: string;
  readonly doseQuantity?: string;
  readonly category?: string;
  readonly notes?: string[];
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
