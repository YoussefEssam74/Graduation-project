"""
Member Churn Predictor for PulseGym Analytics
==============================================

Predicts which members are likely to cancel their membership
using classification models.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime, timedelta

try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

logger = logging.getLogger(__name__)


class ChurnPredictor:
    """
    Predicts member churn probability.

    Uses Random Forest or Gradient Boosting for classification.
    """

    def __init__(self, config: Dict):
        """
        Initialize the churn predictor.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.model: Optional[RandomForestClassifier] = None
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.feature_names = []

        # Config
        analytics_config = config.get('analytics', {}).get('churn', {})
        self.churn_threshold = analytics_config.get('risk_threshold', 0.6)

    def train(self, member_data: pd.DataFrame, churn_labels: pd.Series) -> Dict:
        """
        Train the churn prediction model.

        Args:
            member_data: DataFrame with member features
            churn_labels: Series with churn labels (1=churned, 0=retained)

        Returns:
            Training metrics
        """
        if not SKLEARN_AVAILABLE:
            return {'error': 'scikit-learn not available'}

        if member_data.empty or len(member_data) < 50:
            return {'error': 'Insufficient data for training (need at least 50 samples)'}

        try:
            # Prepare features
            X = self._prepare_features(member_data)
            y = churn_labels.values

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)

            # Train model
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            self.model.fit(X_train_scaled, y_train)

            # Evaluate
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)

            # Feature importance
            importance = dict(
                zip(self.feature_names, self.model.feature_importances_))

            return {
                'success': True,
                'train_accuracy': float(train_score),
                'test_accuracy': float(test_score),
                'feature_importance': importance,
                'samples_trained': len(X_train)
            }

        except Exception as e:
            logger.error(f"Error training churn model: {e}")
            return {'error': str(e)}

    def _prepare_features(self, data: pd.DataFrame) -> np.ndarray:
        """
        Prepare features for the model.

        Expected columns:
        - days_since_last_visit: int
        - visits_last_month: int
        - membership_duration_days: int
        - total_visits: int
        - avg_visit_duration: float
        - classes_attended: int
        - personal_training_sessions: int
        """
        feature_cols = [
            'days_since_last_visit',
            'visits_last_month',
            'membership_duration_days',
            'total_visits',
            'avg_visit_duration',
            'classes_attended',
            'personal_training_sessions'
        ]

        # Use available columns
        available_cols = [col for col in feature_cols if col in data.columns]

        if not available_cols:
            # Create basic features if standard ones not available
            available_cols = [
                col for col in data.columns if data[col].dtype in ['int64', 'float64']]

        self.feature_names = available_cols

        return data[available_cols].fillna(0).values

    def predict_churn(self, member_data: pd.DataFrame) -> List[Dict]:
        """
        Predict churn probability for members.

        Args:
            member_data: DataFrame with member features

        Returns:
            List of members with churn predictions
        """
        if member_data.empty:
            return []

        if self.model is None:
            # Use rule-based prediction
            return self._rule_based_prediction(member_data)

        try:
            X = self._prepare_features(member_data)
            X_scaled = self.scaler.transform(X)

            probabilities = self.model.predict_proba(X_scaled)[:, 1]

            results = []
            for i, (_, row) in enumerate(member_data.iterrows()):
                prob = probabilities[i]

                if prob >= self.churn_threshold:
                    results.append({
                        'member_id': row.get('member_id', row.get('id', i)),
                        'member_name': row.get('name', f'Member {i}'),
                        'churn_probability': float(prob),
                        'risk_level': self._get_risk_level(prob),
                        'risk_factors': self._identify_risk_factors(row),
                        'recommended_actions': self._get_retention_actions(prob, row)
                    })

            return sorted(results, key=lambda x: x['churn_probability'], reverse=True)

        except Exception as e:
            logger.error(f"Error predicting churn: {e}")
            return self._rule_based_prediction(member_data)

    def _rule_based_prediction(self, member_data: pd.DataFrame) -> List[Dict]:
        """Rule-based churn prediction when model isn't trained."""
        results = []

        for _, row in member_data.iterrows():
            # Calculate risk score based on rules
            score = 0.0
            risk_factors = []

            # No visits recently
            days_since_visit = row.get('days_since_last_visit', 30)
            if days_since_visit > 30:
                score += 0.3
                risk_factors.append('No recent visits')
            elif days_since_visit > 14:
                score += 0.15
                risk_factors.append('Reduced visit frequency')

            # Low visit count
            visits_last_month = row.get('visits_last_month', 0)
            if visits_last_month == 0:
                score += 0.3
                risk_factors.append('No visits last month')
            elif visits_last_month < 4:
                score += 0.15
                risk_factors.append('Low visit frequency')

            # New member (higher churn risk)
            membership_days = row.get('membership_duration_days', 365)
            if membership_days < 90:
                score += 0.2
                risk_factors.append('New member (< 3 months)')

            # Not using classes/PT
            classes = row.get('classes_attended', 0)
            pt_sessions = row.get('personal_training_sessions', 0)
            if classes == 0 and pt_sessions == 0:
                score += 0.1
                risk_factors.append('Not using classes or personal training')

            score = min(score, 1.0)  # Cap at 1.0

            if score >= self.churn_threshold:
                results.append({
                    'member_id': row.get('member_id', row.get('id', 0)),
                    'member_name': row.get('name', 'Unknown'),
                    'churn_probability': float(score),
                    'risk_level': self._get_risk_level(score),
                    'risk_factors': risk_factors,
                    'recommended_actions': self._get_retention_actions(score, row)
                })

        return sorted(results, key=lambda x: x['churn_probability'], reverse=True)

    def _get_risk_level(self, probability: float) -> str:
        """Get risk level string from probability."""
        if probability >= 0.8:
            return 'CRITICAL'
        elif probability >= 0.6:
            return 'HIGH'
        elif probability >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'

    def _identify_risk_factors(self, row: pd.Series) -> List[str]:
        """Identify risk factors for a member."""
        factors = []

        if row.get('days_since_last_visit', 0) > 14:
            factors.append('Declining attendance')

        if row.get('visits_last_month', 5) < 4:
            factors.append('Low visit frequency')

        if row.get('membership_duration_days', 365) < 90:
            factors.append('New member')

        if row.get('classes_attended', 1) == 0:
            factors.append('Not attending classes')

        return factors if factors else ['General engagement decline']

    def _get_retention_actions(self, probability: float, row: pd.Series) -> List[str]:
        """Get recommended retention actions."""
        actions = []

        if probability >= 0.8:
            actions.append('Personal outreach from manager')
            actions.append('Offer complimentary personal training session')
            actions.append('Discuss membership concerns')

        if probability >= 0.6:
            actions.append('Send re-engagement email')
            actions.append('Offer free guest pass for a friend')

        if row.get('classes_attended', 1) == 0:
            actions.append('Recommend and book a group class')

        if row.get('personal_training_sessions', 1) == 0:
            actions.append('Offer discounted PT session')

        if row.get('days_since_last_visit', 0) > 14:
            actions.append('Send "We miss you" message')

        return actions if actions else ['Monitor engagement', 'Include in retention campaign']

    def get_churn_summary(self, member_data: pd.DataFrame) -> Dict:
        """
        Get summary of churn predictions for all members.

        Args:
            member_data: DataFrame with all member data

        Returns:
            Summary statistics
        """
        predictions = self.predict_churn(member_data)

        total_members = len(member_data)
        at_risk = len(predictions)

        risk_distribution = {
            'CRITICAL': len([p for p in predictions if p['risk_level'] == 'CRITICAL']),
            'HIGH': len([p for p in predictions if p['risk_level'] == 'HIGH']),
            'MEDIUM': len([p for p in predictions if p['risk_level'] == 'MEDIUM']),
            'LOW': len([p for p in predictions if p['risk_level'] == 'LOW'])
        }

        return {
            'total_members': total_members,
            'at_risk_members': at_risk,
            'at_risk_percentage': float(at_risk / total_members * 100) if total_members > 0 else 0,
            'risk_distribution': risk_distribution,
            'top_at_risk': predictions[:10],  # Top 10 at risk
            'common_risk_factors': self._get_common_risk_factors(predictions)
        }

    def _get_common_risk_factors(self, predictions: List[Dict]) -> Dict[str, int]:
        """Count common risk factors across predictions."""
        factor_counts = {}
        for pred in predictions:
            for factor in pred.get('risk_factors', []):
                factor_counts[factor] = factor_counts.get(factor, 0) + 1
        return dict(sorted(factor_counts.items(), key=lambda x: x[1], reverse=True))
