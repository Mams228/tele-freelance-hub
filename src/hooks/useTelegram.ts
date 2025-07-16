import { useEffect, useState } from 'react';
import type { TelegramWebApp, TelegramUser } from '@/types/telegram';

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        const app = window.Telegram.WebApp;
        setWebApp(app);
        setUser(app.initDataUnsafe.user || null);
        
        // Initialize WebApp
        app.ready();
        app.expand();
        
        // Configure appearance
        app.headerColor = '#0088CC';
        app.backgroundColor = '#F8FAFC';
        
        setIsReady(true);
      }
    };

    // Check if Telegram WebApp is already available
    if (window.Telegram?.WebApp) {
      initTelegram();
    } else {
      // Wait for Telegram WebApp script to load
      const checkInterval = setInterval(() => {
        if (window.Telegram?.WebApp) {
          initTelegram();
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        // Fallback for testing outside Telegram
        setIsReady(true);
      }, 5000);
    }
  }, []);

  const sendData = (data: any) => {
    if (webApp) {
      webApp.sendData(JSON.stringify(data));
    } else {
      console.log('Data yang akan dikirim ke bot:', data);
    }
  };

  const showAlert = (message: string) => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const getUserId = (): string => {
    return user?.id?.toString() || 'demo_user';
  };

  const getUserName = (): string => {
    if (user) {
      return user.first_name + (user.last_name ? ` ${user.last_name}` : '');
    }
    return 'Demo User';
  };

  return {
    isReady,
    webApp,
    user,
    sendData,
    showAlert,
    getUserId,
    getUserName,
    isInTelegram: !!window.Telegram?.WebApp
  };
}