import { Platform } from "react-native";

import {
  RNMLKitFaceDetector,
  type FaceContourType,
  type FaceLandmarkType,
  type RNMLKitFace,
} from "@infinitered/react-native-mlkit-face-detection";

export type FaceLandmarkId =
  | "eye_pouch"
  | "dark_circles"
  | "forehead_wrinkle"
  | "forehead_pores"
  | "crows_feet"
  | "glabella_wrinkle"
  | "nasolabial_fold"
  | "left_cheek_pores"
  | "right_cheek_pores";

export type FaceLandmarkPoint = {
  x: number;
  y: number;
};

export type FaceLandmarkMap = Record<FaceLandmarkId, FaceLandmarkPoint>;

const DETECTOR_OPTIONS = {
  performanceMode: "accurate",
  landmarkMode: true,
  contourMode: true,
  classificationMode: false,
};

const detector =
  Platform.OS === "web"
    ? null
    : new RNMLKitFaceDetector(DETECTOR_OPTIONS, true);

let detectorInitPromise: Promise<void> | null = null;

async function ensureDetectorReady() {
  if (!detector || Platform.OS === "web") {
    return;
  }
  if (detector.status === "ready" || detector.status === "done") {
    return;
  }
  if (!detectorInitPromise) {
    detectorInitPromise = detector
      .initialize(DETECTOR_OPTIONS)
      .catch((error) => {
        detectorInitPromise = null;
        console.warn("Face detector initialization failed", error);
        throw error;
      });
  }
  await detectorInitPromise;
}

export async function detectFaceLandmarks(imageUri: string) {
  if (Platform.OS === "web" || !detector) {
    return null;
  }
  await ensureDetectorReady();
  let result;
  try {
    result = await detector.detectFaces(imageUri);
  } catch (error) {
    console.warn("Face detector execution failed", error);
    return null;
  }
  if (!result || !result.faces || result.faces.length === 0) {
    return null;
  }
  return computeFaceLandmarkMap(result.faces[0]);
}

function computeFaceLandmarkMap(face: RNMLKitFace): FaceLandmarkMap {
  console.log("[Landmarks] frame", JSON.stringify(face.frame));
  console.log(
    "[Landmarks] raw landmarks",
    JSON.stringify(face.landmarks ?? []),
  );
  const frame = normalizeFrame(face.frame as NativeRect | undefined);
  const fallbackPoint: FaceLandmarkPoint = {
    x: frame.x + frame.width / 2,
    y: frame.y + frame.height / 2,
  };

  const rightEye = getLandmarkPoint(face, "rightEye", fallbackPoint);
  const leftEye = getLandmarkPoint(face, "leftEye", fallbackPoint);
  const noseBase = getLandmarkPoint(face, "noseBase", fallbackPoint);
  const rightMouth = getLandmarkPoint(face, "rightMouth", fallbackPoint);
  const leftCheek = getLandmarkPoint(face, "leftCheek", fallbackPoint);
  const rightCheek = getLandmarkPoint(face, "rightCheek", fallbackPoint);

  const rightEyeContour = getContourPoints(face, "rightEye");
  const leftEyeContour = getContourPoints(face, "leftEye");

  const rightEyeBottom =
    pickExtreme(rightEyeContour, (candidate, current) =>
      candidate.y > current.y ? candidate : current,
    ) ?? rightEye;
  const eyeOffset = frame.height * 0.03;
  const eyePouchPoint = {
    x: rightEyeBottom.x,
    y: rightEyeBottom.y + eyeOffset,
  };
  const darkCirclePoint = {
    x: eyePouchPoint.x,
    y: eyePouchPoint.y + frame.height * 0.01,
  };

  const leftEyeOuter =
    pickExtreme(leftEyeContour, (candidate, current) =>
      candidate.x < current.x ? candidate : current,
    ) ?? leftEye;
  const crowsFeetPoint = {
    x: leftEyeOuter.x - frame.width * 0.015,
    y: leftEyeOuter.y,
  };

  const eyesCenterX = (leftEye.x + rightEye.x) / 2;
  const eyesCenterY = (leftEye.y + rightEye.y) / 2;
  const foreheadY = frame.y + frame.height * 0.18;
  const foreheadPoint = {
    x: eyesCenterX,
    y: foreheadY,
  };
  const glabellaPoint = {
    x: eyesCenterX,
    y: eyesCenterY - frame.height * 0.08,
  };

  const nasolabialPoint = midpoint(noseBase, rightMouth);

  const landmarks: FaceLandmarkMap = {
    eye_pouch: eyePouchPoint,
    dark_circles: darkCirclePoint,
    forehead_wrinkle: foreheadPoint,
    forehead_pores: foreheadPoint,
    crows_feet: crowsFeetPoint,
    glabella_wrinkle: glabellaPoint,
    nasolabial_fold: nasolabialPoint,
    left_cheek_pores: leftCheek,
    right_cheek_pores: rightCheek,
  };

  Object.entries(landmarks).forEach(([key, value]) => {
    console.log("[Landmarks]", key, value);
  });

  return landmarks;
}

