import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../cubit/ai_coach_cubit.dart';
import '../cubit/ai_coach_state.dart';
import '../models/chat_message_model.dart';

class AiCoachScreen extends StatefulWidget {
  // showBackButton = true لما بيجي من صفحة تانية (Summary مثلاً)
  final bool showBackButton;
  const AiCoachScreen({super.key, this.showBackButton = false});

  @override
  State<AiCoachScreen> createState() => _AiCoachScreenState();
}

class _AiCoachScreenState extends State<AiCoachScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _send(BuildContext ctx) {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    ctx.read<AiCoachCubit>().sendMessage(text);
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AiCoachCubit()..initChat(),
      child: Builder(
        builder: (ctx) => Scaffold(
          backgroundColor: const Color(0xFFF4F6FB),
          drawer: _buildHistoryDrawer(ctx),
          appBar: _buildAppBar(ctx),
          body: Column(
            children: [
              Expanded(
                child: BlocConsumer<AiCoachCubit, AiCoachState>(
                  listener: (_, state) {
                    if (state is AiCoachSuccess) _scrollToBottom();
                  },
                  builder: (context, state) {
                    if (state is AiCoachLoading ||
                        state is AiCoachHistoryLoading) {
                      return const Center(
                        child: CircularProgressIndicator(
                          color: Color(0xFF1A3A8F),
                        ),
                      );
                    }
                    if (state is AiCoachSuccess) {
                      final totalItems =
                          state.messages.length + (state.isAiTyping ? 1 : 0);
                      return ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                        itemCount: totalItems,
                        itemBuilder: (context, i) {
                          if (i == state.messages.length && state.isAiTyping) {
                            return _buildTypingBubble();
                          }
                          final msg = state.messages[i];
                          return msg.isUser
                              ? _buildUserBubble(msg)
                              : _buildAiBubble(msg);
                        },
                      );
                    }
                    return const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF1A3A8F),
                      ),
                    );
                  },
                ),
              ),
              _buildSuggestions(ctx),
              _buildInputBar(ctx),
            ],
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // AppBar – بيعرض back button لو showBackButton = true
  // ══════════════════════════════════════════════════
  AppBar _buildAppBar(BuildContext ctx) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0.5,
      shadowColor: Colors.grey.shade200,
      // ← زرار الرجوع لو اتفتح من صفحة تانية
      leading: widget.showBackButton
          ? IconButton(
              icon: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: Color(0xFF1A3A8F),
              ),
              onPressed: () => Navigator.of(ctx).pop(),
            )
          : Builder(
              builder: (context) => IconButton(
                icon: const Icon(
                  Icons.history_rounded,
                  color: Color(0xFF1A3A8F),
                ),
                tooltip: 'Chat History',
                onPressed: () {
                  context.read<AiCoachCubit>().fetchChatHistory();
                  Scaffold.of(context).openDrawer();
                },
              ),
            ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.smart_toy_outlined,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Assistant',
                style: TextStyle(color: Colors.grey, fontSize: 10),
              ),
              Text(
                'AI Coach',
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        // History icon لما يبقي في back button mode
        if (widget.showBackButton)
          Builder(
            builder: (context) => IconButton(
              icon: const Icon(Icons.history_rounded, color: Color(0xFF1A3A8F)),
              onPressed: () {
                context.read<AiCoachCubit>().fetchChatHistory();
                Scaffold.of(context).openDrawer();
              },
            ),
          ),
        IconButton(
          icon: const Icon(
            Icons.add_comment_outlined,
            color: Color(0xFF1A3A8F),
          ),
          tooltip: 'New Chat',
          onPressed: () => ctx.read<AiCoachCubit>().startNewChat(),
        ),
        IconButton(
          icon: const Icon(Icons.delete_outline_rounded, color: Colors.grey),
          tooltip: 'Clear',
          onPressed: () => _confirmClear(ctx),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════
  // History Drawer
  // ══════════════════════════════════════════════════
  Widget _buildHistoryDrawer(BuildContext ctx) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(
                      Icons.history_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Chat History',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Previous conversations',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: GestureDetector(
                onTap: () {
                  Navigator.pop(ctx);
                  ctx.read<AiCoachCubit>().startNewChat();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A3A8F).withOpacity(0.07),
                    borderRadius: BorderRadius.circular(13),
                    border: Border.all(
                      color: const Color(0xFF1A3A8F).withOpacity(0.25),
                    ),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.add_rounded,
                        color: Color(0xFF1A3A8F),
                        size: 18,
                      ),
                      SizedBox(width: 10),
                      Text(
                        'New Conversation',
                        style: TextStyle(
                          color: Color(0xFF1A3A8F),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 18),
              child: Text(
                'PREVIOUS CHATS',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: BlocBuilder<AiCoachCubit, AiCoachState>(
                builder: (context, state) {
                  if (state is AiCoachHistoryLoading) {
                    return const Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFF1A3A8F),
                      ),
                    );
                  }
                  List<ChatSessionModel> sessions = [];
                  if (state is AiCoachHistoryLoaded) sessions = state.sessions;
                  if (state is AiCoachSuccess) sessions = state.sessions;

                  if (sessions.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.chat_bubble_outline_rounded,
                            size: 44,
                            color: Colors.grey.shade300,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'No previous chats',
                            style: TextStyle(
                              color: Colors.grey.shade400,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    itemCount: sessions.length,
                    itemBuilder: (context, i) =>
                        _buildSessionTile(ctx, sessions[i]),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionTile(BuildContext ctx, ChatSessionModel session) {
    final dateStr = session.createdAt != null
        ? DateFormat('MMM d, h:mm a').format(session.createdAt!)
        : 'Recent';
    return GestureDetector(
      onTap: () {
        Navigator.pop(ctx);
        ctx.read<AiCoachCubit>().loadSession(session.sessionId);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 7),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
        decoration: BoxDecoration(
          color: const Color(0xFFF4F6FB),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: const Color(0xFF1A3A8F).withOpacity(0.09),
                borderRadius: BorderRadius.circular(9),
              ),
              child: const Icon(
                Icons.chat_rounded,
                color: Color(0xFF1A3A8F),
                size: 16,
              ),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.displayTitle,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    dateStr,
                    style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Colors.grey,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // Bubbles
  // ══════════════════════════════════════════════════
  Widget _buildAiBubble(ChatMessageModel msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          const CircleAvatar(
            radius: 14,
            backgroundColor: Color(0xFF1A3A8F),
            child: Icon(
              Icons.smart_toy_outlined,
              color: Colors.white,
              size: 14,
            ),
          ),
          const SizedBox(width: 7),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                      bottomLeft: Radius.circular(4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.07),
                        blurRadius: 5,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    msg.text,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.5,
                      color: Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  msg.time,
                  style: const TextStyle(color: Colors.grey, fontSize: 9),
                ),
              ],
            ),
          ),
          const SizedBox(width: 44),
        ],
      ),
    );
  }

  Widget _buildUserBubble(ChatMessageModel msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          const SizedBox(width: 44),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
                    ),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(4),
                    ),
                  ),
                  child: Text(
                    msg.text,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  msg.time,
                  style: const TextStyle(color: Colors.grey, fontSize: 9),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingBubble() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          const CircleAvatar(
            radius: 14,
            backgroundColor: Color(0xFF1A3A8F),
            child: Icon(
              Icons.smart_toy_outlined,
              color: Colors.white,
              size: 14,
            ),
          ),
          const SizedBox(width: 7),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.07),
                  blurRadius: 5,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dot(0),
                const SizedBox(width: 4),
                _dot(150),
                const SizedBox(width: 4),
                _dot(300),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _dot(int delayMs) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.3, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
      builder: (_, val, __) => Opacity(
        opacity: val,
        child: Container(
          width: 7,
          height: 7,
          decoration: const BoxDecoration(
            color: Color(0xFF1A3A8F),
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // Suggestions
  // ══════════════════════════════════════════════════
  Widget _buildSuggestions(BuildContext ctx) {
    final suggestions = [
      ('💪 Workout', 'Create a new workout plan for me'),
      ('🥗 Nutrition', 'Give me nutrition tips for muscle gain'),
      ('📊 Progress', 'How is my fitness progress?'),
      ('🔥 Lose Weight', 'Best exercises for weight loss'),
    ];
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: suggestions
              .map(
                (s) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    label: Text(
                      s.$1,
                      style: const TextStyle(
                        color: Color(0xFF1A3A8F),
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF1A3A8F), width: 1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    onPressed: () {
                      _controller.text = s.$2;
                      _send(ctx);
                    },
                  ),
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════
  // Input Bar
  // ══════════════════════════════════════════════════
  Widget _buildInputBar(BuildContext ctx) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.fromLTRB(
        12,
        8,
        12,
        MediaQuery.of(ctx).viewInsets.bottom + 12,
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFF4F6FB),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TextField(
                controller: _controller,
                decoration: const InputDecoration(
                  hintText: 'Ask AI Coach anything...',
                  hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 11),
                ),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _send(ctx),
                maxLines: null,
              ),
            ),
          ),
          const SizedBox(width: 8),
          BlocBuilder<AiCoachCubit, AiCoachState>(
            builder: (context, state) {
              final isTyping = state is AiCoachSuccess && state.isAiTyping;
              return GestureDetector(
                onTap: isTyping ? null : () => _send(ctx),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: isTyping
                        ? null
                        : const LinearGradient(
                            colors: [Color(0xFF1A3A8F), Color(0xFF0D47A1)],
                          ),
                    color: isTyping ? Colors.grey.shade200 : null,
                    shape: BoxShape.circle,
                    boxShadow: isTyping
                        ? null
                        : [
                            BoxShadow(
                              color: const Color(0xFF1A3A8F).withOpacity(0.35),
                              blurRadius: 7,
                              offset: const Offset(0, 3),
                            ),
                          ],
                  ),
                  child: isTyping
                      ? const Padding(
                          padding: EdgeInsets.all(11),
                          child: CircularProgressIndicator(
                            color: Colors.grey,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(
                          Icons.arrow_upward_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _confirmClear(BuildContext ctx) {
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text(
          'Clear Chat',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: const Text('Are you sure you want to clear the chat?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ctx.read<AiCoachCubit>().clearChat();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Clear', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
