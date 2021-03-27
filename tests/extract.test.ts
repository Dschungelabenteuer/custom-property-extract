/* eslint-disable quotes */
import fs from 'fs';
import path from 'path';
import options from '../src/options.json';
import { FileSyntax, SourceType } from '../src/types';
import { extract } from '../src';

const resultTemplate = {
  '--color-primary': [ '#ff017d', '#cf689a', '$color-secondary', 'blue' ],
  '--color-secondary': [ '#000', '$color-secondary' ],
  '--color-background': [ 'white', 'var(--color-background)' ],
  '--color-foreground': [ 'var(--color-secondary)' ],
  '--radius-round': [ '50% 50%' ],
  '--spacing-s': [ '5rem' ],
  '--shadow-xs': [ '1px 2px 3px 4px rgba(0,0,0,0.25), inset 4px 3px 2px 1px #fff' ],
  '--border-light': [ '1px solid rgba(0,0,0,0.15)' ],
  '--amount-suffix-content': [ "'€'", "'$'" ],
  '--margin-default': [ '0.5rem !important' ],
  '--width-header': [ 'calc(100vh - (3rem / 2))' ]
};

const getExpectedOutput = (syntax: FileSyntax, prefix = true) => {
  const template = JSON.stringify(resultTemplate);
  const prefixPattern: [string | RegExp, string] = prefix ? ['', ''] : [/"--/g, '"'];
  switch (syntax) {
    case 'css':
      return JSON.parse(
        template
          .replace(/\$color-secondary/g, 'blue')
          .replace(prefixPattern[0], prefixPattern[1])
      );
    default:
      return JSON.parse(template.replace(prefixPattern[0], prefixPattern[1]));
  }
};

const getContent = (syntax: FileSyntax, source: SourceType) => {
  switch (source) {
    case 'content':
      return fs.readFileSync(require.resolve(`./example.${syntax}`), 'utf8');
    default:
      return path.resolve(`./tests/example.${syntax}`);
  }
}

const availableSourceTypes: SourceType[] = options.properties.source.enum as SourceType[];
const availableFileSyntaxes: FileSyntax[] =  options.properties.syntax.enum as FileSyntax[];

availableSourceTypes.forEach((source) => {
  describe(`Custom Property Extract - extract from ${source}`, () => {

    availableFileSyntaxes.forEach((syntax) => {

      it(`should correcty extract custom properties from ${syntax.toUpperCase()} ${source}`, () => {
        const content = getContent(syntax, source);
        const result = extract(content, { syntax, source });
        expect(result).toEqual(getExpectedOutput(syntax));
      });

      it(`should correcty extract unprefixed custom properties from ${syntax.toUpperCase()} ${source}`, () => {
        const prefix = false;
        const content = getContent(syntax, source);
        const result = extract(content, { syntax, source, prefix });
        expect(result).toEqual(getExpectedOutput(syntax, prefix));
      });

    });
  });
});