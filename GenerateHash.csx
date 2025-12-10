using BCrypt.Net;

// Generate BCrypt hash for 'password'
var hash = BCrypt.Net.BCrypt.HashPassword("password");
Console.WriteLine($"BCrypt hash for 'password': {hash}");
Console.WriteLine("\nUse this hash in your SQL seed data files.");
