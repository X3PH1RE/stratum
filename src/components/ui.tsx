import * as Haptics from 'expo-haptics';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { colors } from '../constants/colors';

type MonitoringToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function MonitoringToggle({
  value,
  onValueChange,
  disabled = false,
}: MonitoringToggleProps) {
  const handleChange = (next: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(next);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Monitoring</Text>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{
          false: colors.surfaceRaised,
          true: colors.accentSoft,
        }}
        thumbColor={value ? colors.accent : colors.accentMuted}
        ios_backgroundColor={colors.surfaceRaised}
      />
    </View>
  );
}

type NetworkPreviewProps = {
  label: string;
  family: 'fourG' | 'fiveG' | 'other';
  carrier: string | null;
};

export function NetworkPreview({ label, family, carrier }: NetworkPreviewProps) {
  const dotColor =
    family === 'fourG'
      ? colors.accent4G
      : family === 'fiveG'
        ? colors.accent5G
        : colors.dotOther;

  return (
    <View style={styles.preview}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.previewLabel}>{label}</Text>
      {carrier ? <Text style={styles.carrier}>{carrier}</Text> : null}
    </View>
  );
}

type SpeedCardProps = {
  title: string;
  value: string;
  style?: ViewStyle;
};

export function SpeedCard({ title, value, style }: SpeedCardProps) {
  return (
    <View style={[styles.speedCard, style]}>
      <View style={styles.speedAccent} />
      <View style={styles.speedContent}>
        <Text style={styles.speedTitle}>{title}</Text>
        <Text style={styles.speedValue}>{value}</Text>
      </View>
    </View>
  );
}

type PermissionRowProps = {
  title: string;
  granted: boolean;
  onGrant: () => void;
};

export function PermissionRow({ title, granted, onGrant }: PermissionRowProps) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionLeft}>
        <View
          style={[
            styles.permissionDot,
            { backgroundColor: granted ? colors.accent5G : colors.accentMuted },
          ]}
        />
        <Text style={styles.permissionTitle}>{title}</Text>
      </View>
      {granted ? (
        <Text style={styles.granted}>Granted</Text>
      ) : (
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onGrant();
          }}
          style={({ pressed }) => [
            styles.grantButton,
            pressed && styles.grantButtonPressed,
          ]}
        >
          <Text style={styles.grantButtonText}>Grant</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: 'DMSans_500Medium',
  },
  preview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  previewLabel: {
    color: colors.textPrimary,
    fontSize: 34,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.5,
  },
  carrier: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  speedCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  speedAccent: {
    width: 3,
    backgroundColor: colors.accent,
  },
  speedContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  speedTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  speedValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: 'DMSans_500Medium',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  permissionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  granted: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  grantButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  grantButtonPressed: {
    opacity: 0.8,
  },
  grantButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
});
