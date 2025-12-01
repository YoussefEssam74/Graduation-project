using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.Payment;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/token-transactions")]
    public class TokenTransactionController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Transaction

        [HttpPost]
        public async Task<ActionResult<TokenTransactionDto>> CreateTransaction([FromBody] CreateTokenTransactionDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var transaction = await _serviceManager.TokenTransactionService.CreateTransactionAsync(userId, dto);
            return Ok(transaction);
        }

        #endregion

        #region Get Transaction

        [HttpGet("{id}")]
        public async Task<ActionResult<TokenTransactionDto>> GetTransaction(int id)
        {
            var transaction = await _serviceManager.TokenTransactionService.GetTransactionByIdAsync(id);
            if (transaction == null) return NotFound();
            return Ok(transaction);
        }

        #endregion

        #region Get User Transactions

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<TokenTransactionDto>>> GetUserTransactions(int userId)
        {
            var transactions = await _serviceManager.TokenTransactionService.GetUserTransactionsAsync(userId);
            return Ok(transactions);
        }

        #endregion

        #region Get User Token Balance

        [HttpGet("user/{userId}/balance")]
        public async Task<ActionResult<int>> GetUserTokenBalance(int userId)
        {
            var balance = await _serviceManager.TokenTransactionService.GetUserTokenBalanceAsync(userId);
            return Ok(balance);
        }

        #endregion
    }
}
