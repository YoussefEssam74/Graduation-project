using System;
using System.Threading.Tasks;
using DomainLayer.Models;

namespace DomainLayer.Contracts
{
    public interface IUnitOfWork : IDisposable
    {
        // Backwards-compatible untyped repository access
        IGenericRepository<T> Repository<T>() where T : class;

        // Typed repository access (new)
        IGenaricRepository<TEntity, TKey> GetRepository<TEntity, TKey>() where TEntity : BaseEntity<TKey>;

        // Transaction management
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}