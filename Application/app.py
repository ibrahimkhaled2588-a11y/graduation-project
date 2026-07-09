import os
import pickle
import time

import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

import analytics
import chd
import ecg_mi
import stroke
from ChatBot import ChatBotManager
from ml_loader import (
    BASE_DIR,
    load_chd_artifacts,
    load_ecg_image_model,
    load_mi_artifacts,
    load_stroke_artifacts,
    mi_models_available,
)

load_dotenv(os.path.join(BASE_DIR, '.env'))
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', '')

app = Flask(__name__)
chatbot = ChatBotManager()
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'ecg_mi', 'images')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CHATS_PATH = os.path.join(BASE_DIR, 'chats.pkl')
DOCTORS_PATH = os.path.join(BASE_DIR, 'doctors.xlsx')

try:
    with open(CHATS_PATH, 'rb') as file:
        chats = pickle.load(file)
except (FileNotFoundError, EOFError, pickle.UnpicklingError):
    chats = []


def form_int(key, default=0):
    value = request.form.get(key, '')
    if value is None or str(value).strip() == '':
        return default
    return int(value)


def form_float(key, default=0.0):
    value = request.form.get(key, '')
    if value is None or str(value).strip() == '':
        return default
    return float(value)


def render_detector(template, prediction='0', message='', doctors=None):
    return render_template(
        template,
        prediction=str(prediction),
        message=message or '',
        doctors=doctors or [],
    )


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/cities', methods=['GET'])
def get_cities():
    doctor_data = pd.read_excel(DOCTORS_PATH)
    return list(doctor_data.city.unique())


@app.route('/chat_api', methods=['POST'])
def chat_api():
    try:
        question = request.form.get('question', '')
        if not question.strip():
            return jsonify({'error': 'Missing question'}), 400
        answer = chatbot.generate_answer(question)
        return jsonify({'answer': answer})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/stroke', methods=['POST', 'GET'])
def stroke_prediction():
    if request.method == 'POST':
        try:
            data = {
                'age': form_int('age'),
                'hypertension': form_int('hypertension'),
                'heart_disease': form_int('heart_disease'),
                'avg_glucose_level': form_float('avg_glucose_level'),
                'height': form_float('height'),
                'weight': form_float('weight'),
                'gender': form_int('gender'),
                'ever_married': form_int('ever_married'),
                'work_type': form_int('work_type'),
                'Residence_type': form_int('Residence_type'),
                'smoking_status': form_int('smoking_status'),
            }

            if data['height'] <= 0 or data['weight'] <= 0:
                return render_detector(
                    'stroke.html',
                    prediction='0',
                    message='Please enter valid height (meters) and weight (kg).',
                )

            pipeline, model = load_stroke_artifacts()
            prediction = stroke.perform_prediction(data, pipeline, model)
            doctors = get_doctors() if prediction['prediction'] == '1' else []
            return render_detector(
                'stroke.html',
                prediction=prediction['prediction'],
                message=prediction['Message'],
                doctors=doctors,
            )
        except FileNotFoundError as e:
            return render_detector(
                'stroke.html',
                prediction='0',
                message=str(e),
            )
        except (TypeError, ValueError) as e:
            return render_detector(
                'stroke.html',
                prediction='0',
                message=f'Please complete all fields with valid numbers. ({e})',
            )
        except Exception as e:
            return render_detector(
                'stroke.html',
                prediction='0',
                message=f'Unexpected error: {e}',
            )

    return render_detector('stroke.html')


@app.route('/chd', methods=['POST', 'GET'])
def chd_prediction():
    if request.method == 'POST':
        try:
            data = {
                'age': form_int('age'),
                'currentSmoker': form_int('currentSmoker'),
                'cigsPerDay': form_int('cigsPerDay'),
                'BPMeds': form_int('BPMeds'),
                'prevalentStroke': form_int('prevalentStroke'),
                'prevalentHyp': form_int('prevalentHyp'),
                'diabetes': form_int('diabetes'),
                'totChol': form_int('totChol'),
                'sysBP': form_int('sysBP'),
                'diaBP': form_int('diaBP'),
                'height': form_float('height'),
                'weight': form_float('weight'),
                'heartRate': form_int('heartRate'),
                'glucose': form_int('glucose'),
                'gender': form_int('gender'),
            }

            if data['height'] <= 0 or data['weight'] <= 0:
                return render_detector(
                    'chd.html',
                    prediction='0',
                    message='Please enter valid height (meters) and weight (kg).',
                )

            pipeline, model = load_chd_artifacts()
            prediction = chd.perform_prediction(data, pipeline, model)
            doctors = get_doctors() if prediction['prediction'] == '1' else []
            return render_detector(
                'chd.html',
                prediction=prediction['prediction'],
                message=prediction['Message'],
                doctors=doctors,
            )
        except FileNotFoundError as e:
            return render_detector(
                'chd.html',
                prediction='0',
                message=str(e),
            )
        except (TypeError, ValueError) as e:
            return render_detector(
                'chd.html',
                prediction='0',
                message=f'Please complete all fields with valid numbers. ({e})',
            )
        except Exception as e:
            return render_detector(
                'chd.html',
                prediction='0',
                message=f'Unexpected error: {e}',
            )

    return render_detector('chd.html')


