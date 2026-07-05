import pandas as pd
from cv2 import imread
from skimage import color, measure
from skimage.filters import gaussian, threshold_otsu
from skimage.transform import resize
from sklearn.preprocessing import MinMaxScaler

import messages


def process_ecg_image(image_path):
    image = imread(image_path)
    if image is None:
        raise ValueError('Could not read the uploaded ECG image.')

    leads = [
        image[300:600, 150:643],
        image[300:600, 646:1135],
        image[300:600, 1140:1625],
        image[300:600, 1630:2125],
        image[600:900, 150:643],
        image[600:900, 646:1135],
        image[600:900, 1140:1625],
        image[600:900, 1630:2125],
        image[900:1200, 150:643],
        image[900:1200, 646:1135],
        image[900:1200, 1140:1625],
        image[900:1200, 1630:2125],
    ]

    flattened_leads_data = []

    for lead in leads:
        grayscale_image = color.rgb2gray(lead) if lead.ndim == 3 else lead
        blurred_image = gaussian(grayscale_image, sigma=0.8)
        global_threshold = threshold_otsu(blurred_image)
        binary_image = resize(blurred_image < global_threshold, (300, 450))

        contours = measure.find_contours(binary_image, 0.8)
        if not contours:
            continue

        contours_shape = sorted([x.shape for x in contours], reverse=True)[0:1]
        resized_contour = None
        for contour in contours:
            if contour.shape in contours_shape:
                resized_contour = resize(contour, (255, 2))
                break

        if resized_contour is None:
            continue

        scaler = MinMaxScaler()
        fit_transformed_data = scaler.fit_transform(resized_contour)
        flattened_leads_data.extend(fit_transformed_data[:, 0].tolist())

    if not flattened_leads_data:
        raise ValueError(
            'Could not extract ECG waveform from this image. '
            'Please upload a standard 12-lead ECG layout.'
        )

    return pd.DataFrame([flattened_leads_data])


_MI_THRESHOLD = 0.40  # Blood-marker threshold; ECG provides complementary signal


def mi_prediction(input_data, pipeline, model):
    input_df = pd.DataFrame(input_data, index=[0])
    # Troponin/CK-MB ratio — strong MI signal, must match build_models.py:train_mi()
    input_df['Troponin_CKMB_ratio'] = input_df['Troponin'] / (input_df['CK-MB'] + 1e-6)
    preprocessed_data = pipeline.transform(input_df)
    prob_positive = model.predict_proba(preprocessed_data)[0][1]
    return int(prob_positive >= _MI_THRESHOLD)


def ecg_prediction(image_path, model):
    processed_image = process_ecg_image(image_path)
    return model.predict(processed_image)[0]


def _ecg_only_result(ecg_output):
    """When MI blood models are unavailable, interpret ECG class only."""
    if ecg_output in (1, 2, 3):
        return {
            'prediction': '1',
            'Message': messages.m_0_mi,
        }
    return {
        'prediction': '0',
        'Message': messages.m_0_no,
    }


def mi_ecg_prediction(input_data, mi_pipeline, mi_model, image_path, ecg_model):
    ecg_output = ecg_prediction(image_path, ecg_model)

    if mi_pipeline is None or mi_model is None:
        return _ecg_only_result(ecg_output)

    mi_output = mi_prediction(input_data, mi_pipeline, mi_model)

    if mi_output == 1:
        if ecg_output == 0:
            return {'prediction': '1', 'Message': messages.m_1_hb}
        if ecg_output == 1:
            return {'prediction': '1', 'Message': messages.m_1_mi}
        if ecg_output == 2:
            return {'prediction': '1', 'Message': messages.m_1_no}
        if ecg_output == 3:
            return {'prediction': '1', 'Message': messages.m_1_pm}
    else:
        if ecg_output == 0:
            return {'prediction': '1', 'Message': messages.m_0_hb}
        if ecg_output == 1:
            return {'prediction': '1', 'Message': messages.m_0_mi}
        if ecg_output == 2:
            return {'prediction': '0', 'Message': messages.m_0_no}
        if ecg_output == 3:
            return {'prediction': '0', 'Message': messages.m_0_hb}

    return {'prediction': '0', 'Message': messages.m_0_no}
