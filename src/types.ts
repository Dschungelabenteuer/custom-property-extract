/** Supported stylesheets syntaxes. */
export type FileSyntax =
  | 'css'
  | 'sass'
  | 'scss';

/** Supported source types. */
export type SourceType =
  | 'file'
  | 'content';

/** Extract options. */
export interface ExtractOptions {
  syntax?: FileSyntax;
  source?: SourceType;
  prefix?: boolean;
}

export interface ExtractResult {
  [key: string]: CustomPropertyValues;
}

export type StyleNode = {
  type: string;
  content?: StyleNode[] | string;
}

export type CustomPropertyValues = CustomPropertyValue[];

export type CustomPropertyValue = string;
