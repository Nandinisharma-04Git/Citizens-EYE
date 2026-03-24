## Dataset References

| Dataset | Source | Use in Project | Notes |
| --- | --- | --- | --- |
| `Traffic_Violations_Annotated.csv` | [Kaggle – Traffic Violation Detection](https://www.kaggle.com/datasets/chethanp09/traffic-violation-detection) | Provides violation categories and timestamps for seeding complaint records and analytics mock data. | Download the CSV and drop it into `data/raw/traffic_violations.csv` to replace the lightweight sample provided here. |
| `Vehicle_Number_Plates.csv` | [Kaggle – Indian Vehicle Number Plates](https://www.kaggle.com/datasets/rupakroy/indian-vehicle-number-plates) | Supplies realistic license plates and vehicle types for ML simulation payloads. | Only a ten-row excerpt is included locally; use the full dataset for richer ML demo outputs. |

### Local Dataset Files

- `sample_violation_dataset.csv`: curated subset of the Kaggle datasets above. Each row merges citizen-provided context with ML outputs for quick demos without requiring large downloads.

> **Licensing Reminder** – These Kaggle datasets are available for educational use. Review each dataset’s license before redistributing beyond this prototype.


