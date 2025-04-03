import { renderHook, act } from '@testing-library/react-hooks';
import { useTreatments } from '../useTreatments';
import { getMedicationRequests, formatTreatments } from '@services/treatmentService';
import { useNotification } from '../useNotification';

// Mock dependencies
jest.mock('@services/treatmentService');
jest.mock('../useNotification');

describe('useTreatments', () => {
  const mockTreatments = [
    {
      id: '123',
      drugName: 'Paracetamol 650 mg',
      status: 'Active',
      priority: 'ROUTINE',
      provider: 'Dr. Test',
      startDate: '2025-04-03 15:23:54',
      duration: '2 day(s)',
      frequency: 'Thrice a day',
      route: 'Oral',
      doseQuantity: '2 Tablet',
      instruction: 'As directed',
      encounter: 'Encounter/789',
      category: 'Medication'
    },
    {
      id: '456',
      drugName: 'Aspirin 100 mg',
      status: 'Active',
      priority: 'ROUTINE',
      provider: 'Dr. Test',
      startDate: '2025-04-03 15:23:54',
      duration: '5 day(s)',
      frequency: 'Once a day',
      route: 'Oral',
      doseQuantity: '1 Tablet',
      instruction: 'Take after food',
      encounter: 'Encounter/789',
      category: 'Medication'
    }
  ];

  const mockMedicationRequests = [
    { id: '123' },
    { id: '456' }
  ];

  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getMedicationRequests as jest.Mock).mockResolvedValue(mockMedicationRequests);
    (formatTreatments as jest.Mock).mockReturnValue(mockTreatments);
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification
    });
  });

  it('should initialize with empty treatments array', () => {
    const { result } = renderHook(() => useTreatments('test-uuid'));
    expect(result.current.treatments).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should fetch treatments on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTreatments('test-uuid'));

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(getMedicationRequests).toHaveBeenCalledWith('test-uuid');
    expect(formatTreatments).toHaveBeenCalledWith(mockMedicationRequests);
    expect(result.current.treatments).toEqual(mockTreatments);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle null patientUUID', async () => {
    const { result } = renderHook(() => useTreatments(null));

    expect(result.current.error).not.toBe(null);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Invalid patient UUID',
    });
    expect(getMedicationRequests).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    (getMedicationRequests as jest.Mock).mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useTreatments('test-uuid'));

    await waitForNextUpdate();

    expect(result.current.error).not.toBe(null);
    expect(mockAddNotification).toHaveBeenCalled();
  });

  it('should refetch treatments when patientUUID changes', async () => {
    const { result, waitForNextUpdate, rerender } = renderHook(
      (props) => useTreatments(props),
      { initialProps: 'test-uuid-1' }
    );

    await waitForNextUpdate();

    expect(getMedicationRequests).toHaveBeenCalledWith('test-uuid-1');

    rerender('test-uuid-2');

    await waitForNextUpdate();

    expect(getMedicationRequests).toHaveBeenCalledWith('test-uuid-2');
  });

  it('should provide a refetch function', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useTreatments('test-uuid'));

    await waitForNextUpdate();

    expect(getMedicationRequests).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitForNextUpdate();

    expect(getMedicationRequests).toHaveBeenCalledTimes(2);
  });

  it('should handle transformation errors', async () => {
    (formatTreatments as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Transformation Error');
    });

    const { result, waitForNextUpdate } = renderHook(() => useTreatments('test-uuid'));

    await waitForNextUpdate();

    expect(result.current.error).not.toBe(null);
    expect(mockAddNotification).toHaveBeenCalled();
  });
});
