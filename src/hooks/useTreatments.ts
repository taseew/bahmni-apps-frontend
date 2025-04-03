import { useState, useCallback, useEffect } from 'react';
import { FormattedTreatment } from '../types/treatment';
import {
  getMedicationRequests,
  transformFhirMedicationData,
} from '../services/treatmentService';
import { useNotification } from './useNotification';
import { getFormattedError } from '../utils/common';

interface UseTreatmentsResult {
  treatments: FormattedTreatment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing treatment data
 * @param patientUUID - UUID of the patient
 * @returns Object containing treatments data, loading state, error state, and refetch function
 */
export function useTreatments(patientUUID: string | null): UseTreatmentsResult {
  const [treatments, setTreatments] = useState<FormattedTreatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchTreatments = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error('Invalid patient UUID'));
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Invalid patient UUID',
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getMedicationRequests(patientUUID);
      const formattedTreatments = transformFhirMedicationData(
        result.entry?.map((entry) => entry.resource) ?? [],
      );
      setTreatments(formattedTreatments);
    } catch (err) {
      const { title, message } = getFormattedError(err);
      setError(new Error(message));
      addNotification({
        type: 'error',
        title,
        message,
      });
    } finally {
      setLoading(false);
    }
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  return {
    treatments,
    loading,
    error,
    refetch: fetchTreatments,
  };
}
