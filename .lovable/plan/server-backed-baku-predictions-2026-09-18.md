# Server-backed Baku predictions

## API and model
- Keep the full trained XGBoost model and evaluator in server-only files.
- Add `GET /api/model` to return metadata, inputs, evaluation details, and baseline predictions computed on request.
- Add `POST /api/predict` to validate a complete 22-driver input field and return newly computed rankings.
- Return clear JSON errors for invalid payloads or unsupported model data.

## Dashboard
- Load the initial dashboard from `GET /api/model` rather than the bundled display snapshot.
- Add editable numeric model inputs and a recalculate action backed by `POST /api/predict`.
- Show loading and error feedback while retaining the last successful ranking whenever a request fails.
- Preserve the existing motorsport editorial layout and “Model score” terminology.

## Verification
- Compare JavaScript evaluator output against all six Python reference cases bundled in the supplied JSON.
- Check both endpoints directly, then verify the initial load, recalculation, and failure states in the browser.
