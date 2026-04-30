# Local Observability

This directory contains a modest, local-only observability stack for the
SupportPlane Kind/Podman sandbox:

- OpenTelemetry Collector for OTLP ingest and Prometheus-format metric export.
- Prometheus for short-retention local metrics.
- Loki for short-retention local logs.
- Grafana with Prometheus and Loki datasources preconfigured.

The manifests are intentionally not production-grade. They use pinned upstream
images, `ClusterIP` services only, no ingress, no external load balancers, modest
resource limits, and ephemeral `emptyDir` storage for Prometheus, Loki, and
Grafana runtime data.

## Apply

```bash
kubectl apply -k infra/kubernetes/local-podman
kubectl get pods -n supportplane-observability
kubectl get svc -n supportplane-observability
```

## Port-Forward Access

Run only the forwards you need:

```bash
kubectl -n supportplane-observability port-forward svc/grafana 3001:3000
kubectl -n supportplane-observability port-forward svc/prometheus 9090:9090
kubectl -n supportplane-observability port-forward svc/loki 3100:3100
kubectl -n supportplane-observability port-forward svc/otel-collector 4317:4317 4318:4318
```

Local URLs:

- Grafana: <http://localhost:3001> (`admin` / `supportplane-local`)
- Prometheus: <http://localhost:9090>
- Loki API: <http://localhost:3100>
- OTLP gRPC: `localhost:4317`
- OTLP HTTP: `http://localhost:4318`

## Notes

- Prometheus currently scrapes itself and the OpenTelemetry Collector endpoints.
- The OpenTelemetry Collector exposes received OTLP metrics for Prometheus on
  port `8889`; traces and logs use the collector debug exporter only.
- Loki is available to Grafana as a datasource, but no log shipper is deployed in
  this slice.
- Retention and storage are local sandbox defaults and are lost when pods are
  recreated.
