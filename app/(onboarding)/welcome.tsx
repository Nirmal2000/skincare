import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/Tokens';
import { useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';
import { ONBOARDING_QUESTIONS, Question, QuestionOption } from '@/features/onboarding/questions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { answers, setAnswer, markComplete } = useOnboardingStore();

  // Reanimated progress bar width
  const progressWidth = useSharedValue(0);

  const currentQuestion = ONBOARDING_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === ONBOARDING_QUESTIONS.length - 1;

  // Update progress bar animation
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const goToNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLastQuestion) {
      // Mark onboarding complete and navigate to tabs
      markComplete();
      router.replace('/(tabs)');
    } else {
      // Move to next question
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Animate progress bar
      progressWidth.value = withTiming(
        ((nextIndex + 1) / ONBOARDING_QUESTIONS.length) * 100,
        { duration: 300, easing: Easing.out(Easing.ease) }
      );

      // Scroll to next question
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const goToPrevious = async () => {
    if (currentIndex === 0) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);

    // Animate progress bar
    progressWidth.value = withTiming(
      ((prevIndex + 1) / ONBOARDING_QUESTIONS.length) * 100,
      { duration: 300, easing: Easing.out(Easing.ease) }
    );

    // Scroll to previous question
    scrollViewRef.current?.scrollTo({
      x: prevIndex * SCREEN_WIDTH,
      animated: true,
    });
  };

  // Check if current question is answered
  const isQuestionAnswered = (): boolean => {
    const answer = answers[currentQuestion.id];

    if (currentQuestion.type === 'multi') {
      return Array.isArray(answer) && answer.length > 0;
    }

    if (currentQuestion.type === 'text') {
      return typeof answer === 'string' && answer.trim().length > 0;
    }

    // Single select
    return answer !== undefined && answer !== null;
  };

  // Initialize progress bar on mount
  useState(() => {
    progressWidth.value = ((currentIndex + 1) / ONBOARDING_QUESTIONS.length) * 100;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill, animatedProgressStyle]}
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {ONBOARDING_QUESTIONS.length}
        </Text>
      </View>

      {/* Questions Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
      >
        {ONBOARDING_QUESTIONS.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            isActive={index === currentIndex}
            currentAnswer={answers[question.id]}
            onAnswer={(value) => setAnswer(question.id, value)}
          />
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {currentIndex > 0 && (
          <Button
            title="Back"
            onPress={goToPrevious}
            variant="secondary"
            style={styles.backButton}
          />
        )}
        <Button
          title={isLastQuestion ? 'Complete' : 'Next'}
          onPress={goToNext}
          variant="primary"
          disabled={!isQuestionAnswered()}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

interface QuestionCardProps {
  question: Question;
  isActive: boolean;
  currentAnswer: any;
  onAnswer: (value: any) => void;
}

function QuestionCard({ question, isActive, currentAnswer, onAnswer }: QuestionCardProps) {
  if (!isActive) {
    return <View style={styles.questionContainer} />;
  }

  return (
    <View style={styles.questionContainer}>
      <ScrollView style={styles.questionScroll} showsVerticalScrollIndicator={false}>
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <Text style={styles.questionTitle}>{question.title}</Text>
          <Text style={styles.questionDescription}>{question.description}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {question.type === 'text' ? (
            <TextInput
              style={styles.textInput}
              placeholder={question.placeholder}
              value={(currentAnswer as string) || ''}
              onChangeText={onAnswer}
              multiline={false}
              autoCapitalize="words"
            />
          ) : question.type === 'multi' ? (
            <MultiSelectOptions
              options={question.options || []}
              selectedValues={(currentAnswer as string[]) || []}
              onToggle={(value) => {
                const current = (currentAnswer as string[]) || [];
                if (current.includes(value)) {
                  onAnswer(current.filter((v) => v !== value));
                } else {
                  onAnswer([...current, value]);
                }
              }}
            />
          ) : (
            <SingleSelectOptions
              options={question.options || []}
              selectedValue={currentAnswer as string}
              onSelect={onAnswer}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface SingleSelectOptionsProps {
  options: QuestionOption[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
}

function SingleSelectOptions({ options, selectedValue, onSelect }: SingleSelectOptionsProps) {
  return (
    <>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }}
          >
            <Card
              variant="option"
              active={isSelected}
              style={styles.optionCard}
            >
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                {option.label}
              </Text>
              {option.description && (
                <Text style={styles.optionDescription}>{option.description}</Text>
              )}
            </Card>
          </Pressable>
        );
      })}
    </>
  );
}

interface MultiSelectOptionsProps {
  options: QuestionOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

function MultiSelectOptions({ options, selectedValues, onToggle }: MultiSelectOptionsProps) {
  return (
    <>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);

        return (
          <Pressable
            key={option.value}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(option.value);
            }}
          >
            <Card
              variant="option"
              active={isSelected}
              style={styles.optionCard}
            >
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                {option.label}
              </Text>
              {option.description && (
                <Text style={styles.optionDescription}>{option.description}</Text>
              )}
            </Card>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundBlush,
  },
  progressContainer: {
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.base,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandPink,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
    textAlign: 'center',
  },
  carousel: {
    flex: 1,
  },
  questionContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: Spacing.large,
  },
  questionScroll: {
    flex: 1,
  },
  questionHeader: {
    marginBottom: Spacing.large,
  },
  questionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  questionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  optionsContainer: {
    gap: Spacing.base,
  },
  optionCard: {
    marginBottom: Spacing.base,
  },
  optionLabel: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: Colors.brandPink,
    fontWeight: '600',
  },
  optionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.tiny,
  },
  textInput: {
    ...Typography.bodyLarge,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.lavender,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.base,
    color: Colors.textPrimary,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.large,
    paddingTop: Spacing.base,
    gap: Spacing.base,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
