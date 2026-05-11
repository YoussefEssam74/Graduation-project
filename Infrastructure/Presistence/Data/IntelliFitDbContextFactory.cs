using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace IntelliFit.Infrastructure.Persistence
{
    public class IntelliFitDbContextFactory : IDesignTimeDbContextFactory<IntelliFitDbContext>
    {
        public IntelliFitDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<IntelliFitDbContext>();
            optionsBuilder.UseNpgsql(
                "Host=localhost;Port=5432;Database=PulseGym_v1.0.1;Username=postgres;Password=123;SSL Mode=Disable"
            );
            return new IntelliFitDbContext(optionsBuilder.Options);
        }
    }
}
