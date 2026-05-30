type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

function readInitDataFromHash() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) {
    return '';
  }

  const params = new URLSearchParams(hash);
  return params.get('tgWebAppData') ?? '';
}

export function getTelegramWindow() {
  return window as TelegramWindow;
}

export function getTelegramInitData() {
  return getTelegramWindow().Telegram?.WebApp?.initData ?? readInitDataFromHash();
}
