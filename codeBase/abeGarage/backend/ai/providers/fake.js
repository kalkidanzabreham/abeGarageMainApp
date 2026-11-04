// Fake providers: no model, no network.
//  - scriptedProvider(outputs): for tests. Returns the given outputs in order
//    (a string, an Error to throw, or a function of the call). Records calls.
//  - keywordProvider(): for local dev and the browser tests (AI_PROVIDER=fake).
//    Picks catalog services by simple keyword matching. It is NOT the AI
//    feature being evaluated; responses say provider "fake".

const scriptedProvider = (outputs, { delayMs = 0, name = "scripted", model = "test" } = {}) => {
  const calls = [];
  let i = 0;
  return {
    name,
    model,
    calls,
    async generate(request) {
      calls.push(request);
      const next = outputs[Math.min(i++, outputs.length - 1)];
      if (delayMs) {
        await new Promise((resolve, reject) => {
          const t = setTimeout(resolve, delayMs);
          request.signal?.addEventListener("abort", () => {
            clearTimeout(t);
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          });
        });
      }
      if (next instanceof Error) throw next;
      return { text: typeof next === "function" ? next(request) : next };
    },
  };
};

const RULES = [
  [/brak|grind|squeal/i, "brakes", /brake/i],
  [/shak|vibrat|wobbl|balanc/i, "tires_wheels", /balanc|align/i],
  [/pull|align|steer/i, "steering", /align/i],
  [/batter|won.?t start|no start|click/i, "battery", /battery/i],
  [/light|check engine|warning|code/i, "electrical", /diagnostic/i],
  [/oil|service due|maintenance/i, "engine", /oil/i],
  [/bump|clunk|knock|suspens/i, "suspension", /suspension/i],
];

const keywordProvider = () => ({
  name: "fake",
  model: "keyword-rules",
  external: false,
  async generate({ messages, system }) {
    const complaint = messages[0].content;
    const catalog = [...system.matchAll(/^(\d+): ([^-\n]+)/gm)].map((m) => ({ id: Number(m[1]), name: m[2].trim() }));
    const systems = [];
    const services = [];
    for (const [pattern, system_, servicePattern] of RULES) {
      if (!pattern.test(complaint)) continue;
      if (!systems.includes(system_)) systems.push(system_);
      const service = catalog.find((c) => servicePattern.test(c.name));
      if (service && !services.some((s) => s.service_id === service.id)) {
        services.push({ service_id: service.id, reason: `matched "${complaint.match(pattern)[0]}"` });
      }
    }
    return {
      text: JSON.stringify({
        suspected_systems: systems,
        suggested_services: services,
        urgency: systems.includes("brakes") || systems.includes("steering") ? "high" : systems.length ? "medium" : "low",
        questions_to_ask_customer: systems.length ? ["When did this start?"] : ["What problem are you having with the vehicle?"],
        confidence: systems.length ? 0.5 : 0.1,
      }),
    };
  },
});

module.exports = { scriptedProvider, keywordProvider };
