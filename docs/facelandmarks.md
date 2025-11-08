You basically need **face landmarks**, not just “face detection”. The flow is:

1. Take a face photo in Expo (camera / picker).
2. Run **ML Kit Face Detection** via an Expo-compatible wrapper.
3. From the returned landmarks / contours, compute one **center point per region** (eyelids, cheeks, lips, forehead, etc.).
4. Combine those points with your payload (`left_eyelids`, `nasolabial_fold`, etc.).

Here’s how to do that end-to-end, plus the docs you should read.

[![Face Detection | ML Kit for Firebase](https://tse2.mm.bing.net/th/id/OIP.6FD78UxbGKWv1W1fiFKP9wHaFj?cb=ucfimg2\&pid=Api\&ucfimg=1)](https://firebase.google.com/docs/ml-kit/detect-faces?utm_source=chatgpt.com)

---

## 1. What to use in Expo in 2025 (important)

* **Old `expo-face-detector` is deprecated** from Expo SDK 51+, and Expo explicitly tells you to move to other solutions (e.g. vision-camera) instead. ([Expo Documentation][1])
* The cleanest “Expo + iOS” setup today is:

> **`@infinitered/react-native-mlkit-face-detection` (RNMLKit Face Detection)**

This is an Expo module that wraps **Google ML Kit Face Detection** for Expo, with docs and an example app. ([GitHub][2])

Under the hood you’re getting **Google ML Kit Face Detection**, which can give you:

* Bounding box for the face
* Landmarks for **eyes, nose, cheeks, mouth**, etc.
* Optional **contours** for detailed shapes around eyes, lips, nose, jawline, etc. ([Google for Developers][3])

For even more granularity (forehead regions, pores etc.), you can additionally (or later) look at **ML Kit Face Mesh / MediaPipe Face Landmarker** which give 133–468 dense 2D/3D points on the face. ([Google AI for Developers][4])

---

## 2. The key docs you want (your “full documentation” set)

### A. Expo / RNMLKit Face Detection docs

These are your primary “how do I use this in Expo?” docs:

* **React Native MLKit main README** (Expo compatibility table, how to build dev clients). ([GitHub][2])
* **Face Detection – API**: `FaceDetectionProvider`, `useFacesInPhoto`, `useFaceDetection`, return types. ([docs.infinite.red][5])
* **Face Detection – Options**: how to enable landmarks / contours / classifications. ([docs.infinite.red][6])
* **Face Detection – Advanced Usage**: calling `detectFaces(imageUri)` manually, deferred initialization, error handling. ([docs.infinite.red][7])

Package: **`@infinitered/react-native-mlkit-face-detection`**, published as “MLKit Face Detection for Expo apps”. ([npm][8])

---

### B. Underlying ML Kit docs (what landmarks you get)

* **ML Kit Face Detection guide** – explains that you can get:

  * Facial feature **coordinates for eyes, ears, cheeks, nose, mouth**
  * **Contours** for eyes, eyebrows, lips, and nose
  * Example output with coordinates for left/right eye, bottom of mouth, lip contours, etc. ([Google for Developers][3])

* **ML Kit Face Mesh / MediaPipe Face Landmarker** – for 3D mesh and dense points (468 points), useful if you want super-accurate forehead / cheek placement later. ([Google AI for Developers][4])

These ML Kit docs describe **coordinate systems and landmark names**, which is what you’ll use to derive centers for “eye_pouch”, “nasolabial_fold”, etc.

---

### C. Expo capture docs

You still need to get the image URI:

* **`expo-camera`**: show camera preview, take picture, get local URI. ([Expo Documentation][9])
* Or **`expo-image-picker`** if you want “pick from gallery” instead.

---

## 3. Wiring this into your Expo iOS app

### 3.1 Install and configure MLKit Face Detection

1. Install the module:

```bash
yarn add @infinitered/react-native-mlkit-face-detection
# or
npm install @infinitered/react-native-mlkit-face-detection
```

2. Add plugin to `app.json` (typical Expo module setup):

```jsonc
{
  "expo": {
    "plugins": [
      "@infinitered/react-native-mlkit-face-detection"
    ]
  }
}
```

3. Create a **development build** (MLKit won’t work in Expo Go):

```bash
npx expo prebuild         # first time or when native config changes
npx expo run:ios -d       # run on physical iPhone
# or use `eas build -p ios` later for production
```

RNMLKit’s README shows the same “prebuild + run:ios -d” workflow and notes that MLKit **does not work on iOS Simulator**; you must use hardware. ([GitHub][2])

---

### 3.2 Wrap app with the FaceDetectionProvider

Enable accurate mode + landmarks + contours so you get enough points:

```tsx
// app/_layout.tsx or your root
import {
  FaceDetectionProvider,
  RNMLKitFaceDetectorOptions,
} from '@infinitered/react-native-mlkit-face-detection';

const FACE_DETECTION_OPTIONS: RNMLKitFaceDetectorOptions = {
  performanceMode: 'accurate',
  landmarkMode: true,
  contourMode: true,
  classificationMode: true,
  minFaceSize: 0.01,
  isTrackingEnabled: false,
};

export default function RootLayout() {
  return (
    <FaceDetectionProvider options={FACE_DETECTION_OPTIONS}>
      {/* your app (tabs, stacks, etc.) */}
    </FaceDetectionProvider>
  );
}
```

Those option names / semantics come straight from the RNMLKit docs. ([docs.infinite.red][6])

---

### 3.3 Capture a face photo (from camera or picker)

Example with `expo-camera` (simplified):

```tsx
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

const [photoUri, setPhotoUri] = useState<string | null>(null);

async function takePicture() {
  if (!cameraRef.current) return;
  const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
  setPhotoUri(photo.uri);
}
```

The important thing is: **you end up with a `photoUri`** (local file path). `expo-camera` docs show the full flow. ([Expo Documentation][9])

---

### 3.4 Run face detection on that photo

Use the **hook API**:

```tsx
import { useFacesInPhoto } from '@infinitered/react-native-mlkit-face-detection';

function AnalysisScreen({ photoUri }: { photoUri: string }) {
  const { faces, status, error } = useFacesInPhoto(photoUri);

  // faces: RNMLKitFace[]
  // status: 'idle' | 'loading' | 'success' | 'error'

  if (status === 'loading') return <LoadingSpinner />;
  if (error) return <ErrorMsg error={error} />;
  if (!faces?.length) return <Text>No face found</Text>;

  const face = faces[0]; // you said input is exactly one face
  const regionCenters = computeRegionCenters(face);

  // ...combine regionCenters with your payload and render
}
```

The RNMLKit docs describe `useFacesInPhoto` returning an array of `RNMLKitFace` with landmarks & contours. ([docs.infinite.red][5])

Alternatively, via `useFaceDetection` + `detectFaces(imageUri)` if you prefer to call it manually. ([docs.infinite.red][7])

---

## 4. Mapping ML Kit landmarks → the facial regions you care about

From ML Kit Face Detection, you get, per face: ([Google for Developers][3])

* A **bounding box**: `(x, y, width, height)`
* **Landmarks** (single points):

  * `leftEye`, `rightEye`
  * `noseBase`
  * `leftCheek`, `rightCheek`
  * `mouthLeft`, `mouthRight`, `mouthBottom`, etc.
* Optionally **contours** (arrays of points):

  * Eye contours, lip contours, nose bridge, jawline, etc.

Coordinates are in image space with **origin at top-left**, `x` rightwards, `y` downwards.

You want:

```ts
left_eyelids, right_eyelids, eye_pouch, dark_circles,
forehead_wrinkle, crows_feet, eye_fine_lines, glabella_wrinkle,
nasolabial_fold, forehead_pores,
left_cheek_pores, right_cheek_pores, jaw_pores
```

You **don’t** need locations for `skin_type`, `mole`, `skin_spot`, etc.

### 4.1 Define a type for region centers

```ts
type Point = { x: number; y: number };

type FaceRegionCenters = {
  left_eyelids: Point;
  right_eyelids: Point;
  eye_pouch: Point;
  dark_circles: Point;
  forehead_wrinkle: Point;
  crows_feet: Point;
  eye_fine_lines: Point;
  glabella_wrinkle: Point;
  nasolabial_fold: Point;
  forehead_pores: Point;
  left_cheek_pores: Point;
  right_cheek_pores: Point;
  jaw_pores: Point;
};
```

### 4.2 Compute those from `RNMLKitFace`

Conceptually:

* **`left_eyelids` / `right_eyelids`**

  * Use the **center of the eye** from the eye contour or landmark.
  * If only center landmark is available, that’s your point.

* **`eye_pouch` (undereye) / `dark_circles`**

  * Take the **lower eye contour** points and average them, then offset a bit downward (e.g. +5–10 px) to sit under the eye.

* **`crows_feet` / `eye_fine_lines`**

  * Take the eye contour’s **outer corner** point (largest X for right eye, smallest X for left eye) and maybe offset slightly outward.

* **`forehead_wrinkle` / `forehead_pores`**

  * ML Kit doesn’t give direct “forehead” landmarks; approximate:

    * Let `eyesCenterX = (leftEye.x + rightEye.x) / 2`
    * Let `box = face.boundingBox`
    * Place forehead center somewhere between box.top and eyes.y, e.g.

      ```ts
      const foreheadY = box.y + 0.18 * box.height; // tweak after testing
      ```

* **`glabella_wrinkle`** (between eyebrows)

  * Use inner eyebrow contour points (if you have brow contours); otherwise:

    * Midpoint between `leftEye` and `rightEye` in X, but slightly above the eyes.

* **`nasolabial_fold`**

  * Use mid between `noseBase` landmark and the corresponding mouth corner `mouthLeft` / `mouthRight`.
  * If you want a single point, take average of both sides.

* **`left_cheek_pores` / `right_cheek_pores`**

  * Use `leftCheek` and `rightCheek` landmarks directly.

* **`jaw_pores`**

  * Use jawline contour points: pick a point near the middle of each jaw side, or average a subset of jawline points under the ear; for a single point, you can average left and right jaw midpoints to get “jaw center”.

Here’s a **sketch implementation** (assumes `face` keeps MLKit-like fields; you’ll adapt to RNMLKit’s exact type names):

```ts
function average(points: Point[]): Point {
  const n = points.length;
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / n, y: sum.y / n };
}

function computeRegionCenters(face: any): FaceRegionCenters {
  const { boundingBox: box, landmarks, contours } = face;

  const leftEye = landmarks.leftEye;
  const rightEye = landmarks.rightEye;
  const noseBase = landmarks.noseBase;
  const leftCheek = landmarks.leftCheek;
  const rightCheek = landmarks.rightCheek;
  const mouthLeft = landmarks.mouthLeft;
  const mouthRight = landmarks.mouthRight;

  const eyeCenter = (eye: Point) => eye;

  const eyesCenterX = (leftEye.x + rightEye.x) / 2;
  const eyesCenterY = (leftEye.y + rightEye.y) / 2;

  const foreheadCenter: Point = {
    x: eyesCenterX,
    y: box.y + 0.18 * box.height,
  };

  const glabella: Point = {
    x: eyesCenterX,
    y: eyesCenterY - 0.10 * box.height,
  };

  const leftEyeLowerContour = contours.leftEyeLower ?? [];
  const rightEyeLowerContour = contours.rightEyeLower ?? [];

  const leftUnderEye =
    leftEyeLowerContour.length > 0
      ? average(leftEyeLowerContour).y + 6
      : leftEye.y + 8;

  const rightUnderEye =
    rightEyeLowerContour.length > 0
      ? average(rightEyeLowerContour).y + 6
      : rightEye.y + 8;

  const leftOuterEye =
    contours.leftEye?.reduce(
      (best: Point | null, p: Point) => (!best || p.x < best.x ? p : best),
      null
    ) ?? leftEye;

  const rightOuterEye =
    contours.rightEye?.reduce(
      (best: Point | null, p: Point) => (!best || p.x > best.x ? p : best),
      null
    ) ?? rightEye;

  const leftJawMid =
    contours.leftJaw?.[Math.floor(contours.leftJaw.length / 2)] ??
    leftCheek ??
    { x: box.x + 0.2 * box.width, y: box.y + 0.8 * box.height };

  const rightJawMid =
    contours.rightJaw?.[Math.floor(contours.rightJaw.length / 2)] ??
    rightCheek ??
    { x: box.x + 0.8 * box.width, y: box.y + 0.8 * box.height };

  const jawCenter = average([leftJawMid, rightJawMid]);

  const nasolabialLeft = {
    x: (noseBase.x + mouthLeft.x) / 2,
    y: (noseBase.y + mouthLeft.y) / 2,
  };

  const nasolabialRight = {
    x: (noseBase.x + mouthRight.x) / 2,
    y: (noseBase.y + mouthRight.y) / 2,
  };

  const nasolabialCenter = average([nasolabialLeft, nasolabialRight]);

  return {
    left_eyelids: eyeCenter(leftEye),
    right_eyelids: eyeCenter(rightEye),

    eye_pouch: { x: eyesCenterX, y: (leftUnderEye + rightUnderEye) / 2 },
    dark_circles: { x: eyesCenterX, y: (leftUnderEye + rightUnderEye) / 2 + 4 },

    forehead_wrinkle: foreheadCenter,
    forehead_pores: foreheadCenter,

    glabella_wrinkle: glabella,

    crows_feet: average([leftOuterEye, rightOuterEye]),
    eye_fine_lines: average([leftOuterEye, rightOuterEye]),

    nasolabial_fold: nasolabialCenter,

    left_cheek_pores: leftCheek,
    right_cheek_pores: rightCheek,

    jaw_pores: jawCenter,
  };
}
```

You’ll tweak those offsets (`0.18 * box.height`, `+6 px`, etc.) after checking on real images from your app.

---

## 5. Joining with your skin analysis payload

Your model already gives you:

```jsonc
"left_eyelids": { "value": 1, "confidence": 0.72 },
"right_eyelids": { "value": 2, "confidence": 0.69 },
"eye_pouch": { "value": 0, "confidence": 0.81 },
"dark_circles": { "value": 1, "confidence": 0.64 },
"forehead_wrinkle": { "value": 0, "confidence": 0.78 },
"crows_feet": { "value": 1, "confidence": 0.55 },
"eye_fine_lines": { "value": 1, "confidence": 0.67 },
"glabella_wrinkle": { "value": 0, "confidence": 0.73 },
"nasolabial_fold": { "value": 1, "confidence": 0.58 },
"forehead_pores": { "value": 1, "confidence": 0.66 },
"left_cheek_pores": { "value": 0, "confidence": 0.71 },
"right_cheek_pores": { "value": 0, "confidence": 0.69 },
"jaw_pores": { "value": 1, "confidence": 0.51 },
...
```

Once you have `regionCenters` from `computeRegionCenters(face)`, your final object for rendering could be:

```ts
type RegionInfo = {
  center: Point;
  value: number;
  confidence: number;
};

type EnrichedResult = Record<string, RegionInfo>;

const enriched: EnrichedResult = Object.fromEntries(
  Object.entries(modelPayload).map(([key, stats]) => {
    const center = regionCenters[key as keyof FaceRegionCenters];
    if (!center) return [key, null]; // ignore skin_type, mole, etc.
    return [key, { ...stats, center }];
  })
);
```

Now your Expo screen knows **where** on the face to draw overlays for each metric.

---

## 6. If you ever need more precision later

* For **very fine pores / wrinkles** or forehead zoning, you can move from classic Face Detection to **Face Mesh** (ML Kit Face Mesh or MediaPipe Face Landmarker) which gives 133–468 points across the whole face. ([Google AI for Developers][4])
* You’d still call it from native (either via RNMLKit if they add it, or your own TFLite wrapper), but the Expo wiring looks similar: get image URI → call native module → compute custom regions.

[1]: https://docs.expo.dev/versions/v52.0.0/sdk/facedetector?utm_source=chatgpt.com "Expo FaceDetector"
[2]: https://github.com/infinitered/react-native-mlkit "GitHub - infinitered/react-native-mlkit: react-native-mlkit - The definitive MLKit wrapper for React Native and Expo"
[3]: https://developers.google.com/ml-kit/vision/face-detection "Face detection  |  ML Kit  |  Google for Developers"
[4]: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker?utm_source=chatgpt.com "Face landmark detection guide | Google AI Edge"
[5]: https://docs.infinite.red/react-native-mlkit/face-detection/api/?utm_source=chatgpt.com "API"
[6]: https://docs.infinite.red/react-native-mlkit/face-detection/options/?utm_source=chatgpt.com "Options"
[7]: https://docs.infinite.red/react-native-mlkit/face-detection/advanced-usage/?utm_source=chatgpt.com "Advanced Usage"
[8]: https://www.npmjs.com/package/%40infinitered/react-native-mlkit-face-detection?utm_source=chatgpt.com "@infinitered/react-native-mlkit-face-detection"
[9]: https://docs.expo.dev/versions/latest/sdk/camera/?utm_source=chatgpt.com "Camera"
