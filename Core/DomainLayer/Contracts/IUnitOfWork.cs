namespace DomainLayer.Contracts
{
    public interface IUnitOfWork : IDisposable
    {
        // Repository access method
        IGenericRepository<T> Repository<T>() where T : class;

        // Transaction management
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}