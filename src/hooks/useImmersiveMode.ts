import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export function useImmersiveMode() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupImmersive = async () => {
      try {
        // Hide status bar for immersive video experience
        await StatusBar.hide();
        // Set dark style so text is light
        await StatusBar.setStyle({ style: Style.Dark });
        // Ensure status bar doesn't overlay content when shown
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {}
    };

    setupImmersive();

    return () => {
      // Restore status bar when leaving video player
      const restoreUI = async () => {
        try {
          await StatusBar.show();
          // Ensure content is properly positioned below status bar
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch {}
      };
      restoreUI();
    };
  }, []);
}
