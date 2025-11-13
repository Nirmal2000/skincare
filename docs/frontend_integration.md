# Face Analysis Task API – Frontend Integration Guide

## Overview

The upgraded backend now runs the multi-pass Gemini workflow described in `docs/upgraded_endpoint.md`. Because that workflow takes several sequential LLM calls, clients **start** the job with one request and **poll** for progress/final results with another. This document explains the two endpoints the frontend should use.

## Base URL

- Local development: `http://localhost:8000`
- Replace with the deployed hostname in production builds.

## Endpoints

| Method | Path             | Description                                                            |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| POST   | `/start-task`    | Upload an image (and optional `real_age`) to kick off background work. |
| GET    | `/tasks/{id}`    | Poll task status; returns snapshots until the job is completed/failed. |

## 1. Start a task (`POST /start-task`)

- **Headers**
  - `Accept: application/json`
- **Body**
  - Multipart form fields:
    - `image`: required file field (`image/png`, `image/jpeg`, etc.).
    - `real_age`: optional integer (as text) that helps the model compare perceived vs. real age.
- **Response (200)**
  - `{ "task_id": "<uuid>" }` – store this identifier for polling.
- **Errors (4xx/5xx)**
  - Standard FastAPI `{"detail": "..."}` payloads: invalid file, missing fields, or server errors.

### Sample `curl`

```bash
curl -X POST \
  -H "Accept: application/json" \
  -F "image=@/path/to/selfie.jpg" \
  -F "real_age=28" \
  http://localhost:8000/start-task
```

### Sample `fetch`

```ts
async function startAnalysis(file: File, realAge?: number) {
  const formData = new FormData();
  formData.append("image", file);
  if (realAge !== undefined) formData.append("real_age", String(realAge));

  const response = await fetch("http://localhost:8000/start-task", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  if (!response.ok) {
    throw new Error((await response.json()).detail ?? "Unable to start analysis");
  }

  return response.json(); // → { task_id }
}
```

## 2. Poll a task (`GET /tasks/{task_id}`)

- **Response body** – conforms to `TaskStatusResponse`:

```jsonc
{
  "task_id": "3d0...",
  "status": "texture_complete",   // see list below
  "result": { ... },               // optional snapshot/final result
  "error": null                    // non-null only if status === "failed"
}
```

- **Status values** (string):
  - `queued` – task registered, background job not started yet.
  - `global_profile_complete` – step 1 done; `result.global_profile` available.
  - `texture_complete`, `pigmentation_complete`, `acne_complete`, `aging_complete` – subsequent cluster steps finished; partial `issues` data fills in.
  - `completed` – all steps done; `result` equals the full `UpgradedFaceAnalysisResult` shape.
  - `failed` – unrecoverable error; inspect `error` for a message and prompt the user to retry.

Poll every 1–2 seconds to balance responsiveness and quota usage.

### Sample polling loop (browser)

```ts
async function waitForResult(taskId: string) {
  while (true) {
    const res = await fetch(`http://localhost:8000/tasks/${taskId}`);
    if (!res.ok) throw new Error("Task lookup failed");
    const payload = await res.json();
    if (payload.status === "completed") return payload.result;
    if (payload.status === "failed") throw new Error(payload.error ?? "Task failed");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}
```

## Result shape (`completed`)

When the workflow finishes, `result` matches the schema defined in `app/schemas.py` (`UpgradedFaceAnalysisResult`):

```jsonc
{
  "global_profile": {
    "skin_type": {"label": "combination", "confidence": 0.86},
    "skin_tone": {"lightness": "medium", "undertone": "neutral"},
    "skin_age": {"estimated_age": 27, "relative_to_real_age": "similar"},
    "scores": {"overall": 78, "wrinkles": 65, "dark_circles": 52, ...},
    "summary_description": "Combination skin with mild T-zone shine..."
  },
  "issues": {
    "oily_shine": [
      {
        "region": "noseBase",
        "intensity": 0.7,
        "area": 6,
        "description": "Oily shine across the T-zone." 
      }
    ],
    "dryness_dehydration": [],
    "enlarged_pores_texture": [],
    "blackheads": [],
    "acne_active": [],
    "acne_scars_post_inflammatory": [],
    "pigmentation_brown_spots": [],
    "freckles": [],
    "melasma_like_patches": [],
    "redness_sensitivity": [],
    "wrinkles_and_fine_lines": [],
    "eye_bags": [],
    "dark_circles": [],
    "moles_or_nevi": []
  }
}
```

The backend keeps updating `result` as each step completes. If you want live UI updates, surface the intermediate `result` payloads and message the current `status` label.

## Frontend Tips

- **Validation**: Show immediate feedback if the user selects a non-image file before hitting the start button.
- **Progress UI**: Use the status strings (`global_profile_complete`, etc.) to show step-by-step progress bars or text updates.
- **Timeouts/Retries**: If a task remains in the same status for too long, allow the user to cancel and retry; tasks are stored in-memory and will disappear when the server restarts.
- **Config**: Inject the API base URL through environment-specific configuration to avoid hardcoding hosts.
