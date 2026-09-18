import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baku Prediction Dashboard" },
      { name: "description", content: "Turn your trained model into an interactive race prediction app." },
      { property: "og:title", content: "Baku Prediction Dashboard" },
      { property: "og:description", content: "Turn your trained model into an interactive race prediction app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type ModelResponse = { metadata: { data_through: string } };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function Index() {
  const [dataThrough, setDataThrough] = useState("");
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/model")
      .then(async (response) => {
        const body = (await response.json()) as ModelResponse & { error?: string };
        if (!response.ok) throw new Error(body.error || "Prediction service unavailable");
        return body;
      })
      .then((data) => {
        if (!active) return;
        setDataThrough(data.metadata.data_through);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Prediction service unavailable");
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ background: "#ffffff", color: "#111111" }} className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight">Baku Prediction Dashboard</h1>
        <p className="mt-3 text-base" style={{ color: "#444444" }}>
          Turn your trained model into an interactive race prediction app.
        </p>

        <div className="mt-10 rounded-lg border p-5" style={{ borderColor: "#dddddd" }} aria-live="polite">
          {pending && <p>Checking the prediction API…</p>}
          {!pending && error && (
            <p role="alert" style={{ color: "#b00020" }}>
              Could not reach the prediction API: {error}
            </p>
          )}
          {!pending && !error && (
            <>
              <p className="font-medium">Connected — the prediction API responded successfully.</p>
              <p className="mt-2" style={{ color: "#444444" }}>
                Data through: {formatDate(dataThrough)}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
