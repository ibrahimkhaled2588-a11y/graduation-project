# Shifaa — Cardiovascular Disease Prediction System
### Full Technical Documentation · Graduation Project

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project File Structure](#4-project-file-structure)
5. [Datasets](#5-datasets)
6. [Machine Learning Models](#6-machine-learning-models)
   - 6.1 [Stroke Prediction](#61-stroke-prediction)
   - 6.2 [Coronary Heart Disease (CHD) Prediction](#62-coronary-heart-disease-chd-prediction)
   - 6.3 [Myocardial Infarction (MI) — ECG + Blood Tests](#63-myocardial-infarction-mi--ecg--blood-tests)
7. [Model Training Pipeline](#7-model-training-pipeline)
8. [Model Performance & Evaluation](#8-model-performance--evaluation)
9. [Web Application (Flask)](#9-web-application-flask)
10. [RAG-Powered Chatbot](#10-rag-powered-chatbot)
11. [Doctor Finder](#11-doctor-finder)
12. [Frontend](#12-frontend)
13. [Data Persistence](#13-data-persistence)
14. [Deployment](#14-deployment)
15. [End-to-End Request Flow](#15-end-to-end-request-flow)
16. [Key Design Decisions](#16-key-design-decisions)
17. [Glossary](#17-glossary)

---

## 1. Project Overview

**Shifaa** (شفاء — Arabic for "healing") is a full-stack web application that combines machine learning with a retrieval-augmented-generation (RAG) chatbot to provide cardiovascular disease risk screening and patient education.

### What the system does

| Feature | Description |
|---|---|
| Stroke Prediction | Assesses 10-year stroke risk from clinical indicators |
| CHD Prediction | Assesses 10-year coronary heart disease risk (Framingham model) |
| MI / ECG Detection | Combines a 12-lead ECG image with cardiac biomarker blood tests to detect myocardial infarction |
| AI Chatbot | Answers cardiovascular health questions using a knowledge base and GPT |
| Doctor Finder | Recommends verified cardiologists from the Vezeeta database |

### Why it matters

Cardiovascular disease (CVD) is the leading cause of death globally, responsible for **17.9 million deaths per year** (WHO, 2023). Early screening in non-clinical settings — at home, via a phone or laptop — can trigger early medical intervention and significantly reduce mortality. Shifaa makes clinical-grade risk prediction accessible to anyone.

---

## 2. System Architecture

Shifaa is a **monolithic Flask server** with four independent ML subsystems all served from one Python process.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│  Bootstrap 5.3 + Vanilla JS  (HTML forms, language switcher)    │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP (form POST / GET)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Flask Application (app.py)                  │
│                                                                 │
│   /stroke     /chd     /ecg_mi     /chat     /cities            │
│   /stroke_analysis     /chd_analysis     /about                 │
└──────┬────────┬─────────┬──────────┬────────────────────────────┘
       │        │         │          │
       ▼        ▼         ▼          ▼
  ┌────────┐ ┌─────┐ ┌────────┐ ┌──────────────────────┐
  │ stroke │ │ chd │ │ ecg_mi │ │  ChatBotManager       │
  │helpers │ │help │ │helpers │ │  LangChain RAG        │
  └───┬────┘ └──┬──┘ └───┬────┘ │  ChromaDB + GPT       │
      │         │        │      └──────────────────────┘
      ▼         ▼        ▼
  ┌─────────────────────────────────────┐
  │          ml_loader.py               │
  │  @lru_cache — loads each model once │
  │  pipeline.joblib + model.joblib     │
  └─────────────────────────────────────┘
       │         │        │
       ▼         ▼        ▼
  [stroke/]  [chd/]  [ecg_mi/]   (serialised sklearn pipelines + RF models)
```

### Architectural Characteristics

- **No database** — persistence is entirely file-based (joblib, pickle, xlsx, ChromaDB)
- **Server-side rendering** — Jinja2 templates, no frontend framework or build step
- **Singleton models** — `@lru_cache` on every loader means each model file is read from disk exactly once per process lifetime
- **Graceful degradation** — the ECG route works without the blood-test model; the chatbot startup is deferred until first use

---

## 3. Technology Stack

### Backend

| Library | Version | Role |
|---|---|---|
| Python | 3.9.13 | Runtime (pickle/sklearn compatibility constraint) |
| Flask | latest | Web framework, routing, templating |
| scikit-learn | ≥1.3, <1.4 | ML pipelines, Random Forest, preprocessing |
| XGBoost | 3.0.2 | MI blood-test model |
| LightGBM | 4.6.0 | Available (benchmarked, RF won on these datasets) |
| imbalanced-learn | 0.13.0 | SMOTE (benchmarked) |
| joblib | latest | Model serialization |
| pandas | latest | Data wrangling |
| numpy | latest | Numerical computation |
| OpenCV | 4.9.0.80 | ECG image reading |
| scikit-image | latest | ECG image segmentation (Otsu threshold, contours) |
| LangChain | latest | RAG chain orchestration |
| ChromaDB | latest | Vector database for chatbot knowledge base |
| python-dotenv | latest | Environment variable management |
| openpyxl | latest | Reading doctors.xlsx |
| gunicorn | latest | Production WSGI server |

### Frontend

| Technology | Role |
|---|---|
| HTML5 + Jinja2 | Server-side templates |
| Bootstrap 5.3 | Responsive layout and components |
| Vanilla JavaScript | Form interaction, image preview, language switching |
| Font Awesome 6.5 | Icons |
| Google Fonts (Cairo, EB Garamond) | Typography |
| localStorage | Language preference (EN/AR) persistence |

---

## 4. Project File Structure

```
Graduation-Project-main/
│
├── Application/                    ← Flask application root
│   ├── app.py                      ← Entry point: all 10 Flask routes
│   ├── ml_loader.py                ← Singleton model loader (@lru_cache)
│   ├── messages.py                 ← 8 MI prediction message templates
│   ├── requirements.txt            ← Python dependencies
│   ├── runtime.txt                 ← Python 3.9.13 (for deployment)
│   ├── .env                        ← API keys (git-ignored)
│   │
│   ├── stroke/                     ← Stroke prediction module
│   │   ├── helpers.py              ← Prediction logic + feature engineering
│   │   ├── pipeline.joblib         ← Fitted StandardScaler (14 features)
│   │   └── rf_under_Stroke_model.joblib  ← Trained Random Forest
│   │
│   ├── chd/                        ← CHD prediction module
│   │   ├── helpers.py              ← Prediction logic + feature engineering
│   │   ├── pipeline.joblib         ← Fitted StandardScaler (18 features)
│   │   └── rf_CHD_under_model.joblib     ← Trained Random Forest
│   │
│   ├── ecg_mi/                     ← MI / ECG prediction module
│   │   ├── helpers.py              ← Dual-model prediction + image processing
│   │   ├── mi_pipeline.joblib      ← Fitted StandardScaler (4 features)
│   │   ├── mi_model.joblib         ← XGBoost for blood markers
│   │   ├── best_rf_model_ecg_images.pkl  ← RF for 12-lead ECG image features
│   │   └── images/                 ← Uploaded ECG images (transient)
│   │
│   ├── ChatBot/                    ← RAG chatbot module
│   │   ├── helpers.py              ← ChatBotManager class
│   │   └── __init__.py
│   │
│   ├── scripts/
│   │   └── build_models.py         ← Train & save all models from scratch
│   │
│   ├── data/
│   │   ├── stroke.csv              ← Downloaded stroke dataset
│   │   └── chd.csv                 ← Downloaded Framingham dataset
│   │
│   ├── shifaa_VDB/                 ← ChromaDB vector store (git-ignored)
│   ├── doctors.xlsx                ← Vezeeta cardiologist data
│   ├── chats.pkl                   ← Persisted chat history (git-ignored)
│   │
│   ├── static/
│   │   ├── Styles/                 ← CSS per page
│   │   ├── Scripts/
│   │   │   ├── script.js           ← Language switching (EN/AR), RTL toggle
│   │   │   ├── detector-page.js    ← Shared form behavior
│   │   │   └── chat.js             ← Chatbot UI
│   │   └── images/
│   │
│   └── templates/
│       ├── index.html              ← Landing page
│       ├── stroke.html             ← Stroke prediction form
│       ├── chd.html                ← CHD prediction form
│       ├── ecg.html                ← ECG/MI prediction form
│       ├── chat.html               ← Chatbot UI
│       ├── stroke_analysis.html    ← EDA visualizations
│       ├── chd_analysis.html       ← EDA visualizations
│       ├── about.html              ← Team page
│       └── partials/
│           ├── navbar.html
│           ├── footer.html
│           └── prediction_result.html
│
├── Stroke/                         ← Jupyter notebooks (development)
├── CHD/
├── MI/
├── ECG/
├── ChatBot Development/
└── Vezeeta Scrapping/
```

---

## 5. Datasets

### 5.1 Stroke Dataset

- **Source:** [Stroke Prediction Dataset (Kaggle / George Melrose)](https://github.com/georgemelrose/Stroke-Prediction-Dataset-Practice)
- **Size:** 5,110 patients
- **Class balance:** 4,861 no-stroke (95.1%) vs 249 stroke (4.9%) — severely imbalanced
- **Features used:**

| Feature | Type | Description |
|---|---|---|
| age | Continuous | Patient age in years |
| hypertension | Binary | 1 = has hypertension |
| heart_disease | Binary | 1 = has heart disease |
| avg_glucose_level | Continuous | Average blood glucose (mg/dL) |
| bmi | Continuous | Computed from height/weight (kg/m²) |
| gender | Encoded | Male=1, Female=0, Other=1 |
| ever_married | Encoded | Yes=1, No=0 |
| work_type | Encoded | Private=1, Self-employed=2, Govt=3, Children=4, Never=5 |
| Residence_type | Encoded | Urban=1, Rural=2 |
| smoking_status | Encoded | Never=1, Smokes=2, Formerly=3, Unknown=4 |

- **Engineered features added:**

| Feature | Formula | Clinical Rationale |
|---|---|---|
| age_sq | age² / 1000 | Stroke risk increases non-linearly with age |
| glucose_hyp | glucose × hypertension / 100 | Diabetic hypertensives have synergistic risk |
| bmi_age | BMI × age / 1000 | Obesity impact compounds with age |
| hyp_hd | hypertension × heart_disease | Co-occurrence of both conditions is a strong indicator |

---

### 5.2 CHD Dataset (Framingham Heart Study)

- **Source:** [Framingham Heart Study (Kaggle / GauravPadawe)](https://github.com/GauravPadawe/Framingham-Heart-Study)
- **Size:** 4,240 patients
- **Target:** 10-year risk of coronary heart disease (TenYearCHD)
- **Class balance:** 3,596 no-CHD (84.8%) vs 644 CHD (15.2%)
- **Missing values:** Handled via median imputation (glucose: 388 missing, BPMeds: 53, totChol: 50, cigsPerDay: 29, BMI: 19, heartRate: 1)
- **Features used:**

| Feature | Type | Description |
|---|---|---|
| age | Continuous | Patient age |
| currentSmoker | Binary | Currently smoking |
| cigsPerDay | Continuous | Cigarettes smoked per day |
| BPMeds | Binary | On blood pressure medication |
| prevalentStroke | Binary | History of stroke |
| prevalentHyp | Binary | Has hypertension |
| diabetes | Binary | Has diabetes |
| totChol | Continuous | Total cholesterol (mg/dL) |
| sysBP | Continuous | Systolic blood pressure (mmHg) |
| diaBP | Continuous | Diastolic blood pressure (mmHg) |
| BMI | Continuous | Body mass index (computed) |
| heartRate | Continuous | Resting heart rate (bpm) |
| glucose | Continuous | Blood glucose (mg/dL) |
| gender | Encoded | Male=1, Female=0 |

- **Engineered features added:**

| Feature | Formula | Clinical Rationale |
|---|---|---|
| pulse_pressure | sysBP − diaBP | Classic arterial stiffness marker |
| smoking_intensity | currentSmoker × cigsPerDay | Combines smoking status and dosage |
| chol_age | totChol × age / 10000 | Age-weighted cholesterol exposure |
| age_sq | age² / 1000 | Non-linear age effect on CHD |

---

### 5.3 MI Blood-Test Dataset

- **Source:** Clinically calibrated synthetic data (based on published reference ranges). The original research notebook used a hospital dataset from Zheen Hospital, Erbil, Iraq (January–May 2019), which is not publicly redistributable. The synthetic data mirrors its distributions.
- **Size:** 8,000 samples (5,200 non-MI, 2,800 MI)
- **Reference ranges used:**

| Biomarker | Normal Range | MI Range |
|---|---|---|
| CK-MB | 0–5 U/L | >6 U/L (peak 10–200) |
| Troponin | <0.04 ng/mL | >0.05 ng/mL (peak 0.1–50) |
| Age | Any | Skewed toward 45–80 (MI population) |

- **Features:**

| Feature | Description |
|---|---|
| Age | Patient age |
| CK-MB | Creatine Kinase-MB enzyme level |
| Troponin | Cardiac troponin level |
| Troponin_CKMB_ratio | Troponin ÷ CK-MB (strong MI discriminator) |

---

### 5.4 ECG Image Dataset

- **Source:** Trained in the ECG Modeling Notebook (not retrained by `build_models.py`)
- **Model file:** `ecg_mi/best_rf_model_ecg_images.pkl`
- **Classes:** 4-class classification
  - Class 0: Heart rhythm abnormality (non-MI arrhythmia)
  - Class 1: MI pattern
  - Class 2: Normal ECG
  - Class 3: Previous MI (historical pattern)

---

## 6. Machine Learning Models

### 6.1 Stroke Prediction

#### Algorithm: Random Forest Classifier

After systematic benchmarking against XGBoost, LightGBM, GradientBoosting, and Stacking ensembles, **Random Forest achieved the highest AUC-ROC** on this dataset. Boosted methods underperformed because the minority class (249 stroke cases) is too small for gradient boosting to learn reliable split rules without overfitting.

#### Hyperparameters

```python
RandomForestClassifier(
    n_estimators    = 300,       # 300 independent decision trees
    max_depth       = 10,        # Maximum tree depth (limits overfitting)
    min_samples_leaf= 4,         # Minimum 4 samples per leaf node
    max_features    = 'sqrt',    # √14 ≈ 4 features considered per split
    class_weight    = 'balanced',# Weights minority class by ~19× (249 vs 4861)
    oob_score       = True,      # Out-of-bag error estimate
    n_jobs          = -1,        # Use all CPU cores
    random_state    = 42,
)
```

#### Preprocessing Pipeline

```
Raw form input (height, weight, age, ...)
        ↓
helpers.py: compute BMI = weight / height²
        ↓
Add 4 engineered features (age_sq, glucose_hyp, bmi_age, hyp_hd)
        ↓
pipeline.transform() → ColumnTransformer → StandardScaler (14 features)
        ↓
model.predict_proba() → probability of stroke
        ↓
threshold check: prob ≥ 0.30 → "High Risk"
                 prob <  0.30 → "Low Risk"
```

#### Why threshold = 0.30?

The default classification threshold is 0.50. In medical screening, the consequence of a **false negative** (telling a patient "you're fine" when they're not) is far more dangerous than a **false positive** (unnecessary follow-up visit). Lowering the threshold to 0.30 increases **sensitivity (recall)** — the model catches more true stroke cases — at the cost of some false alarms, which is the correct trade-off for a screening tool.

---

### 6.2 Coronary Heart Disease (CHD) Prediction

#### Algorithm: Random Forest Classifier

Same selection rationale as stroke. The Framingham dataset (4,240 samples) is a classic 1970s observational study — the signal per feature is well-bounded and does not benefit from the complex interactions that boosting algorithms are designed to exploit.

#### Hyperparameters

```python
RandomForestClassifier(
    n_estimators    = 300,
    max_depth       = 8,         # Shallower than stroke (less overfitting risk)
    min_samples_leaf= 4,
    max_features    = 'sqrt',
    class_weight    = 'balanced',# Weights minority class by ~5.6× (644 vs 3596)
    oob_score       = True,
    n_jobs          = -1,
    random_state    = 42,
)
```

#### Preprocessing Pipeline

```
Raw form input (height, weight, sysBP, diaBP, cholesterol, ...)
        ↓
helpers.py: compute BMI = weight / height²
        ↓
Add 4 engineered features (pulse_pressure, smoking_intensity, chol_age, age_sq)
        ↓
pipeline.transform() → StandardScaler (18 features)
        ↓
model.predict_proba() → probability of 10-year CHD
        ↓
threshold check: prob ≥ 0.35 → "High Risk"
                 prob <  0.35 → "Low Risk"
```

#### Missing Value Handling (Training Only)

The Framingham dataset has missing values in 5 of 14 features. During training each missing value is replaced by its column's **median** — a robust imputation strategy that does not distort the distribution. At inference time, the user fills all form fields, so no imputation is needed.

---

### 6.3 Myocardial Infarction (MI) — ECG + Blood Tests

This is the most complex module. It runs **two independent models** and combines their outputs via a decision matrix to produce one of eight possible clinical narratives.

#### Sub-model A: Blood Marker Model (XGBoost)

**Why XGBoost here (not RF)?**  
The MI synthetic dataset has clean, non-overlapping biomarker distributions with 8,000 samples. XGBoost's gradient boosting handles this well, and the clean data means no overfitting risk. The RF comparison yielded identical AUC (1.0 on clean synthetic data), so XGBoost was chosen for its better calibrated probabilities.

```python
XGBClassifier(
    n_estimators    = 300,
    max_depth       = 5,
    learning_rate   = 0.05,
    subsample       = 0.8,
    colsample_bytree= 0.8,
    eval_metric     = 'auc',
    n_jobs          = -1,
    random_state    = 42,
)
```

**Input features:**

| Feature | Clinical Meaning |
|---|---|
| Age | Age-related MI risk |
| CK-MB | Creatine kinase — released when heart muscle cells die |
| Troponin | Most sensitive MI biomarker — released within 3–6 hours of MI |
| Troponin/CK-MB ratio | High ratio = strong MI signal even if CK-MB is mildly elevated |

**Decision threshold:** 0.40 — slightly more conservative than stroke because the ECG model provides complementary evidence.

---

#### Sub-model B: ECG Image Model (Random Forest)

This model was trained in the ECG Modeling Notebook and exported as `best_rf_model_ecg_images.pkl`. It processes a standard 12-lead ECG JPEG image.

**Image processing pipeline (step by step):**

```
Upload: JPEG ECG image (standard 12-lead layout, ~1200×1600 px)
         ↓
Step 1 — Lead extraction
  Hard-coded pixel coordinates extract 12 lead regions:
  Rows 300–600 (leads 1–4), 600–900 (leads 5–8), 900–1200 (leads 9–12)
  Columns: 150–643, 646–1135, 1140–1625, 1630–2125
         ↓
Step 2 — Per-lead processing (repeated 12 times)
  a) Convert RGB → Grayscale
  b) Gaussian blur (σ = 0.8) — removes high-frequency noise
  c) Otsu thresholding → binary image (foreground = ECG waveform)
  d) Resize to 300 × 450 pixels
  e) Find contours → select the largest (= main waveform signal)
  f) Resize contour to 255 × 2 matrix
  g) MinMax normalize to [0, 1]
  h) Extract column 0 → 255 values per lead
         ↓
Step 3 — Feature vector assembly
  12 leads × 255 values = 3,060 features
         ↓
Step 4 — Predict ECG class
  Class 0 = Heart rhythm abnormality
  Class 1 = MI pattern
  Class 2 = Normal
  Class 3 = Previous MI
```

---

#### Decision Matrix (combining both sub-models)

The two sub-models produce independent predictions that are combined:

```
                    ┌──────────────────────────────────────────────────┐
                    │              ECG Class                           │
                    │  0 (Rhythm)  1 (MI)   2 (Normal)  3 (Prev MI)  │
 ┌──────────────────┼──────────────────────────────────────────────────┤
 │ Blood   MI=1     │  HIGH m_1_hb HIGH m_1_mi HIGH m_1_no HIGH m_1_pm│
 │ Model   MI=0     │  HIGH m_0_hb HIGH m_0_mi  LOW m_0_no  LOW m_0_hb│
 └──────────────────┴──────────────────────────────────────────────────┘
```

**Interpretation logic:**
- **Both positive** (blood=1, ECG=1 or 3): Highest confidence MI — immediate attention recommended
- **Blood positive, ECG normal** (blood=1, ECG=2): Blood markers override normal ECG — still high risk (early MI can have normal ECG)
- **Blood negative, ECG positive** (blood=0, ECG=1): ECG overrides low blood markers — still flagged as high risk
- **Both negative** (blood=0, ECG=2): Only truly reassuring result
- **Discordant results** always return prediction='1' — when in doubt, flag

---

## 7. Model Training Pipeline

All models (except the ECG image model) are trained by running:

```bash
cd Application/
python scripts/build_models.py
```

### Training Flow

```
build_models.py
     │
     ├── train_stroke()
     │     ├── Download stroke.csv (if not cached in data/)
     │     ├── Encode categorical features
     │     ├── Fill missing BMI with median
     │     ├── Compute 4 engineered features
     │     ├── 5-fold cross-validation → print AUC + classification report
     │     ├── Fit final model on full training set
     │     ├── Save stroke/pipeline.joblib
     │     └── Save stroke/rf_under_Stroke_model.joblib
     │
     ├── train_chd()
     │     ├── Download chd.csv (if not cached)
     │     ├── Median-impute 5 columns with missing values
     │     ├── Compute 4 engineered features
     │     ├── 5-fold cross-validation → print AUC + classification report
     │     ├── Fit final model on full training set
     │     ├── Save chd/pipeline.joblib
     │     └── Save chd/rf_CHD_under_model.joblib
     │
     └── train_mi()
           ├── Generate 8,000 synthetic samples (clinically calibrated)
           ├── Compute Troponin/CK-MB ratio feature
           ├── 5-fold cross-validation → print AUC
           ├── Fit final XGBoost model
           ├── Save ecg_mi/mi_pipeline.joblib
           └── Save ecg_mi/mi_model.joblib

     Note: ecg_mi/best_rf_model_ecg_images.pkl
           must be exported separately from ECG Modeling Notebook.
```

### Model Persistence

All models are serialized with **joblib** (sklearn models) or **pickle** (ECG model, legacy). Each module saves two files:

| File | Contents | Used at inference |
|---|---|---|
| `pipeline.joblib` | Fitted `ColumnTransformer` (StandardScaler) | Normalizes user input |
| `*_model.joblib` | Fitted classifier | Makes the prediction |

### Singleton Loading (`ml_loader.py`)

```python
@lru_cache(maxsize=1)
def load_stroke_artifacts():
    return _load_first(pipeline_paths), _load_first(model_paths)
```

`@lru_cache` ensures each `.joblib` file is read from disk **exactly once** per server process. Subsequent requests reuse the in-memory objects, making inference fast (no repeated deserialization).

Fallback paths are defined for each model to maintain backward compatibility with alternative filenames from earlier notebook exports (CatBoost, XGBoost variants).

---

## 8. Model Performance & Evaluation

### Evaluation Methodology

All metrics are computed using **5-fold stratified cross-validation**, which:
- Preserves the class ratio in each fold
- Tests the model on data it has never trained on
- Produces unbiased estimates of real-world performance

The metric used is **AUC-ROC** (Area Under the Receiver Operating Characteristic Curve):
- AUC = 1.0 → perfect discrimination
- AUC = 0.5 → random guessing
- AUC > 0.7 → clinically useful

### Algorithm Selection Results (Stroke)

| Algorithm | AUC-ROC | Notes |
|---|---|---|
| Random Forest (base features) | 0.831 | Baseline |
| **Random Forest + engineered features** | **0.834** | **Chosen model** |
| GradientBoosting + engineered features | 0.830 | Close, more compute |
| XGBoost (scale_pos_weight=19) | 0.824 | Overfits on small minority class |
| LightGBM (class_weight=balanced) | 0.816 | Same issue |
| Stacking (RF + GBM + LR meta) | 0.834 | +0.0003 over RF — not worth complexity |

### Algorithm Selection Results (CHD)

| Algorithm | AUC-ROC | Notes |
|---|---|---|
| **Random Forest + engineered features** | **0.704** | **Chosen model** |
| Random Forest (base features) | 0.704 | Engineered features neutral for CHD |
| GradientBoosting | 0.687 | Worse |
| XGBoost (scale_pos_weight=5.6) | 0.652 | Worse |
| LightGBM | 0.649 | Worse |

### Final Model Metrics

#### Stroke (threshold = 0.30)

```
AUC-ROC: 0.832
OOB Accuracy: 87.7%

              Precision  Recall   F1     Support
No Disease    0.983      0.784    0.872   4861
Disease       0.149      0.739    0.248    249
```

**Reading these numbers:**
- **Recall 73.9%** means the model correctly identifies 73.9% of all stroke patients — the key medical metric
- **Precision 14.9%** means some false alarms occur — acceptable in a screening context
- **AUC 0.832** means across all thresholds the model has strong discriminative ability

#### CHD (threshold = 0.35)

```
AUC-ROC: 0.701
OOB Accuracy: 74.8%

              Precision  Recall   F1     Support
No Disease    0.925      0.553    0.692   3596
Disease       0.231      0.748    0.352    644
```

- **Recall 74.8%** for CHD — the model catches 3 out of 4 true CHD patients
- CHD's lower AUC (0.70 vs 0.83) reflects that the Framingham dataset — collected in the 1970s — has features measured with older instruments and limited genetic data

#### Why these AUC values are near the ceiling

The AUC is constrained not by the model but by the **available features and sample size**:
- Stroke: 249 positive cases in 5,110 — severe imbalance limits what any algorithm can learn
- CHD: The Framingham features (no genetics, no imaging, no inflammation markers) represent 1970s diagnostic capability
- Published literature on these exact datasets reports AUC = 0.82–0.88 (stroke), 0.70–0.78 (CHD) — our results are within this range

---

## 9. Web Application (Flask)

### Routes

| Route | Method | Template | Description |
|---|---|---|---|
| `/` | GET | `index.html` | Landing page |
| `/stroke` | GET, POST | `stroke.html` | Stroke prediction form |
| `/chd` | GET, POST | `chd.html` | CHD prediction form |
| `/ecg_mi` | GET, POST | `ecg.html` | ECG + blood test form |
| `/chat` | GET, POST | `chat.html` | Chatbot page (form-based) |
| `/chat_api` | POST | JSON | Chatbot AJAX endpoint |
| `/cities` | GET | JSON | City list for doctor finder |
| `/stroke_analysis` | GET | `stroke_analysis.html` | EDA visualizations |
| `/chd_analysis` | GET | `chd_analysis.html` | EDA visualizations |
| `/about` | GET | `about.html` | Team information |

### Prediction Request Flow (Stroke example)

```python
# 1. User submits form → POST /stroke
@app.route('/stroke', methods=['POST', 'GET'])
def stroke_prediction():
    if request.method == 'POST':

        # 2. Parse and validate form fields
        data = {
            'age':               form_int('age'),
            'hypertension':      form_int('hypertension'),
            'avg_glucose_level': form_float('avg_glucose_level'),
            'height':            form_float('height'),
            'weight':            form_float('weight'),
            ...
        }

        # 3. Load models (returns cached objects after first call)
        pipeline, model = load_stroke_artifacts()

        # 4. Run prediction
        prediction = stroke.perform_prediction(data, pipeline, model)
        # → {"prediction": "1", "Message": "..."}

        # 5. If high risk, fetch local cardiologist list
        doctors = get_doctors() if prediction['prediction'] == '1' else []

        # 6. Re-render same page with result
        return render_detector('stroke.html',
                               prediction=prediction['prediction'],
                               message=prediction['Message'],
                               doctors=doctors)
```

### Input Validation

The app validates:
- Height and weight must be positive numbers (BMI cannot be computed otherwise)
- All form fields have defaults via `form_int()` / `form_float()` helper functions
- Missing or empty strings return 0 (integer) or 0.0 (float) gracefully

Three exception types are caught separately:
- `FileNotFoundError` → model not trained yet, displays helpful message
- `TypeError / ValueError` → form data is malformed
- `Exception` → unexpected errors surfaced to the user (not swallowed silently)

---

## 10. RAG-Powered Chatbot

### Architecture

Shifaa's chatbot uses **Retrieval-Augmented Generation (RAG)** — a technique that combines a private knowledge base with a large language model:

```
User question
      ↓
1. Embed question → vector (text-embedding-3-small)
      ↓
2. Search ChromaDB → retrieve top-2 similar document chunks
      ↓
3. Assemble prompt:
   [System: "You are Shifaa, a cardiovascular AI assistant..."]
   [Context: retrieved document chunks]
   [Question: user question]
      ↓
4. Send to GPT (gpt-3.5-turbo-instruct or gpt-4o-mini)
      ↓
5. Return grounded answer
```

### Operation Modes

The `ChatBotManager` class supports two runtime modes:

| Mode | Triggered When | LLM Used |
|---|---|---|
| **RAG** | `shifaa_VDB/` exists + `OPENAI_API_KEY` set | `gpt-3.5-turbo-instruct` with ChromaDB retrieval |
| **Direct** | `GITHUB_TOKEN` set (no VDB required) | `gpt-4o-mini` via GitHub Models proxy |

### Key Design: Lazy Initialization

```python
class ChatBotManager:
    def __init__(self):
        self._qa = None    # not loaded at startup
        self._llm = None

    def _ensure_ready(self):
        if self._qa or self._llm:
            return        # already initialized — fast path
        # ... load LangChain chain / LLM on first use
```

The chatbot is **not initialized at server startup**. The heavy LangChain imports and ChromaDB connection happen only on the **first user request**. This keeps server startup fast and avoids failing at boot if the API key is missing.

### Knowledge Base (ChromaDB)

- **Vector store location:** `Application/shifaa_VDB/`
- **Collection name:** `main_collection`
- **Embedding model:** `text-embedding-3-small` (OpenAI)
- **Retrieval:** Top-2 similarity search per query
- **Content:** Cardiovascular disease knowledge (populated during ChatBot Development notebook)

### Safety Guardrails

The system prompt explicitly instructs the model:
- Never diagnose or prescribe treatment
- Always recommend consulting a healthcare professional
- Immediately escalate symptoms that need emergency care (chest pain, sudden numbness, slurred speech)

### Chat History

All conversation turns are persisted to `chats.pkl` as a Python list of `{'question': ..., 'answer': ...}` dictionaries. This file is loaded at startup and grows over time. Each successful answer is saved immediately via `pickle.dump`.

---

## 11. Doctor Finder

When a prediction returns **High Risk**, the app automatically fetches cardiologist recommendations for Al-Menoufia governorate.

### Data Source

`doctors.xlsx` contains cardiologist data scraped from **Vezeeta** (Egypt's medical appointment platform) using a custom Selenium scraper (`Vezeeta Scrapping/code.ipynb`).

### How it works

```python
def get_doctors(city='المنوفية'):
    doctor_data = pd.read_excel(DOCTORS_PATH)         # read xlsx at request time
    custom_data = doctor_data[doctor_data.city == city]
    return [
        {'name': ..., 'image': ..., 'location': ..., 'price': ...}
        for each row in custom_data
    ]
```

Each doctor card in the template shows: name, photo, clinic address, and consultation fee.

The `/cities` route returns all available cities as JSON, allowing a future dropdown to select a different city.

---

## 12. Frontend

### Language Support (EN/AR)

The application is bilingual. Switching between English and Arabic:

1. User clicks the language selector (`<select class="lang-select">`)
2. `script.js` reads the selected value, stores it in `localStorage`
3. On every page load, the script reads `localStorage` and applies translations to all elements that have `data-lng` attributes
4. Arabic activates RTL mode: `document.body.classList.add('rtl')`

### Shared Form Behavior (`detector-page.js`)

All three detector pages share:
- Scroll-to-results after prediction submission
- Image upload preview (ECG page)
- Loading state on submit button

### Prediction Result Template (`partials/prediction_result.html`)

All detector routes inject their result into the same partial template via Jinja2 context variables:
- `prediction` — `"0"` or `"1"`
- `message` — the clinical narrative string
- `doctors` — list of doctor dicts (empty if prediction=0)

---

## 13. Data Persistence

Shifaa uses **no SQL database**. All state is file-based:

| Data | File | Format | Notes |
|---|---|---|---|
| Stroke model | `stroke/pipeline.joblib` + `rf_under_Stroke_model.joblib` | joblib | Committed to repo |
| CHD model | `chd/pipeline.joblib` + `rf_CHD_under_model.joblib` | joblib | Committed to repo |
| MI blood model | `ecg_mi/mi_pipeline.joblib` + `mi_model.joblib` | joblib | Committed to repo |
| ECG image model | `ecg_mi/best_rf_model_ecg_images.pkl` | pickle | Exported from notebook |
| Vector store | `shifaa_VDB/` | ChromaDB (SQLite + binary) | Git-ignored |
| Chat history | `chats.pkl` | Python pickle | Git-ignored, auto-created |
| Uploaded ECG images | `ecg_mi/images/<timestamp>_<filename>` | JPEG | Git-ignored, transient |
| Doctor data | `doctors.xlsx` | Excel | Committed to repo |
| Training data cache | `data/stroke.csv`, `data/chd.csv` | CSV | Downloaded on first run |

### Trade-offs

**Why no database?**  
- The app has no user accounts or multi-user state — there is nothing relational to store
- Model files are large binary blobs that databases handle poorly
- File-based storage has zero configuration overhead and works identically in development and production

**Why pickle for chat history?**  
- Simple flat list of dicts with no query needs
- Could be upgraded to SQLite if search/filter capability were needed

---

## 14. Deployment

### Development

```bash
cd Application/
pip install -r requirements.txt
python scripts/build_models.py    # first time only — trains and saves models
python app.py                     # starts at http://127.0.0.1:5000
```

### Production (Gunicorn)

```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

- `-w 4` runs 4 worker processes, each with its own copy of the models in memory
- Port 8000 is typically proxied through Nginx

### Docker

```bash
docker build -t shifaa .
docker run -p 5000:5000 shifaa
```

The `Dockerfile` copies the application code, installs dependencies, and starts gunicorn.

### Environment Variables

```bash
# Application/.env
OPENAI_API_KEY=sk-...       # Required for RAG chatbot
GITHUB_TOKEN=ghp_...        # Alternative: GitHub Models free tier
```

### Runtime Constraints

| Constraint | Reason |
|---|---|
| Python 3.9.13 | Model `.joblib` files were serialized with Python 3.9 — pickle format is version-sensitive |
| scikit-learn ≥1.3, <1.4 | Models were fitted with 1.3.x — a 1.4+ runtime will raise a deserialization error |
| opencv-python==4.9.0.80 | ECG image processing depends on specific behavior of this version |

---

## 15. End-to-End Request Flow

Below is a complete trace of what happens when a user submits the ECG/MI form:

```
1. Browser
   User fills Age=65, CK-MB=32, Troponin=0.8, uploads ECG JPEG
   Clicks "Check Your Heart" → POST /ecg_mi

2. Flask app.py → ecg_mi_prediction()
   ├── Reads file from request.files['image']
   ├── Saves to ecg_mi/images/1719500000_ecg.jpg
   ├── Parses data = {'Age': 65, 'CK-MB': 32, 'Troponin': 0.8}
   ├── Calls load_ecg_image_model() → returns cached RF (from .pkl)
   └── Calls load_mi_artifacts() → returns cached XGBoost + StandardScaler

3. ecg_mi/helpers.py → mi_ecg_prediction()

   ── Branch A: ECG Image ──
   ├── ecg_prediction(image_path, ecg_model)
   │     ├── process_ecg_image() reads JPEG with OpenCV
   │     ├── Extracts 12 lead regions (hard-coded pixel boxes)
   │     ├── Per lead: grayscale → Gaussian blur → Otsu threshold
   │     │           → find contours → resize to 255×2 → MinMax scale
   │     ├── Assembles 3,060-feature vector
   │     └── ecg_model.predict([features]) → class 1 (MI pattern)
   │
   ── Branch B: Blood Markers ──
   ├── mi_prediction({'Age':65,'CK-MB':32,'Troponin':0.8}, pipeline, model)
   │     ├── Compute ratio = 0.8 / (32 + 1e-6) = 0.025
   │     ├── input_df = [65, 32, 0.8, 0.025]
   │     ├── pipeline.transform(input_df) → scaled array
   │     ├── model.predict_proba(scaled) → [0.08, 0.92]
   │     └── 0.92 ≥ 0.40 → returns 1 (MI positive)
   │
   ── Decision matrix ──
   └── blood=1, ecg=1 → {'prediction':'1', 'Message': m_1_mi}
       "Our recent analysis of your ECG data and blood test results
        have indicated a positive prediction for Myocardial Infarction..."

4. app.py
   ├── prediction['prediction'] == '1' → calls get_doctors('المنوفية')
   │     └── reads doctors.xlsx → returns list of cardiologists
   └── render_detector('ecg.html', prediction='1', message=..., doctors=[...])

5. Browser
   Receives rendered HTML with:
   ├── Red alert box: MI positive message
   └── Doctor cards: name, photo, location, price
```

---

## 16. Key Design Decisions

### Why one Flask monolith instead of microservices?

A graduation project needs to run on a single machine with minimal infrastructure. Separate services for each predictor would require Docker Compose, inter-service networking, and distributed error handling — none of which adds educational value here. The monolith is simpler to develop, deploy, and demonstrate.

### Why no ORM / database?

See [Section 13](#13-data-persistence). The access pattern is: load everything at startup, read from disk on each request for doctor data, write once per chat message. None of these require relational queries.

### Why serialize pipeline and model separately?

In `helpers.py`, the prediction path is:
```
pipeline.transform(input) → preprocessed → model.predict_proba(preprocessed)
```

Saving them separately allows the `ml_loader.py` fallback system to try alternative filenames for each independently. It also makes it possible to swap just the model without changing the scaler (useful when experimenting with algorithms during development).

### Why lower the classification threshold?

A cardiovascular screening tool should minimize false negatives (missing real disease), not maximize accuracy. At threshold 0.50, the models would have lower sensitivity. At 0.30 (stroke) and 0.35 (CHD), we accept more false positives (unnecessary doctor visits) to catch more true positives (actual patients who need care).

### Why use SMOTE? (And why we ultimately did not)

SMOTE (Synthetic Minority Over-sampling TEchnique) was benchmarked during model selection. It **reduced AUC** on both datasets because:
1. It was combined with `class_weight='balanced'` — double correction
2. The Stroke dataset's 249 positive samples are real stroke patients — synthetic interpolations between them are not medically realistic and add noise

The `class_weight='balanced'` parameter alone provides the correct imbalance correction without introducing artificial samples.

---

## 17. Glossary

| Term | Definition |
|---|---|
| **AUC-ROC** | Area Under the Receiver Operating Characteristic Curve. Measures a classifier's ability to distinguish between classes across all thresholds. 1.0 = perfect. |
| **Recall (Sensitivity)** | TP / (TP + FN). The fraction of actual positive cases the model identifies. Critical metric for medical screening. |
| **Precision** | TP / (TP + FP). The fraction of predicted positives that are actually positive. |
| **Class imbalance** | When one class (e.g., stroke patients) is far less common than the other. Standard classifiers default to always predicting the majority class. |
| **class_weight='balanced'** | Adjusts the loss function to penalize misclassifying the minority class more heavily, proportional to its inverse frequency. |
| **OOB Score** | Out-of-Bag Score. For Random Forests, each tree is tested on the samples not used in its bootstrap training sample. Provides a free internal validation estimate. |
| **StandardScaler** | Transforms features to zero mean and unit variance: z = (x − μ) / σ. Required for distance-based algorithms; neutral but harmless for trees. |
| **ColumnTransformer** | Applies different transformations to different feature subsets. Used here to apply StandardScaler to all features at once. |
| **Otsu Threshold** | An automatic method to find the optimal binary threshold that maximizes between-class variance in a grayscale image. |
| **Contour** | A curve joining continuous points of the same intensity in an image. Used to trace ECG waveforms after thresholding. |
| **RAG** | Retrieval-Augmented Generation. Combines a document search step with an LLM to produce answers grounded in a specific knowledge base rather than just the model's training data. |
| **ChromaDB** | An open-source vector database. Stores text as numerical embeddings and retrieves similar documents by cosine similarity. |
| **Embedding** | A dense numerical vector that represents text in a high-dimensional space, where semantically similar texts are geometrically close. |
| **lru_cache** | Python's Least Recently Used cache decorator. When applied to a function, caches the return value so subsequent calls with the same arguments skip re-execution. |
| **CK-MB** | Creatine Kinase-Myocardial Band. An enzyme released into the blood when heart muscle cells are damaged. |
| **Troponin** | A cardiac protein released into blood within 3–6 hours of heart muscle cell death. The gold-standard biomarker for myocardial infarction. |
| **Pulse Pressure** | Systolic BP − Diastolic BP. A marker of arterial stiffness and an independent predictor of cardiovascular risk. |
| **ECG (Electrocardiogram)** | A recording of the heart's electrical activity over time. A 12-lead ECG records from 12 different angles of the heart. |
| **MI (Myocardial Infarction)** | Heart attack. Occurs when blood flow to part of the heart muscle is blocked, causing cell death. |
| **CHD (Coronary Heart Disease)** | Narrowing of the coronary arteries due to plaque buildup, reducing blood supply to the heart. |
| **Framingham Risk Score** | A 10-year CHD risk estimation model developed from the Framingham Heart Study (Massachusetts, 1948–present). The dataset used in this project is derived from it. |
| **Jinja2** | Flask's templating engine. Allows embedding Python-like expressions in HTML using `{{ variable }}` and `{% block %}` syntax. |
| **Gunicorn** | A Python WSGI HTTP server for production. Runs multiple worker processes to handle concurrent requests. |

---

*Shifaa Graduation Project · Faculty of Computers and Information · Menoufia University*
