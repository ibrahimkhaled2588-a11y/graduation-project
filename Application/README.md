# Shifaa Web Application

## Quick start

```bash
cd Application
pip install -r requirements.txt
python scripts/build_models.py
python app.py
```

Open http://127.0.0.1:5000

## Models

| Detector | Files in `Application/` | Build command |
|----------|-------------------------|---------------|
| Stroke | `stroke/pipeline.joblib`, `stroke/rf_under_Stroke_model.joblib` | `python scripts/build_models.py` |
| CHD | `chd/pipeline.joblib`, `chd/rf_CHD_under_model.joblib` | same |
| ECG + MI | `ecg_mi/mi_pipeline.joblib`, `ecg_mi/mi_model.joblib`, `ecg_mi/best_rf_model_ecg_images.pkl` | MI via script; ECG image from notebook export |

Notebook exports (`Catboost_Stroke_model.joblib`, etc.) are also supported via `ml_loader.py` fallbacks.

## Chatbot

1. Copy `shifaa_VDB` from the ChatBot Development notebook into `Application/`.
2. Set `OPENAI_API_KEY` in `Application/.env`.

## Doctors carousel

Requires `Application/doctors.xlsx` (included). City filter defaults to المنوفية.
