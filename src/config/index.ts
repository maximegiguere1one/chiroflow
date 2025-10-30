export { APP_CONFIG, type AppConfig } from './app.config';
export { TIMING_CONFIG, type TimingConfig } from './timing.config';
export { BUSINESS_CONFIG, type BusinessConfig } from './business.config';
export { UI_CONFIG, type UIConfig } from './ui.config';

export const CONFIG = {
  app: APP_CONFIG,
  timing: TIMING_CONFIG,
  business: BUSINESS_CONFIG,
  ui: UI_CONFIG,
} as const;
