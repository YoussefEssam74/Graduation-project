using DomainLayer.Contracts;
using IntelliFit.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Storage;

namespace IntelliFit.Infrastructure.Persistence.Repository
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly IntelliFitDbContext _context;
        private readonly Dictionary<Type, object> _repositories;
        private IDbContextTransaction? _transaction;

        public UnitOfWork(IntelliFitDbContext context)
        {
            _context = context;
            _repositories = new Dictionary<Type, object>();
        }

        public IGenericRepository<T> Repository<T>() where T : class
        {
            var type = typeof(T);

            if (!_repositories.ContainsKey(type))
            {
                var repositoryType = typeof(GenericRepository<>).MakeGenericType(type);
                var repositoryInstance = Activator.CreateInstance(repositoryType, _context);
                _repositories.Add(type, repositoryInstance!);
            }

            return (IGenericRepository<T>)_repositories[type];
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}