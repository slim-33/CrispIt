import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

interface FreshnessGaugeProps {
  score: number; // 1-10
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function FreshnessGauge({ score, size = 160 }: FreshnessGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 10, {
      duration: 1200,
      easing: Easing.bezierFn(0.16, 1, 0.3, 1),
    });
  }, [score]);

  const color = getColor(score);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - score / 10)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.scoreText, { color }]}>{score}</Text>
        <Text style={styles.maxText}>/10</Text>
        <Text style={[styles.labelText, { color }]}>{getLabel(score)}</Text>
      </View>
    </View>
  );
}

function getColor(score: number): string {
  if (score >= 8) return '#2D6A4F';
  if (score >= 6) return '#40916C';
  if (score >= 4) return '#F4A261';
  if (score >= 2) return '#E76F51';
  return '#DC2626';
}

function getLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  if (score >= 2) return 'Poor';
  return 'Bad';
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
  },
  maxText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: -4,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
