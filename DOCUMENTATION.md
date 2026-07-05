# Shifaa — Technical Documentation

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Backend — Flask Application](#3-backend--flask-application)
4. [ML Modules](#4-ml-modules)
   - [Stroke Risk](#41-stroke-risk-module)
   - [Coronary Heart Disease (CHD)](#42-coronary-heart-disease-chd-module)
   - [ECG + Myocardial Infarction](#43-ecg--myocardial-infarction-module)
   - [AI Chatbot](#44-ai-chatbot-module)
5. [Model Loading](#5-model-loading-ml_loaderpy)
6. [Model Training](#6-model-training-scriptsbuild_modelspy)
7. [Frontend](#7-frontend)
8. [Data Flows](#8-data-flows)
9. [Configuration & Environment](#9-configuration--environment)
10. [Deployment](#10-deployment)
11. [Research Notebooks](#11-research-notebooks)

---

## 1. Architecture Overview

Shifaa follows a monolithic Flask architecture with clearly separated ML modules. Each disease domain (stroke, CHD, ECG/MI) is an independent Python package containing its prediction logic and pre-trained model artifacts.

```
Browser
   │
   ▼
Flask (app.py)
   ├── /stroke   →  stroke/helpers.py  →  stroke/pipeline.joblib + rf_under_Stroke_model.joblib
   ├── /chd      →  chd/helpers.py     →  chd/pipeline.joblib + rf_CHD_under_model.joblib
   ├── /ecg_mi   →  ecg_mi/helpers.py  →  ecg_mi/best_rf_model_ecg_images.pkl
   │                                   →  ecg_mi/mi_pipeline.joblib + mi_model.joblib
   └── /chat     →  ChatBot/helpers.py →  shifaa_VDB/ (ChromaDB) + OpenAI API
```

The frontend is server-rendered Jinja2 with a small amount of vanilla JavaScript for interactivity (language switching, form UX, Swiper carousels).

---

## 2. Directory Structure

```
Graduation-Project-main/
│
├── Application/                        # Deployable Flask app
│   ├── app.py                          # All routes + startup logic
│   ├── ml_loader.py                    # Lazy model loading with fallback paths
│   ├── messages.py                     # ECG+MI result message templates
│   ├── requirements.txt
│   ├── runtime.txt                     # Python 3.9.13
│   ├── .env                            # OPENAI_API_KEY (not committed)
│   ├── chats.pkl                       # Persisted chat history
│   ├── doctors.xlsx                    # Cardiologist database (from Vezeeta)
│   │
│   ├── stroke/
│   │   ├── __init__.py
│   │   ├── helpers.py                  # perform_prediction()
│   │   ├── pipeline.joblib             # StandardScaler pipeline
│   │   └── rf_under_Stroke_model.joblib
│   │
│   ├── chd/
│   │   ├── __init__.py
│   │   ├── helpers.py                  # perform_prediction()
│   │   ├── pipeline.joblib
│   │   └── rf_CHD_under_model.joblib
│   │
│   ├── ecg_mi/
│   │   ├── __init__.py
│   │   ├── helpers.py                  # process_ecg_image(), mi_prediction(), ecg_prediction(), mi_ecg_prediction()
│   │   ├── images/                     # Uploaded ECG images (timestamped)
│   │   ├── mi_pipeline.joblib
│   │   ├── mi_model.joblib
│   │   └── best_rf_model_ecg_images.pkl
│   │
│   ├── ChatBot/
│   │   ├── __init__.py
│   │   └── helpers.py                  # ChatBotManager class
│   │
│   ├── shifaa_VDB/                     # ChromaDB persistence directory
│   │
│   ├── scripts/
│   │   └── build_models.py             # Train and export all models
│   │
│   ├── data/                           # Downloaded training datasets
│   │   ├── stroke.csv
│   │   └── chd.csv
│   │
│   ├── templates/
│   │   ├── index.html
│   │   ├── stroke.html
│   │   ├── chd.html
│   │   ├── ecg.html
│   │   ├── chat.html
│   │   ├── about.html
│   │   ├── stroke_analysis.html
│   │   ├── chd_analysis.html
│   │   └── partials/
│   │       ├── navbar.html
│   │       ├── footer.html
│   │       └── prediction_result.html
│   │
│   └── static/
│       ├── Scripts/
│       │   ├── script.js               # Language switching, nav
│       │   ├── chat.js                 # Chat UI interactions
│       │   └── detector-page.js        # Form/Swiper init, result scroll
│       ├── Styles/
│       │   ├── index.css               # Home page + shared tokens
│       │   ├── detector.css            # All detector form pages
│       │   ├── chat.css
│       │   └── about.css
│       └── images/                     # Logos, page illustrations, team photos
│
├── CHD/                                # CHD EDA + modeling notebook
├── Stroke/                             # Stroke EDA + modeling notebook
├── MI/                                 # MI blood marker notebook
├── ECG/                                # ECG processing + classification notebooks
├── ChatBot Development/                # RAG chatbot development notebook
├── Power-Bi-Dashboards/                # Power BI dashboard screenshot exports
└── Vezeeta Scrapping/                  # Doctor data scraping notebook + output
```

---

## 3. Backend — Flask Application

**File:** `Application/app.py`

### Utility Functions

```python
form_int(key, default=0)      # Safe int conversion from request.form
form_float(key, default=0.0)  # Safe float conversion from request.form
```

### Routes

#### `GET /`
Renders the home page (`index.html`).

#### `GET /about`
Renders the About & team page (`about.html`).

#### `GET /cities`
Returns a JSON array of available city names extracted from `doctors.xlsx`.

#### `GET/POST /stroke`
- **GET:** Renders the stroke prediction form (`stroke.html`)
- **POST:** Reads 11 form fields, calls `stroke.helpers.perform_prediction()`, calls `render_detector()` with result

#### `GET/POST /chd`
- **GET:** Renders the CHD form (`chd.html`)
- **POST:** Reads 15 form fields, calls `chd.helpers.perform_prediction()`, calls `render_detector()` with result

#### `GET/POST /ecg_mi`
- **GET:** Renders the ECG+MI form (`ecg.html`)
- **POST:** Saves uploaded image to `ecg_mi/images/<timestamp>.jpg`, calls `ecg_mi.helpers.mi_ecg_prediction()`, calls `render_detector()` with result

#### `GET/POST /chat`
- **GET:** Renders chat page with history from `chats.pkl`
- **POST:** Calls `chatbot.generate_answer()`, appends to history, re-renders

#### `POST /chat_api`
JSON endpoint for chatbot. Accepts `{"question": "..."}`, returns `{"answer": "..."}` or `{"error": "..."}`.

#### `GET /stroke_analysis`
Renders the stroke Power BI dashboard page (`stroke_analysis.html`).

#### `GET /chd_analysis`
Renders the CHD Power BI dashboard page (`chd_analysis.html`).

### Helper Functions

#### `render_detector(template, message, city)`
Unified result renderer used by all three detector routes.
- Calls `get_doctors(city)` if city provided
- Passes `message` and `doctors` list to the template

#### `get_doctors(city)`
Reads `doctors.xlsx`, filters by city name, returns a list of dicts:
```python
{"name": str, "location": str, "price": str, "link": str}
```

#### `save_questions(question, answer)`
Loads `chats.pkl`, appends `(question, answer)` tuple, saves back.

---

## 4. ML Modules

### 4.1 Stroke Risk Module

**File:** `Application/stroke/helpers.py`

#### `perform_prediction(data: dict) -> str`

Accepts a dict with these keys:

| Key | Type | Description |
|-----|------|-------------|
| `age` | int | Patient age |
| `gender` | str | `"Male"` or `"Female"` |
| `hypertension` | int | 0 or 1 |
| `heart_disease` | int | 0 or 1 |
| `ever_married` | str | `"Yes"` or `"No"` |
| `work_type` | str | `"Private"`, `"Self-employed"`, `"Govt_job"`, `"children"`, `"Never_worked"` |
| `Residence_type` | str | `"Urban"` or `"Rural"` |
| `avg_glucose_level` | float | mg/dL |
| `height` | float | cm (used to compute BMI, then dropped) |
| `weight` | float | kg (used to compute BMI, then dropped) |
| `smoking_status` | str | `"formerly smoked"`, `"never smoked"`, `"smokes"`, `"Unknown"` |

**Returns:** A string message indicating high or low stroke risk.

**Process:**
1. Creates a pandas DataFrame
2. Computes `bmi = weight / (height/100)²`
3. Drops `height` and `weight`
4. Applies the loaded preprocessing pipeline (StandardScaler)
5. Runs the Random Forest model
6. Returns the appropriate message

**Model specs:**
- `RandomForestClassifier(n_estimators=200, max_depth=12, class_weight='balanced')`
- Handles class imbalance via undersampling during training

---

### 4.2 Coronary Heart Disease (CHD) Module

**File:** `Application/chd/helpers.py`

#### `perform_prediction(data: dict) -> str`

Accepts a dict with these keys:

| Key | Type | Description |
|-----|------|-------------|
| `age` | int | Patient age |
| `gender` | str | `"M"` or `"F"` |
| `currentSmoker` | int | 0 or 1 |
| `cigsPerDay` | float | Cigarettes per day |
| `BPMeds` | int | 0 or 1 (on BP medication) |
| `prevalentStroke` | int | 0 or 1 |
| `prevalentHyp` | int | 0 or 1 (hypertension) |
| `diabetes` | int | 0 or 1 |
| `totChol` | float | Total cholesterol (mg/dL) |
| `sysBP` | float | Systolic blood pressure (mmHg) |
| `diaBP` | float | Diastolic blood pressure (mmHg) |
| `heartRate` | float | Resting heart rate (bpm) |
| `glucose` | float | Blood glucose (mg/dL) |
| `height` | float | cm (used to compute BMI, then dropped) |
| `weight` | float | kg (used to compute BMI, then dropped) |

**Returns:** A string message indicating high or low 10-year CHD risk.

**Model specs:**
- `RandomForestClassifier(n_estimators=200, max_depth=10, class_weight='balanced')`
- Trained on the Framingham Heart Study dataset

---

### 4.3 ECG + Myocardial Infarction Module

**File:** `Application/ecg_mi/helpers.py`

This module runs two independent models and combines their results.

---

#### `process_ecg_image(image_path: str) -> np.ndarray`

Extracts a feature vector from a 12-lead ECG JPEG image.

**Process:**
1. Reads image with OpenCV
2. Defines pixel bounding boxes for each of the 12 ECG leads (hardcoded coordinates based on standard 12-lead ECG paper layout)
3. For each lead:
   - Crops the region
   - Converts to grayscale
   - Applies Gaussian blur (5×5 kernel)
   - Applies Otsu thresholding to isolate waveform lines
   - Finds contours to detect waveform features
   - Normalizes and flattens to a fixed-length vector (255 values)
4. Concatenates all 12 lead vectors → ~3,060 features total

**Returns:** 1D numpy array of ECG image features

---

#### `ecg_prediction(image_path: str) -> int`

**Input:** Path to a 12-lead ECG image  
**Output:** Integer class label:

| Class | Meaning |
|-------|---------|
| 0 | Normal / Healthy |
| 1 | Myocardial Infarction |
| 2 | Abnormal Heartbeat |
| 3 | History of MI (Post-MI) |

---

#### `mi_prediction(age: int, ck_mb: float, troponin: float) -> int`

Uses blood marker values to predict myocardial infarction.

| Input | Description |
|-------|-------------|
| `age` | Patient age in years |
| `ck_mb` | CK-MB enzyme level (U/L) |
| `troponin` | Troponin I level (ng/mL) |

**Returns:** `0` (no MI) or `1` (MI detected)

---

#### `mi_ecg_prediction(image_path, age, ck_mb, troponin) -> str`

Combines both models and returns a contextual message from `messages.py`.

**Decision matrix:**

| MI Blood Result | ECG Class | Message Template |
|-----------------|-----------|-----------------|
| 1 (positive) | 0 (normal) | `m_1_no` — blood test positive, ECG normal |
| 1 (positive) | 1 (MI) | `m_1_mi` — both confirm MI |
| 1 (positive) | 2 (abnormal) | `m_1_hb` — MI + abnormal heartbeat |
| 1 (positive) | 3 (post-MI) | `m_1_pm` — MI + post-MI history |
| 0 (negative) | 0 (normal) | `m_0_no` — all clear |
| 0 (negative) | 1 (MI) | `m_0_mi` — ECG shows MI, blood negative |
| 0 (negative) | 2 (abnormal) | `m_0_hb` — abnormal heartbeat only |
| 0 (negative) | 3 (post-MI) | `m_0_pm` — post-MI history, currently negative |

---

### 4.4 AI Chatbot Module

**File:** `Application/ChatBot/helpers.py`

#### Class: `ChatBotManager`

A singleton-style manager for the RAG (Retrieval-Augmented Generation) chatbot.

**Initialization** (lazy — runs on first call):
1. Loads ChromaDB from `Application/shifaa_VDB/`
2. Initializes OpenAI embeddings
3. Creates a LangChain retriever (top-2 similar documents)
4. Configures prompt template with `{context}` and `{question}` placeholders
5. Builds `RetrievalQA` chain with `gpt-3.5-turbo-instruct`

#### `generate_answer(question: str) -> str`

1. Calls `_initialize()` if not already done
2. Retrieves the 2 most relevant document chunks from ChromaDB
3. Formats them into the prompt
4. Calls OpenAI and returns the generated answer

**Raises** a descriptive error if:
- `OPENAI_API_KEY` is missing from environment
- `shifaa_VDB/` directory does not exist

**Prerequisites:**
- `Application/.env` with `OPENAI_API_KEY=...`
- `Application/shifaa_VDB/` generated by running `ChatBot Development/ChatBot_Development.ipynb`

---

## 5. Model Loading (`ml_loader.py`)

Handles loading pre-trained model artifacts with graceful fallbacks.

### Functions

#### `load_stroke_artifacts() -> tuple[Pipeline, RandomForestClassifier]`
Tries multiple file name variants (`stroke_pipeline.joblib`, `pipeline.joblib`) to load the stroke preprocessing pipeline and model.

#### `load_chd_artifacts() -> tuple[Pipeline, RandomForestClassifier]`
Same pattern for CHD.

#### `load_ecg_image_model() -> RandomForestClassifier`
Loads `best_rf_model_ecg_images.pkl`.

#### `load_mi_artifacts() -> tuple[Pipeline, RandomForestClassifier]`
Loads `mi_pipeline.joblib` + `mi_model.joblib`.

#### `mi_models_available() -> bool`
Returns `True` if both MI model files exist on disk. Used to conditionally show the MI blood marker section in the UI.

#### `models_status() -> dict`
Returns a dict of `{model_name: bool}` indicating which models loaded successfully. Printed at startup for diagnostics.

All loaders use `@lru_cache` so each artifact is loaded from disk only once per process lifetime.

---

## 6. Model Training (`scripts/build_models.py`)

Run this script once to train and export all ML models.

```bash
cd Application
python scripts/build_models.py
```

### `train_stroke()`
1. Downloads the Kaggle stroke dataset to `data/stroke.csv`
2. Label-encodes categorical columns
3. Applies undersampling to balance classes
4. Fits `ColumnTransformer` + `StandardScaler`
5. Trains `RandomForestClassifier(n_estimators=200, max_depth=12, class_weight='balanced')`
6. Saves to `stroke/pipeline.joblib` and `stroke/rf_under_Stroke_model.joblib`

### `train_chd()`
1. Downloads Framingham CHD data to `data/chd.csv`
2. Encodes features, imputes missing BMI with median
3. Applies undersampling
4. Fits pipeline and trains model
5. Saves to `chd/pipeline.joblib` and `chd/rf_CHD_under_model.joblib`

### `train_mi()`
Generates synthetic MI data (4,000 samples):
- `age`: uniform 25–90
- `CK-MB`: normal distribution (µ=14, σ=8, clipped > 0)
- `Troponin`: log-normal distribution
- Label `MI=1` if: `age > 55 AND CK-MB > 25 AND Troponin > 0.04`

Trains a Random Forest and saves to `ecg_mi/mi_pipeline.joblib` and `ecg_mi/mi_model.joblib`.

> ECG image model training is done separately in `ECG/ECG Modeling Notebook.ipynb`.

---

## 7. Frontend

### Template Hierarchy

All pages share a common structure via Jinja2 includes:

```
base layout (inline in each template)
  ├── partials/navbar.html   — responsive nav with language switcher
  ├── [page content]
  ├── partials/prediction_result.html  — rendered after POST on detector pages
  └── partials/footer.html
```

### Pages

#### `index.html` — Home
- Hero with CTA button → scrolls to services grid
- 4 service cards (Detector, Analysis, Chatbot, About)
- 3-step "How It Works" explainer

#### `stroke.html`, `chd.html` — Detector Forms
- Hero + description
- Form section with labeled fields
- On POST: includes `prediction_result.html` partial with result + doctor carousel

#### `ecg.html` — ECG + MI Form
- Same layout as above
- File upload input with drag-and-drop styling and image preview
- 3 numeric inputs for blood markers

#### `prediction_result.html` — Result Partial
- Shown only when `message` is present in template context
- Risk badge (high / low) with icon
- Full result message text
- If high risk: Swiper.js carousel of doctor cards (name, location, price, booking link)

#### `chat.html` — Chatbot
- Chat history bubbles (outgoing / incoming)
- Auto-resizing textarea input
- Example question chips
- Enter to submit, Shift+Enter for new line

#### `about.html` — Team & Mission
- 3 feature cards (AI-Powered, Data Analytics, 24/7 Support)
- Team member grid with photos and social links

#### `stroke_analysis.html`, `chd_analysis.html` — Dashboards
- Embed Power BI dashboard images

### JavaScript Modules

#### `script.js`
- **Language switching:** Detects stored preference in `localStorage`, applies translations from an in-file dictionary, toggles `dir="rtl"` for Arabic
- **Navbar:** Hamburger toggle, scroll effect (adds shadow on scroll)
- **Translations:** Object with `en`/`ar` keys for all static text

#### `detector-page.js`
- Scrolls to the form when the "Get Started" CTA is clicked
- Initializes Swiper carousel for the doctor list
  - Breakpoints: 1 slide on mobile, 2 on tablet, 3 on desktop
- Auto-scrolls to the result panel after form submission

#### `chat.js`
- Auto-scrolls chat container to the latest message
- Auto-expands the textarea as the user types
- Handles Enter-to-submit / Shift+Enter-for-newline behavior
- Populates the input when an example chip is clicked

### CSS Design System

`detector.css` defines shared CSS custom properties:

```css
--accent: #e94057          /* Primary red */
--accent-teal: #0f7173     /* Secondary teal */
--text-secondary: #555     /* Body text */
--card-bg: #fff
--radius: 12px
```

`index.css` imports `detector.css` and adds home-page-specific rules.

---

## 8. Data Flows

### Stroke / CHD Prediction

```
User fills form
      │
      ▼
POST /stroke (or /chd)
      │
      ▼
app.py: form_int() / form_float() on each field
      │
      ▼
stroke/helpers.py: perform_prediction(data)
  ├── Build DataFrame
  ├── Compute BMI, drop height/weight
  ├── pipeline.transform(df)     ← StandardScaler
  └── model.predict(scaled_df)   ← RandomForest → 0 or 1
      │
      ▼
app.py: render_detector(template, message, city)
  └── get_doctors(city)           ← filters doctors.xlsx
      │
      ▼
Jinja2 renders prediction_result.html partial
```

### ECG + MI Prediction

```
User uploads ECG image + enters Age, CK-MB, Troponin
      │
      ▼
POST /ecg_mi
      │
      ▼
app.py: saves image to ecg_mi/images/<timestamp>.jpg
      │
      ▼
ecg_mi/helpers.py: mi_ecg_prediction(image_path, age, ck_mb, troponin)
  ├── process_ecg_image(image_path)
  │     ├── Crop 12 lead regions
  │     ├── Grayscale → Gaussian blur → Otsu threshold → contours
  │     └── Flatten → ~3000 feature vector
  ├── ecg_prediction(image_path)    ← ECG RandomForest → class 0-3
  ├── mi_prediction(age, ck_mb, troponin) ← MI RandomForest → 0 or 1
  └── Lookup message in 8-combination matrix (messages.py)
      │
      ▼
app.py: render_detector(template, message, city)
```

### Chatbot

```
User submits question
      │
      ▼
POST /chat (or /chat_api)
      │
      ▼
ChatBotManager.generate_answer(question)
  ├── _initialize() (first call only)
  │     ├── Load ChromaDB from shifaa_VDB/
  │     └── Configure LangChain RetrievalQA chain
  ├── Retrieve top-2 docs from ChromaDB
  ├── Build prompt: [context] + question
  └── OpenAI gpt-3.5-turbo-instruct → answer string
      │
      ▼
app.py: save_questions(question, answer) → chats.pkl
      │
      ▼
Render chat.html with updated history
```

---

## 9. Configuration & Environment

### `.env` File

```
OPENAI_API_KEY=sk-...
```

Place in `Application/.env`. Loaded automatically by `python-dotenv` on app startup.

Only required for the chatbot. All ML prediction features work without it.

### `requirements.txt` Key Dependencies

| Package | Purpose |
|---------|---------|
| `flask` | Web framework |
| `gunicorn` | Production WSGI server |
| `scikit-learn>=1.3` | ML models and pipelines |
| `scikit-image` | ECG image feature extraction |
| `opencv-python==4.9.0.80` | Image reading and processing |
| `pandas` | Data manipulation |
| `joblib` | Model serialization |
| `openai` | ChatGPT API |
| `langchain`, `langchain-openai`, `langchain-chroma` | RAG chatbot |
| `chromadb` | Vector database |
| `python-dotenv` | Load `.env` file |
| `openpyxl` | Read `doctors.xlsx` |

### `runtime.txt`

```
python-3.9.13
```

Specifies the Python version for PaaS deployments (e.g., Heroku, Render).

### Data Files

| File | Description |
|------|-------------|
| `doctors.xlsx` | Cardiologist database (name, location, city, price, booking URL) scraped from Vezeeta |
| `chats.pkl` | Pickle file storing list of `(question, answer)` tuples — chat history |
| `ecg_mi/images/` | Uploaded ECG images, named `<unix_timestamp>.jpg` |

---

## 10. Deployment

### Development

```bash
cd Application
python app.py
# Runs on http://127.0.0.1:5000 with debug=True
```

### Production with Gunicorn

```bash
cd Application
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

- `-w 4` — 4 worker processes (adjust based on CPU cores)
- `-b 0.0.0.0:8000` — bind to all interfaces on port 8000

### Checklist Before Deploying

- [ ] All model `.joblib` / `.pkl` files present in `stroke/`, `chd/`, `ecg_mi/`
- [ ] `shifaa_VDB/` directory present (for chatbot)
- [ ] `.env` file with `OPENAI_API_KEY` (for chatbot)
- [ ] `doctors.xlsx` present
- [ ] `ecg_mi/images/` directory exists and is writable

---

## 11. Research Notebooks

These notebooks document the full ML pipeline for each disease domain. They are not part of the web app but contain all EDA, model selection, and evaluation work.

| Notebook | Location | Contents |
|----------|----------|---------|
| CHD Modeling | `CHD/CHD (Modeling + Interpretation + Deployment) v1.ipynb` | EDA, feature engineering, model selection, SHAP explanations |
| Stroke Modeling | `Stroke/Stroke (Modeling + Interpretation + Deployment) v1.ipynb` | Same structure as CHD notebook |
| MI Blood Markers | `MI/MI Notebook.ipynb` | Synthetic data generation, threshold analysis, model training |
| ECG Processing | `ECG/ECG Processing Notebook.ipynb` | 12-lead region extraction, feature engineering |
| ECG Modeling | `ECG/ECG Modeling Notebook.ipynb` | Classification model training and evaluation |
| Chatbot Development | `ChatBot Development/ChatBot_Development.ipynb` | Document ingestion, Chroma vector DB creation, RAG chain setup |
| Doctor Scraping | `Vezeeta Scrapping/code.ipynb` | Web scraping cardiologists from Vezeeta.com |

### Power BI Dashboards

Located in `Power-Bi-Dashboards/`:
- `CHD Dashboard/Images/` — CHD Home Page.jpg, CHD Categorical Page.jpg
- `Stroke Dashboard/Images/` — Stroke Dashboard.jpg

These are embedded as static images in `chd_analysis.html` and `stroke_analysis.html`.

---

*Documentation last updated: June 2026*
