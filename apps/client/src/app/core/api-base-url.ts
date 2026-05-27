export function getApiBaseUrl() {
  const runtimeWindow = window as Window & { __TG_BDAYS_API_URL__?: string };
  if (runtimeWindow.__TG_BDAYS_API_URL__) {
    return runtimeWindow.__TG_BDAYS_API_URL__;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  return 'https://tg-bdays-972361613065.europe-west3.run.app';
}
