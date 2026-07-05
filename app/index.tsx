import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ExpoGoBanner,
  MonitoringToggle,
  NetworkPreview,
  PermissionRow,
  SpeedCard,
} from '../src/components/ui';
import { colors } from '../src/constants/colors';
import { useMonitoring, usePermissions } from '../src/hooks/useMonitoring';
import { readCellularInfo } from '../src/platform/nativeApi';
import { monitoringController } from '../src/services/monitoringController';
import type { CellularInfo } from '../src/types/cellular';

const idleCellular: CellularInfo = {
  label: 'Unknown',
  family: 'other',
  carrier: null,
};

async function hasRequiredPermissions(isExpoGo: boolean) {
  if (isExpoGo) {
    return true;
  }

  if (Platform.OS !== 'android') {
    return false;
  }

  const phoneGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  );

  const notifGranted =
    Platform.Version < 33
      ? true
      : await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

  return phoneGranted && notifGranted;
}

export default function HomeScreen() {
  const { running, cellular: liveCellular, download, upload, toggle, previewMode } =
    useMonitoring();
  const [previewCellular, setPreviewCellular] = useState<CellularInfo>(idleCellular);
  const {
    permissions,
    requiredGranted,
    requestBattery,
    requestNotifications,
    requestPhoneState,
    refresh,
    isExpoGo,
  } = usePermissions();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      await refresh();
      const enabled = await monitoringController.loadPersistedEnabled();

      if (enabled && (await hasRequiredPermissions(isExpoGo))) {
        await monitoringController.start();
      }

      if (mounted) {
        setBootstrapped(true);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [refresh, isExpoGo]);

  useEffect(() => {
    if (running) {
      return;
    }

    const poll = async () => {
      const info = await readCellularInfo();
      setPreviewCellular(info);
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 2000);

    return () => clearInterval(interval);
  }, [running]);

  const cellular = running ? liveCellular : previewCellular;

  const handleToggle = async (enabled: boolean) => {
    if (enabled && !requiredGranted) {
      Alert.alert(
        'Permissions needed',
        'Grant phone state and notification permissions before starting Stratum.',
      );
      return;
    }

    if (enabled && !isExpoGo && permissions.battery !== 'granted') {
      Alert.alert(
        'Battery optimization',
        'For reliable monitoring on battery saver, allow Stratum to ignore battery optimizations.',
        [
          { text: 'Skip', style: 'cancel', onPress: () => void toggle(true) },
          {
            text: 'Allow',
            onPress: async () => {
              await requestBattery();
              await toggle(true);
            },
          },
        ],
      );
      return;
    }

    await toggle(enabled);
  };

  if (!bootstrapped) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Stratum</Text>

        {previewMode ? <ExpoGoBanner /> : null}

        <NetworkPreview
          label={cellular.label}
          family={cellular.family}
          carrier={cellular.carrier}
        />

        <MonitoringToggle
          value={running}
          onValueChange={(enabled) => {
            void handleToggle(enabled);
          }}
          disabled={!requiredGranted && !running}
        />

        <View style={styles.speedSection}>
          <SpeedCard title="Download" value={running ? download : '—'} />
          <SpeedCard title="Upload" value={running ? upload : '—'} />
        </View>

        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.permissionsCard}>
          <PermissionRow
            title="Phone state"
            granted={permissions.phoneState === 'granted'}
            onGrant={() => {
              void requestPhoneState();
            }}
          />
          <PermissionRow
            title="Battery exempt"
            granted={permissions.battery === 'granted'}
            unavailable={permissions.battery === 'unavailable'}
            onGrant={() => {
              void requestBattery();
            }}
          />
          <PermissionRow
            title="Notifications"
            granted={permissions.notifications === 'granted'}
            unavailable={isExpoGo}
            onGrant={() => {
              void requestNotifications();
            }}
          />
        </View>

        {!requiredGranted ? (
          <Text style={styles.hint}>
            Grant phone state and notifications to enable monitoring.
          </Text>
        ) : isExpoGo ? (
          <Text style={styles.hint}>
            Open this project in Expo Go via the QR code from npx expo start.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: 8,
    marginBottom: 8,
  },
  speedSection: {
    gap: 12,
    marginTop: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  permissionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  hint: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_400Regular',
  },
});
