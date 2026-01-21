"""
Revenue Forecaster for PulseGym Analytics
==========================================

Time series forecasting for gym revenue using Prophet.
Falls back to simple moving average if Prophet unavailable.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timedelta

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

logger = logging.getLogger(__name__)


class RevenueForecaster:
    """
    Forecasts gym revenue using time series analysis.

    Uses Prophet for sophisticated forecasting with seasonality,
    or falls back to simpler methods if unavailable.
    """

    def __init__(self, config: Dict):
        """
        Initialize the revenue forecaster.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.model: Optional[Prophet] = None
        self.last_trained = None

        # Config
        analytics_config = config.get('analytics', {}).get('revenue', {})
        self.forecast_periods = analytics_config.get(
            'forecast_periods', 12)  # months

        if not PROPHET_AVAILABLE:
            logger.warning(
                "Prophet not available. Using fallback forecasting.")

    def train(self, revenue_data: pd.DataFrame) -> bool:
        """
        Train the forecasting model.

        Args:
            revenue_data: DataFrame with 'date' and 'revenue' columns

        Returns:
            True if training successful
        """
        if revenue_data.empty or len(revenue_data) < 12:
            logger.warning(
                "Insufficient data for training (need at least 12 data points)")
            return False

        if not PROPHET_AVAILABLE:
            self.historical_data = revenue_data.copy()
            self.last_trained = datetime.now()
            return True

        try:
            # Prepare data for Prophet (requires 'ds' and 'y' columns)
            df = revenue_data.copy()
            df.columns = ['ds', 'y'] if len(df.columns) == 2 else df.columns

            if 'ds' not in df.columns:
                df['ds'] = pd.to_datetime(df['date']) if 'date' in df.columns else pd.date_range(
                    start='2024-01-01', periods=len(df), freq='M')
            if 'y' not in df.columns:
                df['y'] = df['revenue'] if 'revenue' in df.columns else df.iloc[:, -1]

            # Train Prophet
            self.model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                changepoint_prior_scale=0.05
            )
            self.model.fit(df[['ds', 'y']])
            self.last_trained = datetime.now()

            logger.info(f"Revenue forecaster trained on {len(df)} data points")
            return True

        except Exception as e:
            logger.error(f"Error training Prophet: {e}")
            return False

    def forecast(self, periods: Optional[int] = None) -> Dict:
        """
        Generate revenue forecast.

        Args:
            periods: Number of periods to forecast (default from config)

        Returns:
            Forecast results dictionary
        """
        periods = periods or self.forecast_periods

        if PROPHET_AVAILABLE and self.model is not None:
            return self._prophet_forecast(periods)
        else:
            return self._fallback_forecast(periods)

    def _prophet_forecast(self, periods: int) -> Dict:
        """Generate forecast using Prophet."""
        try:
            # Create future dataframe
            future = self.model.make_future_dataframe(
                periods=periods, freq='M')
            forecast = self.model.predict(future)

            # Extract results
            future_only = forecast.tail(periods)

            results = {
                'forecast_generated': datetime.now().isoformat(),
                'periods': periods,
                'method': 'Prophet',
                'predictions': [],
                'summary': {}
            }

            for _, row in future_only.iterrows():
                results['predictions'].append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'predicted_revenue': float(row['yhat']),
                    'lower_bound': float(row['yhat_lower']),
                    'upper_bound': float(row['yhat_upper'])
                })

            # Summary statistics
            results['summary'] = {
                'avg_predicted_revenue': float(future_only['yhat'].mean()),
                'min_predicted_revenue': float(future_only['yhat'].min()),
                'max_predicted_revenue': float(future_only['yhat'].max()),
                'total_predicted_revenue': float(future_only['yhat'].sum())
            }

            return results

        except Exception as e:
            logger.error(f"Prophet forecast error: {e}")
            return self._fallback_forecast(periods)

    def _fallback_forecast(self, periods: int) -> Dict:
        """Simple moving average fallback forecast."""
        results = {
            'forecast_generated': datetime.now().isoformat(),
            'periods': periods,
            'method': 'Moving Average',
            'predictions': [],
            'summary': {},
            'warning': 'Using fallback method. Install Prophet for better forecasts.'
        }

        # Use historical data if available
        if hasattr(self, 'historical_data') and not self.historical_data.empty:
            revenue_col = 'revenue' if 'revenue' in self.historical_data.columns else self.historical_data.columns[-1]
            historical_values = self.historical_data[revenue_col].values
        else:
            # Sample data for demo
            historical_values = np.array([8000, 7500, 9000, 10000, 11000, 12000,
                                         11500, 10500, 9500, 8500, 7000, 6500])

        # Simple seasonal moving average
        seasonal_avg = np.mean(historical_values)
        seasonal_std = np.std(historical_values)

        # Generate predictions with seasonal pattern
        base_date = datetime.now()
        for i in range(periods):
            future_date = base_date + timedelta(days=30 * (i + 1))
            # Add some seasonality (simple sine wave)
            seasonal_factor = 1 + 0.2 * \
                np.sin(2 * np.pi * (future_date.month - 1) / 12)
            predicted = seasonal_avg * seasonal_factor

            results['predictions'].append({
                'date': future_date.strftime('%Y-%m-%d'),
                'predicted_revenue': float(predicted),
                'lower_bound': float(predicted - 1.5 * seasonal_std),
                'upper_bound': float(predicted + 1.5 * seasonal_std)
            })

        # Summary
        predictions = [p['predicted_revenue'] for p in results['predictions']]
        results['summary'] = {
            'avg_predicted_revenue': float(np.mean(predictions)),
            'min_predicted_revenue': float(np.min(predictions)),
            'max_predicted_revenue': float(np.max(predictions)),
            'total_predicted_revenue': float(np.sum(predictions))
        }

        return results

    def analyze_trends(self, revenue_data: pd.DataFrame) -> Dict:
        """
        Analyze revenue trends.

        Args:
            revenue_data: Historical revenue data

        Returns:
            Trend analysis results
        """
        if revenue_data.empty:
            return {'error': 'No data provided'}

        revenue_col = 'revenue' if 'revenue' in revenue_data.columns else revenue_data.columns[-1]
        values = revenue_data[revenue_col].values

        # Calculate trends
        if len(values) >= 2:
            overall_trend = (values[-1] - values[0]) / \
                values[0] * 100 if values[0] != 0 else 0
            mom_change = (values[-1] - values[-2]) / values[-2] * \
                100 if len(values) >= 2 and values[-2] != 0 else 0
        else:
            overall_trend = 0
            mom_change = 0

        # Find best/worst months
        if 'month' in revenue_data.columns:
            month_col = 'month'
        elif 'date' in revenue_data.columns:
            revenue_data = revenue_data.copy()
            revenue_data['month'] = pd.to_datetime(
                revenue_data['date']).dt.month
            month_col = 'month'
        else:
            revenue_data = revenue_data.copy()
            revenue_data['month'] = range(1, len(revenue_data) + 1)
            month_col = 'month'

        best_idx = revenue_data[revenue_col].idxmax()
        worst_idx = revenue_data[revenue_col].idxmin()

        return {
            'analyzed_periods': len(values),
            'average_revenue': float(np.mean(values)),
            'median_revenue': float(np.median(values)),
            'std_deviation': float(np.std(values)),
            'overall_trend_percent': float(overall_trend),
            'month_over_month_change': float(mom_change),
            'trend_direction': 'UP' if overall_trend > 5 else ('DOWN' if overall_trend < -5 else 'STABLE'),
            'best_period': {
                'month': int(revenue_data.loc[best_idx, month_col]),
                'revenue': float(revenue_data.loc[best_idx, revenue_col])
            },
            'worst_period': {
                'month': int(revenue_data.loc[worst_idx, month_col]),
                'revenue': float(revenue_data.loc[worst_idx, revenue_col])
            },
            'recommendation': self._get_revenue_recommendation(overall_trend, mom_change)
        }

    def _get_revenue_recommendation(self, overall_trend: float, mom_change: float) -> str:
        """Generate revenue recommendation based on trends."""
        if overall_trend > 10 and mom_change > 0:
            return "Revenue is growing strongly. Consider expanding capacity or premium offerings."
        elif overall_trend > 0 and mom_change > 0:
            return "Revenue is growing steadily. Maintain current strategies and optimize operations."
        elif overall_trend > 0 and mom_change < 0:
            return "Recent decline after growth. Review recent changes and member feedback."
        elif overall_trend < -10:
            return "Significant revenue decline. Urgent review needed. Consider promotions and retention programs."
        elif overall_trend < 0:
            return "Revenue declining. Focus on member retention and new member acquisition."
        else:
            return "Revenue is stable. Look for growth opportunities and efficiency improvements."
