"""
Train and export joblib models used by the Flask app.

Run from Application directory:
    python scripts/build_models.py

Model selection rationale (determined by 5-fold CV across RF/XGB/LGBM/GBM):
  Stroke : RF + engineered features — AUC 0.834 (XGB/LGBM score worse on this small dataset)
  CHD    : RF + engineered features — AUC 0.704 (same finding; Framingham data is the ceiling)
  MI     : XGBoost on clinically calibrated synthetic data — AUC 1.0 (clean synthetic separation)
"""

from __future__ import annotations

import os
import sys
import urllib.request

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)


def download(url: str, dest: str) -> str:
    if not os.path.isfile(dest):
        print(f'Downloading {url} ...')
        urllib.request.urlretrieve(url, dest)
    return dest


def _cv_report(name: str, pipe, X: pd.DataFrame, y: pd.Series, threshold: float) -> None:
    """5-fold stratified CV — prints AUC-ROC and per-class metrics."""
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    y_prob = cross_val_predict(pipe, X, y, cv=cv, method='predict_proba')[:, 1]
    auc = roc_auc_score(y, y_prob)
    y_pred = (y_prob >= threshold).astype(int)
    print(f'\n--- {name} CV (threshold={threshold}) ---')
    print(f'AUC-ROC : {auc:.4f}')
    print(classification_report(y, y_pred, target_names=['No Disease', 'Disease'], digits=3))


# ── Feature engineering ────────────────────────────────────────────────────────
# These functions are mirrored exactly in stroke/helpers.py and chd/helpers.py.

def add_stroke_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['age_sq']      = (df['age'] ** 2) / 1000
    df['glucose_hyp'] = df['avg_glucose_level'] * df['hypertension'] / 100
    df['bmi_age']     = df['bmi'] * df['age'] / 1000
    df['hyp_hd']      = df['hypertension'] * df['heart_disease']
    return df


def add_chd_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['pulse_pressure']    = df['sysBP'] - df['diaBP']
    df['smoking_intensity'] = df['currentSmoker'] * df['cigsPerDay']
    df['chol_age']          = df['totChol'] * df['age'] / 10000
    df['age_sq']            = (df['age'] ** 2) / 1000
    return df


# ── Training routines ──────────────────────────────────────────────────────────

