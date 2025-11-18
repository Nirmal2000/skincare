---
name: reanimated-library
description: React Native animation patterns using reanimated v4. Use when implementing animations, transitions, gestures, or micro-interactions.
---

# Reanimated Library

This skill provides react-native-reanimated v4 animation patterns for native-performance animations in GalliGo Mobile.

## When to Use This Skill

- Implementing animations and transitions
- Creating gesture interactions (swipe, drag, pinch)
- Building micro-interactions (button press, toggle)
- Adding scroll-based effects (parallax, fade)
- Optimizing animation performance

## Core Concepts

### Shared Values
Foundation of reanimated - values that can be animated:

```typescript
import { useSharedValue } from 'react-native-reanimated'

const Component = () => {
  const opacity = useSharedValue(1)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)

  // Modify shared values
  opacity.value = 0.5
  translateY.value = 100

  return <Animated.View>{/* Content */}</Animated.View>
}
```

### Animated Styles
Connect shared values to component styles:

```typescript
import Animated, { useAnimatedStyle } from 'react-native-reanimated'

const Component = () => {
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return <Animated.View style={animatedStyle}>{/* Content */}</Animated.View>
}
```

### Spring Animations
Natural, bouncy animations (preferred for iOS):

```typescript
import { withSpring } from 'react-native-reanimated'

const bounceIn = () => {
  opacity.value = withSpring(1, {
    damping: 15,
    stiffness: 150,
  })
}

// Common spring configs
const gentleSpring = { damping: 20, stiffness: 120 } // Modals
const snappySpring = { damping: 10, stiffness: 200 } // Buttons
const bouncySpring = { damping: 8, stiffness: 180 }  // Playful
```

### Timing Animations
Controlled, smooth animations:

```typescript
import { withTiming, Easing } from 'react-native-reanimated'

const fadeOut = () => {
  opacity.value = withTiming(0, {
    duration: 300,
    easing: Easing.out(Easing.ease),
  })
}

// Common timing configs
const quick = { duration: 200 }
const standard = { duration: 300 }
const slow = { duration: 500 }
```

## iOS Timing Standards

Follow iOS Human Interface Guidelines for timing:

### Navigation Transitions
```typescript
// Screen push/pop: 350ms spring
const screenTransition = () => {
  translateX.value = withSpring(0, {
    damping: 18,
    stiffness: 140,
  })
}

// Modal presentation: 440ms spring
const presentModal = () => {
  translateY.value = withSpring(0, {
    damping: 22,
    stiffness: 130,
  })
}

// Modal dismissal: 320ms timing
const dismissModal = () => {
  translateY.value = withTiming(-screenHeight, {
    duration: 320,
    easing: Easing.in(Easing.ease),
  })
}
```

### Micro-interactions
```typescript
// Button press: 200-300ms
const buttonPress = () => {
  scale.value = withTiming(0.95, { duration: 100 })
  // On release:
  scale.value = withSpring(1, { damping: 12, stiffness: 200 })
}

// Toggle: 250ms
const toggle = () => {
  position.value = withSpring(isOn ? 20 : 0, {
    damping: 15,
    stiffness: 180,
    duration: 250,
  })
}
```

## Common Animation Patterns

### 1. Fade In/Out
```typescript
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

// Using built-in animations
<Animated.View
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(200)}
>
  {/* Content */}
</Animated.View>

// Custom fade
const Component = () => {
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return <Animated.View style={animatedStyle}>{/* Content */}</Animated.View>
}
```

### 2. Slide In/Out
```typescript
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated'

// Modal/sheet sliding up from bottom
<Animated.View
  entering={SlideInDown.springify().damping(20)}
  exiting={SlideOutDown.duration(320)}
  className="absolute bottom-0 w-full bg-white rounded-t-3xl"
>
  {/* Modal content */}
</Animated.View>

// Slide from right (for lists)
<Animated.View
  entering={SlideInRight.duration(300).delay(index * 50)}
>
  {/* List item */}
</Animated.View>
```

### 3. Scale Button Press
```typescript
const Button = ({ onPress, children }) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 })
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  )
}
```

