import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function useBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = async () => {
      // Check if we can go back in navigation history
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // If no history, minimize the app (don't exit)
        await App.minimizeApp();
      }
    };

    const listener = App.addListener("backButton", handleBackButton);

    return () => {
      listener.then((remove) => remove());
    };
  }, [navigate]);
}
