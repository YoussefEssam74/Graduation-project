"""
Equipment Analyzer for PulseGym Analytics
==========================================

Analyzes equipment usage patterns, maintenance schedules,
and predicts equipment failures.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timedelta

try:
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

logger = logging.getLogger(__name__)


class EquipmentAnalyzer:
    """
    Analyzes equipment usage and predicts maintenance needs.

    Uses Random Forest for failure prediction and usage analysis.
    """

    def __init__(self, config: Dict):
        """
        Initialize the equipment analyzer.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.failure_model: Optional[RandomForestClassifier] = None
        self.maintenance_model: Optional[RandomForestRegressor] = None
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None

        # Thresholds from config
        analytics_config = config.get('analytics', {}).get('equipment', {})
        self.failure_threshold = analytics_config.get('failure_threshold', 0.7)
        self.maintenance_warning_days = analytics_config.get(
            'maintenance_warning_days', 7)

    def analyze_usage(self, equipment_data: pd.DataFrame) -> Dict:
        """
        Analyze equipment usage patterns.

        Args:
            equipment_data: DataFrame with columns:
                - equipment_id: int
                - equipment_name: str
                - usage_hours: float
                - last_maintenance_date: datetime
                - category: str

        Returns:
            Analysis results dictionary
        """
        if equipment_data.empty:
            return {'error': 'No equipment data provided'}

        results = {
            'total_equipment': len(equipment_data),
            'total_usage_hours': float(equipment_data['usage_hours'].sum()),
            'avg_usage_hours': float(equipment_data['usage_hours'].mean()),
            'usage_by_category': {},
            'top_used_equipment': [],
            'underutilized_equipment': []
        }

        # Usage by category
        if 'category' in equipment_data.columns:
            category_usage = equipment_data.groupby(
                'category')['usage_hours'].sum()
            results['usage_by_category'] = category_usage.to_dict()

        # Top used equipment
        top_used = equipment_data.nlargest(5, 'usage_hours')
        results['top_used_equipment'] = top_used[['equipment_id',
                                                  'equipment_name', 'usage_hours']].to_dict('records')

        # Underutilized (bottom 20%)
        threshold = equipment_data['usage_hours'].quantile(0.2)
        underutilized = equipment_data[equipment_data['usage_hours'] <= threshold]
        results['underutilized_equipment'] = underutilized[[
            'equipment_id', 'equipment_name', 'usage_hours']].to_dict('records')

        return results

    def predict_failures(self, equipment_data: pd.DataFrame) -> List[Dict]:
        """
        Predict equipment likely to fail.

        Args:
            equipment_data: DataFrame with equipment metrics

        Returns:
            List of equipment with failure predictions
        """
        if equipment_data.empty:
            return []

        # Calculate days since last maintenance
        if 'last_maintenance_date' in equipment_data.columns:
            today = datetime.now()
            equipment_data = equipment_data.copy()
            equipment_data['days_since_maintenance'] = equipment_data['last_maintenance_date'].apply(
                lambda x: (today - pd.to_datetime(x)
                           ).days if pd.notna(x) else 365
            )
        elif 'days_since_maintenance' not in equipment_data.columns:
            equipment_data = equipment_data.copy()
            equipment_data['days_since_maintenance'] = 30  # Default

        # Simple rule-based prediction if model not trained
        if self.failure_model is None:
            return self._rule_based_failure_prediction(equipment_data)

        # ML-based prediction
        features = self._extract_features(equipment_data)
        probabilities = self.failure_model.predict_proba(features)[:, 1]

        results = []
        for i, row in equipment_data.iterrows():
            prob = probabilities[i] if i < len(probabilities) else 0.5
            if prob >= self.failure_threshold:
                results.append({
                    'equipment_id': int(row.get('equipment_id', i)),
                    'equipment_name': row.get('equipment_name', f'Equipment {i}'),
                    'failure_probability': float(prob),
                    'risk_level': 'HIGH' if prob > 0.8 else 'MEDIUM',
                    'recommended_action': 'Schedule immediate maintenance' if prob > 0.8 else 'Schedule maintenance within 7 days'
                })

        return sorted(results, key=lambda x: x['failure_probability'], reverse=True)

    def _rule_based_failure_prediction(self, equipment_data: pd.DataFrame) -> List[Dict]:
        """Rule-based failure prediction when ML model isn't trained."""
        results = []

        for _, row in equipment_data.iterrows():
            usage_hours = row.get('usage_hours', 0)
            days_since_maintenance = row.get('days_since_maintenance', 30)

            # Simple formula: higher usage + longer since maintenance = higher risk
            risk_score = (usage_hours / 1000) * 0.4 + \
                (days_since_maintenance / 90) * 0.6
            risk_score = min(risk_score, 1.0)  # Cap at 1.0

            if risk_score >= 0.5:
                results.append({
                    'equipment_id': int(row.get('equipment_id', 0)),
                    'equipment_name': row.get('equipment_name', 'Unknown'),
                    'failure_probability': float(risk_score),
                    'risk_level': 'HIGH' if risk_score > 0.7 else 'MEDIUM',
                    'usage_hours': float(usage_hours),
                    'days_since_maintenance': int(days_since_maintenance),
                    'recommended_action': 'Schedule maintenance soon'
                })

        return sorted(results, key=lambda x: x['failure_probability'], reverse=True)

    def _extract_features(self, data: pd.DataFrame) -> np.ndarray:
        """Extract features for ML model."""
        feature_cols = ['usage_hours', 'days_since_maintenance']

        features = data[feature_cols].fillna(0).values
        if self.scaler is not None:
            features = self.scaler.transform(features)

        return features

    def get_maintenance_schedule(self, equipment_data: pd.DataFrame) -> List[Dict]:
        """
        Generate maintenance schedule recommendations.

        Args:
            equipment_data: DataFrame with equipment data

        Returns:
            List of maintenance recommendations
        """
        schedule = []
        today = datetime.now()

        for _, row in equipment_data.iterrows():
            equipment_id = row.get('equipment_id', 0)
            equipment_name = row.get(
                'equipment_name', f'Equipment {equipment_id}')

            # Calculate recommended maintenance date
            usage_hours = row.get('usage_hours', 0)
            last_maintenance = row.get('last_maintenance_date')

            if last_maintenance:
                last_maintenance = pd.to_datetime(last_maintenance)
                days_since = (today - last_maintenance).days
            else:
                days_since = 90  # Assume needs maintenance

            # Recommend maintenance based on usage and time
            # Every 500 hours or 90 days, whichever comes first
            hours_factor = usage_hours / 500
            days_factor = days_since / 90

            urgency = max(hours_factor, days_factor)

            if urgency >= 0.8:
                priority = 'HIGH'
                recommended_date = today + timedelta(days=3)
            elif urgency >= 0.5:
                priority = 'MEDIUM'
                recommended_date = today + timedelta(days=7)
            else:
                priority = 'LOW'
                recommended_date = today + timedelta(days=14)

            schedule.append({
                'equipment_id': int(equipment_id),
                'equipment_name': equipment_name,
                'priority': priority,
                'recommended_date': recommended_date.strftime('%Y-%m-%d'),
                'usage_hours': float(usage_hours),
                'days_since_last_maintenance': int(days_since)
            })

        return sorted(schedule, key=lambda x: ['HIGH', 'MEDIUM', 'LOW'].index(x['priority']))

    def get_equipment_report(self, equipment_data: pd.DataFrame) -> Dict:
        """
        Generate comprehensive equipment report.

        Args:
            equipment_data: DataFrame with equipment data

        Returns:
            Complete equipment analytics report
        """
        return {
            'generated_at': datetime.now().isoformat(),
            'usage_analysis': self.analyze_usage(equipment_data),
            'failure_predictions': self.predict_failures(equipment_data),
            'maintenance_schedule': self.get_maintenance_schedule(equipment_data)
        }
