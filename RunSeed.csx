#!/usr/bin/env dotnet-script
#r "nuget: Npgsql, 8.0.3"

using Npgsql;

var connectionString = "Host=localhost;Port=5432;Database=intellifit_db;Username=postgres;Password=123";
var sqlFilePath = Path.Combine(Directory.GetCurrentDirectory(), "Documentation", "SeedData_Complete.sql");

Console.WriteLine($"Reading SQL from: {sqlFilePath}");
var sql = File.ReadAllText(sqlFilePath);

Console.WriteLine("Connecting to database...");
var conn = new NpgsqlConnection(connectionString);
conn.Open();

Console.WriteLine("Executing seed data...");
var cmd = new NpgsqlCommand(sql, conn);
cmd.CommandTimeout = 300; // 5 minutes timeout
cmd.ExecuteNonQuery();

Console.WriteLine("✓ Seed data executed successfully!");
conn.Close();
