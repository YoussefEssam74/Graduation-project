#!/usr/bin/env dotnet-script
#r "nuget: Npgsql, 8.0.3"

using Npgsql;

var connectionString = "Host=localhost;Port=5432;Database=intellifit_db;Username=postgres;Password=123";

var conn = new NpgsqlConnection(connectionString);
conn.Open();

var tables = new[] { "users", "members", "coaches", "admins", "receptionists", "subscription_plans", "token_packages", "chat_messages" };

Console.WriteLine("Database Table Counts:");
Console.WriteLine("========================");

foreach (var table in tables)
{
    var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM {table}", conn);
    var count = cmd.ExecuteScalar();
    Console.WriteLine($"{table,-25}: {count}");
}

conn.Close();
