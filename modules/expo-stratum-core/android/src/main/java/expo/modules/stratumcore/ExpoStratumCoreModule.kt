package expo.modules.stratumcore

import android.content.Context
import android.net.TrafficStats
import android.os.Build
import android.telephony.TelephonyCallback
import android.telephony.TelephonyDisplayInfo
import android.telephony.TelephonyManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoStratumCoreModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoStratumCore")

    OnCreate {
      registerDisplayInfoListener()
    }

    OnDestroy {
      unregisterDisplayInfoListener()
    }

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

    val overrideType = cachedOverrideNetworkType
    var label = mapNetworkTypeToLabel(networkType, overrideType)
    var family = mapLabelToFamily(label)

    return mapOf(
      "label" to label,
      "family" to family,
      "carrier" to carrier,
    )
  }

  private fun mapNetworkTypeToLabel(networkType: Int, overrideType: Int): String {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      when (overrideType) {
        TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_LTE_CA,
        TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_LTE_ADVANCED_PRO,
        -> return "LTE+"
        TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_ADVANCED,
        TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA_MMWAVE,
        -> return "5G+"
        TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA -> return "5G"
      }
    }

    return when (networkType) {
      TelephonyManager.NETWORK_TYPE_LTE -> "LTE"
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

  private fun registerDisplayInfoListener() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return
    }

    val context = appContext.reactContext ?: return
    val telephonyManager =
      context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager ?: return

    if (displayCallback != null) {
      return
    }

    val callback =
      object : TelephonyCallback(), TelephonyCallback.DisplayInfoListener {
        override fun onDisplayInfoChanged(displayInfo: TelephonyDisplayInfo) {
          cachedOverrideNetworkType = displayInfo.overrideNetworkType
        }
      }

    displayCallback = callback
    telephonyManager.registerTelephonyCallback(context.mainExecutor, callback)
  }

  private fun unregisterDisplayInfoListener() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return
    }

    val context = appContext.reactContext ?: return
    val telephonyManager =
      context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager ?: return
    val callback = displayCallback ?: return

    telephonyManager.unregisterTelephonyCallback(callback)
    displayCallback = null
  }

  companion object {
    @Volatile
    private var cachedOverrideNetworkType: Int = TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NONE

    @Volatile
    private var displayCallback: TelephonyCallback? = null
  }
}