@app.route('/ecg_mi', methods=['POST', 'GET'])
def ecg_mi_prediction():
    if request.method == 'POST':
        try:
            if 'image' not in request.files:
                return render_detector(
                    'ecg.html',
                    prediction='0',
                    message='Please upload an ECG image.',
                )

            file = request.files['image']
            if not file or file.filename == '':
                return render_detector(
                    'ecg.html',
                    prediction='0',
                    message='Please upload an ECG image.',
                )

            data = {
                'Age': form_int('Age'),
                'CK-MB': form_int('CK-MB'),
                'Troponin': form_float('Troponin'),
            }

            safe_name = f'{int(time.time())}_{file.filename}'
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_name)
            file.save(file_path)

            ecg_model = load_ecg_image_model()
            mi_pipeline, mi_model = (None, None)
            if mi_models_available():
                mi_pipeline, mi_model = load_mi_artifacts()

            prediction = ecg_mi.mi_ecg_prediction(
                data, mi_pipeline, mi_model, file_path, ecg_model,
            )
            doctors = get_doctors() if prediction['prediction'] == '1' else []
            return render_detector(
                'ecg.html',
                prediction=prediction['prediction'],
                message=prediction['Message'],
                doctors=doctors,
            )
        except FileNotFoundError as e:
            return render_detector(
                'ecg.html',
                prediction='0',
                message=str(e),
            )
        except (TypeError, ValueError) as e:
            return render_detector(
                'ecg.html',
                prediction='0',
                message=f'Please enter valid values for all fields. ({e})',
            )
        except Exception as e:
            return render_detector(
                'ecg.html',
                prediction='0',
                message=f'Unexpected error: {e}',
            )

    return render_detector('ecg.html')


@app.route('/chat', methods=['POST', 'GET'])
def chat_page():
    if request.method == 'POST':
        try:
            question = request.form.get('question', '').strip()
            if not question:
                return render_template('chat.html', chats=chats, error='Please enter a question.')
            answer = chatbot.generate_answer(question)
            chats.append({'question': question, 'answer': answer})
            save_questions(chats)
            return render_template('chat.html', chats=chats)
        except Exception as e:
            return render_template('chat.html', chats=chats, error=str(e))
    return render_template('chat.html', chats=chats)


@app.route('/stroke_analysis')
def stroke_analysis():
    return render_template('stroke_analysis.html')


@app.route('/chd_analysis')
def chd_anlaysis():
    return render_template('chd_analysis.html')


@app.route('/api/stroke-analysis')
def stroke_analysis_data():
    gender = request.args.get('gender')
    return jsonify(analytics.get_stroke_stats(gender))


@app.route('/api/chd-analysis')
def chd_analysis_data():
    gender = request.args.get('gender')
    return jsonify(analytics.get_chd_stats(gender))


@app.route('/about')
def about():
    return render_template('about.html')


def get_doctors(city='المنوفية'):
    if not os.path.isfile(DOCTORS_PATH):
        return []
    doctor_data = pd.read_excel(DOCTORS_PATH)
    if 'city' not in doctor_data.columns:
        return []
    custom_data = doctor_data[doctor_data.city == city]
    data_list = []
    for i in range(len(custom_data)):
        row_data = custom_data.iloc[i]
        data_list.append({
            'name': str(row_data.iloc[0]),
            'image': row_data.image,
            'location': row_data.location,
            'price': row_data.price,
        })
    return data_list


def save_questions(chat_list):
    with open(CHATS_PATH, 'wb') as file:
        pickle.dump(chat_list, file)


if __name__ == '__main__':
    app.run(debug=True)
