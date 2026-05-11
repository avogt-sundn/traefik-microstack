import {TranslocoService} from '@jsverse/transloco';
import {PartnerGroupSearchDto} from '../../../api';
import {ColumnIconConfig} from '../../basic/treetable/treetable.types';
import {
  getPartnerType,
  PartnerType,
} from '../../../services/partner-treetable-service/partner-treetable.service';

export interface SearchExample {
  query: string;
  descriptionKey: string;
}

const EXAMPLES_COLLAPSED_KEY = 'partner-search-examples-collapsed';

export class PartnerSearchConfig {
  static readonly EXAMPLES_COLLAPSED_KEY = EXAMPLES_COLLAPSED_KEY;

  static readonly SEARCH_EXAMPLES: SearchExample[] = [
    {query: '100001',          descriptionKey: 'partner.search.examples.partnerNr'},
    {query: '80331 München',   descriptionKey: 'partner.search.examples.plzCity'},
    {query: 'Hauptstraße',     descriptionKey: 'partner.search.examples.street'},
    {query: 'Fischer Logistik', descriptionKey: 'partner.search.examples.name'},
    {query: 'MUELL',           descriptionKey: 'partner.search.examples.wildcards'},
    {query: 'Schmidt Berlin',  descriptionKey: 'partner.search.examples.explicit'},
  ];

  static readonly PARTNER_ROUTES = {
    VIEW: '../view',
    RELATIVE: true,
  } as const;

  static readonly SEARCH_DEFAULTS = {
    searchPerformed: false,
    hasResults: false,
    partnerTreetableService: null,
  } as const;

  constructor(private translocoService: TranslocoService) {}

  get partnerDisplayedColumns() {
    return [
      {key: 'type', label: ""},
      {key: 'groupNumber', label: this.translocoService.translate('partner.search.table.columns.groupNumber')},
      {key: 'partnerNumber', label: this.translocoService.translate('partner.search.table.columns.partnerNumber')},
      {key: 'alphaCode', label: this.translocoService.translate('partner.search.table.columns.alphacode')},
      {key: 'name', label: this.translocoService.translate('forms.fields.name')},
      {key: 'address', label: this.translocoService.translate('partner.search.table.columns.address')},
    ];
  }

  get partnerIconConfigs(): ColumnIconConfig<PartnerGroupSearchDto>[] {
    return [
      {
        columnKey: 'type',
        valueFormatter: (dto) => getPartnerType(dto),
        iconMap: new Map([
          [
            PartnerType.InternerVerbund,
            'groups',
          ],
          [
            PartnerType.NormalerVerbund,
            'groups',
          ],
          [
            PartnerType.Partner,
            'person',
          ],
        ]),
        colorMap: new Map([
          [
            PartnerType.InternerVerbund,
            'var(--traefik-microstack-icon-primary)',
          ],
          [
            PartnerType.NormalerVerbund,
            'var(--traefik-microstack-icon-secondary)',
          ],
          [
            PartnerType.Partner,
            'var(--traefik-microstack-icon-tertiary)',
          ],
        ]),
      },
    ];
  }
}
