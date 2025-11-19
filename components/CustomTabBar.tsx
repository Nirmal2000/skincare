import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, Spacing } from '@/constants/Tokens';

const TAB_ITEM_WIDTH = 60;     // width reserved per tab icon+label
const H_PADDING = 6;          // inner horizontal padding of the pill

function CustomTabBar(props: BottomTabBarProps) {
  const { state, descriptors } = props;

  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key].options as any;
    return options.href !== null;
  });

  const tabCount = visibleRoutes.length;
  const width = tabCount * TAB_ITEM_WIDTH + H_PADDING * 2;

  return (
    <View pointerEvents="box-none" style={styles.tabBarContainer}>
      <View style={[styles.tabBarPill, { width }]}>
        <BottomTabBar
          {...props}
          style={[props.style, styles.innerTabBar]}  // 👈 overrides bg to transparent
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Spacing.medium + 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tabBarPill: {
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.appBackground,  // 👈 THIS is the color we want
    // overflow: 'hidden',
  },
  innerTabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    height: 64,
    justifyContent: 'center',
  },

});


export { CustomTabBar, TAB_ITEM_WIDTH };
