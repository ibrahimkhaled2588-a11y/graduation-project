# Shifaa — AI-Powered Cardiovascular Disease Prevention System

Shifaa is a full-stack web application that uses machine learning to predict cardiovascular risk, analyze ECG images, and provide a medical AI chatbot — helping users detect heart disease early and connect with local cardiologists.

---

## Features

| Module | Description |
|--------|-------------|
| **Stroke Risk Detector** | Predicts stroke risk from 11 health indicators using a Random Forest model |
| **CHD Risk Detector** | Predicts 10-year coronary heart disease risk from 15 clinical metrics (Framingham model) |
| **ECG + MI Detector** | Analyzes a 12-lead ECG image and blood markers (CK-MB, Troponin) to detect myocardial infarction |
| **AI Medical Chatbot** | RAG-based chatbot (OpenAI + ChromaDB) for cardiovascular health Q&A |
| **Doctor Finder** | Shows nearby cardiologists (sourced from Vezeeta) when high risk is detected |
| **Data Dashboards** | Embedded Power BI dashboards for CHD and stroke trend analysis |
| **Multi-language UI** | English / Arabic with RTL layout support |

---

## Tech Stack

**Backend:** Python 3.9, Flask, scikit-learn, OpenCV, LangChain, OpenAI, ChromaDB  
**Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5, Swiper.js  
**ML:** Random Forest classifiers, scikit-learn pipelines, ECG image feature extraction  
**Data:** Kaggle Stroke Dataset, Framingham Heart Study, synthetic MI data, Vezeeta doctor data  

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd Graduation-Project-main/Application
pip install -r requirements.txt
```

### 2. Build ML models

Downloads datasets and trains all models (stroke, CHD, MI). Only needed once.

```bash
python scripts/build_models.py
```

### 3. Configure the chatbot (optional)

Create a `.env` file in the `Application/` directory:

```
OPENAI_API_KEY=your_openai_api_key_here
```

Then run `ChatBot Development/ChatBot_Development.ipynb` to build the `shifaa_VDB/` Chroma vector database and copy the resulting directory into `Application/shifaa_VDB/`.

### 4. Run the development server

```bash
python app.py
```

Visit [http://127.0.0.1:5000](http://127.0.0.1:5000)

### 5. Production deployment

```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

---

## Project Structure

```
Graduation-Project-main/
├── Application/                # Flask web app (deployable)
│   ├── app.py                  # Entry point — all routes
│   ├── ml_loader.py            # Model loading with fallbacks
│   ├── messages.py             # Prediction result message templates
│   ├── requirements.txt
│   ├── runtime.txt             # Python 3.9.13
│   ├── .env                    # OPENAI_API_KEY (not committed)
│   │
│   ├── stroke/                 # Stroke risk prediction module
│   ├── chd/                    # Coronary heart disease module
│   ├── ecg_mi/                 # ECG image + myocardial infarction module
│   ├── ChatBot/                # LangChain RAG chatbot module
│   ├── shifaa_VDB/             # ChromaDB vector store (generated)
│   │
│   ├── scripts/
│   │   └── build_models.py     # Train and export all ML models
│   │
│   ├── templates/              # Jinja2 HTML templates
│   ├── static/                 # CSS, JS, images
│   └── doctors.xlsx            # Cardiologist contact database
│
├── CHD/                        # CHD modeling notebook
├── Stroke/                     # Stroke modeling notebook
├── MI/                         # Myocardial infarction notebook
├── ECG/                        # ECG processing + modeling notebooks
├── ChatBot Development/        # Chatbot training + vector DB notebook
├── Power-Bi-Dashboards/        # Dashboard screenshots
├── Vezeeta Scrapping/          # Doctor data collection notebook
└── DOCUMENTATION.md            # Full technical documentation
```

---

## ML Models

| Condition | Algorithm | Features | Dataset |
|-----------|-----------|----------|---------|
| Stroke | Random Forest (200 trees, max_depth=12) | 10 health indicators | Kaggle Stroke Dataset |
| CHD | Random Forest (200 trees, max_depth=10) | 14 clinical metrics | Framingham Heart Study |
| MI (Blood) | Random Forest | Age, CK-MB, Troponin | Synthetic (4,000 samples) |
| ECG (Image) | Random Forest | ~3,000 image features | ECG image dataset |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Home page |
| GET/POST | `/stroke` | Stroke risk prediction |
| GET/POST | `/chd` | CHD risk prediction |
| GET/POST | `/ecg_mi` | ECG + MI detection |
| GET/POST | `/chat` | Chatbot interface |
| POST | `/chat_api` | Chatbot JSON API |
| GET | `/stroke_analysis` | Stroke Power BI dashboard |
| GET | `/chd_analysis` | CHD Power BI dashboard |
| GET | `/about` | About & team page |
| GET | `/cities` | City list (JSON) |

---

## Datasets

- [CHD Dataset](https://www.kaggle.com/datasets/captainozlem/framingham-chd-preprocessed-data) — Framingham Heart Study
- [Stroke Dataset](https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset)
- [ECG Dataset](https://data.mendeley.com/datasets/gwbz3fsgp8/2)
- [MI Dataset](https://data.mendeley.com/datasets/wmhctcrt5v/1)

---

## Team

| Name | GitHub |
|------|--------|
| Ahmed Basem El-Basiouny | [@ahmedbasemdev](https://github.com/ahmedbasemdev) |
| Ahmed Tarek Salam | [@AhmedSalam24](https://github.com/AhmedSalam24) |
| Roqia Adel Shehata | [@Roqia11](https://github.com/Roqia11) |
| Rowida Adel Shehata | [@RowidaAdel](https://github.com/RowidaAdel) |
| Salma Adel Saleh | [@salmadel](https://github.com/salmadel) |
| Sherif Ali El-Shafey | [@SherifElshafeyy](https://github.com/SherifElshafeyy) |

---

## License

MIT License

---

> **Disclaimer:** Shifaa is an educational and research tool. It is **not a substitute for professional medical advice**. Always consult a qualified physician for diagnosis and treatment.
