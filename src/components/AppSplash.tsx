import { useEffect, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const AppSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // On native, the Android splash already showed — just hide it and skip
    if (isNative) {
      SplashScreen.hide({ fadeOutDuration: 300 });
      setVisible(false);
      onComplete();
      return;
    }

    // On web, show our in-app splash for ~2s then fade out
    setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 500);
    }, 2000);
  }, [onComplete, isNative]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/cinefyx-logo.png"
          alt="Cinefyx"
          className="w-32 h-32 object-contain"
        />
      </div>
      <p className="pb-8 text-xs text-gray-500 tracking-widest uppercase">
        Powered by Primeapps
      </p>
    </div>
  );
};

export default AppSplash;
