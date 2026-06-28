import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class ModuleBrand {
  final IconData? icon;
  final Color color;
  final Color backgroundColor;

  const ModuleBrand({
    this.icon,
    required this.color,
    required this.backgroundColor,
  });
}

ModuleBrand moduleBrandFor(String? slug, String? iconName, String? hexColor) {
  final slugKey = (slug ?? iconName ?? '').toLowerCase();

  if (slugKey.contains('youtube')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.youtube,
      color: Color(0xFFFF0000),
      backgroundColor: Color(0xFFFFE5E5),
    );
  }
  if (slugKey.contains('instagram')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.instagram,
      color: Color(0xFFE4405F),
      backgroundColor: Color(0xFFFCE4EC),
    );
  }
  if (slugKey.contains('whatsapp')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.whatsapp,
      color: Color(0xFF25D366),
      backgroundColor: Color(0xFFE8F8EE),
    );
  }
  if (slugKey.contains('facebook')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.facebook,
      color: Color(0xFF1877F2),
      backgroundColor: Color(0xFFE7F0FF),
    );
  }
  if (slugKey.contains('telegram')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.telegram,
      color: Color(0xFF26A5E4),
      backgroundColor: Color(0xFFE3F4FC),
    );
  }
  if (slugKey.contains('twitter') || slugKey.contains('x')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.xTwitter,
      color: Color(0xFF000000),
      backgroundColor: Color(0xFFF0F0F0),
    );
  }
  if (slugKey.contains('linkedin')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.linkedin,
      color: Color(0xFF0A66C2),
      backgroundColor: Color(0xFFE8F1FA),
    );
  }
  if (slugKey.contains('google') || slugKey.contains('gmb')) {
    return const ModuleBrand(
      icon: FontAwesomeIcons.google,
      color: Color(0xFF4285F4),
      backgroundColor: Color(0xFFE8F0FE),
    );
  }

  Color color = const Color(0xFF6366F1);
  if (hexColor != null && hexColor.startsWith('#')) {
    try {
      color = Color(int.parse(hexColor.replaceFirst('#', '0xFF')));
    } catch (_) {}
  }

  return ModuleBrand(
    icon: Icons.analytics_outlined,
    color: color,
    backgroundColor: color.withValues(alpha: 0.12),
  );
}

class ModuleLogo extends StatelessWidget {
  final String? slug;
  final String? iconName;
  final String? hexColor;
  final double size;

  const ModuleLogo({
    super.key,
    required this.slug,
    this.iconName,
    this.hexColor,
    this.size = 48,
  });

  @override
  Widget build(BuildContext context) {
    final brand = moduleBrandFor(slug, iconName, hexColor);
    final iconSize = size * 0.46;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: brand.backgroundColor,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: FaIcon(
          brand.icon ?? Icons.analytics_outlined,
          color: brand.color,
          size: iconSize,
        ),
      ),
    );
  }
}
