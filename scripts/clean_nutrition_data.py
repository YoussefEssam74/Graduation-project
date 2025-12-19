"""Data cleaning utilities for nutrition dataset (stub)."""
import argparse
import pandas as pd


def load_and_clean(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    for c in df.select_dtypes(include=['object']).columns:
        df[c] = df[c].astype(str).str.strip()
    # normalization placeholders
    return df


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--in', dest='inpath', required=True)
    p.add_argument('--out', dest='outpath', required=True)
    args = p.parse_args()
    df = load_and_clean(args.inpath)
    df.to_csv(args.outpath, index=False)


if __name__ == '__main__':
    main()
