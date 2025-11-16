/**
 * Helpers de Mapping de Données
 *
 * Convertit entre les conventions de naming :
 * - API REST : snake_case (device_id, app_version)
 * - Code interne : camelCase (deviceId, appVersion)
 */

/**
 * Mapper device_info de l'API vers deviceInfo interne
 */
export function mapDeviceInfoFromAPI(apiDeviceInfo: any) {
  return {
    platform: apiDeviceInfo.platform,
    version: apiDeviceInfo.version,
    model: apiDeviceInfo.model,
    appVersion: apiDeviceInfo.app_version,
    fcmToken: apiDeviceInfo.fcm_token,
  };
}

/**
 * Mapper deviceInfo interne vers device_info pour l'API
 */
export function mapDeviceInfoToAPI(deviceInfo: any) {
  return {
    platform: deviceInfo.platform,
    version: deviceInfo.version,
    model: deviceInfo.model,
    app_version: deviceInfo.appVersion,
    fcm_token: deviceInfo.fcmToken,
  };
}

/**
 * Mapper les préférences utilisateur vers l'API
 */
export function mapPreferencesToAPI(preferences: any) {
  return {
    default_quality: preferences.defaultQuality,
    auto_save: preferences.autoSave,
    notifications_enabled: preferences.notificationsEnabled,
    language: preferences.language,
    theme: preferences.theme,
  };
}

/**
 * Mapper les préférences depuis l'API
 */
export function mapPreferencesFromAPI(apiPreferences: any) {
  return {
    defaultQuality: apiPreferences.default_quality,
    autoSave: apiPreferences.auto_save,
    notificationsEnabled: apiPreferences.notifications_enabled,
    language: apiPreferences.language,
    theme: apiPreferences.theme,
  };
}

/**
 * Convertir une clé de snake_case vers camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convertir une clé de camelCase vers snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convertir récursivement un objet de snake_case vers camelCase
 */
export function deepSnakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSnakeToCamel(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[snakeToCamel(key)] = deepSnakeToCamel(value);
    }
    return result;
  }

  return obj;
}

/**
 * Convertir récursivement un objet de camelCase vers snake_case
 */
export function deepCamelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => deepCamelToSnake(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[camelToSnake(key)] = deepCamelToSnake(value);
    }
    return result;
  }

  return obj;
}

// Export par défaut
export default {
  mapDeviceInfoFromAPI,
  mapDeviceInfoToAPI,
  mapPreferencesToAPI,
  mapPreferencesFromAPI,
  snakeToCamel,
  camelToSnake,
  deepSnakeToCamel,
  deepCamelToSnake,
};
