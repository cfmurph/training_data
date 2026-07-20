import 'package:flutter/material.dart';

import 'dashboard_screen.dart';
import 'performance_screen.dart';
import 'plan_screen.dart';
import 'weight_screen.dart';

/// Root scaffold with bottom navigation bar.
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _index = 0;

  static const _screens = [
    DashboardScreen(),
    PlanScreen(),
    PerformanceScreen(),
    WeightScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF0D1117),
        indicatorColor: const Color(0xFF6366F1).withOpacity(0.25),
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        height: 65,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined, color: Color(0xFF6B7280)),
            selectedIcon: Icon(Icons.dashboard, color: Color(0xFF818CF8)),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.directions_bike_outlined, color: Color(0xFF6B7280)),
            selectedIcon: Icon(Icons.directions_bike, color: Color(0xFF818CF8)),
            label: 'Plan',
          ),
          NavigationDestination(
            icon: Icon(Icons.bolt_outlined, color: Color(0xFF6B7280)),
            selectedIcon: Icon(Icons.bolt, color: Color(0xFF818CF8)),
            label: 'Performance',
          ),
          NavigationDestination(
            icon: Icon(Icons.monitor_weight_outlined, color: Color(0xFF6B7280)),
            selectedIcon: Icon(Icons.monitor_weight, color: Color(0xFF818CF8)),
            label: 'Weight',
          ),
        ],
      ),
    );
  }
}
