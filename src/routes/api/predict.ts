import { createFileRoute } from "@tanstack/react-router";
import { getModelResponse, validateInputs } from "../../lib/baku-model.server";

export const Route = createFileRoute("/api/predict")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { inputs?: unknown };
          const inputs = validateInputs(body.inputs);
          return Response.json(getModelResponse(inputs), { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid prediction request";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
