# Citizen's Eye – AI-Powered Traffic Complaint System

End-to-end reference implementation that fulfils the Citizen's Eye mandate: citizens report traffic violations, officers triage/enforce, and analytics close the accountability loop.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS, React Router, Axios, Recharts, Chart.js.
- **Backend**: Python 3.10+, Flask, Flask-CORS, PyMongo (`mongomock` fallback for local dev).
- **Database**: MongoDB (Atlas/Local). The backend automatically falls back to an in-memory mock if `MONGODB_URI` is not set.
- **Datasets**: Kaggle sources listed in `data/datasets.md`, with a lightweight sample (`data/sample_violation_dataset.csv`) checked in for demos.

## Project Structure

```
backend/              Flask API, Mongo models, ML mock endpoint
frontend/             React + Tailwind client (citizen + officer portals)
data/                 Kaggle references + sample CSV for seeding
docs/                 Architecture notes and planning artifacts
```

## Backend – Quick Start

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # PowerShell
pip install -r requirements.txt

# optional: copy env template
copy env.sample .env

flask --app app run --debug
```

### Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `MONGODB_URI` | *(empty)* | Atlas/local URI. When empty the app uses `mongomock`. |
| `MONGODB_DB` | `citizens_eye` | Database name. |
| `ALLOW_MOCK_STORAGE` | `true` | When true, images are stored as base64 strings + generated URLs. |
| `SEED_DATA` | `true` | Populates sample users/complaints/actions on startup. |

## Frontend – Quick Start

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` to point to your backend:

```
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

## Citizen Journey

1. Login as a citizen (sample credentials in `backend/seed_data.py`).
2. Submit a violation with image upload – timestamp and location are captured automatically.
3. Track complaint status in the dashboard; once resolved, submit feedback.

## Officer Journey

1. Login as officer to access RBAC-protected inbox.
2. Filter complaints by status/zone/violation, open details with citizen + ML data.
3. Log actions (issue notice, mark resolved, request info) which notify the citizen UI.
4. Review analytics (hotspots, top violations, average resolution time) powered by `/api/analytics/summary`.

## Datasets

- See `data/datasets.md` for Kaggle links and licensing notes.
- Use `data/sample_violation_dataset.csv` to seed Mongo or for demos. Larger datasets can be imported via `backend/seed_data.py`.

## Testing

- Backend: `pytest` (tests can be added under `backend/tests/`).
- Frontend: `npm run test` (setup ready via Vite + Vitest when needed).

## Security Notes

- HTTPS termination is expected at the deployment layer (reverse proxy or hosting provider).
- RBAC is enforced both client-side (route guarding) and server-side via the `X-User-Role` header plus user lookups.

## Future Enhancements

- Replace mock ML endpoint with actual YOLO/OCR microservice.
- Integrate geospatial queries via MongoDB Atlas Search for real heatmaps.
- Add push notifications/websockets for real-time officer updates.


