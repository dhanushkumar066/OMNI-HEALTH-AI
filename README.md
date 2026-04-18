# OmniHealth AI

An AI-powered medical diagnostic system that combines multiple machine learning models for comprehensive health analysis including symptom checking, liver disease prediction, brain MRI analysis, and chest X-ray interpretation.

## Features

- **Symptom Checker**: Random Forest model for disease prediction based on symptoms
- **Liver Disease Prediction**: Gradient Boosting model for liver health assessment
- **Brain MRI Analysis**: CNN model for brain tumor detection (glioma, meningioma, pituitary, no tumor)
- **Chest X-ray Analysis**: CNN model for pneumonia detection
- **Web Interface**: Modern React frontend with Tailwind CSS
- **REST API**: FastAPI backend for model inference

## Project Structure

```
├── ai-backend/          # Python FastAPI backend
│   ├── main.py         # Main API server
│   ├── predict_image.py # Image prediction endpoints
│   ├── predict_symptoms.py # Symptom prediction endpoints
│   └── requirements.txt
├── frontend/           # React web application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── node-backend/       # Node.js server (if needed)
├── models/            # Trained ML models
│   ├── symptom_model.pkl
│   ├── liver_model.pkl
│   ├── brain_model.h5
│   ├── chest_model.h5
│   └── *.json (metadata)
├── data/              # Datasets (CSV files included)
├── train_all_models.py # Model training script
├── download_datasets.py # Dataset download script
└── requirements.txt   # Python dependencies
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhanushkumar066/OMNI-HEALTH-AI.git
   cd OMNI-HEALTH-AI
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r ai-backend/requirements.txt
   ```

3. **Download datasets** (optional - models are pre-trained)
   ```bash
   python download_datasets.py
   ```

4. **Train models** (optional - pre-trained models included)
   ```bash
   python train_all_models.py
   ```

5. **Start the AI backend**
   ```bash
   cd ai-backend
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

### Node Backend (Optional)

```bash
cd node-backend
npm install
npm start
```

## API Endpoints

### Symptom Prediction
```
POST /predict/symptoms
Body: {"symptoms": ["fever", "cough", "fatigue"]}
```

### Liver Prediction
```
POST /predict/liver
Body: {"age": 30, "gender": "Male", "tb": 1.2, ...}
```

### Image Analysis
```
POST /predict/image
Form: file (brain MRI or chest X-ray image)
```

## Model Performance

- **Symptom Model**: ~85% accuracy (Random Forest)
- **Liver Model**: ~75% accuracy (Gradient Boosting)
- **Brain MRI Model**: ~92% accuracy (CNN)
- **Chest X-ray Model**: ~88% accuracy (CNN)

## Technologies Used

- **Machine Learning**: TensorFlow, scikit-learn, XGBoost
- **Backend**: FastAPI, Python
- **Frontend**: React, Tailwind CSS, Vite
- **Data Processing**: Pandas, NumPy
- **Visualization**: Matplotlib

## Usage

1. Start the backend server
2. Start the frontend development server
3. Open http://localhost:5173 in your browser
4. Use the web interface to:
   - Check symptoms for disease prediction
   - Upload medical images for analysis
   - View prediction results and confidence scores

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and research purposes. Please consult medical professionals for actual health advice.

## Disclaimer

This AI system is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with questions about medical conditions.