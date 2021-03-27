import fs from 'fs';
import gonzales from 'gonzales-pe';
import { validate } from 'schema-utils';

import { FileSyntax, ExtractOptions, ExtractResult, StyleNode } from './types';
import jsonSchema from './options.json';
import formatValue from './format';

/** Parses a stylesheet. */
const parseStylesheet = (
  source: string,
  options: ExtractOptions
) => {
  const { syntax } = options;
  const sourceType = options.source;
  const content = sourceType === 'file'
    ? fs.readFileSync(require.resolve(source), 'utf8')
    : source;

  return gonzales.parse(content, { syntax });
};

/**
 * Extracts custom properties of given stylesheet
 * and returns a name:value object.
 */
export const extract = (
  source: string,
  options: ExtractOptions = {}
): ExtractResult => {
  options = { syntax: 'css', prefix: true, source: 'file', ...options };
  validate(jsonSchema as any, options, { name: 'CustomPropertyExtract' });

  const output: ExtractResult = {};
  const parsed = parseStylesheet(source, options);
  const prefix = options.prefix ? '--' : '';

  // Browse all custom properties.
  parsed.traverseByType('customProperty', (node: StyleNode, index: number, parent: StyleNode) => {
    const propertyName = node.content as string;

    if (!Object.prototype.hasOwnProperty.call(output, `${prefix}${propertyName}`)) {
      output[`${prefix}${propertyName}`] = [];
    }

    let formattedValue: string;
    const declarationContent = parent.content as StyleNode[];
    const declarationContentLength = declarationContent.length;

    // Browse the whole declaration to find the value type.
    for (let i = 0; i < declarationContentLength; i++) {
      if (declarationContent[i].type === 'value') {
        formattedValue = formatValue(
          options.syntax as FileSyntax,
          declarationContent[i].content as StyleNode[]
        );
        output[`${prefix}${propertyName}`].push(formattedValue);
      }
    }
  });

  return output;
};
