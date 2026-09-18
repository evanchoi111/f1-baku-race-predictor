import { createFileRoute } from "@tanstack/react-router";
import { getModelResponse, verifyReferenceCases } from "../../lib/baku-model.server";

export const Route = createFileRoute("/api/model")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const verification = verifyReferenceCases();
          if (!verification.passed) return Response.json({ error: "Model verification failed", verification }, { status: 500 });
          return Response.json({ ...getModelResponse(), verification }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to load model";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
