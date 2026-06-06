using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.Subscription;
using Shared.Enums;
using Stripe;
using Stripe.Checkout;

namespace Service.Services
{
    public class StripeService : IStripeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ISubscriptionService _subscriptionService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<StripeService> _logger;

        public StripeService(
            IUnitOfWork unitOfWork,
            ISubscriptionService subscriptionService,
            IConfiguration configuration,
            ILogger<StripeService> _stripeLogger)
        {
            _unitOfWork = unitOfWork;
            _subscriptionService = subscriptionService;
            _configuration = configuration;
            _logger = _stripeLogger;

            // Initialize Stripe Key (checks multiple configuration formats for compatibility)
            var apiKey = configuration["Stripe:SecretKey"] 
                         ?? configuration["Stripe__SecretKey"] 
                         ?? Environment.GetEnvironmentVariable("Stripe__SecretKey");

            if (!string.IsNullOrEmpty(apiKey))
            {
                StripeConfiguration.ApiKey = apiKey;
            }
            else
            {
                _logger.LogWarning("Stripe Secret Key is not configured. Stripe payments will fail.");
            }
        }

        public async Task<(string sessionId, string url)> CreateCheckoutSessionAsync(int userId, int planId, string flowType, string originUrl, string? couponCode = null)
        {
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(planId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Subscription plan with ID {planId} not found");
            }

            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            decimal finalPrice = plan.Price;
            if (!string.IsNullOrEmpty(couponCode))
            {
                var coupons = await _unitOfWork.Repository<IntelliFit.Domain.Models.Coupon>().FindAsync(c => c.Code == couponCode.ToUpperInvariant());
                var coupon = coupons.FirstOrDefault();
                if (coupon == null || !coupon.IsActive || coupon.ExpiryDate < DateTime.UtcNow || (coupon.MaxUsage.HasValue && coupon.CurrentUsage >= coupon.MaxUsage.Value))
                {
                    throw new InvalidOperationException("The coupon code is invalid, expired, or has reached its usage limit.");
                }

                decimal discount = 0;
                if (coupon.DiscountType == DiscountType.Percentage)
                {
                    discount = plan.Price * (coupon.DiscountValue / 100m);
                }
                else if (coupon.DiscountType == DiscountType.FixedAmount)
                {
                    discount = coupon.DiscountValue;
                }

                finalPrice = Math.Max(0, plan.Price - discount);
            }

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                CustomerEmail = user.Email,
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(finalPrice * 100), // Amount in cents/piastres
                            Currency = "egp",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = plan.PlanName,
                                Description = plan.Description ?? $"Subscription plan for {plan.DurationDays} days" + (string.IsNullOrEmpty(couponCode) ? "" : $" (Coupon {couponCode.ToUpperInvariant()} applied)"),
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode = "payment",
                SuccessUrl = $"{originUrl.TrimEnd('/')}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = flowType == "change-plan" 
                    ? $"{originUrl.TrimEnd('/')}/change-plan"
                    : $"{originUrl.TrimEnd('/')}/choose-plan",
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId.ToString() },
                    { "planId", planId.ToString() },
                    { "flowType", flowType },
                    { "couponCode", couponCode ?? "" }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);
            return (session.Id, session.Url);
        }

        public async Task<bool> VerifyCheckoutSessionAsync(string sessionId)
        {
            var service = new SessionService();
            Session session;

            try
            {
                session = await service.GetAsync(sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Stripe session {SessionId}", sessionId);
                return false;
            }
            
            if (session == null)
            {
                _logger.LogWarning("Stripe session {SessionId} not found.", sessionId);
                return false;
            }

            if (session.Status != "complete" && session.Status != "active")
            {
                _logger.LogWarning("Stripe session {SessionId} status is '{Status}', expected 'complete'.", sessionId, session.Status);
                return false;
            }

            if (session.PaymentStatus != "paid")
            {
                _logger.LogWarning("Stripe session {SessionId} payment status is '{PaymentStatus}', expected 'paid'.", sessionId, session.PaymentStatus);
                return false;
            }

            // Extract metadata
            if (session.Metadata == null ||
                !session.Metadata.TryGetValue("userId", out var userIdStr) || !int.TryParse(userIdStr, out var userId) ||
                !session.Metadata.TryGetValue("planId", out var planIdStr) || !int.TryParse(planIdStr, out var planId) ||
                !session.Metadata.TryGetValue("flowType", out var flowType))
            {
                _logger.LogError("Stripe session {SessionId} metadata is missing or invalid.", sessionId);
                return false;
            }

            string? couponCode = null;
            if (session.Metadata.TryGetValue("couponCode", out var code) && !string.IsNullOrEmpty(code))
            {
                couponCode = code;
            }

            // Idempotency: Check if we have already processed this payment
            var existingPayments = await _unitOfWork.Repository<Payment>().FindAsync(p => p.TransactionReference == sessionId);
            if (existingPayments.Any())
            {
                _logger.LogInformation("Stripe session {SessionId} has already been processed.", sessionId);
                return true; 
            }

            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(planId);
            if (plan == null)
            {
                _logger.LogError("Plan {PlanId} from Stripe session metadata not found.", planId);
                return false;
            }

            // Start a database transaction for atomic safety
            using var transaction = await _unitOfWork.BeginTransactionAsync();
            try
            {
                // 1. Create a Payment record in the database
                var payment = new Payment
                {
                    UserId = userId,
                    Amount = session.AmountTotal.HasValue ? (decimal)session.AmountTotal.Value / 100m : plan.Price,
                    PaymentMethod = "Stripe",
                    PaymentType = "Subscription",
                    Status = PaymentStatus.Completed,
                    TransactionReference = sessionId,
                    PackageId = null,
                    InvoiceNumber = $"INV-STRIPE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}",
                    GatewayResponse = $"Stripe Session ID: {sessionId}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Repository<Payment>().AddAsync(payment);
                await _unitOfWork.SaveChangesAsync();

                // Increment coupon usage if present
                if (!string.IsNullOrEmpty(couponCode))
                {
                    var coupons = await _unitOfWork.Repository<IntelliFit.Domain.Models.Coupon>().FindAsync(c => c.Code == couponCode.ToUpperInvariant());
                    var coupon = coupons.FirstOrDefault();
                    if (coupon != null)
                    {
                        coupon.CurrentUsage++;
                        coupon.UpdatedAt = DateTime.UtcNow;
                        _unitOfWork.Repository<IntelliFit.Domain.Models.Coupon>().Update(coupon);
                        await _unitOfWork.SaveChangesAsync();
                    }
                }

                // 2. Activate or Change subscription using ISubscriptionService
                if (flowType == "change-plan")
                {
                    await _subscriptionService.ChangePlanAsync(new ChangePlanDto
                    {
                        UserId = userId,
                        NewPlanId = planId,
                        PaymentId = payment.PaymentId
                    });
                }
                else
                {
                    await _subscriptionService.CreateUserSubscriptionAsync(new CreateSubscriptionDto
                    {
                        UserId = userId,
                        PlanId = planId,
                        PaymentId = payment.PaymentId
                    });
                }

                await _unitOfWork.CommitTransactionAsync();
                _logger.LogInformation("Successfully processed Stripe session {SessionId} for User {UserId} with Plan {PlanId}", sessionId, userId, planId);
                return true;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Error occurred while processing Stripe session {SessionId} in database.", sessionId);
                return false;
            }
        }

        public async Task<bool> HandleWebhookAsync(string json, string stripeSignature)
        {
            try
            {
                var webhookSecret = _configuration["Stripe:WebhookSecret"] 
                                     ?? _configuration["Stripe__WebhookSecret"] 
                                     ?? Environment.GetEnvironmentVariable("Stripe__WebhookSecret") 
                                     ?? "whsec_test";

                var stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret, throwOnApiVersionMismatch: false);

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;
                    if (session != null)
                    {
                        return await VerifyCheckoutSessionAsync(session.Id);
                    }
                }
                
                return true; // Acknowledge other event types to Stripe
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Stripe webhook signature validation failed or error processing event.");
                return false;
            }
        }
    }
}
