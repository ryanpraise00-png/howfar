import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect, G, Polygon, Path, Circle } from 'react-native-svg';

export default function ChatBackground({ children, bgColor }: { children: React.ReactNode; bgColor?: string | null }) {
  return (
    <View style={[styles.container, bgColor ? { backgroundColor: bgColor } : undefined]}>
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <Pattern id="chatbg" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <Rect width="120" height="120" fill={bgColor ?? '#F6F7FB'} />

            {/* H lettermark */}
            <G opacity="0.055">
              <Rect x="8" y="10" width="4" height="18" rx="1" fill="#14213D" />
              <Rect x="20" y="10" width="4" height="18" rx="1" fill="#14213D" />
              <Rect x="8" y="17.5" width="16" height="4" rx="1" fill="#3D5AFE" />
            </G>

            {/* Speech bubble 1 */}
            <G opacity="0.05">
              <Rect x="38" y="8" width="28" height="18" rx="5" fill="#14213D" />
              <Polygon points="42,26 38,32 48,26" fill="#14213D" />
            </G>

            {/* Signal arc */}
            <G opacity="0.05">
              <Path d="M 80 18 Q 84 12 90 18" stroke="#3D5AFE" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <Path d="M 77 21 Q 84 9 91 21" stroke="#3D5AFE" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <Circle cx="84" cy="22" r="1.5" fill="#3D5AFE" />
            </G>

            {/* Amber dot */}
            <Circle cx="110" cy="14" r="2" fill="#F2A93B" opacity="0.15" />

            {/* Speech bubble 2 — indigo */}
            <G opacity="0.045">
              <Rect x="70" y="48" width="32" height="20" rx="5" fill="#3D5AFE" />
              <Polygon points="98,68 102,74 92,68" fill="#3D5AFE" />
            </G>

            {/* H lettermark medium */}
            <G opacity="0.04">
              <Rect x="10" y="58" width="5" height="22" rx="1" fill="#14213D" />
              <Rect x="24" y="58" width="5" height="22" rx="1" fill="#14213D" />
              <Rect x="10" y="67" width="19" height="5" rx="1" fill="#3D5AFE" />
            </G>

            {/* Small speech bubble 3 */}
            <G opacity="0.05">
              <Rect x="44" y="56" width="18" height="12" rx="4" fill="#14213D" />
              <Polygon points="47,68 44,73 52,68" fill="#14213D" />
            </G>

            {/* Signal arc bottom */}
            <G opacity="0.045">
              <Path d="M 8 92 Q 12 86 18 92" stroke="#14213D" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <Path d="M 5 95 Q 12 83 19 95" stroke="#14213D" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <Circle cx="12" cy="96" r="1.5" fill="#14213D" />
            </G>

            {/* Tiny H mark indigo */}
            <G opacity="0.04">
              <Rect x="50" y="90" width="3" height="14" rx="1" fill="#3D5AFE" />
              <Rect x="59" y="90" width="3" height="14" rx="1" fill="#3D5AFE" />
              <Rect x="50" y="95.5" width="12" height="3" rx="1" fill="#3D5AFE" />
            </G>

            {/* Amber dot bottom */}
            <Circle cx="105" cy="95" r="3" fill="#F2A93B" opacity="0.12" />

            {/* Tiny speech bubble bottom right */}
            <G opacity="0.04">
              <Rect x="82" y="88" width="22" height="14" rx="4" fill="#14213D" />
              <Polygon points="85,102 82,107 90,102" fill="#14213D" />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#chatbg)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
});
