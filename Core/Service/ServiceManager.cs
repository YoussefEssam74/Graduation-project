using ServiceAbstraction;
using ServiceAbstraction.Services;
using IntelliFit.ServiceAbstraction;
using IntelliFit.ServiceAbstraction.Services;
using DomainLayer.Contracts;
using Service.Services;
using IntelliFit.Service.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using IntelliFit.Presentation.Hubs;
using AutoMapper;

namespace Service
{
    public class ServiceManager(
        IUnitOfWork _unitOfWork,
        ITokenService _tokenService,
        IConfiguration _configuration,
        ILogger<AIService> _aiLogger,
        IHubContext<NotificationHub> _hubContext,
        IMapper _mapper
    ) : IServiceManager
    {
        private readonly Lazy<IAuthService> _LazyAuthService = new Lazy<IAuthService>(() => new AuthService(_unitOfWork, _tokenService));
        private readonly Lazy<IUserService> _LazyUserService = new Lazy<IUserService>(() => new UserService(_unitOfWork));
        private readonly Lazy<IBookingService> _LazyBookingService = new Lazy<IBookingService>(() => new BookingService(_unitOfWork, _mapper));
        private readonly Lazy<ISubscriptionService> _LazySubscriptionService = new Lazy<ISubscriptionService>(() => new SubscriptionService(_unitOfWork));
        private readonly Lazy<IPaymentService> _LazyPaymentService = new Lazy<IPaymentService>(() => new PaymentService(_unitOfWork, _mapper));
        private readonly Lazy<IExerciseService> _LazyExerciseService = new Lazy<IExerciseService>(() => new ExerciseService(_unitOfWork));
        private readonly Lazy<IEquipmentService> _LazyEquipmentService = new Lazy<IEquipmentService>(() => new EquipmentService(_unitOfWork));
        private readonly Lazy<IWorkoutPlanService> _LazyWorkoutPlanService = new Lazy<IWorkoutPlanService>(() => new WorkoutPlanService(_unitOfWork));
        private readonly Lazy<INutritionPlanService> _LazyNutritionPlanService = new Lazy<INutritionPlanService>(() => new NutritionPlanService(_unitOfWork));
        private readonly Lazy<IInBodyService> _LazyInBodyService = new Lazy<IInBodyService>(() => new InBodyService(_unitOfWork));
        private readonly Lazy<IStatsService> _LazyStatsService = new Lazy<IStatsService>(() => new StatsService(_unitOfWork));
        private readonly Lazy<IMealService> _LazyMealService = new Lazy<IMealService>(() => new MealService(_unitOfWork));
        private readonly Lazy<IAIChatService> _LazyAIChatService = new Lazy<IAIChatService>(() => new AIChatService(_unitOfWork));
        private readonly Lazy<INotificationService> _LazyNotificationService = new Lazy<INotificationService>(() => new NotificationService(_hubContext, _unitOfWork, _mapper));
        private readonly Lazy<IAIService> _LazyAIService = new Lazy<IAIService>(() => new AIService(_configuration, _aiLogger));
        private readonly Lazy<IWorkoutLogService> _LazyWorkoutLogService = new Lazy<IWorkoutLogService>(() => new WorkoutLogService(_unitOfWork, _mapper));
        private readonly Lazy<ICoachReviewService> _LazyCoachReviewService = new Lazy<ICoachReviewService>(() => new CoachReviewService(_unitOfWork, _mapper));
        private readonly Lazy<ITokenTransactionService> _LazyTokenTransactionService = new Lazy<ITokenTransactionService>(() => new TokenTransactionService(_unitOfWork, _mapper));
        private readonly Lazy<IActivityFeedService> _LazyActivityFeedService = new Lazy<IActivityFeedService>(() => new ActivityFeedService(_unitOfWork, _mapper));
        private readonly Lazy<IUserMilestoneService> _LazyUserMilestoneService = new Lazy<IUserMilestoneService>(() => new UserMilestoneService(_unitOfWork, _mapper));
        private readonly Lazy<IWorkoutTemplateService> _LazyWorkoutTemplateService = new Lazy<IWorkoutTemplateService>(() => new WorkoutTemplateService(_unitOfWork, _mapper));
        private readonly Lazy<IAuditLogService> _LazyAuditLogService = new Lazy<IAuditLogService>(() => new AuditLogService(_unitOfWork, _mapper));

        public IAuthService AuthService => _LazyAuthService.Value;
        public IUserService UserService => _LazyUserService.Value;
        public IBookingService BookingService => _LazyBookingService.Value;
        public ISubscriptionService SubscriptionService => _LazySubscriptionService.Value;
        public IPaymentService PaymentService => _LazyPaymentService.Value;
        public IExerciseService ExerciseService => _LazyExerciseService.Value;
        public IEquipmentService EquipmentService => _LazyEquipmentService.Value;
        public IWorkoutPlanService WorkoutPlanService => _LazyWorkoutPlanService.Value;
        public INutritionPlanService NutritionPlanService => _LazyNutritionPlanService.Value;
        public IInBodyService InBodyService => _LazyInBodyService.Value;
        public IStatsService StatsService => _LazyStatsService.Value;
        public IMealService MealService => _LazyMealService.Value;
        public IAIChatService AIChatService => _LazyAIChatService.Value;
        public INotificationService NotificationService => _LazyNotificationService.Value;
        public IAIService AIService => _LazyAIService.Value;
        public IWorkoutLogService WorkoutLogService => _LazyWorkoutLogService.Value;
        public ICoachReviewService CoachReviewService => _LazyCoachReviewService.Value;
        public ITokenTransactionService TokenTransactionService => _LazyTokenTransactionService.Value;
        public IActivityFeedService ActivityFeedService => _LazyActivityFeedService.Value;
        public IUserMilestoneService UserMilestoneService => _LazyUserMilestoneService.Value;
        public IWorkoutTemplateService WorkoutTemplateService => _LazyWorkoutTemplateService.Value;
        public IAuditLogService AuditLogService => _LazyAuditLogService.Value;
    }
}
