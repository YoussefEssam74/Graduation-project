"""Forecasting stub for revenue/equipment usage (Prophet or similar recommended).
"""
import pandas as pd


def forecast(df: pd.DataFrame, periods: int = 12):
    # df expected: ds (date), y (value)
    # stub: return last value repeated
    last = df['y'].iloc[-1]
    future = pd.DataFrame({'ds': pd.date_range(start=df['ds'].iloc[-1], periods=periods+1, closed='right'), 'y': [last]*periods})
    return future
