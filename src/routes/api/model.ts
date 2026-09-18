import { createFileRoute } from "@tanstack/react-router";
import { getModelResponse, verifyReferenceCases } from "../../lib/baku-model.server";

export const Route = createFileRoute("/api/model")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Reference-case verification stays internal: a failure returns a
          // 500, but the check results themselves are never exposed.
          const verification = verifyReferenceCases();
          if (!verification.passed) return Response.json({ error: "Model verification failed" }, { status: 500 });
          return Response.json(getModelResponse(), { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to load model";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
