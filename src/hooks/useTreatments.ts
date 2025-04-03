import { useState, useEffect, useCallback } from 'react';
import { Treatment } from '@types/treatment';
import { getMedicationRequests, formatTreatments } from '@services/treatmentService';
import { useNotification } from './useNotification';
import { getFormattedError } from '@utils/common';

/**
 * Custom hook for fetching and managing treatment data
 * @param patientUUID - The UUID of the patient
 * @returns Object containing treatments data, loading state, error, and refetch function
 */
export function useTreatments(patientUUID: string | null) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchTreatments = useCallback(async () => {
    if (!patientUUID) {
      const errorMessage = 'Invalid patient UUID';
      setError(new Error(errorMessage));
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const medicationRequests = await getMedicationRequests(patientUUID);
      const formattedTreatments = formatTreatments(medicationRequests);

      setTreatments(formattedTreatments);
    } catch (err) {
      const formattedError = getFormattedError(err);
      setError(new Error(formattedError.message));

      addNotification({
        type: 'error',
        title: formattedError.title,
        message: formattedError.message,
      });
    } finally {
      setLoading(false);
    }
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  return { treatments, loading, error, refetch: fetchTreatments };
}
