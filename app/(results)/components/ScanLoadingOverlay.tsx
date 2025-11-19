import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '@/constants/Tokens';
import AnalysisProgressBar from './AnalysisProgressBar';

export default function ScanLoadingOverlay() {
  const [firstBarComplete, setFirstBarComplete] = useState(false);

  return (
    <View style={styles.container}>
      {/* First progress bar: Analysing scan results (0-5s) */}
      <AnalysisProgressBar
        label="Analysing scan results..."
        duration={10000}
        delay={0}
        onComplete={() => setFirstBarComplete(true)}
      />

      {/* Second progress bar: Building scan report (5-10s, stops at 95%) */}
      {firstBarComplete && (
        <AnalysisProgressBar
          label="Building scan report..."
          duration={10000}
          delay={0}
          maxProgress={95}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: Spacing.default,
  },
});
