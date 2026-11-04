// Keeps only suggested services that exist in the garage's catalog and
// attaches the catalog's own name and price (never the model's).
// Unknown ids and duplicates are dropped and reported so the UI can flag
// them; nothing the model invents reaches the order form.
const mapServices = (suggested, catalog) => {
  const byId = new Map(catalog.map((s) => [s.service_id, s]));
  const services = [];
  const dropped = [];
  const seen = new Set();
  for (const s of suggested) {
    const entry = byId.get(s.service_id);
    if (!entry) {
      dropped.push({ service_id: s.service_id, reason: "not in the service catalog" });
    } else if (seen.has(s.service_id)) {
      dropped.push({ service_id: s.service_id, reason: "duplicate" });
    } else {
      seen.add(s.service_id);
      services.push({
        service_id: entry.service_id,
        service_name: entry.service_name,
        service_price: entry.service_price,
        reason: s.reason,
      });
    }
  }
  return { services, dropped };
};

module.exports = { mapServices };
