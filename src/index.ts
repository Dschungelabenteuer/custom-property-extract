import fs from 'fs';
import gonzales from 'gonzales-pe';
import { validate } from 'schema-utils';

import { FileSyntax, ExtractOptions, ExtractResult, CustomPropertyParameters, CustomPropertyValue, StyleNode, SimpleExtractResult, FullExtractResult } from './types';
import jsonSchema from './options.json';
import { formatValue, formatScope } from './format';

const commentKeyword = '@case';

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
  options = { syntax: 'css', mode: 'simple', prefix: true, source: 'file', ...options };
  validate(jsonSchema as any, options, { name: 'CustomPropertyExtract' });

  const parsed = parseStylesheet(source, options);
  const prefix = options.prefix ? '--' : '';
  const simpleMode = options.mode === 'simple';
  const syntax = options.syntax ?? 'css';

  return simpleMode
    ? simpleExtract(parsed, prefix, syntax)
    : fullExtract(parsed, prefix, syntax);
};


/**
 * Extracts custom properties without tracking their selectors.
 */
export const simpleExtract = (
  parsed: any,
  prefix: string,
  syntax: FileSyntax,
): SimpleExtractResult => {
  let output: SimpleExtractResult = {};

  // Browse all custom properties.
  parsed.traverseByType('customProperty', (node: StyleNode, index: number, parent: StyleNode) => {
    const { key, value } = getExtractedCustomProperty(node, parent, syntax, prefix);
    output = addExtractedCustomProperty(output, key, value) as SimpleExtractResult;
  });

  return output;
}

/**
 * Extracts custom properties and their selectors.
 */
 export const fullExtract = (
  parsed: any,
  prefix: string,
  syntax: FileSyntax,
): FullExtractResult => {
  let output: FullExtractResult = {};
  let comment: string | null;
  let previousDepth: number = -1;
  let previousScope: string[] = [];
  let currentScope: string[] = [];

  const isNamedComment = (node: StyleNode): boolean => node
    && (node.is('multilineComment') || node.is('singlelineComment'))
    && typeof node.content === 'string'
    && node.content.includes(commentKeyword);

  // Browse all nodes.
  parsed.traverse((node: StyleNode, index: number, parent: StyleNode, depth: number) => {
    if (node.is('ruleset')) {
      if (depth < previousDepth) {
        currentScope = formatScope([], node.content as StyleNode[])
        previousScope = [];
      } else if (depth === previousDepth) {
        currentScope = formatScope(previousScope, node.content as StyleNode[])
      } else {
        previousScope = currentScope;
        currentScope = formatScope(currentScope, node.content as StyleNode[])
      }

      previousDepth = depth;
    } else if (isNamedComment(node)) {
      comment = (node.content as string)
        // Remove comment keyword (@case) since.
        .replace(commentKeyword, '')
        // Quick and dirty way to get rid of the multiline comment's leading `* ` mark.
        .replace('* ', '')
        // Trim final name.
        .trim();
    } else if (node.is('customProperty') && parent.type !== 'arguments') {
      const formattedSelectors = currentScope.join(', ');
      const { key, value } = getExtractedCustomProperty(node, parent, syntax, prefix, formattedSelectors, comment);
      output = addExtractedCustomProperty(output, key, value) as FullExtractResult;
      comment = null;
    }
  });

  return output;
}

/**
 * Get extracted Custom Property.
 */
export const getExtractedCustomProperty = (
  node: StyleNode,
  parent: StyleNode,
  syntax: FileSyntax,
  prefix: string,
  selector?: string,
  comment?: string | null,
): CustomPropertyParameters => {
  const propertyName = node.content as string;
  const key = `${prefix}${propertyName}`;

  let formattedValue: string = '';
  const declarationContent = parent.content as StyleNode[];
  const declarationContentLength = declarationContent.length;

  // Browse the whole declaration to find the value type.
  for (let i = 0; i < declarationContentLength; i++) {
    const { type, content } = declarationContent[i]
    if (type === 'value') {
      formattedValue = formatValue(syntax, content as StyleNode[]);
    }
  }

  let value: CustomPropertyValue = formattedValue;

  if (selector && comment) {
    value = { selector, value, name: comment };
  } else if (selector) {
    value = { selector, value };
  }

  return { key, value };
}

/**
 * Add extracted CustomProperty to object.
 */
export const addExtractedCustomProperty = (
  output: ExtractResult,
  key: string,
  value: CustomPropertyValue
): ExtractResult => {
  if (value === '') {
    return output;
  }

  if (!Object.prototype.hasOwnProperty.call(output, key)) {
    output[key] = [];
  }

  output[key].push((value as any));
  return output;
}