// lib/features/profile/ui/help_support_screen.dart

import 'package:flutter/material.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  static const _primaryColor = Color(0xFF1A73E8);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: _primaryColor,
          ),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: const Text(
          'Help & Support',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
        children: [
          // ── Hero Card ────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A73E8), Color(0xFF0D47A1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1A73E8).withValues(alpha: 0.3),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                const Icon(Icons.support_agent_rounded,
                    color: Colors.white, size: 50),
                const SizedBox(height: 12),
                const Text(
                  'How can we help you?',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Our support team is available 24/7',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── Contact Options ──────────────────────────────────
          _buildSectionLabel('📞 Contact Us'),
          const SizedBox(height: 12),

          _buildContactCard(
            context,
            icon: Icons.email_rounded,
            iconColor: const Color(0xFF1A73E8),
            title: 'Email Support',
            subtitle: 'support@intellifit.com',
            onTap: () => _showComingSoon(context),
          ),
          const SizedBox(height: 10),
          _buildContactCard(
            context,
            icon: Icons.chat_bubble_rounded,
            iconColor: const Color(0xFF43A047),
            title: 'Live Chat',
            subtitle: 'Chat with our support team',
            onTap: () => _showComingSoon(context),
          ),
          const SizedBox(height: 10),
          _buildContactCard(
            context,
            icon: Icons.phone_rounded,
            iconColor: const Color(0xFFFF7043),
            title: 'Call Us',
            subtitle: '+1 (800) INTELLIFIT',
            onTap: () => _showComingSoon(context),
          ),

          const SizedBox(height: 24),

          // ── FAQ ──────────────────────────────────────────────
          _buildSectionLabel('❓ Frequently Asked Questions'),
          const SizedBox(height: 12),

          _buildFaqItem(
            'How do I book equipment?',
            'Go to the Bookings tab, select the Equipment tab, choose your preferred date and machine, then tap "Book Now". Tokens will be deducted from your balance.',
          ),
          _buildFaqItem(
            'How do I book a coach session?',
            'Go to Bookings → Coach tab. Browse available coaches, select a time slot, and confirm your booking.',
          ),
          _buildFaqItem(
            'How does the AI Coach work?',
            'Our AI Coach uses your fitness data and goals to generate personalized workout and nutrition plans. You can also chat with it for real-time advice.',
          ),
          _buildFaqItem(
            'How do I get more tokens?',
            'Tokens can be purchased through the app. Go to Profile → Membership & Tokens to top up your balance.',
          ),
          _buildFaqItem(
            'Can I cancel a booking?',
            'Yes. Go to Bookings, find your booking, and tap Cancel. Tokens will be refunded if cancelled 24 hours in advance.',
          ),
          _buildFaqItem(
            'How do I update my profile?',
            'Go to Profile → Personal Information to edit your name, phone, and address.',
          ),

          const SizedBox(height: 24),

          // ── App Info ─────────────────────────────────────────
          _buildSectionLabel('ℹ️ App Information'),
          const SizedBox(height: 12),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withValues(alpha: 0.07),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildInfoRow('App Version', '1.0.0'),
                const Divider(height: 20),
                _buildInfoRow('Build', '2024.1'),
                const Divider(height: 20),
                _buildInfoRow('API Version', 'v1'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────
  // Contact Card
  // ──────────────────────────────────────────────────────────────
  Widget _buildContactCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withValues(alpha: 0.07),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: Colors.grey, size: 22),
          ],
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────
  // FAQ Item (Expandable)
  // ──────────────────────────────────────────────────────────────
  Widget _buildFaqItem(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.07),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Theme(
        data: ThemeData(
          dividerColor: Colors.transparent,
          splashColor: Colors.transparent,
        ),
        child: ExpansionTile(
          tilePadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          childrenPadding:
              const EdgeInsets.fromLTRB(16, 0, 16, 16),
          title: Text(
            question,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: Colors.black87,
            ),
          ),
          iconColor: _primaryColor,
          collapsedIconColor: Colors.grey,
          children: [
            Text(
              answer,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.grey, fontSize: 13),
        ),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.info_outline, color: Colors.white),
            SizedBox(width: 8),
            Text('Coming soon!'),
          ],
        ),
        backgroundColor: _primaryColor,
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
