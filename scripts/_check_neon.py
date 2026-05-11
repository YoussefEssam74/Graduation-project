import psycopg2

conn = psycopg2.connect(
    host="ep-purple-sun-ali1v059.c-3.eu-central-1.aws.neon.tech",
    dbname="neondb",
    user="neondb_owner",
    password="npg_JpaFCdHcU20O",
    sslmode="require"
)
cur = conn.cursor()

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
""")
tables = [row[0] for row in cur.fetchall()]
print(f"Tables found: {len(tables)}")
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    count = cur.fetchone()[0]
    print(f"  {t}: {count} rows")

cur.close()
conn.close()
print("\nConnection OK")
