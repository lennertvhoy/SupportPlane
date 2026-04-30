type Labels = Record<string, string | number | boolean | undefined | null>;

type LogEvent = {
  service: string;
  event: string;
  correlationId: string;
  tenantId?: string;
  actionId?: string;
  outboxItemId?: string;
  mode?: string;
  result?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

const SECRET_KEY_PATTERN = /(token|secret|password|credential|authorization|apiKey|api_token|bearer)/i;

function safeLabel(value: unknown): string {
  if (value === undefined || value === null) return 'unknown';
  return String(value).replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 96);
}

function labelKey(labels: Labels): string {
  return Object.entries(labels)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${safeLabel(value)}`)
    .join(',');
}

function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEY_PATTERN.test(key)) return '[REDACTED]';
  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]')
      .slice(0, 240);
  }
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'string' ? redactValue(key, item) : item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [childKey, redactValue(childKey, childValue)])
    );
  }
  return value;
}

function labelsText(labels: Labels): string {
  const entries = Object.entries(labels).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) return '';
  return `{${entries.map(([key, value]) => `${key}="${safeLabel(value)}"`).join(',')}}`;
}

class TelemetryRegistry {
  private readonly counters = new Map<string, number>();
  private readonly histograms = new Map<string, number[]>();
  private readonly recentLogs: LogEvent[] = [];
  private readonly startedAt = new Date().toISOString();

  increment(name: string, labels: Labels = {}, amount = 1): void {
    const key = `${name}|${labelKey(labels)}`;
    this.counters.set(key, (this.counters.get(key) ?? 0) + amount);
  }

  observe(name: string, value: number, labels: Labels = {}): void {
    const key = `${name}|${labelKey(labels)}`;
    const values = this.histograms.get(key) ?? [];
    values.push(value);
    if (values.length > 500) values.shift();
    this.histograms.set(key, values);
  }

  log(event: Omit<LogEvent, 'timestamp' | 'service'> & { service?: string }): void {
    const safeEvent: LogEvent = {
      service: event.service ?? 'supportplane-api',
      event: safeLabel(event.event),
      correlationId: safeLabel(event.correlationId),
      tenantId: event.tenantId ? safeLabel(event.tenantId) : undefined,
      actionId: event.actionId ? safeLabel(event.actionId) : undefined,
      outboxItemId: event.outboxItemId ? safeLabel(event.outboxItemId) : undefined,
      mode: event.mode ? safeLabel(event.mode) : undefined,
      result: event.result ? safeLabel(event.result) : undefined,
      timestamp: new Date().toISOString(),
      metadata: event.metadata ? (redactValue('metadata', event.metadata) as Record<string, unknown>) : undefined,
    };
    this.recentLogs.push(safeEvent);
    if (this.recentLogs.length > 100) this.recentLogs.shift();
    console.log(JSON.stringify(safeEvent));
  }

  prometheusText(): string {
    const lines: string[] = [
      '# HELP supportplane_info Local SupportPlane observability baseline info.',
      '# TYPE supportplane_info gauge',
      'supportplane_info{service="supportplane-api",local_only="true",production_monitoring="false"} 1',
    ];
    for (const [key, value] of this.counters.entries()) {
      const [name, rawLabels = ''] = key.split('|');
      const labels = Object.fromEntries(rawLabels.split(',').filter(Boolean).map((entry) => {
        const [label, labelValue] = entry.split('=');
        return [label, labelValue ?? 'unknown'];
      }));
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name}${labelsText(labels)} ${value}`);
    }
    for (const [key, values] of this.histograms.entries()) {
      const [name, rawLabels = ''] = key.split('|');
      const labels = Object.fromEntries(rawLabels.split(',').filter(Boolean).map((entry) => {
        const [label, labelValue] = entry.split('=');
        return [label, labelValue ?? 'unknown'];
      }));
      const sum = values.reduce((acc, value) => acc + value, 0);
      lines.push(`# TYPE ${name} summary`);
      lines.push(`${name}_count${labelsText(labels)} ${values.length}`);
      lines.push(`${name}_sum${labelsText(labels)} ${sum}`);
    }
    return `${lines.join('\n')}\n`;
  }

  status() {
    const checkedAt = new Date().toISOString();
    const recentSandbox = [...this.recentLogs].reverse().find((event) =>
      ['sandbox_delivered', 'sandbox_writeback_failed', 'sandbox_dry_run'].includes(event.result ?? '')
    );
    const recentMinio = [...this.recentLogs].reverse().find((event) => event.event === 'minio_evidence_persisted');
    const recentMailpit = [...this.recentLogs].reverse().find((event) => event.event === 'mailpit_notification_recorded');
    const natsEnabled = process.env['SUPPORTPLANE_QUEUE_BACKEND'] === 'nats-jetstream';
    return {
      enabled: true,
      localOnly: true,
      productionMonitoring: false,
      correlationId: this.recentLogs.at(-1)?.correlationId ?? 'not_currently_reported',
      startedAt: this.startedAt,
      checkedAt,
      api: {
        status: 'ok',
        health: 'ok',
        storeMode: process.env['SUPPORTPLANE_STORE'] ?? 'memory',
        authMode: process.env['SUPPORTPLANE_AUTH_MODE'] ?? 'dev',
        checkedAt,
      },
      worker: {
        status: 'available',
        queueBackend: process.env['SUPPORTPLANE_QUEUE_BACKEND'] ?? 'postgres-local-outbox',
        fallbackQueueBackend: 'postgres-local-outbox',
        deliveryMode: process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true' ? 'sandbox_available' : 'mock',
        writebackEnabled: process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true',
        realNetwork: process.env['SUPPORTPLANE_SANDBOX_WRITEBACK_ENABLED'] === 'true',
        externalWriteAttempted: recentSandbox?.result === 'sandbox_delivered',
        lastSandboxWritebackStatus: recentSandbox?.result ?? 'not_currently_reported',
      },
      queue: {
        backend: process.env['SUPPORTPLANE_QUEUE_BACKEND'] ?? 'postgres-local-outbox',
        fallbackBackend: 'postgres-local-outbox',
        status: 'available',
      },
      nats: {
        enabled: natsEnabled,
        status: natsEnabled ? 'enabled' : 'disabled',
        streamName: process.env['NATS_OUTBOX_STREAM'] ?? 'SUPPORTPLANE_OUTBOX',
        subject: process.env['NATS_OUTBOX_SUBJECT'] ?? 'supportplane.outbox.ready',
        consumerName: process.env['NATS_OUTBOX_CONSUMER'] ?? 'SUPPORTPLANE_WORKER',
        bridgeMode: 'postgres-canonical-jetstream-bridge',
      },
      sandboxWriteback: {
        status: recentSandbox?.result ?? 'not_currently_reported',
        lastStatus: recentSandbox?.result ?? 'not_currently_reported',
        lastCompletedAt: recentSandbox?.timestamp,
        externalArticleId: String(recentSandbox?.metadata?.['externalReferenceId'] ?? 'not_currently_reported'),
      },
      ai: {
        provider: process.env['SUPPORTPLANE_AI_PROVIDER'] ?? 'ollama',
        providerMode: process.env['SUPPORTPLANE_AI_PROVIDER_MODE'] ?? 'local',
        model: process.env['SUPPORTPLANE_AI_MODEL'] ?? process.env['OLLAMA_MODEL'] ?? 'gemma4:e4b',
        fallbackUsed: false,
        status: 'local_no_cloud',
      },
      observabilityStack: {
        prometheus: { status: 'configured', endpoint: 'http://localhost:9090 via port-forward' },
        grafana: { status: 'configured', endpoint: 'http://localhost:3001 via port-forward' },
        otelCollector: { status: 'configured', endpoint: 'otel-collector.supportplane-observability.svc.cluster.local:4317/4318' },
        loki: { status: 'configured_no_log_shipper', endpoint: 'http://localhost:3100 via port-forward' },
      },
      telemetry: {
        minioEvidence: {
          status: recentMinio ? 'observed' : 'not_currently_reported',
          endpoint: 'minio.supportplane-data.svc.cluster.local:9000',
          lastWriteStatus: recentMinio?.result ?? 'not_currently_reported',
        },
        mailpitNotification: {
          status: recentMailpit ? 'observed' : 'not_currently_reported',
          endpoint: 'mailpit.supportplane-integrations.svc.cluster.local:1025',
          lastNotificationStatus: recentMailpit?.result ?? 'not_currently_reported',
        },
        sandboxWriteback: {
          status: recentSandbox?.result ?? 'not_currently_reported',
          lastStatus: recentSandbox?.result ?? 'not_currently_reported',
        },
        secretsRedacted: true,
      },
      endpoints: {
        apiMetrics: '/metrics',
        apiStatus: '/observability/status',
        prometheusPortForward: 'kubectl -n supportplane-observability port-forward svc/prometheus 9090:9090',
        grafanaPortForward: 'kubectl -n supportplane-observability port-forward svc/grafana 3001:3000',
        otelCollector: 'supportplane-observability/otel-collector:4317,4318',
        lokiPortForward: 'kubectl -n supportplane-observability port-forward svc/loki 3100:3100',
      },
      signals: {
        correlationIds: true,
        structuredLogs: true,
        prometheusMetrics: true,
        traces: 'OTel collector deployed for local ingestion; API emits correlated logs/metrics in this baseline.',
        noSecretsInTelemetry: true,
      },
      recentLogs: this.recentLogs.slice(-25),
      disclaimers: ['Local observability only', 'No production monitoring', 'No secrets in telemetry'],
    };
  }
}

export const telemetry = new TelemetryRegistry();
