// Chooses the backend adapter at build time. Both adapters expose the same interface,
// so every page and component is identical in demo and production.
import { IS_DEMO } from '../lib/config.js';
import { demoApi } from './demoApi.js';
import { supabaseApi } from './supabaseApi.js';

export const api = IS_DEMO ? demoApi : supabaseApi;
