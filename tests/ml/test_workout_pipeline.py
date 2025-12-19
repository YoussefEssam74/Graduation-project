import pytest
import pandas as pd
from scripts.clean_workout_data import load_and_clean


def test_load_and_clean(tmp_path):
    df = pd.DataFrame({'example_id':[1], 'exercises':['squat, press']})
    p = tmp_path / "in.csv"
    df.to_csv(p, index=False)
    out = load_and_clean(str(p))
    assert 'example_id' in out.columns

