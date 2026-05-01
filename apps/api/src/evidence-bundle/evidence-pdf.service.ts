import { Injectable } from '@nestjs/common';
import type { EvidenceBundle } from '@supportplane/contracts';

const FONTS = {
  LiberationSans: {
    normal: '/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf',
    bold: '/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf',
    italics: '/usr/share/fonts/liberation-sans-fonts/LiberationSans-Italic.ttf',
    bolditalics: '/usr/share/fonts/liberation-sans-fonts/LiberationSans-BoldItalic.ttf',
  },
};

// pdfmake is CommonJS without types; load lazily to avoid startup failures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPrinter(): Promise<any> {
  // @ts-ignore — pdfmake has no TypeScript declarations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import('pdfmake/src/printer.js');
  return mod.default ?? mod;
}

@Injectable()
export class EvidencePdfService {
  private printer: unknown | undefined;

  constructor() {
    // Lazy-load printer on first use to avoid blocking startup
  }

  async generatePdf(bundle: EvidenceBundle): Promise<Buffer> {
    if (!this.printer) {
      const PdfPrinter = await loadPrinter();
      if (typeof PdfPrinter !== 'function') {
        throw new Error('PDF generator is not available — pdfmake printer failed to load');
      }
      try {
        this.printer = new PdfPrinter(FONTS);
      } catch {
        throw new Error('PDF generator is not available — font loading failed');
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const docDefinition = this.buildDocDefinition(bundle);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const printer = this.printer as any;
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err: Error) => reject(err));
        pdfDoc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private buildDocDefinition(bundle: EvidenceBundle): unknown {
    const now = new Date().toISOString();

    const timelineRows = bundle.auditTimeline
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((e) => [
        e.createdAt,
        e.eventType,
        `${e.actorType}:${e.actorId.slice(0, 12)}`,
        `${e.resourceType}:${e.resourceId.slice(0, 12)}`,
      ]);

    const aiUsageRows = bundle.aiUsage.map((u) => [
      u.provider,
      u.model,
      u.mockOnly ? 'mock' : 'real',
      u.generatedAt ?? '-',
    ]);

    const content: Array<unknown> = [
      { text: 'SupportPlane Evidence Bundle', style: 'header' },
      { text: `Generated: ${now}`, style: 'subheader' },
      { text: `Bundle ID: ${bundle.bundleId}` },
      { text: `Tenant: ${bundle.tenantId}` },
      { text: `Session: ${bundle.sessionId}` },
      { text: `Format: PDF Export (v${bundle.version})` },
      { text: '\n' },

      { text: 'Session Summary', style: 'section' },
      {
        ul: [
          `Title: ${bundle.sessionSummary.title}`,
          `Status: ${bundle.sessionSummary.status}`,
          `Priority: ${bundle.sessionSummary.priority}`,
          ...(bundle.sessionSummary.description ? [`Description: ${bundle.sessionSummary.description}`] : []),
          `Started: ${bundle.sessionSummary.startedAt}`,
        ],
      },
      { text: '\n' },

      { text: 'Audit Timeline', style: 'section' },
      timelineRows.length > 0
        ? {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto'],
              body: [
                ['Timestamp', 'Event Type', 'Actor', 'Resource'],
                ...timelineRows,
              ],
            },
            layout: 'lightHorizontalLines',
          }
        : { text: 'No audit events.', italics: true },
      { text: '\n' },

      { text: 'AI Usage Summary', style: 'section' },
      aiUsageRows.length > 0
        ? {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto'],
              body: [
                ['Provider', 'Model', 'Mode', 'Generated At'],
                ...aiUsageRows,
              ],
            },
            layout: 'lightHorizontalLines',
          }
        : { text: 'No AI usage recorded.', italics: true },
      { text: '\n' },

      { text: 'Truth Labels', style: 'section' },
      {
        ul: bundle.mockDevOnlyDisclaimers.slice(0, 6),
      },
      { text: '\n' },

      { text: 'Limitations', style: 'section' },
      {
        ul: bundle.limitations.slice(0, 6),
      },
      { text: '\n' },

      { text: 'Source Provenance', style: 'section' },
      {
        ul: [
          `Store Type: ${bundle.sourceProvenance.storeType}`,
          `Persistence Claimed: ${bundle.sourceProvenance.persistenceClaimed}`,
          `Generated By: ${bundle.sourceProvenance.generatedByService}`,
          `Schema Version: ${bundle.sourceProvenance.schemaVersion}`,
        ],
      },
    ];

    return {
      content,
      defaultStyle: {
        font: 'LiberationSans',
        fontSize: 10,
      },
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        section: {
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5],
        },
      },
      pageMargins: [40, 40, 40, 40],
    };
  }
}
