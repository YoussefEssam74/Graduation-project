using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.Payment;
using AutoMapper;

namespace Service.Services
{
    public class TokenTransactionService : ITokenTransactionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public TokenTransactionService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<TokenTransactionDto> CreateTransactionAsync(int userId, CreateTokenTransactionDto dto)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            if (user == null) throw new Exception("User not found");

            var balanceBefore = user.TokenBalance;
            var balanceAfter = balanceBefore + dto.Amount;

            var transaction = _mapper.Map<TokenTransaction>(dto);
            transaction.UserId = userId;
            transaction.BalanceBefore = balanceBefore;
            transaction.BalanceAfter = balanceAfter;

            // Update user balance
            user.TokenBalance = balanceAfter;
            _unitOfWork.Repository<User>().Update(user);

            await _unitOfWork.Repository<TokenTransaction>().AddAsync(transaction);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<TokenTransactionDto>(transaction);
        }

        public async Task<IEnumerable<TokenTransactionDto>> GetUserTransactionsAsync(int userId)
        {
            var transactions = await _unitOfWork.Repository<TokenTransaction>().GetAllAsync();
            var userTransactions = transactions.Where(t => t.UserId == userId)
                                              .OrderByDescending(t => t.CreatedAt);
            return userTransactions.Select(t => _mapper.Map<TokenTransactionDto>(t));
        }

        public async Task<int> GetUserTokenBalanceAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            return user?.TokenBalance ?? 0;
        }

        public async Task<TokenTransactionDto?> GetTransactionByIdAsync(int transactionId)
        {
            var transaction = await _unitOfWork.Repository<TokenTransaction>().GetByIdAsync(transactionId);
            return transaction != null ? _mapper.Map<TokenTransactionDto>(transaction) : null;
        }
    }
}
