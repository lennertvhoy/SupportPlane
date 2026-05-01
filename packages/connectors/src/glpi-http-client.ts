export interface GlpiHttpClient {
  searchTicket(query: string): Promise<unknown>;
  getTicket(ticketId: string): Promise<unknown>;
  getUser(userId: string): Promise<unknown>;
}

export class MockGlpiHttpClient implements GlpiHttpClient {
  async searchTicket(_query: string): Promise<unknown> {
    return [
      {
        id: 'GLPI-101',
        subject: 'Network outage in building B',
        status: 'new',
        priority: 'high',
        customerName: 'Acme BVBA',
        customerEmail: 'support@acme.example',
      },
    ];
  }

  async getTicket(ticketId: string): Promise<unknown> {
    return {
      id: ticketId,
      subject: 'Network outage in building B',
      status: 'new',
      priority: 'high',
      customer_id: 'GLPI-USER-5',
      date: new Date().toISOString(),
    };
  }

  async getUser(userId: string): Promise<unknown> {
    return {
      id: userId,
      name: 'Acme BVBA',
      email: 'support@acme.example',
      firstname: 'Acme',
      lastname: 'BVBA',
    };
  }
}
