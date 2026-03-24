## Citizen's Eye – Architecture Overview

### High-Level Diagram
```
Citizen Browser (React + Tailwind) ──► Flask API ──► MongoDB
         ▲                                 │
         │                                 ├── ML Mock Service (/api/ml/process_image)
         └──── Officer Portal (React) ◄────┘
```

### Frontend
- **Stack**: React 18 + React Router + Axios + Tailwind CSS + Recharts + Chart.js.
- **Citizen workspace**: reporting form, tracker list, feedback modal.
- **Officer workspace**: filtered inbox, complaint details, action logger, analytics.
- **State management**: lightweight lifted state + dedicated hooks per feature.
- **Security**: client enforces RBAC by routing citizens/officers to appropriate dashboards after login, while backend validates roles on protected endpoints via headers.

### Backend
- **Stack**: Flask + Flask-CORS + PyMongo + (fallback) `mongomock`.
- **Collections**
  - `users`: citizens & officers with role + zone metadata.
  - `complaints`: citizen-generated complaints and manual metadata.
  - `ml_extracted_data`: simulated YOLO/OCR output tied to complaints.
  - `actions`: officer actions (notice, resolved, request info).
  - `feedback`: citizen satisfaction loop.
- **Modules**
  - `config.py`: handles environment variables, Mongo connection, and mock storage toggles.
  - `app.py`: route registration, RBAC decorators, analytics helpers, ML simulation.
  - `seed_data.py`: loads starter users/complaints for demos.

### Data Flow
1. Citizen logs in ⇒ obtains user payload + role.
2. Citizen submits complaint with image ⇒ backend stores mock image URL + autop timestamp/location.
3. Backend triggers `/api/ml/process_image` (or citizen can call explicitly) ⇒ persists ML outputs.
4. Officer dashboard consumes `/api/complaints` filtered feed + actions endpoint to update workflow.
5. Once complaint marked resolved ⇒ citizen receives feedback prompt and posts rating/comments.
6. Analytics endpoint aggregates counts + mock heatmap bins (for Chart.js).

### Dataset Strategy
- `data/sample_violation_dataset.csv`: trimmed subset referencing Kaggle’s *Indian Vehicle Number Plates* and *Traffic Violations* datasets.
- `data/datasets.md`: citation, download links, and integration instructions for swapping in production-scale data.

### Deployment Notes
- Backend exposes `.env`-driven settings (`MONGODB_URI`, `ALLOW_MOCK_STORAGE`, etc.).
- Frontend `.env` controls API base URL.
- HTTPS enforcement deferred to infra tier per mandate.


