import os
import psycopg2
from seed_nutrition_data import get_db_connection

def check_activity():
    conn = get_db_connection()
    cur = conn.cursor()
    
    print("\n--- Active Queries ---")
    cur.execute("""
        SELECT pid, usename, query, state, wait_event_type, wait_event 
        FROM pg_stat_activity 
        WHERE state != 'idle' AND pid != pg_backend_pid()
    """)
    rows = cur.fetchall()
    for row in rows:
        print(f"PID: {row[0]} | User: {row[1]} | State: {row[3]}")
        print(f"  Query: {row[2][:200]}")
        print(f"  Wait Event: {row[4]} - {row[5]}")
        print("-" * 40)
        
    print("\n--- Locks ---")
    cur.execute("""
        SELECT t.relname, l.mode, l.granted, l.pid, a.query
        FROM pg_locks l
        JOIN pg_class t ON l.relation = t.oid
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE t.relname IN ('ingredients', 'disease_rules', 'disease_avoided_ingredients', 'disease_recommended_ingredients')
    """)
    rows = cur.fetchall()
    for row in rows:
        print(f"Table: {row[0]} | Mode: {row[1]} | Granted: {row[2]} | PID: {row[3]}")
        print(f"  Query: {row[4][:200]}")
        print("-" * 40)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_activity()
