/**
 * Types for Treatment Display Control
 */

/**
 * Interface representing a FHIR R4 MedicationRequest Bundle
 */
export interface FhirMedicationRequestBundle {
  readonly resourceType: string;
  readonly id: string;
  readonly meta: {
    readonly lastUpdated: string;
  };
  readonly type: string;
  readonly total: number;
  readonly link?: ReadonlyArray<{
    readonly relation: string;
    readonly url: string;
  }>;
  readonly entry?: ReadonlyArray<{
    readonly fullUrl: string;
    readonly resource: FhirMedicationRequest;
  }>;
}

/**
 * Interface representing a FHIR R4 MedicationRequest Resource
 */
export interface FhirMedicationRequest {
  readonly resourceType: string;
  readonly id: string;
  readonly meta: {
    readonly versionId: string;
    readonly lastUpdated: string;
  };
  readonly text?: {
    readonly status: string;
    readonly div: string;
  };
  readonly status: string;
  readonly intent: string;
  readonly priority: string;
  readonly medicationReference?: {
    readonly reference: string;
    readonly type: string;
    readonly display: string;
  };
  readonly medicationCodeableConcept?: {
    readonly text: string;
    readonly coding?: ReadonlyArray<{
      readonly system: string;
      readonly code: string;
      readonly display: string;
    }>;
  };
  readonly subject: {
    readonly reference: string;
    readonly type: string;
    readonly display: string;
  };
  readonly encounter?: {
    readonly reference: string;
    readonly type: string;
  };
  readonly authoredOn: string;
  readonly requester?: {
    readonly reference: string;
    readonly type: string;
    readonly identifier?: {
      readonly value: string;
    };
    readonly display?: string;
  };
  readonly dosageInstruction?: ReadonlyArray<{
    readonly text?: string;
    readonly timing?: {
      readonly event?: string[];
      readonly repeat?: {
        readonly duration?: number;
        readonly durationUnit?: string;
      };
      readonly code?: {
        readonly coding?: ReadonlyArray<{
          readonly code: string;
          readonly display: string;
        }>;
        readonly text?: string;
      };
    };
    readonly asNeededBoolean?: boolean;
    readonly route?: {
      readonly coding?: ReadonlyArray<{
        readonly code: string;
        readonly display: string;
      }>;
      readonly text?: string;
    };
    readonly doseAndRate?: ReadonlyArray<{
      readonly doseQuantity?: {
        readonly value: number;
        readonly unit: string;
        readonly system?: string;
        readonly code?: string;
      };
    }>;
  }>;
  readonly dispenseRequest?: {
    readonly validityPeriod?: {
      readonly start: string;
      readonly end?: string;
    };
    readonly numberOfRepeatsAllowed?: number;
    readonly quantity?: {
      readonly value: number;
      readonly unit: string;
      readonly system?: string;
      readonly code?: string;
    };
  };
}

/**
 * Interface representing formatted treatment data for display
 */
export interface Treatment {
  readonly id: string;
  readonly drugName: string;
  readonly status: string;
  readonly priority: string;
  readonly provider?: string;
  readonly startDate: string;
  readonly duration?: string;
  readonly frequency?: string;
  readonly route?: string;
  readonly doseQuantity?: string;
  readonly instruction?: string;
  readonly encounter?: string;
  readonly category?: string;
}

/**
 * Interface for the Treatment Display Control props
 */
export interface TreatmentDisplayControlProps {
  readonly tableTitle?: string;
  readonly ariaLabel?: string;
  readonly className?: string;
}