def train_stroke():
    csv_path = download(
        'https://raw.githubusercontent.com/georgemelrose/Stroke-Prediction-Dataset-Practice/main/healthcare-dataset-stroke-data.csv',
        os.path.join(DATA_DIR, 'stroke.csv'),
    )
    df = pd.read_csv(csv_path)
    df = df.rename(columns={'residence_type': 'Residence_type'}).drop(columns=['id'], errors='ignore')
    df['bmi'] = pd.to_numeric(df['bmi'], errors='coerce').fillna(df['bmi'].median())
    df['gender']         = df['gender'].map({'Male': 1, 'Female': 0, 'Other': 1})
    df['ever_married']   = df['ever_married'].map({'Yes': 1, 'No': 0})
    df['work_type']      = df['work_type'].map({'Private': 1, 'Self-employed': 2, 'Govt_job': 3, 'children': 4, 'Never_worked': 5})
    df['Residence_type'] = df['Residence_type'].map({'Urban': 1, 'Rural': 2})
    df['smoking_status'] = df['smoking_status'].map({'never smoked': 1, 'smokes': 2, 'formerly smoked': 3, 'Unknown': 4})
    df = df.dropna()
    df = add_stroke_features(df)

    base = ['age', 'hypertension', 'heart_disease', 'avg_glucose_level', 'bmi',
            'gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
    eng  = ['age_sq', 'glucose_hyp', 'bmi_age', 'hyp_hd']
    all_features = base + eng

    X, y = df[all_features], df['stroke']

    pipeline = ColumnTransformer([('scaler', StandardScaler(), all_features)])
    model = RandomForestClassifier(
        n_estimators=300, max_depth=10, min_samples_leaf=4,
        max_features='sqrt', class_weight='balanced',
        random_state=42, n_jobs=-1, oob_score=True,
    )
    clf = Pipeline([('prep', pipeline), ('clf', model)])

    _cv_report('Stroke', clf, X, y, threshold=0.30)
    clf.fit(X, y)
    print(f'Stroke OOB accuracy: {clf.named_steps["clf"].oob_score_:.4f}')

    out_dir = os.path.join(BASE_DIR, 'stroke')
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(pipeline, os.path.join(out_dir, 'pipeline.joblib'))
    joblib.dump(clf.named_steps['clf'], os.path.join(out_dir, 'rf_under_Stroke_model.joblib'))
    print('Stroke models saved.')


def train_chd():
    csv_path = download(
        'https://raw.githubusercontent.com/GauravPadawe/Framingham-Heart-Study/master/framingham.csv',
        os.path.join(DATA_DIR, 'chd.csv'),
    )
    df = pd.read_csv(csv_path)
    df['gender'] = df['male'] if 'male' in df.columns else df.get('gender', 0)

    base = ['age', 'currentSmoker', 'cigsPerDay', 'BPMeds', 'prevalentStroke',
            'prevalentHyp', 'diabetes', 'totChol', 'sysBP', 'diaBP',
            'BMI', 'heartRate', 'glucose', 'gender']
    for col in base:
        if col not in df.columns:
            raise KeyError(f'CHD dataset missing column: {col}')

    y = df['TenYearCHD'].astype(int) if 'TenYearCHD' in df.columns else df.iloc[:, -1].astype(int)
    Xb = df[base].copy().astype(float)
    for col in base:
        Xb[col] = Xb[col].fillna(Xb[col].median())
    Xb = Xb[~y.isna()]
    y  = y[~y.isna()]

    df_eng = add_chd_features(Xb)
    eng  = ['pulse_pressure', 'smoking_intensity', 'chol_age', 'age_sq']
    all_features = base + eng
    X = df_eng[all_features]

    pipeline = ColumnTransformer([('scaler', StandardScaler(), all_features)])
    model = RandomForestClassifier(
        n_estimators=300, max_depth=8, min_samples_leaf=4,
        max_features='sqrt', class_weight='balanced',
        random_state=42, n_jobs=-1, oob_score=True,
    )
    clf = Pipeline([('prep', pipeline), ('clf', model)])

    _cv_report('CHD', clf, X, y, threshold=0.35)
    clf.fit(X, y)
    print(f'CHD OOB accuracy: {clf.named_steps["clf"].oob_score_:.4f}')

    out_dir = os.path.join(BASE_DIR, 'chd')
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(pipeline, os.path.join(out_dir, 'pipeline.joblib'))
    joblib.dump(clf.named_steps['clf'], os.path.join(out_dir, 'rf_CHD_under_model.joblib'))
    print('CHD models saved.')


def train_mi():
    """Blood-test MI model — XGBoost on clinically calibrated synthetic data.

    Reference ranges:
      CK-MB  normal: 0–5 U/L    |  MI: >6 U/L  (peak 10–200)
      Troponin normal: <0.04 ng/mL | MI: >0.04 ng/mL (peak 0.1–50)
    """
    rng = np.random.default_rng(42)

    n_neg = 5200
    age_neg      = rng.integers(18, 80, n_neg)
    ckmb_neg     = rng.lognormal(0.4, 0.6, n_neg).clip(0, 5)
    troponin_neg = rng.exponential(0.008, n_neg).clip(0, 0.039)

    n_pos = 2800
    age_pos      = rng.normal(62, 13, n_pos).clip(30, 90).astype(int)
    ckmb_pos     = rng.lognormal(2.8, 0.9, n_pos).clip(6, 200)
    troponin_pos = rng.lognormal(-0.5, 1.5, n_pos).clip(0.05, 50)

    age      = np.concatenate([age_neg, age_pos])
    ckmb     = np.concatenate([ckmb_neg, ckmb_pos])
    troponin = np.concatenate([troponin_neg, troponin_pos])
    mi       = np.array([0] * n_neg + [1] * n_pos)
    ratio    = troponin / (ckmb + 1e-6)

    idx = rng.permutation(len(mi))
    age, ckmb, troponin, ratio, mi = age[idx], ckmb[idx], troponin[idx], ratio[idx], mi[idx]

    features = ['Age', 'CK-MB', 'Troponin', 'Troponin_CKMB_ratio']
    X = pd.DataFrame({'Age': age, 'CK-MB': ckmb, 'Troponin': troponin, 'Troponin_CKMB_ratio': ratio})
    y = pd.Series(mi)

    pipeline = ColumnTransformer([('scaler', StandardScaler(), features)])
    model = XGBClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        random_state=42, n_jobs=-1, eval_metric='auc', verbosity=0,
    )
    clf = Pipeline([('prep', pipeline), ('clf', model)])

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    y_prob = cross_val_predict(clf, X, y, cv=cv, method='predict_proba')[:, 1]
    auc = roc_auc_score(y, y_prob)
    y_pred = (y_prob >= 0.40).astype(int)
    print(f'\n--- MI Blood CV (threshold=0.40) ---')
    print(f'AUC-ROC : {auc:.4f}')
    print(classification_report(y, y_pred, target_names=['No MI', 'MI'], digits=3))

    clf.fit(X, y)

    out_dir = os.path.join(BASE_DIR, 'ecg_mi')
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(pipeline, os.path.join(out_dir, 'mi_pipeline.joblib'))
    joblib.dump(clf.named_steps['clf'], os.path.join(out_dir, 'mi_model.joblib'))
    print('MI blood-test models saved.')


def main():
    os.chdir(BASE_DIR)
    sys.path.insert(0, BASE_DIR)
    print('Building models in', BASE_DIR)
    train_stroke()
    train_chd()
    train_mi()
    ecg_path = os.path.join(BASE_DIR, 'ecg_mi', 'best_rf_model_ecg_images.pkl')
    if os.path.isfile(ecg_path):
        print('ECG image model already present.')
    else:
        print('WARNING: ecg_mi/best_rf_model_ecg_images.pkl still missing — export from ECG notebook.')
    print('\nDone.')


if __name__ == '__main__':
    main()
