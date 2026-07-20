/// Backend URL configuration.
///
/// For Android Emulator: http://10.0.2.2:3001
/// For physical device on same network: http://<your-machine-ip>:3001
/// For production: https://your-server.com
class AppConfig {
  static const String defaultBaseUrl = 'http://10.0.2.2:3001';

  static String baseUrl = defaultBaseUrl;

  /// Called once at startup from SharedPreferences.
  static void setBaseUrl(String url) {
    baseUrl = url.isEmpty ? defaultBaseUrl : url;
  }
}
