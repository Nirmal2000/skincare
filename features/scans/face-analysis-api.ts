import Constants from 'expo-constants';
import {
  StartAnalysisResponse,
  TaskStatusResponse,
  GenerateRoutineResponse,
  RoutineIntake,
} from '../../types/api';

/**
 * API Error class for distinguishing API errors from network errors
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Get the API base URL from environment config
 */
function getApiBaseUrl(): string {
  const baseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_FACE_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      'EXPO_PUBLIC_FACE_API_BASE_URL not configured in app.json'
    );
  }
  return baseUrl;
}

/**
 * Start a face analysis task by uploading an image
 * Endpoint: POST /start-task
 */
export async function startAnalysis(
  imageUri: string,
  realAge: number | undefined,
  token: string
): Promise<StartAnalysisResponse> {
  try {
    const formData = new FormData();

    // In React Native/Expo, we can directly append the file URI to FormData
    // The platform will handle the file reading
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'selfie.jpg',
    };

    formData.append('image', file as any);

    if (realAge !== undefined) {
      formData.append('real_age', String(realAge));
    }

    const apiBaseUrl = getApiBaseUrl();    
    const apiResponse = await fetch(`${apiBaseUrl}/start-task`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type header - let fetch/platform set it for multipart form
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      const error = await apiResponse.json().catch(() => ({}));
      throw new APIError(
        apiResponse.status,
        error.detail || `Upload failed: ${apiResponse.statusText}`
      );
    }

    const data = await apiResponse.json();
    console.log('[Face Analysis API] Started analysis:', data.task_id);
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error('[Face Analysis API] Error starting analysis:', error);
    throw new Error(
      `Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Poll task status once
 * Endpoint: GET /tasks/{task_id}
 */
export async function pollTaskStatus(
  taskId: string,
  token: string
): Promise<TaskStatusResponse> {
  try {
    const apiBaseUrl = getApiBaseUrl(); 
    const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        error.detail || `Poll failed: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('[Face Analysis API] Task status:', data.status);
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error('[Face Analysis API] Error polling task status:', error);
    throw new Error(
      `Failed to poll status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Poll task status until completion or timeout
 * Polls every 1.5 seconds up to 5 minutes
 */
export async function pollUntilComplete(
  taskId: string,
  token: string,
  maxWaitMs: number = 300000 // 5 minutes
): Promise<TaskStatusResponse> {
  const startTime = Date.now();
  const pollInterval = 1500; // 1.5 seconds

  let attempt = 0;
  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    try {
      const payload = await pollTaskStatus(taskId, token);

      if (payload.status === 'completed') {
        console.log(
          `[Face Analysis API] Analysis completed after ${attempt} attempts`
        );
        return payload;
      }

      if (payload.status === 'failed') {
        throw new Error(
          payload.error || 'Analysis failed on backend'
        );
      }

      console.log(
        `[Face Analysis API] Attempt ${attempt}: Status = ${payload.status}`
      );

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      if (error instanceof APIError && error.status >= 500) {
        // Server error, retry
        console.warn(
          `[Face Analysis API] Server error (${error.status}), retrying...`
        );
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } else {
        throw error;
      }
    }
  }

  throw new Error(
    `Analysis timeout - exceeded ${maxWaitMs / 1000} seconds`
  );
}

/**
 * Generate a routine recommendation from completed analysis
 * Endpoint: POST /recommend
 */
export async function generateRoutine(
  taskId: string,
  intake: RoutineIntake,
  token: string
): Promise<GenerateRoutineResponse> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task_id: taskId,
        intake,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        error.detail || `Routine generation failed: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('[Face Analysis API] Started routine generation:', data.task_id);
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error('[Face Analysis API] Error generating routine:', error);
    throw new Error(
      `Failed to generate routine: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
