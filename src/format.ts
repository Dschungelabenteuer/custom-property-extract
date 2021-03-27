import { FileSyntax, StyleNode } from './types';

const formatValue = (
  syntax: FileSyntax,
  nodes: StyleNode[],
  parentType?: string
): string => {
  const output: string[] = [];
  const nodeLength = nodes.length;

  nodes.forEach(({ content, type }, index) => {
    let value: string;

    if (Array.isArray(content)) {
      value = formatValue(syntax, content, type);
    } else {
      value = formatStringValue(content as string, type, parentType)
    }

    // Transform parentheses
    if (parentType === 'parentheses') {
      value = formatParentheses(value, index, nodeLength);
    }

    // Transform function
    if (parentType === 'function') {
      value = formatFunctionContent(value, index, nodeLength);
    }

    // Transform color
    if (type === 'color') {
      value = formatColor(value);
    }

    // Transform variables
    if (type === 'ident') {
      value = formatIdentifier(syntax, value, parentType);
    }

    output.push(value);
  });

  return output.join('');
};

const formatStringValue = (
  value: string,
  type: string,
  parentType?: string
): string => {

  if (type === 'space') {
    return ' ';
  }

  if (parentType === 'percentage') {
    return `${value}%`;
  }

  return value;
}

const formatColor = (value: string): string => {
  return `#${value}`;
}

const formatParentheses = (
  value: string,
  index: number,
  length: number
): string => {
  switch (index) {
    case 0:
      return `(${value}`;
    case length - 1:
      return `${value})`;
    default:
      return value;
  }
}

const formatFunctionContent = (
  value: string,
  index: number,
  length: number
): string => {
  switch (index) {
    case 0:
      return `${value}(`;
    case length - 1:
      return `${value})`;
    default:
      return value;
  }
}

const formatIdentifier = (
  syntax: FileSyntax,
  value: string,
  parentType?: string,
): string => {
  switch (parentType) {
    case 'variable':
      return `$${value}`;
    case 'customProperty':
      return `--${value}`;
    default:
      return value;
  }
}

export default formatValue;
