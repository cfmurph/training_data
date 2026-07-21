import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../config.dart';
import '../providers/app_provider.dart';
import '../widgets/tt_app_bar.dart';

/// OAuth connect screen. Opens each provider's OAuth URL in an in-app WebView.
/// When the backend redirects to /dashboard (OAuth success), we close the
/// WebView and refresh auth status.
class ConnectScreen extends StatefulWidget {
  const ConnectScreen({super.key});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  bool _showWebView = false;
  String _oauthUrl = '';
  String _providerLabel = '';

  void _openOAuth(String path, String label) {
    setState(() {
      _oauthUrl = '${AppConfig.baseUrl}$path';
      _providerLabel = label;
      _showWebView = true;
    });
  }

  Future<void> _onOAuthComplete() async {
    setState(() => _showWebView = false);
    if (mounted) {
      await context.read<AppProvider>().checkAuth();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showWebView) {
      return _OAuthWebView(
        url: _oauthUrl,
        title: 'Connect ${ _providerLabel}',
        onComplete: _onOAuthComplete,
        onCancel: () => setState(() => _showWebView = false),
      );
    }

    return Scaffold(
      appBar: const TTAppBar(title: 'Connect Account'),
      backgroundColor: const Color(0xFF030712),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Text(
                'Link your account',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                'Connect Strava, Garmin, or Training Peaks to import your cycling data and power your training plan.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[400],
                    ),
              ),
              const SizedBox(height: 32),

              // ── Strava ─────────────────────────────────────────────
              _ProviderCard(
                name: 'Strava',
                subtitle: 'Import runs, rides, and more',
                color: const Color(0xFFFC4C02),
                icon: _stravaIcon(),
                onTap: () => _openOAuth('/api/auth/strava/connect', 'Strava'),
              ),
              const SizedBox(height: 12),

              // ── Garmin ─────────────────────────────────────────────
              _ProviderCard(
                name: 'Garmin Connect',
                subtitle: 'Sync from Garmin Health API',
                color: const Color(0xFF007DC3),
                icon: _letterIcon('G', const Color(0xFF007DC3)),
                onTap: () => _openOAuth('/api/auth/garmin/connect', 'Garmin'),
              ),
              const SizedBox(height: 12),

              // ── Training Peaks ────────────────────────────────────
              _ProviderCard(
                name: 'Training Peaks',
                subtitle: 'Import structured workouts',
                color: const Color(0xFF4C3B9F),
                icon: _letterIcon('TP', const Color(0xFF4C3B9F)),
                onTap: () =>
                    _openOAuth('/api/auth/trainingpeaks/connect', 'Training Peaks'),
              ),

              const SizedBox(height: 32),
              _ServerUrlCard(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _stravaIcon() => Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0xFFFC4C02).withOpacity(0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.directions_bike, color: Color(0xFFFC4C02), size: 26),
      );

  Widget _letterIcon(String text, Color color) => Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(text,
              style: TextStyle(
                  color: color, fontWeight: FontWeight.bold, fontSize: 14)),
        ),
      );
}

// ── Provider tile ─────────────────────────────────────────────────────────

class _ProviderCard extends StatelessWidget {
  final String name;
  final String subtitle;
  final Color color;
  final Widget icon;
  final VoidCallback onTap;

  const _ProviderCard({
    required this.name,
    required this.subtitle,
    required this.color,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF111827),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF1F2937)),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              icon,
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: TextStyle(color: Colors.grey[400], fontSize: 13)),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, color: Colors.grey[600], size: 16),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Server URL config card ────────────────────────────────────────────────

class _ServerUrlCard extends StatefulWidget {
  @override
  State<_ServerUrlCard> createState() => _ServerUrlCardState();
}

class _ServerUrlCardState extends State<_ServerUrlCard> {
  final _ctrl = TextEditingController(text: AppConfig.baseUrl);
  bool _saved = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border.all(color: const Color(0xFF1F2937)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.settings, color: Color(0xFF6366F1), size: 18),
              const SizedBox(width: 8),
              const Text('Backend URL',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Emulator: http://10.0.2.2:3001  •  Physical device: http://<your-ip>:3001',
            style: TextStyle(color: Colors.grey[500], fontSize: 11),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _ctrl,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'http://10.0.2.2:3001',
              hintStyle: TextStyle(color: Colors.grey[600]),
              filled: true,
              fillColor: const Color(0xFF1F2937),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              suffixIcon: _saved
                  ? const Icon(Icons.check, color: Color(0xFF10B981), size: 18)
                  : null,
            ),
            onSubmitted: (_) => _save(),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1F2937),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Save URL'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    await ApiService.saveUrl(_ctrl.text.trim());
    setState(() => _saved = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _saved = false);
    });
  }
}

// ── OAuth WebView ─────────────────────────────────────────────────────────

class _OAuthWebView extends StatefulWidget {
  final String url;
  final String title;
  final VoidCallback onComplete;
  final VoidCallback onCancel;

  const _OAuthWebView({
    required this.url,
    required this.title,
    required this.onComplete,
    required this.onCancel,
  });

  @override
  State<_OAuthWebView> createState() => _OAuthWebViewState();
}

class _OAuthWebViewState extends State<_OAuthWebView> {
  late final WebViewController _wvc;
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    _wvc = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onProgress: (p) => setState(() => _progress = p / 100),
        onNavigationRequest: (req) {
          // OAuth completed → backend redirects to /dashboard or /?connected=...
          final url = req.url;
          if (url.contains('/dashboard') ||
              url.contains('connected=strava') ||
              url.contains('connected=garmin') ||
              url.contains('connected=trainingpeaks')) {
            widget.onComplete();
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: const Color(0xFF111827),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: widget.onCancel,
        ),
        bottom: _progress < 1
            ? PreferredSize(
                preferredSize: const Size.fromHeight(2),
                child: LinearProgressIndicator(
                  value: _progress,
                  backgroundColor: Colors.transparent,
                  color: const Color(0xFF6366F1),
                ),
              )
            : null,
      ),
      body: WebViewWidget(controller: _wvc),
    );
  }
}
