import fs from 'fs';
import gonzales from 'gonzales-pe';
import { validate } from 'schema-utils';

import {
  FileSyntax,
  ExtractOptions,
  ExtractResult,
  CustomPropertyParameters,
  FullCustomPropertyValue,
  CustomPropertyValue,
  StyleNode,
  SimpleExtractResult,
  FullExtractResult,
} from './types';

import jsonSchema from './options.json';
import { formatValue, formatScope, formatMediaQuery } from './format';

const commentKeyword = '@case';

/** Parses a stylesheet. */
const parseStylesheet = (
  source: string,
  options: ExtractOptions,
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
  options: ExtractOptions = {},
): ExtractResult => {
  const finalOptions: ExtractOptions = {
    syntax: 'css',
    mode: 'simple',
    prefix: true,
    source: 'file',
    ...options,
  };

  validate(jsonSchema as any, finalOptions, { name: 'CustomPropertyExtract' });

  const parsed = parseStylesheet(source, finalOptions);
  const prefix = finalOptions.prefix ? '--' : '';
  const simpleMode = finalOptions.mode === 'simple';
  const syntax = finalOptions.syntax ?? 'css';

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
};

/**
 * Extracts custom properties and their selectors/media queries.
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
  let currentMediaQuery: string | undefined;
  let currentMediaDepth: number | undefined;

  const isNamedComment = (node: StyleNode): boolean => node
    && (node.is('multilineComment') || node.is('singlelineComment'))
    && typeof node.content === 'string'
    && node.content.includes(commentKeyword);

  const isMediaQuery = (node: StyleNode): boolean => node
    && node.is('atrule')
    && Array.isArray(node.content)
    && node.content.length > 0
    && Array.isArray(node.content[0].content)
    && node.content[0].content[0].content === 'media';

  // Browse all nodes.
  parsed.traverse((node: StyleNode, index: number, parent: StyleNode, depth: number) => {
    if (isMediaQuery(node)) {
      // We'll remember the fact we're starting to parse a media query.
      currentMediaQuery = formatMediaQuery(syntax, node.content as any);
      currentMediaDepth = depth;
    } else if (currentMediaDepth && depth <= currentMediaDepth) {
      // If we were parsing a media query and we're now parsing a node which has the same
      // or shallower depth, this mean we got out of the media query.
      currentMediaQuery = undefined;
      currentMediaDepth = undefined;
      // Since media queries can be nested, we'll decrease the previous depth to ignore
      // the media query declaration because it is not an actual selector which should be
      // considered in the cascading hierarchy.
      previousDepth -= 2;
    }

    if (node.is('ruleset')) {
      if (depth < previousDepth) {
        // We are leaving the current scope.
        previousScope = [];
        currentScope = formatScope(previousScope, node.content as StyleNode[]);
      } else if (depth === previousDepth) {
        // If we were parsing a media query and we're now parsing a node which
        // has the same depth, we are leaving the current scope. Else, we are
        // entering another selector from the parent scope.
        if (currentMediaDepth && currentMediaDepth + 2 === depth) {
          previousScope = [];
        }
        currentScope = formatScope(previousScope, node.content as StyleNode[]);
      } else {
        // If we are parsing a media query which has the same depth as the
        // previous node, weare leaving the current scope. Else, we are
        // entering a nested declaration.
        previousScope = currentMediaDepth === previousDepth ? [] : currentScope;
        currentScope = formatScope(previousScope, node.content as StyleNode[]);
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
      const { key, value } = getExtractedCustomProperty(
        node,
        parent,
        syntax,
        prefix,
        formattedSelectors.trim(),
        comment,
        currentMediaQuery,
      );
      output = addExtractedCustomProperty(output, key, value) as FullExtractResult;
      comment = null;
    }
  });

  return output;
};

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
  mediaQuery?: string,
): CustomPropertyParameters => {
  const propertyName = node.content as string;
  const key = `${prefix}${propertyName}`;

  let formattedValue: string = '';
  const declarationContent = parent.content as StyleNode[];
  const declarationContentLength = declarationContent.length;

  // Browse the whole declaration to find the value type.
  for (let i = 0; i < declarationContentLength; i += 1) {
    const { type, content } = declarationContent[i];
    if (type === 'value') {
      formattedValue = formatValue(syntax, content as StyleNode[]);
    }
  }

  let output: FullCustomPropertyValue = { value: formattedValue };
  if (selector) output = { ...output, selector };
  if (comment) output = { ...output, name: comment };
  if (mediaQuery) output = { ...output, media: mediaQuery };

  const value: CustomPropertyValue = Object.keys(output).length === 1
    ? output.value
    : output;

  return { key, value };
};

/**
 * Add extracted CustomProperty to object.
 */
export const addExtractedCustomProperty = (
  output: ExtractResult,
  key: string,
  value: CustomPropertyValue,
): ExtractResult => {
  const finalOutput: ExtractResult = output;

  if (value === '') {
    return finalOutput;
  }

  if (!Object.prototype.hasOwnProperty.call(finalOutput, key)) {
    finalOutput[key] = [];
  }

  finalOutput[key].push((value as any));
  return finalOutput;
};
