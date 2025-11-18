import { BorderRadius, Colors, Spacing } from '@/constants/Tokens';
import { Image, StyleSheet, View } from 'react-native';
import FacialAreaLabel from './FacialAreaLabel';

import React from 'react';

export interface FacialArea {
  id: string;
  label: string;
  position: 'top' | 'bottom-left' | 'bottom-right' | 'left' | 'right';
}

interface ScanLoadingScreenProps {
  photoUri: string;
  onLoadingComplete?: () => void;
}

const FACIAL_AREAS_ALL: FacialArea[] = [
  { id: 'forehead', label: 'Forehead', position: 'top' },
  { id: 'chin', label: 'Chin', position: 'bottom-left' },
  { id: 'upper-nose', label: 'Upper nose', position: 'right' },
  { id: 'nasolabial', label: 'Nasolabial fold', position: 'bottom-left' },
  { id: 'cheeks', label: 'Cheeks', position: 'bottom-right' },
  { id: 'left-cheek', label: 'Left cheek', position: 'left' },
  { id: 'right-cheek', label: 'Right cheek', position: 'right' },
];

// Helper: Shuffle array and pick N items
function getRandomAreas(areas: FacialArea[], count: number): FacialArea[] {
  const shuffled = [...areas].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function ScanLoadingScreen({
  photoUri,
  onLoadingComplete,
}: ScanLoadingScreenProps) {
  // Get 5 random facial areas on component mount
  const selectedAreas = React.useMemo(() => {
    return getRandomAreas(FACIAL_AREAS_ALL, 5);
  }, []);

  return (
    <View style={styles.container}>
      {/* Face Image with Glow Effect */}
      <View style={styles.imageContainer}>
        {/* Glow background */}
        <View style={[styles.imageShadow, styles.glowLayer1]} />
        <View style={[styles.imageShadow, styles.glowLayer2]} />

        {/* Image */}
        <Image
          source={{ uri: photoUri }}
          style={styles.faceImage}
          resizeMode="cover"
        />
      </View>

      {/* Facial Area Labels with Ticks */}
      {selectedAreas.map((area) => (
        <FacialAreaLabel
          key={area.id}
          area={area}
          order={selectedAreas.indexOf(area)}
        />
      ))}
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
    marginBottom: Spacing.xl,
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
