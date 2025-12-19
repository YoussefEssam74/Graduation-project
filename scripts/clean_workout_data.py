"""Data cleaning utilities for workout dataset (stub).
Run as: python scripts/clean_workout_data.py --in data.csv --out cleaned.csv
"""
import argparse
import pandas as pd


def load_and_clean(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    # minimal cleaning stub: strip strings and drop empty rows
    for c in df.select_dtypes(include=['object']).columns:
        df[c] = df[c].astype(str).str.strip()
    df = df.dropna(how='all')
    return df


def validate_schema(df: pd.DataFrame) -> None:
    required = ['example_id']
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--in', dest='inpath', required=True)
    p.add_argument('--out', dest='outpath', required=True)
    args = p.parse_args()
    df = load_and_clean(args.inpath)
    validate_schema(df)
    df.to_csv(args.outpath, index=False)


if __name__ == '__main__':
    main()
