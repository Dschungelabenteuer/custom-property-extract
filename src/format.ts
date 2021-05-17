import { FileSyntax, StyleNode } from './types';

export const formatScope = (
  scope: string[],
  nodes: StyleNode[]
): string[] => {
  const output: string[] = [];
  const proceedableTypes = ['selector', 'space', 'delimiter'];
  const proceedableNodes = nodes.filter(({ type }) => proceedableTypes.includes(type));
  const childSelectors: string[] = [];
  let currentIndex = 0;

  proceedableNodes.forEach(({ type, content }) => {
    switch (type) {
      case 'selector':
        childSelectors[currentIndex] = formatSelector(content as StyleNode[]);
        return;
      case 'delimiter':
        childSelectors[currentIndex] = childSelectors[currentIndex] + ' ';
        currentIndex++;
        return;
      default:
        childSelectors[currentIndex] = childSelectors[currentIndex] + ' ';
        break;
    }
  });

  if (!scope.length) {
    return childSelectors;
  }

  scope.forEach((selector) => {
    childSelectors.forEach((childSelector) => {
      output.push(
        `${selector}${childSelector}`
          .replace(' &', '')
          .replace(' :', ':')
      );
    });
  });

  return output;
}

export const formatValue = (
  syntax: FileSyntax,
  nodes: StyleNode[],
  parentType?: string,
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

const formatWrappedContent = (
  value: string,
  index: number,
  length: number,
  chars: [string, string],
): string => {
  const [open, close] = chars;

  if (index === 0 && length === 1) {
    return `${open}${value}${close}`;
  }

  switch (index) {
    case 0:
      return `${open}${value}`;
    case length - 1:
      return `${value}${close}`;
    default:
      return value;
  }
}

const formatParentheses = (
  value: string,
  index: number,
  length: number
): string => formatWrappedContent(value, index, length, ['(', ')'])

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

const formatAttributeContent = (
  value: string,
  index: number,
  length: number
): string => formatWrappedContent(value, index, length, ['[', ']'])

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

export const formatSelector = (
  nodes: StyleNode[],
  parentType?: string,
): string => {
  const output: string[] = [];
  const nodeLength = nodes.length;

  nodes.forEach(({ content, type }, index) => {
    let value: string = '';

    if (Array.isArray(content)) {
      value = formatSelector(content, type);
    } else {
      value = formatStringValue(content as string, type, parentType)
    }

    if (type === 'class') {
      value = `.${value}`;
    }

    if (type === 'pseudoElement') {
      value = `::${value}`;
    }

    if (type === 'pseudoClass') {
      value = `:${value}`;
    }

    if (parentType === 'arguments') {
      value = `${formatParentheses(value, index, nodeLength)}`;
    }

    if (parentType === 'attributeSelector') {
      value = `${formatAttributeContent(value, index, nodeLength)}`;
    }

    output.push(`${value}`);
  });

  return output.join('');
}