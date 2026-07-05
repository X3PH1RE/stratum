package expo.modules.stratumcore

import android.content.Context
import android.net.TrafficStats
import android.os.Build
import android.telephony.TelephonyDisplayInfo
import android.telephony.TelephonyManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoStratumCoreModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoStratumCore")

    Function("getMobileTrafficStats") {
      getMobileTrafficStatsMap()
    }

    Function("getCellularInfo") {
      getCellularInfoMap()
    }
  }

  private fun getMobileTrafficStatsMap(): Map<String, Any> {
    val rx = TrafficStats.getMobileRxBytes()
    val tx = TrafficStats.getMobileTxBytes()
    val unsupported = TrafficStats.UNSUPPORTED.toLong()

    return mapOf(
      "rxBytes" to if (rx == unsupported) 0L else rx,
      "txBytes" to if (tx == unsupported) 0L else tx,
      "timestamp" to System.currentTimeMillis(),
    )
  }

  private fun getCellularInfoMap(): Map<String, Any?> {
    val context = appContext.reactContext ?: return unknownCellular()
    val telephonyManager =
      context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        ?: return unknownCellular()

    val networkType =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        telephonyManager.dataNetworkType
      } else {
        @Suppress("DEPRECATION")
        telephonyManager.networkType
      }

    val carrier =
      telephonyManager.networkOperatorName?.takeIf { it.isNotBlank() }
        ?: telephonyManager.simOperatorName?.takeIf { it.isNotBlank() }

    var label = mapNetworkTypeToLabel(networkType)
    var family = mapLabelToFamily(label)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && networkType == TelephonyManager.NETWORK_TYPE_NR) {
      try {
        @Suppress("DEPRECATION")
        val displayInfo = telephonyManager.displayInfo
        val override = displayInfo?.overrideNetworkType ?: TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NONE
        if (
          override == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_ADVANCED ||
          override == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA_MMWAVE
        ) {
          label = "5G+"
          family = "fiveG"
        }
      } catch (_: Exception) {
        // Telephony display info unavailable on some devices.
      }
    }

    return mapOf(
      "label" to label,
      "family" to family,
      "carrier" to carrier,
    )
  }

  private fun mapNetworkTypeToLabel(networkType: Int): String {
    return when (networkType) {
      TelephonyManager.NETWORK_TYPE_LTE -> "LTE"
      TelephonyManager.NETWORK_TYPE_LTE_CA -> "LTE+"
      TelephonyManager.NETWORK_TYPE_NR -> "5G"
      TelephonyManager.NETWORK_TYPE_HSPAP,
      TelephonyManager.NETWORK_TYPE_HSPA,
      TelephonyManager.NETWORK_TYPE_HSDPA,
      TelephonyManager.NETWORK_TYPE_HSUPA,
      TelephonyManager.NETWORK_TYPE_EHRPD,
      TelephonyManager.NETWORK_TYPE_EVDO_0,
      TelephonyManager.NETWORK_TYPE_EVDO_A,
      TelephonyManager.NETWORK_TYPE_EVDO_B,
      -> "4G"
      TelephonyManager.NETWORK_TYPE_UMTS,
      TelephonyManager.NETWORK_TYPE_CDMA,
      TelephonyManager.NETWORK_TYPE_1xRTT,
      TelephonyManager.NETWORK_TYPE_IDEN,
      -> "3G"
      TelephonyManager.NETWORK_TYPE_GPRS,
      TelephonyManager.NETWORK_TYPE_EDGE,
      -> "2G"
      else -> "Unknown"
    }
  }

  private fun mapLabelToFamily(label: String): String {
    return when (label) {
      "LTE", "LTE+", "4G" -> "fourG"
      "5G", "5G+" -> "fiveG"
      else -> "other"
    }
  }

  private fun unknownCellular(): Map<String, Any?> {
    return mapOf(
      "label" to "Unknown",
      "family" to "other",
      "carrier" to null,
    )
  }
}
