import {
  LOCALE_ID,
  Pipe,
  PipeTransform,
  inject,
} from '@angular/core';

const PLURAL: { [ k: string ]: string } = {
  '(quiz)$': '$1zes',
  '^(ox)$': '$1en',
  '([m|l])ouse$': '$1ice',
  '(matr|vert|ind)ix|ex$': '$1ices',
  '(x|ch|ss|sh)$': '$1es',
  '([^aeiouy]|qu)y$': '$1ies',
  '(hive)$': '$1s',
  '(?:([^f])fe|([lr])f)$': '$1$2ves',
  '(shea|lea|loa|thie)f$': '$1ves',
  'sis$': 'ses',
  '([ti])um$': '$1a',
  '(tomat|potat|ech|her|vet)o$': '$1oes',
  '(bu)s$': '$1ses',
  '(alias)$': '$1es',
  '(octop)us$': '$1i',
  '(ax|test)is$': '$1es',
  '(us)$': '$1es',
  '([^s]+)$': '$1s',
};

const SINGULAR: { [ k: string ]: string } = {
  '(quiz)zes$': '$1',
  '(matr)ices$': '$1ix',
  '(vert|ind)ices$': '$1ex',
  '^(ox)en$': '$1',
  '(alias)es$': '$1',
  '(octop|vir)i$': '$1us',
  '(cris|ax|test)es$': '$1is',
  '(shoe)s$': '$1',
  '(o)es$': '$1',
  '(bus)es$': '$1',
  '([m|l])ice$': '$1ouse',
  '(x|ch|ss|sh)es$': '$1',
  '(m)ovies$': '$1ovie',
  '(s)eries$': '$1eries',
  '([^aeiouy]|qu)ies$': '$1y',
  '([lr])ves$': '$1f',
  '(tive)s$': '$1',
  '(hive)s$': '$1',
  '(li|wi|kni)ves$': '$1fe',
  '(shea|loa|lea|thie)ves$': '$1f',
  '(^analy)ses$': '$1sis',
  '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$': '$1$2sis',
  '([ti])a$': '$1um',
  '(n)ews$': '$1ews',
  '(h|bl)ouses$': '$1ouse',
  '(corpse)s$': '$1',
  '(us)es$': '$1',
  s$: '',
};

const __compiled = new Map<string, RegExp>();

const IRREGULAR_WORDS: { [ k: string ]: string } = {
  move: 'moves',
  foot: 'feet',
  goose: 'geese',
  sex: 'sexes',
  child: 'children',
  man: 'men',
  tooth: 'teeth',
  person: 'people',
};

function formatOne(word: string) {
  if (word.toLowerCase() in IRREGULAR_WORDS) {
    return word;
  }
  for (const [ pattern, replace ] of Object.entries(PLURAL)) {
    if (!__compiled.has(pattern)) {
      const regex = new RegExp(pattern, 'i');
      __compiled.set(pattern, regex);
    }
    const regex = __compiled.get(pattern)!;
    if (regex.test(word)) {
      return word.replace(regex, replace);
    }
  }
  throw new Error(`Word does not match any rules ${word}`);
}

function formatMany(word: string) {
  if (word.toLowerCase() in IRREGULAR_WORDS) {
    return IRREGULAR_WORDS[ word ];
  }
  for (const [ pattern, replace ] of Object.entries(PLURAL)) {
    if (!__compiled.has(pattern)) {
      __compiled.set(pattern, new RegExp(pattern, 'i'));
    }
    const regex = __compiled.get(pattern)!;
    if (regex.test(word)) {
      return word.replace(regex, replace);
    }
  }
  throw new Error(`Word '${word}' does not match any regular words`);
}

const UNCOUNTABLE_WORDS: string[] = [
  'sheep',
  'fish',
  'deer',
  'moose',
  'series',
  'species',
  'money',
  'rice',
  'information',
  'equipment',
];

export function formatPlural(
  word: string,
  count: number,
  locale: string,
  options?: Intl.PluralRulesOptions | undefined,
): string {
  // save some time in the case that singular and plural are the same
  if (UNCOUNTABLE_WORDS.indexOf(word.toLowerCase()) >= 0) return word;

  const rule = new Intl.PluralRules(locale, options).select(count);
  switch (rule) {
    case 'one':
      return formatOne(word);
    case 'other':
      return formatMany(word);
    default:
      throw new Error(`Unrecognised plural rule {rule}`);
  }
}

@Pipe({
  name: 'plural',
})
export class PluralPipe implements PipeTransform {
  readonly locale = inject(LOCALE_ID);

  transform(word: string, count: number, options?: Intl.PluralRulesOptions) {
    return formatPlural(word, count, this.locale, options);
  }
}
