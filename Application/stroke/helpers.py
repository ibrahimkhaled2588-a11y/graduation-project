import pandas as pd

postive_message = """
Our recent analysis using the cardiovascular
prediction system indicates an elevated risk for
stroke. It's crucial to view this as a proactive
opportunity for early intervention and management.
Sorry, Please schedule a visit with a healthcare
provider for a comprehensive evaluation and
personalized advice.
Get well soon."""

negative_message="""
Good news from your recent health assessment:
your stroke risk is low based on our analysis. It's a
positive sign, but staying on a healthy path is key.
Keep up with balanced eating, exercise, and stress
management.
Best."""

_THRESHOLD = 0.30  # Lower threshold favours recall — critical for stroke screening


def perform_prediction(sample_input_data, pipeline, model):
    intput_df = pd.DataFrame(sample_input_data, index=[0])
    intput_df['bmi'] = intput_df.weight / (intput_df.height * intput_df.height)
    intput_df = intput_df.drop(['height', 'weight'], axis=1)

    # Engineered features — must match build_models.py:add_stroke_features()
    intput_df['age_sq'] = (intput_df['age'] ** 2) / 1000
    intput_df['glucose_hyp'] = intput_df['avg_glucose_level'] * intput_df['hypertension'] / 100
    intput_df['bmi_age'] = intput_df['bmi'] * intput_df['age'] / 1000
    intput_df['hyp_hd'] = intput_df['hypertension'] * intput_df['heart_disease']

    preprocessed_data = pipeline.transform(intput_df)
    prob_positive = model.predict_proba(preprocessed_data)[0][1]
    if prob_positive >= _THRESHOLD:
        return {"prediction": "1", "Message": postive_message}
    return {"prediction": "0", "Message": negative_message}
