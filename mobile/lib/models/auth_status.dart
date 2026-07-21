class AthleteInfo {
  final String id;
  final String name;
  final String? username;
  final String? avatar;
  final String? city;
  final String? country;

  AthleteInfo({
    required this.id,
    required this.name,
    this.username,
    this.avatar,
    this.city,
    this.country,
  });

  factory AthleteInfo.fromJson(Map<String, dynamic> j) => AthleteInfo(
        id: j['id']?.toString() ?? '',
        name: j['name'] ?? '',
        username: j['username'],
        avatar: j['avatar'],
        city: j['city'],
        country: j['country'],
      );
}

class AuthStatus {
  final bool strava;
  final bool garmin;
  final bool trainingPeaks;
  final bool trainingPeaksConfigured;
  final AthleteInfo? athlete;
  final String? provider;

  AuthStatus({
    required this.strava,
    required this.garmin,
    required this.trainingPeaks,
    required this.trainingPeaksConfigured,
    this.athlete,
    this.provider,
  });

  bool get isConnected => strava || garmin || trainingPeaks;

  factory AuthStatus.fromJson(Map<String, dynamic> j) => AuthStatus(
        strava: j['strava'] ?? false,
        garmin: j['garmin'] ?? false,
        trainingPeaks: j['trainingPeaks'] ?? false,
        trainingPeaksConfigured: j['trainingPeaksConfigured'] ?? false,
        athlete: j['athlete'] != null ? AthleteInfo.fromJson(j['athlete']) : null,
        provider: j['provider'],
      );

  factory AuthStatus.disconnected() => AuthStatus(
        strava: false,
        garmin: false,
        trainingPeaks: false,
        trainingPeaksConfigured: false,
      );
}
