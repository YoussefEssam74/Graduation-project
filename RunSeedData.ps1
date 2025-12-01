# PowerShell script to run seed data SQL files
$connectionString = "Host=localhost;Port=5432;Database=intellifit_db;Username=postgres;Password=123"

Write-Host "Installing Npgsql if needed..." -ForegroundColor Yellow
dotnet add package Npgsql --version 8.0.0

Write-Host "`nReading SQL file 1..." -ForegroundColor Cyan
$sql1 = Get-Content "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\Documentation\SeedData_Corrected_TPT.sql" -Raw

Write-Host "Executing SQL file 1..." -ForegroundColor Cyan

Add-Type -TypeDefinition @"
using System;
using System.Data;
using Npgsql;

public class SqlExecutor
{
    public static void ExecuteSql(string connectionString, string sql)
    {
        using (var conn = new NpgsqlConnection(connectionString))
        {
            conn.Open();
            using (var cmd = new NpgsqlCommand(sql, conn))
            {
                cmd.ExecuteNonQuery();
            }
        }
    }
}
"@ -ReferencedAssemblies @("System.Data", "Npgsql")

try {
    [SqlExecutor]::ExecuteSql($connectionString, $sql1)
    Write-Host "✓ Seed data part 1 applied successfully!" -ForegroundColor Green
    
    Write-Host "`nReading SQL file 2..." -ForegroundColor Cyan
    $sql2 = Get-Content "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\Documentation\SeedData_Part2_TPT.sql" -Raw
    
    Write-Host "Executing SQL file 2..." -ForegroundColor Cyan
    [SqlExecutor]::ExecuteSql($connectionString, $sql2)
    Write-Host "✓ Seed data part 2 applied successfully!" -ForegroundColor Green
}
catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}
