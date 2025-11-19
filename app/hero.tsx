import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { Colors, Spacing, Typography } from '@/constants/Tokens';
import { useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HeroScreen() {
  const { hasSeenHero, markHeroSeen } = useOnboardingStore();

  // Auto-skip if already seen - go to signin
  useEffect(() => {
    if (hasSeenHero) {
      router.replace('/(auth)/signin');
    }
  }, [hasSeenHero]);

  const handleGetStarted = () => {
    markHeroSeen();
    router.push('/(auth)/signin');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/ob1.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Content */}
      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          {/* Logo/Brand Name */}
          <Animated.Text
            entering={FadeIn.duration(800).delay(200)}
            style={styles.logo}
          >
            BETTERSKIN
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text
            entering={FadeIn.duration(800).delay(400)}
            style={styles.tagline}
          >
            Your AI skincare companion
          </Animated.Text>
        </View>

        {/* CTA Button */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(600)}
          style={styles.buttonContainer}
        >
          <Button
            title="Get Started"
            variant="white"
            onPress={handleGetStarted}
            style={styles.button}
            textStyle={styles.buttonText}
            rightIcon={<Ionicons name="chevron-forward" size={20} color={Colors.black} />}
          />
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: 'ZTNature-Black',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Spacing.medium,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontFamily: 'ZTNature-Medium',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  button: {
    width: '50%',
    backgroundColor: Colors.white,
  },
  buttonText: {
    color: Colors.black,
    fontFamily: 'ZTNature-Black',
    fontSize: 18,
  },
});
