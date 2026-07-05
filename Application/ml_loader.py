"""Load and cache ML pipelines/models with notebook-compatible fallbacks."""

from __future__ import annotations

import os
from functools import lru_cache

import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_SPECS = {
    'stroke': {
        'pipeline': [
            'stroke/pipeline.joblib',
            'stroke/stroke_pipeline.joblib',
        ],
        'model': [
            'stroke/rf_under_Stroke_model.joblib',
            'stroke/Catboost_Stroke_model.joblib',
        ],
    },
    'chd': {
        'pipeline': [
            'chd/pipeline.joblib',
            'chd/CHD_pipeline.joblib',
        ],
        'model': [
            'chd/rf_CHD_under_model.joblib',
            'chd/XGBoost_CHD_model.joblib',
        ],
    },
    'ecg_mi': {
        'pipeline': [
            'ecg_mi/mi_pipeline.joblib',
            'ecg_mi/MI_pipeline_Features_Selection.joblib',
            'ecg_mi/MI_pipeline.joblib',
        ],
        'model': [
            'ecg_mi/mi_model.joblib',
            'ecg_mi/best_XGB_Model_MI.joblib',
        ],
        'ecg': [
            'ecg_mi/best_rf_model_ecg_images.pkl',
        ],
    },
}


def _resolve(rel_paths: list[str]) -> str | None:
    for rel in rel_paths:
        path = os.path.join(BASE_DIR, rel)
        if os.path.isfile(path):
            return path
    return None


def _load_first(rel_paths: list[str]):
    path = _resolve(rel_paths)
    if not path:
        names = ', '.join(rel_paths)
        raise FileNotFoundError(
            f'Model artifact not found. Expected one of: {names}. '
            f'Run: python scripts/build_models.py'
        )
    return joblib.load(path)


@lru_cache(maxsize=1)
def load_stroke_artifacts():
    spec = MODEL_SPECS['stroke']
    return _load_first(spec['pipeline']), _load_first(spec['model'])


@lru_cache(maxsize=1)
def load_chd_artifacts():
    spec = MODEL_SPECS['chd']
    return _load_first(spec['pipeline']), _load_first(spec['model'])


@lru_cache(maxsize=1)
def load_ecg_image_model():
    return _load_first(MODEL_SPECS['ecg_mi']['ecg'])


@lru_cache(maxsize=1)
def load_mi_artifacts():
    spec = MODEL_SPECS['ecg_mi']
    return _load_first(spec['pipeline']), _load_first(spec['model'])


def mi_models_available() -> bool:
    try:
        load_mi_artifacts()
        return True
    except FileNotFoundError:
        return False


def models_status() -> dict[str, bool]:
    status = {}
    for key in ('stroke', 'chd', 'ecg_mi'):
        try:
            if key == 'ecg_mi':
                load_ecg_image_model()
                status['ecg_image'] = True
                status['mi_blood'] = mi_models_available()
            else:
                loader = load_stroke_artifacts if key == 'stroke' else load_chd_artifacts
                loader()
                status[key] = True
        except FileNotFoundError:
            if key == 'ecg_mi':
                status['ecg_image'] = os.path.isfile(
                    os.path.join(BASE_DIR, 'ecg_mi/best_rf_model_ecg_images.pkl')
                )
                status['mi_blood'] = False
            else:
                status[key] = False
    return status
