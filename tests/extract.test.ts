/* eslint-disable quotes */
import fs from 'fs';
import path from 'path';
import { FileSyntax } from '../src/types';
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

describe('Custom Property Extract - extract from file', () => {

  it('should correcty extract custom properties from CSS files', () => {
    const syntax = 'css';
    const result = extract(path.resolve(`./tests/example.${syntax}`), { syntax });
    expect(result).toEqual(getExpectedOutput(syntax));
  });

  it('should correcty extract custom properties from SASS files', () => {
    const syntax = 'sass';
    const result = extract(path.resolve(`./tests/example.${syntax}`), { syntax });
    expect(result).toEqual(getExpectedOutput(syntax));
  });

  it('should correcty extract custom properties from SCSS files', () => {
    const syntax = 'scss';
    const result = extract(path.resolve(`./tests/example.${syntax}`), { syntax });
    expect(result).toEqual(getExpectedOutput(syntax));
  });

  it('should correcty remove custom properties prefix when prefix is set to false', () => {
    const syntax = 'scss';
    const result = extract(path.resolve(`./tests/example.${syntax}`), { syntax, prefix: false });
    expect(result).toEqual(getExpectedOutput(syntax, false));
  });

});


describe('Custom Property Extract - extract from content', () => {

  it('should correcty extract custom properties from CSS files', () => {
    const syntax = 'css';
    const content = fs.readFileSync(require.resolve(`./example.${syntax}`), 'utf8')
    const result = extract(content, { syntax, source: 'content' });
    expect(result).toEqual(getExpectedOutput(syntax));
  });

  it('should correcty extract custom properties from SASS files', () => {
    const syntax = 'sass';
    const content = fs.readFileSync(require.resolve(`./example.${syntax}`), 'utf8')
    const result = extract(content, { syntax, source: 'content' });
    expect(result).toEqual(getExpectedOutput(syntax));
  });

  it('should correcty extract custom properties from SCSS files', () => {
    const syntax = 'scss';
    const content = fs.readFileSync(require.resolve(`./example.${syntax}`), 'utf8')
    const result = extract(content, { syntax, source: 'content' });
    expect(result).toEqual(getExpectedOutput(syntax));
  });

  it('should correcty remove custom properties prefix when prefix is set to false', () => {
    const syntax = 'scss';
    const content = fs.readFileSync(require.resolve(`./example.${syntax}`), 'utf8')
    const result = extract(content, { syntax, source: 'content', prefix: false });
    expect(result).toEqual(getExpectedOutput(syntax, false));
  });

});

