import { Injectable } from '@angular/core';

export interface Client {
  name: string;
  label: string;
  logoUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientSelectionService {

  private clients: Client[] = [
    { name: 'ABC Bank', label: 'abc', logoUrl: './assets/logos/abc.png' },
    { name: 'DEF Enterprise', label: 'def', logoUrl: './assets/logos/def.png' },
    { name: 'GHI GmbH', label: 'ghi', logoUrl: './assets/logos/ghi.png' },
  ];

  getClients(): Client[] {
    return this.clients;
  }

  getClientByLabel(label: string): Client | undefined {
    return this.clients.find(client => client.label === label);
  }
}
