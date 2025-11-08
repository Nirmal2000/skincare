import MaskedView from "@react-native-masked-view/masked-view";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Ellipse } from "react-native-svg";

import { OVAL_H, OVAL_W } from "./constants";

type OvalMaskProps = {
  children: ReactNode;
};

export function OvalMask({ children }: OvalMaskProps) {
  return (
    <MaskedView
      style={{ width: OVAL_W, height: OVAL_H }}
      maskElement={
        <Svg width={OVAL_W} height={OVAL_H}>
          <Ellipse
            cx={OVAL_W / 2}
            cy={OVAL_H / 2}
            rx={OVAL_W / 2}
            ry={OVAL_H / 2}
            fill="black"
          />
        </Svg>
      }
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderWidth: 3,
          borderColor: "rgba(255,255,255,0.2)",
        }}
        pointerEvents="none"
      />
      {children}
    </MaskedView>
  );
}
