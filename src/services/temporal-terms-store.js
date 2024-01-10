let temporalTerms = null;
let lastFetchTimestamp = null;

export function setTemporalTerms(newTerms, timestamp) {
  temporalTerms = newTerms;
  lastFetchTimestamp = timestamp;
}

export function getTemporalTerms() {
  return temporalTerms;
}

export function getLastFetchTimestamp() {
  return lastFetchTimestamp;
}
