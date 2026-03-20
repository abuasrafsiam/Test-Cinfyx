import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export function useImmersiveMode() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupImmersive = async () => {
      try {
        // Hide status bar and navigation bar
        await StatusBar.hide();
        // Set dark style so text is light
        await StatusBar.setStyle({ style: Style.Dark });
        // Make status bar overlay the content
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch {}
    };

    setupImmersive();

    return () => {
      // Show status bar when leaving
      const restoreUI = async () => {
        try {
          await StatusBar.show();
        } catch {}
      };
      restoreUI();
    };
  }, []);
}
