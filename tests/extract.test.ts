/* eslint-disable quotes */
import fs from 'fs';
import path from 'path';
import options from '../src/options.json';
import { FileSyntax, SourceType, SimpleExtractResult, FullExtractResult, ExtractResult, ExtractMode } from '../src/types';
import { extract } from '../src';

const resultTemplate: ExtractResult = {
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
  '--width-header': [ 'calc(100vh - (3rem / 2))' ],
  '--test-variable': [ 'red', 'blue', 'yellow', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'green' ],
};

const selectorsTemplate: ExtractResult = {
  '--color-primary': [
    { value: '--', selector: ':root ',name: 'Main color.' },
    { value: '--', selector: '[data-theme="dark"] ', name: 'Main color but for dark mode.' },
    { value: '--', selector: '[data-theme="dark"].nested ' },
    { value: '--', selector: '[data-lang="us"]:root '  },
  ],
  '--color-secondary': [
    { value: '--', selector: ':root ' },
    { value: '--', selector: '[data-theme="dark"] ' }
  ],
  '--color-background': [
    { value: '--', selector: ':root ' },
    { value: '--', selector: '[data-theme="dark"] ' },
  ],
  '--color-foreground': [
    { value: '--', selector: ':root ' }
  ],
  '--radius-round': [
    { value: '--', selector: ':root ' },
  ],
  '--spacing-s': [
    { value: '--', selector: ':root ' },
  ],
  '--shadow-xs': [
    { value: '--', selector: ':root ' },
  ],
  '--border-light': [
    { value: '--', selector: ':root ' },
  ],
  '--amount-suffix-content': [
    { value: '--', selector: ':root '  },
    { value: '--', selector: '[data-lang="us"] ' },
  ],
  '--margin-default': [
    { value: '--', selector: ':root ' },
  ],
  '--width-header': [
    { value: '--', selector: '[data-theme="dark"].nested '},
  ],
  '--test-variable': [
    { value: '--', selector: '.firstSelector .firstChildSelector , .firstSelector .secondChildSelector , .secondSelector .firstChildSelector , .secondSelector .secondChildSelector ' },
    { value: '--', selector: '.firstSelector.firstModifierSelector , .firstSelector.secondModifierSelector , .secondSelector.firstModifierSelector , .secondSelector.secondModifierSelector '  },
    { value: '--', selector: '.firstSelector > div , .secondSelector > div ' },
    { value: '--', selector: '.firstSelector > span , .secondSelector > span ' },
    { value: '--', selector: '.firstSelector:hover , .secondSelector:hover ' },
    { value: '--', selector: '.firstSelector::before , .secondSelector::before ' },
    { value: '--', selector: '.firstSelector:nth-child(50) , .secondSelector:nth-child(50) ' },
    { value: '--', selector: '.firstSelector[href^="starterpage"] , .secondSelector[href^="starterpage"] ' },
    { value: '--', selector: '.firstSelector[href^="starterpage"][disabled] , .secondSelector[href^="starterpage"][disabled] ' },
    { value: '--', selector: '.singleSelector a:hover ' },
    { value: '--', selector: '.singleSelector a::before ' },
    { value: '--', selector: '.singleSelector a:nth-child(50) ' },
    { value: '--', selector: '.singleSelector a[href^="starterpage"][disabled] ' },
  ]
};

const applyPrefixOption = (
  output: ExtractResult,
  prefix = true
): ExtractResult => {
  if (prefix) {
    return output;
  }

  const prefixPattern: [string, string] = ['--', ''];
  const newOutput: ExtractResult = {};

  Object.keys(output).forEach((property) => {
    const renamedProperty = property.replace(prefixPattern[0], prefixPattern[1]);
    newOutput[renamedProperty] = output[property];
  });

  return newOutput;
}

const getExpectedFullOutput = (
  output: SimpleExtractResult,
  prefix = true
): FullExtractResult => {
  const newOutput: FullExtractResult = {};

  // Overwrite each simple value with the expected full object.
  Object.keys(output).forEach((property) => {
    newOutput[property] = output[property]
      .map((_, index) => ({
        ...selectorsTemplate[property][index],
        // We're getting the value from the original simple value
        // since it's already computed (e.g. variable interpolation for CSS).
        value: output[property][index],
      }))
  });

  return applyPrefixOption(newOutput, prefix) as FullExtractResult;
}

const getExpectedOutput = (
  syntax: FileSyntax,
  prefix = true,
  mode = 'simple'
): ExtractResult => {
  const template = JSON.stringify(resultTemplate);
  let output;
  switch (syntax) {
    case 'css':
      output = JSON.parse(template.replace(/\$color-secondary/g, 'blue'));
      break;
    default:
      output = JSON.parse(template);
      break;
  }

  return mode === 'full'
    ? getExpectedFullOutput(output, prefix) as FullExtractResult
    : applyPrefixOption(output, prefix) as SimpleExtractResult;
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
const availableOutputModes: ExtractMode[] =  options.properties.mode.enum as ExtractMode[];

availableSourceTypes.forEach((source) => {
  describe(`Custom Property Extract - extract from ${source}`, () => {

    availableFileSyntaxes.forEach((syntax) => {

      availableOutputModes.forEach((mode) => {

        it(`should correcty extract custom properties from ${syntax.toUpperCase()} ${source} (${mode})`, () => {
          const prefix = true;
          const content = getContent(syntax, source);
          const result = extract(content, { syntax, source, prefix, mode });
          expect(result).toEqual(getExpectedOutput(syntax, prefix, mode));
        });

        it(`should correcty extract unprefixed custom properties from ${syntax.toUpperCase()} ${source} (${mode})`, () => {
          const prefix = false;
          const content = getContent(syntax, source);
          const result = extract(content, { syntax, source, prefix, mode });
          expect(result).toEqual(getExpectedOutput(syntax, prefix, mode));
        });

      });

    });

  });
});