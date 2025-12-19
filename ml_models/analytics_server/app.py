from flask import Flask, jsonify
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import numpy as np
import os
import logging
import yaml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load config
config_path = os.path.join(os.path.dirname(__file__), '..', 'config.yaml')
if os.path.exists(config_path):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
else:
    config = {}

def load_maintenance_data():
    """Load equipment maintenance data from DB/CSV or fallback to sample.
    Priority: 1) DB (env ANALYTICS_DB_CONN), 2) CSV (config), 3) Sample (dev only).
    """
    db_conn = os.environ.get('ANALYTICS_DB_CONN')
    
    if db_conn:
        try:
            from sqlalchemy import create_engine
            engine = create_engine(db_conn)
            df = pd.read_sql(
                'SELECT equipment_id, usage_hours, last_maintenance_days FROM equipment_usage',
                engine
            )
            logger.info(f"Loaded {len(df)} maintenance records from DB")
            return df
        except Exception as e:
            logger.error(f"DB read failed: {e}. Falling back to CSV/sample.")
    
    # Try CSV from config
    csv_path = config.get('analytics', {}).get('maintenance_data_path')
    if csv_path and os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        logger.info(f"Loaded {len(df)} maintenance records from CSV: {csv_path}")
        return df
    
    # Fallback to sample (dev only)
    logger.warning('Using sample maintenance data (3 rows). Configure ANALYTICS_DB_CONN or analytics.maintenance_data_path in config.yaml for production.')
    # TODO: Remove sample data fallback in production
    return pd.DataFrame({
        'equipment_id': [1, 2, 3], 
        'usage_hours': [100, 200, 50],
        'last_maintenance_days': [30, 60, 10]
    })

def load_revenue_data():
    """Load revenue data from DB/CSV or fallback to sample."""
    db_conn = os.environ.get('ANALYTICS_DB_CONN')
    
    if db_conn:
        try:
            from sqlalchemy import create_engine
            engine = create_engine(db_conn)
            df = pd.read_sql(
                'SELECT month, revenue FROM monthly_revenue ORDER BY month',
                engine
            )
            logger.info(f"Loaded {len(df)} revenue records from DB")
            return df
        except Exception as e:
            logger.error(f"DB read failed: {e}. Falling back to CSV/sample.")
    
    # Try CSV from config
    csv_path = config.get('analytics', {}).get('revenue_data_path')
    if csv_path and os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        logger.info(f"Loaded {len(df)} revenue records from CSV: {csv_path}")
        return df
    
    # Fallback to deterministic sample (not random)
    logger.warning('Using sample revenue data (12 months). Configure ANALYTICS_DB_CONN or analytics.revenue_data_path in config.yaml for production.')
    # TODO: Remove sample data fallback in production
    return pd.DataFrame({
        'month': range(1, 13),
        'revenue': [8000, 7500, 9000, 10000, 11000, 12000, 11500, 10500, 9500, 8500, 7000, 6500]
    })

@app.route('/predict/maintenance', methods=['GET'])
def predict_maintenance():
    # Simple logic: Predict failure probability based on usage
    df = load_maintenance_data()
    # Mock model
    df['failure_prob'] = (df['usage_hours'] * 0.001) + (df['last_maintenance_days'] * 0.005)
    flagged = df[df['failure_prob'] > 0.5].to_dict(orient='records')
    return jsonify({'maintenance_needed': flagged})

@app.route('/analyze/revenue', methods=['GET'])
def analyze_revenue():
    df = load_revenue_data()
    lowest_month = int(df.loc[df['revenue'].idxmin()]['month'])
    highest_month = int(df.loc[df['revenue'].idxmax()]['month'])
    return jsonify({
        'lowest_revenue_month': lowest_month,
        'highest_revenue_month': highest_month,
        'recommendation': f"Offer promotions in month {lowest_month} to boost sales."
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005)
