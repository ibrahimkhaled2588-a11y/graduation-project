# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shifaa** is a full-stack web application for cardiovascular disease prediction and prevention. It combines Flask-served ML models with an RAG-powered chatbot.

## Development Commands

All commands run from the `Application/` directory.

```bash
# Install dependencies
pip install -r requirements.txt

# Train all ML models (one-time; downloads Kaggle datasets)
python scripts/build_models.py

# Run development server (http://127.0.0.1:5000)
python app.py

# Production
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

**Docker:**
```bash
docker build -t shifaa .
docker run -p 5000:5000 shifaa
```

No test suite or linting configuration exists in this project.

## Environment Setup

Copy `.env` in `Application/` and set:
```
OPENAI_API_KEY=sk-...
```

Required for the chatbot. The three predictors (stroke, CHD, ECG/MI) work without it.

## Architecture

The app is a monolithic Flask server (`Application/app.py`, 10 routes) with four independent ML subsystems. All routes use server-side Jinja2 rendering — there is no SPA frontend.

### ML Modules

Each module under `Application/` is self-contained with a `helpers.py` (preprocessing + prediction logic) and pre-trained model artifacts:

| Module | Input | Algorithm | Model files |
|--------|-------|-----------|-------------|
| `stroke/` | 10 clinical indicators (age, BMI, glucose, smoking…) | RandomForest(200 trees, depth 12) | `pipeline.joblib`, `rf_under_Stroke_model.joblib` |
| `chd/` | 14 clinical metrics (Framingham study features) | RandomForest(200 trees, depth 10) | `pipeline.joblib`, `rf_CHD_under_model.joblib` |
| `ecg_mi/` | JPEG ECG image + Age/CK-MB/Troponin | Two RFs combined via decision matrix | `mi_pipeline.joblib`, `mi_model.joblib`, `best_rf_model_ecg_images.pkl` |
| `ChatBot/` | Natural language question | LangChain RAG → gpt-3.5-turbo-instruct | ChromaDB at `shifaa_VDB/` |

**Model loading** is handled in `ml_loader.py` via `@lru_cache` — models are singletons loaded once per process. It has graceful fallbacks for alternative model filenames (CatBoost/XGBoost variants that may exist from experiments).

### ECG Image Pipeline

The ECG/MI module is the most complex. It:
1. Accepts an uploaded JPEG, saves it to `ecg_mi/images/<timestamp>_<name>`
2. Uses OpenCV + scikit-image to crop 12 lead regions, apply Gaussian blur, Otsu threshold, and contour detection → ~3,000 image features
3. Runs a separate blood-marker RF (Age, CK-MB, Troponin, trained on 4,000 synthetic samples)
4. Combines both model outputs via a decision matrix in `messages.py` (8 outcome templates)

### Chatbot (RAG)

`ChatBot/helpers.py` wraps a LangChain retrieval chain:
- Vector store: ChromaDB (`shifaa_VDB/`, collection `main_collection`)
- Embeddings: `text-embedding-3-small`
- Retriever: top-2 similarity search
- Chat history persisted to `chats.pkl` (pickle list of `(question, answer)` tuples)

`ChatBotManager` is instantiated once at app startup in `app.py`.

### Prediction Result Flow

```
POST form → app.py route → module.helpers.perform_prediction() → dict
    → messages.py template lookup → rendered via templates/partials/prediction_result.html
```

### Frontend

- Vanilla JS with Bootstrap 5.3. No build step, no bundler.
- `static/Scripts/script.js` — language switching (EN/AR) stored in `localStorage`, RTL toggling
- `static/Scripts/detector-page.js` — shared form behavior across all three detector pages
- `static/Scripts/chat.js` — chatbot UI interactions
- Templates include `partials/navbar.html` and `partials/footer.html` via Jinja2 `include`

### Doctor Finder

`doctors.xlsx` contains cardiologist data scraped from Vezeeta. The `/cities` route returns a JSON list of available cities. Default city filter is المنوفية (Al-Menoufia). The data is read with `openpyxl` at request time.

## File Storage

The application uses **no SQL database**. Persistence is entirely file-based:

| Data | Location | Notes |
|------|----------|-------|
| ML model artifacts | `stroke/`, `chd/`, `ecg_mi/` dirs | `.joblib`/`.pkl` files committed to repo |
| ChromaDB vector store | `shifaa_VDB/` | Git-ignored; must be copied from notebook |
| Chat history | `chats.pkl` | Git-ignored; auto-created |
| Uploaded ECG images | `ecg_mi/images/` | Git-ignored; transient |
| Doctor data | `doctors.xlsx` | Committed |

## Key Constraints

- `scikit-learn` must be `>=1.3,<1.4` — model artifacts were serialized with 1.3.x and will break with 1.4+.
- `opencv-python==4.9.0.80` is pinned — the ECG image processing pipeline depends on specific behavior.
- Python runtime is **3.9.13** (`runtime.txt`). The app does not run on 3.10+ due to pickle/sklearn compatibility.
- The chatbot requires both `shifaa_VDB/` (ChromaDB) and a valid `OPENAI_API_KEY`. Without them, `/chat` will raise on first use.
- Model files must exist before starting the server. If missing, run `python scripts/build_models.py` first.