### 4. Scroll-Based Parallax
```typescript
import { useAnimatedScrollHandler } from 'react-native-reanimated'

const ParallaxScreen = () => {
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: scrollY.value * 0.5 }, // Parallax
    ],
    opacity: 1 - scrollY.value / 200, // Fade out
  }))

  return (
    <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
      <Animated.View style={headerStyle} className="h-64">
        {/* Header image */}
      </Animated.View>
      {/* Content */}
    </Animated.ScrollView>
  )
}
```

### 5. Skeleton Loading
```typescript
const SkeletonLoader = () => {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1, // Infinite
      false // No reverse
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={animatedStyle} className="h-4 bg-gray-200 rounded" />
  )
}
```

### 6. Staggered List Entry
```typescript
const AnimatedList = ({ items }) => (
  <View>
    {items.map((item, index) => (
      <Animated.View
        key={item.id}
        entering={FadeIn.duration(300).delay(index * 50)}
      >
        <ItemCard item={item} />
      </Animated.View>
    ))}
  </View>
)
```

## Gesture Handling

Requires `react-native-gesture-handler`.

### Pan Gesture (Drag)
```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated'

const DraggableCard = () => {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const context = useSharedValue({ x: 0, y: 0 })

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value }
    })
    .onUpdate((event) => {
      translateX.value = context.value.x + event.translationX
      translateY.value = context.value.y + event.translationY
    })
    .onEnd(() => {
      // Snap back to origin
      translateX.value = withSpring(0)
      translateY.value = withSpring(0)
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>{/* Content */}</Animated.View>
    </GestureDetector>
  )
}
```

### Swipe to Delete
```typescript
const SwipeToDelete = ({ onDelete, children }) => {
  const translateX = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Ignore small movements
    .onUpdate((event) => {
      // Only allow left swipe
      if (event.translationX < 0) {
        translateX.value = event.translationX
      }
    })
    .onEnd((event) => {
      if (event.translationX < -100) {
        // Threshold reached - delete
        translateX.value = withTiming(-500, { duration: 300 })
        runOnJS(onDelete)()
      } else {
        // Snap back
        translateX.value = withSpring(0)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  )
}
```

### Long Press
```typescript
const LongPressCard = ({ onLongPress }) => {
  const scale = useSharedValue(1)

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      scale.value = withSpring(0.95)
      runOnJS(onLongPress)()
    })
    .onFinalize(() => {
      scale.value = withSpring(1)
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <GestureDetector gesture={longPressGesture}>
      <Animated.View style={animatedStyle}>{/* Content */}</Animated.View>
    </GestureDetector>
  )
}
```

### Pinch to Zoom
```typescript
const ZoomableImage = ({ uri }) => {
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale
    })
    .onEnd(() => {
      savedScale.value = scale.value
      // Reset if zoomed out too much
      if (scale.value < 1) {
        scale.value = withSpring(1)
        savedScale.value = 1
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <GestureDetector gesture={pinchGesture}>
      <Animated.Image source={{ uri }} style={animatedStyle} />
    </GestureDetector>
  )
}
```

## Layout Animations

Automatically animate layout changes:

```typescript
import Animated, { Layout } from 'react-native-reanimated'

const AnimatedList = ({ items }) => (
  <View>
    {items.map((item) => (
      <Animated.View
        key={item.id}
        entering={FadeIn}
        exiting={FadeOut}
        layout={Layout.springify()} // Animate layout changes
      >
        <ItemCard item={item} />
      </Animated.View>
    ))}
  </View>
)
```

## Advanced Patterns

### Interpolation
Map input range to output range:

```typescript
import { interpolate } from 'react-native-reanimated'

const animatedStyle = useAnimatedStyle(() => {
  const rotate = interpolate(
    scrollY.value,
    [0, 100],
    [0, 180], // Rotate from 0° to 180° as scroll from 0 to 100
    'clamp' // Don't exceed bounds
  )

  return {
    transform: [{ rotate: `${rotate}deg` }],
  }
})
```

### withSequence (Chain Animations)
```typescript
import { withSequence } from 'react-native-reanimated'

const bounce = () => {
  scale.value = withSequence(
    withTiming(1.2, { duration: 150 }),
    withSpring(1, { damping: 12 })
  )
}
```