function getContourPoints(
  face: RNMLKitFace,
  type: FaceContourType,
): FaceLandmarkPoint[] {
  const contour = face.contours?.find((candidate) =>
    matchesContourType(candidate.type, type),
  );
  if (!contour || !contour.points) {
    return [];
  }
  return contour.points.map((point) => toPoint(point, { x: 0, y: 0 }));
}

function getLandmarkPoint(
  face: RNMLKitFace,
  type: FaceLandmarkType,
  fallback: FaceLandmarkPoint,
): FaceLandmarkPoint {
  const match = face.landmarks?.find((landmark) =>
    matchesLandmarkType(landmark.type, type),
  );
  if (!match?.position) {
    console.warn("[Landmarks] missing", type, "using fallback", fallback);
  }
  return toPoint(match?.position as RawPoint | undefined, fallback);
}

function toPoint(
  point: RawPoint | null | undefined,
  fallback: FaceLandmarkPoint,
): FaceLandmarkPoint {
  if (
    point &&
    typeof point.x === "number" &&
    typeof point.y === "number" &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y)
  ) {
    return { x: point.x, y: point.y };
  }
  return fallback;
}

function pickExtreme(
  points: FaceLandmarkPoint[],
  reducer: (
    candidate: FaceLandmarkPoint,
    current: FaceLandmarkPoint,
  ) => FaceLandmarkPoint,
): FaceLandmarkPoint | null {
  if (!points.length) {
    return null;
  }
  return points.reduce((current, candidate) => reducer(candidate, current));
}

function midpoint(a: FaceLandmarkPoint, b: FaceLandmarkPoint): FaceLandmarkPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

type RawPoint = {
  x?: number | null;
  y?: number | null;
};

type NativeRect = {
  origin?: RawPoint | null;
  size?: RawPoint | null;
} | null;

function normalizeFrame(rect: NativeRect | undefined): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: rect?.origin?.x ?? 0,
    y: rect?.origin?.y ?? 0,
    width: rect?.size?.x ?? 0,
    height: rect?.size?.y ?? 0,
  };
}

function matchesLandmarkType(
  value: FaceLandmarkType | string | null | undefined,
  target: FaceLandmarkType,
) {
  if (!value) return false;
  const normalized = value.toString();
  const camel =
    normalized.charAt(0).toLowerCase() + normalized.slice(1);
  return camel === target;
}

function matchesContourType(
  value: FaceContourType | string | null | undefined,
  target: FaceContourType,
) {
  if (!value) return false;
  const normalized = value.toString();
  const camel =
    normalized.charAt(0).toLowerCase() + normalized.slice(1);
  return camel === target;
}
