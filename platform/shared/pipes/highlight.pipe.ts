import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

/**
 * Highlights all occurrences of search terms within a text string.
 *
 * Usage: {{ value | highlight:['term1', 'term2'] }}
 *
 * Each term is matched case-insensitively. Matches are wrapped in <mark>.
 */
@Pipe({name: 'highlight', standalone: true})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | number | null | undefined, terms: string[]): SafeHtml {
    const text = value == null ? '' : String(value);
    if (!text || !terms || terms.length === 0) {
      return text;
    }

    // Filter out empty/short terms, escape regex special chars
    const escaped = terms
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escaped.length === 0) {
      return text;
    }

    const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
    const highlighted = text.replace(pattern, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
