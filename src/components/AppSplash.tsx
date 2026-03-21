import { useEffect, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const AppSplash = ({ onComplete }: { onComplete: () => void }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Hide native splash once our in-app splash is rendered
      if (Capacitor.isNativePlatform()) {
        await SplashScreen.hide({ fadeOutDuration: 300 });
      }

      // Show in-app splash for ~2.5s then fade out
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onComplete();
        }, 500);
      }, 2000);
    };

    init();
  }, [onComplete]);

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
      <div className="pb-20 text-center">
        <h1 className="text-3xl font-bold text-white tracking-wide mb-2">
          CINEFYX
        </h1>
        <p className="text-sm text-gray-400 font-light tracking-wide">
          Watch Movies & Shows in 4K
        </p>
      </div>
    </div>
  );
};

export default AppSplash;