### withRepeat (Loop Animations)
```typescript
import { withRepeat } from 'react-native-reanimated'

useEffect(() => {
  // Infinite rotation
  rotation.value = withRepeat(
    withTiming(360, { duration: 2000, easing: Easing.linear }),
    -1, // Infinite
    false // No reverse
  )
}, [])
```

## Performance Optimization

### Use Worklets
Worklets run on the UI thread for 60 FPS:

```typescript
'worklet' // This function runs on UI thread
const clamp = (value: number, min: number, max: number) => {
  'worklet'
  return Math.min(Math.max(value, min), max)
}

const animatedStyle = useAnimatedStyle(() => {
  const clamped = clamp(translateX.value, -100, 100)
  return {
    transform: [{ translateX: clamped }],
  }
})
```

### runOnJS for JS Functions
Call JS functions from worklets:

```typescript
import { runOnJS } from 'react-native-reanimated'

const panGesture = Gesture.Pan()
  .onEnd(() => {
    // ❌ BAD: Direct call won't work
    onComplete()

    // ✅ GOOD: Wrap with runOnJS
    runOnJS(onComplete)()
  })
```

### Avoid Heavy Calculations
```typescript
// ❌ BAD: Heavy calculation in animated style
const animatedStyle = useAnimatedStyle(() => ({
  opacity: expensiveCalculation(scrollY.value),
}))

// ✅ GOOD: Pre-calculate or use useDerivedValue
const opacity = useDerivedValue(() => {
  return expensiveCalculation(scrollY.value)
})

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}))
```

## Built-in Animations

Quick animations without writing code:

```typescript
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  BounceIn,
} from 'react-native-reanimated'

<Animated.View entering={FadeIn} exiting={FadeOut}>
  {/* Fades in and out */}
</Animated.View>

<Animated.View entering={SlideInRight.duration(300)}>
  {/* Slides in from right in 300ms */}
</Animated.View>

<Animated.View entering={BounceIn.springify()}>
  {/* Bounces in with spring */}
</Animated.View>
```

**Available animations**:
- Fade: `FadeIn`, `FadeOut`, `FadeInDown`, `FadeInUp`
- Slide: `SlideInLeft`, `SlideInRight`, `SlideInUp`, `SlideInDown`
- Zoom: `ZoomIn`, `ZoomOut`
- Bounce: `BounceIn`, `BounceOut`
- Flip: `FlipInXUp`, `FlipInYLeft`

## Common Gotchas

### 1. Shared Values Don't Trigger Re-renders
```typescript
// ❌ WRONG: Won't update UI
const [count, setCount] = useState(0)
opacity.value = count / 100 // Component won't re-render

// ✅ CORRECT: Use in animated style
const animatedStyle = useAnimatedStyle(() => ({
  opacity: count / 100,
}))
```

### 2. Can't Use Regular setState in Worklets
```typescript
// ❌ WRONG: setState doesn't work in worklets
const panGesture = Gesture.Pan()
  .onEnd(() => {
    setIsComplete(true) // Won't work
  })

// ✅ CORRECT: Use runOnJS
const panGesture = Gesture.Pan()
  .onEnd(() => {
    runOnJS(setIsComplete)(true)
  })
```

### 3. Must Use Animated Components
```typescript
// ❌ WRONG: Regular View won't animate
<View style={animatedStyle} />

// ✅ CORRECT: Use Animated.View
<Animated.View style={animatedStyle} />
```

## Quick Reference

| Animation Type | Use Case | Duration |
|----------------|----------|----------|
| `withSpring` | Buttons, modals, natural motion | ~200-350ms |
| `withTiming` | Fades, slides, controlled | 200-500ms |
| `withSequence` | Multi-step animations | Varies |
| `withRepeat` | Loading, infinite loops | Infinite |
| Built-in (FadeIn, etc.) | Quick animations | Customizable |

## Related Skills

- @ios-design-guidelines - iOS timing standards
- @react-native-patterns - Component integration
- @mobile-accessibility - Accessible animations

---

For complex animations, use @animation-specialist agent. This skill is for quick reference and common patterns.
