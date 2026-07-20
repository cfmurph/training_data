import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/app_provider.dart';
import 'screens/connect_screen.dart';
import 'screens/main_screen.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.loadSavedUrl();
  runApp(const TrainTrackApp());
}

class TrainTrackApp extends StatelessWidget {
  const TrainTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppProvider()..checkAuth(),
      child: MaterialApp(
        title: 'TrainTrack',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF6366F1),
            brightness: Brightness.dark,
            surface: const Color(0xFF111827),
            onSurface: Colors.white,
          ),
          scaffoldBackgroundColor: const Color(0xFF030712),
          useMaterial3: true,
          fontFamily: 'Roboto',
          textTheme: const TextTheme(
            bodyLarge: TextStyle(color: Colors.white),
            bodyMedium: TextStyle(color: Colors.white),
          ),
          // Navigation bar theme
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: const Color(0xFF0D1117),
            surfaceTintColor: Colors.transparent,
            indicatorColor: const Color(0xFF6366F1).withOpacity(0.25),
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return const TextStyle(color: Color(0xFF818CF8), fontSize: 11);
              }
              return const TextStyle(color: Color(0xFF6B7280), fontSize: 11);
            }),
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF0D1117),
            foregroundColor: Colors.white,
            elevation: 0,
            surfaceTintColor: Colors.transparent,
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFF1F2937),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            hintStyle: const TextStyle(color: Color(0xFF4B5563)),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6366F1),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        home: const _RootGate(),
      ),
    );
  }
}

/// Shows a loading splash, then routes to ConnectScreen or MainScreen
/// depending on auth status.
class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (ctx, prov, _) {
        if (prov.authLoading) {
          return const Scaffold(
            backgroundColor: Color(0xFF030712),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Icon(Icons.directions_bike, color: Color(0xFF6366F1), size: 64),
                  SizedBox(height: 16),
                  Text(
                    'TrainTrack',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Cycling training, redefined',
                    style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
                  ),
                  SizedBox(height: 40),
                  CircularProgressIndicator(
                    color: Color(0xFF6366F1),
                    strokeWidth: 2,
                  ),
                ],
              ),
            ),
          );
        }

        return prov.auth.isConnected ? const MainScreen() : const ConnectScreen();
      },
    );
  }
}
