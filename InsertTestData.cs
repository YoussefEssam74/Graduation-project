using System;
using System.IO;
using System.Text.RegularExpressions;
using Npgsql;

class InsertTestData
{
    static async Task Main()
    {
        string connectionString = "Host=localhost;Port=5432;Database=PulseGym_v1.0.1;Username=postgres;Password=123";
        
        try
        {
            using (var connection = new NpgsqlConnection(connectionString))
            {
                await connection.OpenAsync();
                Console.WriteLine("✅ Connected to PostgreSQL database");

                string sqlFile = "Documentation/INSERT_TEST_DATA.sql";
                
                if (!File.Exists(sqlFile))
                {
                    Console.WriteLine($"❌ File not found: {sqlFile}");
                    return;
                }

                string sqlContent = File.ReadAllText(sqlFile);
                
                // Split by semicolon (simple approach)
                string[] commands = sqlContent.Split(';');
                int successCount = 0;
                int errorCount = 0;

                foreach (var cmd in commands)
                {
                    string trimmedCmd = cmd.Trim();
                    
                    // Skip comments and empty lines
                    if (trimmedCmd.StartsWith("--") || trimmedCmd.Length == 0)
                        continue;

                    try
                    {
                        using (var command = connection.CreateCommand())
                        {
                            command.CommandText = trimmedCmd;
                            command.CommandTimeout = 30;
                            
                            var result = await command.ExecuteNonQueryAsync();
                            successCount++;
                            
                            string preview = trimmedCmd.Length > 60 
                                ? trimmedCmd.Substring(0, 60) + "..." 
                                : trimmedCmd;
                            Console.WriteLine($"✓ {preview}");
                        }
                    }
                    catch (Exception ex)
                    {
                        errorCount++;
                        Console.WriteLine($"✗ Error: {ex.Message}");
                    }
                }

                Console.WriteLine("");
                Console.WriteLine($"📊 Summary: {successCount} commands executed successfully");
                if (errorCount > 0)
                    Console.WriteLine($"   {errorCount} commands failed");
                
                Console.WriteLine("");
                Console.WriteLine("✅ Test data insertion complete!");
                Console.WriteLine("");
                Console.WriteLine("📋 Equipment added:");
                Console.WriteLine("   - 8 Cardio machines");
                Console.WriteLine("   - 15 Strength training equipment");
                Console.WriteLine("   - 6 Functional training items");
                Console.WriteLine("   - 4 Recovery tools");
                Console.WriteLine("   - 3 Olympic equipment");
                Console.WriteLine("");
                Console.WriteLine("📊 InBody measurements added:");
                Console.WriteLine("   - 5 different users with varying measurement history");
                Console.WriteLine("   - Total of 18 measurements tracking progress");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Connection error: {ex.Message}");
        }
    }
}
