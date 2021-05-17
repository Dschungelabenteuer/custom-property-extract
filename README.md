# custom-property-extract

Extract CSS custom properties (a.k.a CSS variables) and their values from `SCSS`, `SASS` and `CSS` stylesheets.

Since they can be overwritten in selectors, every custom property returns an array of all possible values
directly extracted from the provided stylesheet. See [Example](#example) to get a quick overview on how
things work.

## Install

Install custom-property-extract by running the following command:
```console
npm install custom-property-extract
```

## Usage

### **extract(_sourceStyle_, _extractOptions_)**

```js
const path = require('path');
const { extract } = require('custom-property-extract');

const customProperties = extract(path.resolve('./path/to/stylesheet.scss'), { syntax: 'scss' });
```


Alternatively, you can directly pass the content of the stylesheet in the `sourceStyle` argument by
setting the `source` option to `"content"`:
```js
const path = require('path');
const { extract } = require('custom-property-extract');

const style = `
  :root {
    --my-variable: blue;
  }
`;

const customProperties = extract(style, {
  syntax: 'scss',
  source: 'content',
});
```

### **_extractOptions_**

| **Name**             | **Type**    | **Required** | **Default** | **Description**                                               |
|----------------------|-------------|--------------|-------------|---------------------------------------------------------------|
| **`mode`**           | `{String}`  | `false`      | `"simple"`  | Output mode (`"simple"`, `"full"`)                            |
| **`syntax`**         | `{String}`  | `false`      | `"css"`     | Syntax of the source stylesheet (`"css"`, `"scss"`, `"sass"`) |
| **`source`**         | `{String}`  | `false`      | `"file"`    | Type of the source (`"file"`, `"content"`)                    |
| **`prefix`**         | `{Boolean}` | `false`      | `true`      | Determines whether to prefix custom properties with `--`.     |

## Example

Consider the following CSS stylesheet:
```css
@charset "UTF-8";
:root {
  --color-primary: #ff017d;
  --color-secondary: #000;
  --color-background: white;
  --color-foreground: var(--color-secondary);
  --radius-round: 50% 50%;
  --spacing-s: 5rem;
  --shadow-xs: 1px 2px 3px 4px rgba(0,0,0,0.25), inset 4px 3px 2px 1px #fff;
  --border-light: 1px solid rgba(0,0,0,0.15);
  --amount-suffix-content: '€';
  --margin-default: 0.5rem !important;
}

[data-theme="dark"] {
  --color-primary: #cf689a;
  --color-secondary: blue;
  --color-background: var(--color-background);
}

[data-theme="dark"].nested {
  --color-primary: blue;
  --width-header: calc(100vh - (3rem / 2));
}

[data-lang="us"] {
  --amount-suffix-content: '$';
}

@media screen and (min-width: 960px) {
  :root {
    --color-primary: blue;
  }
}
```

### Simple mode

Using custom-property-extract's extract function will output the following object:
```js
{
  '--color-primary': [ '#ff017d', '#cf689a', 'blue', 'blue' ],
  '--color-secondary': [ '#000', 'blue' ],
  '--color-background': [ 'white', 'var(--color-background)' ],
  '--color-foreground': [ 'var(--color-secondary)' ],
  '--radius-round': [ '50% 50%' ],
  '--spacing-s': [ '5rem' ],
  '--shadow-xs': [ '1px 2px 3px 4px rgba(0,0,0,0.25), inset 4px 3px 2px 1px #fff' ],
  '--border-light': [ '1px solid rgba(0,0,0,0.15)' ],
  '--amount-suffix-content': [ "'€'", "'$'" ],
  '--margin-default': [ '0.5rem !important' ],
  '--width-header': [ 'calc(100vh - (3rem / 2))' ]
}
```

### Full mode

Using custom-property-extract's extract function with `mode` set to "`full`" will output the following object:
```js
{
  '--color-primary': [
    {
      selector: ':root ',
      value: '#ff017d'
    },
    {
      selector: '[data-theme="dark"] ',
      value: '#cf689a'
    },
    {
      selector: '[data-theme="dark"].nested ',
      value: 'blue'
    },
    {
      selector: '[data-lang="us"]:root ',
      value: 'blue'
    }
  ],
  '--color-secondary': [
    {
      selector: ':root ',
      value: '#000'
    },
    {
      selector: '[data-theme="dark"] ',
      value: 'blue'
    }
  ],
  '--color-background': [
    {
      selector: ':root ',
      value: 'white'
    },
    {
      selector: '[data-theme="dark"] ',
      value: 'var(--color-background)'
    }
  ],
  '--color-foreground': [
    {
      selector: ':root ',
      value: 'var(--color-secondary)'
    }
  ],
  '--radius-round': [
    {
      selector: ':root ',
      value: '50% 50%'
    }
  ],
  '--spacing-s': [
    {
      selector: ':root ',
      value: '5rem'
    }
  ],
  '--shadow-xs': [
    {
      selector: ':root ',
      value: '1px 2px 3px 4px rgba(0,0,0,0.25), inset 4px 3px 2px 1px #fff'
    }
  ],
  '--border-light': [
    {
      selector: ':root ',
      value: '1px solid rgba(0,0,0,0.15)'
    }
  ],
  '--amount-suffix-content': [
    {
      selector: ':root ',
      value: "'€'"
    },
    {
      selector: '[data-lang="us"] ',
      value: "'$'"
    }
  ],
  '--margin-default': [
    {
      selector: ':root ',
      value: '0.5rem !important'
    }
  ],
  '--width-header': [
    {
      selector: '[data-theme="dark"].nested ',
      value: 'calc(100vh - (3rem / 2))'
    }
  ]
}
```

### Naming a custom property definition

When using the full mode, you may provide a name to a custom property definition by adding a comment starting with the `@case` keyword.

**Example input**
```scss
:root {
  // @case Default color.
  --color-primary: #ff017d;
  --color-secondary: #000;
}

.app {
  --color-primary: gray;

  .has-errors {
    /** @case Color when something wrong happened. */
    --color-primary: red;
  }
}
```

**Example output**
```js
{
  '--color-primary': [
    { selector: ':root ', value: '#ff017d', name: 'Default color.' },
    { selector: '.app ', value: 'gray' },
    {
      selector: '.app .has-errors ',
      value: 'red',
      name: 'Color when something wrong happened.'
    }
  ],
  '--color-secondary': [ { selector: ':root ', value: '#000' } ]
}
```
