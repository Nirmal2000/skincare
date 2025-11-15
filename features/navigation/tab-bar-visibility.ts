import { create } from "zustand";
import { runOnJS, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

type TabBarVisibilityState = {
  hidden: boolean;
  setHidden: (value: boolean) => void;
};

export const useTabBarVisibility = create<TabBarVisibilityState>((set) => ({
  hidden: false,
  setHidden: (value) => set({ hidden: value }),
}));

export function useTabBarAutoHideScrollHandler(threshold = 2) {
  const setHidden = useTabBarVisibility((state) => state.setHidden);
  const lastY = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const delta = currentY - lastY.value;
      lastY.value = currentY;

      if (Math.abs(delta) < threshold) return;

      if (currentY <= 0) {
        runOnJS(setHidden)(false);
        return;
      }

      runOnJS(setHidden)(delta > 0);
    },
  });
}
