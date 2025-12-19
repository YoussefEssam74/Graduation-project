"""ETL stub: aggregate usage logs into daily equipment usage."""
import pandas as pd


def run_etl(raw_csv: str) -> pd.DataFrame:
    df = pd.read_csv(raw_csv)
    # expected columns: timestamp, equipment_id, user_id, duration_minutes
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['date'] = df['timestamp'].dt.date
    agg = df.groupby(['date','equipment_id']).agg({'duration_minutes':'sum','user_id':'nunique'}).reset_index()
    agg = agg.rename(columns={'user_id':'unique_users'})
    return agg
