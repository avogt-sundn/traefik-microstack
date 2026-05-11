import {Component} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {RouterLink} from "@angular/router";

const mockStorage = {
  storage: new Map<string, string>(),
  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  },
  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  },
  removeItem(key: string): void {
    this.storage.delete(key);
  },
  clear(): void {
    this.storage.clear();
  },
};

@Component({
  selector: 'shared-history',
  templateUrl: './history.html',
  styleUrl: './history.scss',
  imports: [
    RouterLink,
    MatCardModule,
    MatListModule,
    MatIcon,
  ],
})
export class History {
  user = {name: 'Max Mustermann', number: 'max123'};
  history: {
    entity: string,
    identifier: string,
    url: string,
    pathname: string,
    params: Record<string, string>
  }[] = [];

  ngOnInit() {
    const client = window.location.pathname.split('/')[1];
    const historyKey = `history_${client}_${this.user.number}`;
    const historyData = mockStorage.getItem(historyKey);
    if (historyData) {
      this.history = JSON.parse(historyData);
    }
    this.trackURLChanges();
  }

  trackURLChanges() {
    const pathname = window.location.pathname;
    const client = pathname.split('/')[1];
    if (!client) {
      return;
    }
    const module = pathname.split('/')[2];
    if (!module) {
      return;
    }
    let entity = pathname.split('/')[3];
    if (!entity) {
      return;
    }
    let view = pathname.split('/')[4];
    if (module === 'partner-search' || module === 'partner-edit') {
      view = entity;
      entity = module;
    }

    if (!view || (view !== 'view')) {
      return;
    }

    const searchParams = new URL(window.location.href).searchParams;
    const identifier = searchParams.get(entity + 'Nr') ?? '001';
    if (!identifier) {
      return;
    }

    const historyKey = `history_${client}_${this.user.number}`;
    const url = pathname + '?' + entity + 'Nr=' + identifier;
    this.history = this.history.filter(entry => entry.url !== url);
    if (this.history.length >= 10) {
      this.history.pop();
    }
    const params: Record<string, string> = {};
    params[entity + 'Nr'] = identifier;
    this.history.unshift({url, entity, identifier, pathname, params});
    mockStorage.setItem(historyKey, JSON.stringify(this.history));
  }

}
