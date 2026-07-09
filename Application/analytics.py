"""Real-time stats for the interactive Stroke/CHD analysis dashboards.

Computes percentages straight from the source datasets (data/stroke.csv,
data/chd.csv) so the dashboard numbers stay accurate under the gender filter,
unlike the static Power BI screenshots this replaced.
"""

import os
from functools import lru_cache

import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')


@lru_cache(maxsize=1)
def _stroke_df():
    return pd.read_csv(os.path.join(DATA_DIR, 'stroke.csv'))


@lru_cache(maxsize=1)
def _chd_df():
    return pd.read_csv(os.path.join(DATA_DIR, 'chd.csv'))


def _breakdown(series):
    counts = series.value_counts()
    total = int(counts.sum()) or 1
    return [
        {
            'label': str(label),
            'count': int(count),
            'percent': round(count / total * 100, 1),
        }
        for label, count in counts.items()
    ]


def _rate(numerator, denominator):
    denominator = denominator or 1
    return round(numerator / denominator * 100, 1)


def _age_ranges(df, age_col, outcome_col, bin_size=10, start=0, end=90):
    bins = list(range(start, end + bin_size, bin_size))
    labels = [f'{bins[i]}-{bins[i + 1]}' for i in range(len(bins) - 1)]
    bucket = pd.cut(df[age_col], bins=bins, labels=labels, include_lowest=True)

    grouped = df.groupby(bucket, observed=True)[outcome_col]
    counts = grouped.count()
    positive = grouped.sum()

    out_labels, out_counts, out_positive, out_rate = [], [], [], []
    for label in labels:
        c = int(counts.get(label, 0))
        if c == 0:
            continue
        p = int(positive.get(label, 0))
        out_labels.append(label)
        out_counts.append(c)
        out_positive.append(p)
        out_rate.append(_rate(p, c))

    return {
        'labels': out_labels,
        'counts': out_counts,
        'positive': out_positive,
        'rate': out_rate,
    }


def get_stroke_stats(gender=None):
    df = _stroke_df()
    if gender in ('Male', 'Female'):
        df = df[df.gender == gender]

    total = int(len(df))
    stroke_count = int(df.stroke.sum())
    healthy_count = total - stroke_count

    return {
        'total': total,
        'healthy': healthy_count,
        'positive': stroke_count,
        'positive_rate': _rate(stroke_count, total),
        'avg_age': round(float(df.age.mean() or 0), 1),
        'gender': _breakdown(df.gender),
        'residence': _breakdown(df.residence_type),
        'married': _breakdown(df.ever_married),
        'smoking': _breakdown(df.smoking_status),
        'work_type': _breakdown(df.work_type),
        'hypertension': _breakdown(df.hypertension.map({0: 'No', 1: 'Yes'})),
        'heart_disease': _breakdown(df.heart_disease.map({0: 'No', 1: 'Yes'})),
        'age_ranges': _age_ranges(df, 'age', 'stroke'),
    }


def get_chd_stats(gender=None):
    df = _chd_df()
    if gender in ('Male', 'Female'):
        df = df[df.male == (1 if gender == 'Male' else 0)]

    total = int(len(df))
    chd_count = int(df.TenYearCHD.sum())
    healthy_count = total - chd_count

    return {
        'total': total,
        'healthy': healthy_count,
        'positive': chd_count,
        'positive_rate': _rate(chd_count, total),
        'avg_age': round(float(df.age.mean() or 0), 1),
        'max_heart_rate': int(df.heartRate.max()) if total else 0,
        'min_heart_rate': int(df.heartRate.min()) if total else 0,
        'gender': _breakdown(df.male.map({0: 'Female', 1: 'Male'})),
        'smoker': _breakdown(df.currentSmoker.map({0: 'Non-Smoker', 1: 'Smoker'})),
        'diabetes': _breakdown(df.diabetes.map({0: 'No', 1: 'Yes'})),
        'bp_meds': _breakdown(df.BPMeds.fillna(0).map({0: 'No', 1: 'Yes'})),
        'prevalent_hyp': _breakdown(df.prevalentHyp.map({0: 'No', 1: 'Yes'})),
        'prevalent_stroke': _breakdown(df.prevalentStroke.map({0: 'No', 1: 'Yes'})),
        'age_ranges': _age_ranges(df, 'age', 'TenYearCHD'),
    }
