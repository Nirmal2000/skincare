import { BorderRadius, Colors, Spacing } from '@/constants/Tokens';
import { Image, StyleSheet, View } from 'react-native';
import FacialAreaLabel from './FacialAreaLabel';

import React from 'react';

export interface FacialArea {
  id: string;
  label: string;
  position: 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface ScanLoadingScreenProps { photoUri: string; onLoadingComplete?: () => void; }

const FACIAL_AREAS_ALL: FacialArea[] = [
  { id: 'forehead', label: 'Forehead', position: 'top' },  
  { id: 'upper-nose', label: 'Upper nose', position: 'top' },
  { id: 'nasolabial', label: 'Nasolabial fold', position: 'bottom-left' },
  { id: 'cheeks', label: 'Cheeks', position: 'bottom-right' },
  { id: 'left-cheek', label: 'Left cheek', position: 'top-left' },
  { id: 'right-cheek', label: 'Right cheek', position: 'top-right' },
];

// These are your 5 orbit slots
const ORBIT_POSITIONS: FacialArea['position'][] = [
  'top-left',
  'top',
  'top-right',
  'bottom-left',
  'bottom-right',
];

// Shuffle and pick N, then assign unique positions
function getRandomAreas(areas: FacialArea[], count: number): FacialArea[] {
  const shuffled = [...areas].sort(() => Math.random() - 0.5).slice(0, count);

  return shuffled.map((area, index) => ({
    ...area,
    position: ORBIT_POSITIONS[index], // force unique slot
  }));
}

export default function ScanLoadingScreen({
  photoUri,
  onLoadingComplete,
}: ScanLoadingScreenProps) {
  const selectedAreas = React.useMemo(
    () => getRandomAreas(FACIAL_AREAS_ALL, 5),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={[styles.imageShadow, styles.glowLayer1]} />
        <View style={[styles.imageShadow, styles.glowLayer2]} />

        <Image
          source={{ uri: photoUri }}
          style={styles.faceImage}
          resizeMode="cover"
        />

        {selectedAreas.map((area, index) => (
          <FacialAreaLabel key={area.id} area={area} order={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBackground,
    paddingHorizontal: Spacing.default,
  },

  imageContainer: {
    position: 'relative',
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl, // 32 - move image down in screen
    marginBottom: Spacing.medium, // 20 - adjust spacing
  },

  faceImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.circle,
    overflow: 'hidden',
    zIndex: 10,
  },

  imageShadow: {
    position: 'absolute',
    borderRadius: BorderRadius.circle,
  },

  // Glow effect layers
  glowLayer1: {
    width: 240,
    height: 240,
    top: -10,
    left: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  glowLayer2: {
    width: 260,
    height: 260,
    top: -20,
    left: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
