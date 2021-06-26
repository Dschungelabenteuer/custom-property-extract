/** Supported stylesheets syntaxes. */
export type FileSyntax =
  | 'css'
  | 'sass'
  | 'scss';

/** Supported source types. */
export type SourceType =
  | 'file'
  | 'content';

/** Supported extract outputs. */
export type ExtractMode =
  | 'simple'
  | 'full';

/** Extract options. */
export interface ExtractOptions {
  mode?: ExtractMode;
  syntax?: FileSyntax;
  source?: SourceType;
  prefix?: boolean;
}
export interface CustomPropertyParameters {
  key: string;
  value: CustomPropertyValue;
}

export interface StyleNode {
  type: string;
  content?: StyleNode[] | string;
  is: (type: string) => boolean;
}

export type SimpleCustomPropertyValues = SimpleCustomPropertyValue[];
export type SimpleCustomPropertyValue = string;
export interface SimpleExtractResult {
  [key: string]: SimpleCustomPropertyValues;
}

export type FullCustomPropertyValues = FullCustomPropertyValue[];
export interface FullCustomPropertyValue {
  media?: string;
  name?: string;
  selector?: string;
  value: string;
};
export interface FullExtractResult {
  [key: string]: FullCustomPropertyValues;
}

export type CustomPropertyValues = CustomPropertyValue[];
export type CustomPropertyValue = SimpleCustomPropertyValue | FullCustomPropertyValue;
export type ExtractResult = SimpleExtractResult | FullExtractResult;
