# Urothelial Cell Segmentation Web App

This project is a full-stack application for semantic segmentation of urothelial cell images using a React frontend and a Django backend.

## 🧬 Features

- Upload sample cell images and get predicted segmentation masks
- Compare ground truth and model prediction side-by-side
- View classification metrics including AUROC and per-class precision/recall

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

---

### 2. Set Up and Run the Backend

#### a. Create a virtual environment (optional but recommended)

```bash
cd backend
python -m venv segment_env
source segment_env/Scripts/activate   # On Windows
# OR
source segment_env/bin/activate       # On Mac/Linux
```

#### b. Install Python dependencies

```bash
pip install -r requirements.txt
```



#### c. Start the Django development server

```bash
python manage.py runserver
```

The backend will be running at: [http://localhost:8000](http://localhost:8000)

---

### 3. Set Up and Run the Frontend

```bash
cd ../frontend
npm install
npm start
```

The React app will open automatically in your browser at: [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
CellSegmentationFullStack/
├── backend/         # Django project
│   ├── api/         # Django app
│   └── backend/
├── frontend/        # React frontend
│   ├── public/
│   └── src/
└── README.md
```

---

## 📦 Required NPM Packages

These are automatically installed with `npm install`, but for reference:

- `axios` – for HTTP requests
- `react` – frontend framework
- `react-dom` – DOM binding
- `react-scripts` – CLI scripts
- (others may include dependencies from `package.json`)

---

## 📝 Notes

- Sample cell images and ground truth masks are located in:  
  `frontend/public/sample_imgs/`
- Segmentation models are loaded from:  
  `backend/api/seg_models/bestunet_model.pkl`

---

## ✅ To Do
- [ ] Add option to upload user image
- [ ] Add "sign in" feature
- [ ] Add authentication
- [ ] Improve model selection interface
- [ ] Deploy to cloud
- [ ] add write up to explain problem and models.
- [ ] Update UI from simple HTML.

---

## 📧 Contact

For questions, feel free to reach out or open an issue on GitHub.
