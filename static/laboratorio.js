const form = document.querySelector("#intensity-form");
const result = document.querySelector("#result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  const attempt = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
  result.replaceChildren(Object.assign(document.createElement("strong"), { textContent: "Calculando decisão…" }));
  const response = await fetch("/api/laboratorio/intensidade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempts: [attempt] }),
  });
  const suggestion = await response.json();
  const title = document.createElement("strong");
  title.textContent = `${suggestion.action.toUpperCase()} · ${suggestion.suggested_load_kg} kg`;
  const detail = document.createElement("span");
  detail.textContent = suggestion.message;
  result.replaceChildren(title, detail);
});
