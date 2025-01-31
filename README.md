# My Wizard Module

A lightweight, Shadow DOM-based step-by-step "wizard" or guided tour, highlighting elements in your UI with tooltips. Supports:

- **Light / Dark themes**  
- **Skips invisible elements**  
- **Previous / Next / Close** buttons  
- **LocalStorage** to remember if a user has already seen the tour  
- **Optional auto-scrolling** to bring each step into view  
- **Mobile-friendly** layout

## Installation

Clone or download this repo, and include **wizard.js** in your HTML:

```html
<script src="wizard.js"></script>
```

The module attaches `window.WizardModule` globally.

## Usage

```js
// In your code:
const steps = [
  { selector: '#loginButton', text: 'Click here to log in!' },
  { selector: '#profilePicture', text: '<strong>Profile:</strong> Update your info here.' }
];

WizardModule.startWizard(
  steps,          // array of { selector, text }
  'myWizardId',   // optional localStorage key
  false,          // forceStart?
  'light',        // theme => 'light' or 'dark'
  { autoScroll: true }  // extra options
);
```

- **`steps`**: Each step has a CSS `selector` and `text` (HTML allowed).
- **`wizardId`**: If provided, once completed, it won't start again unless `forceStart` is `true`.
- **`forceStart`**: If `true`, ignore localStorage.
- **`theme`**: `'light'` or `'dark'`. Default is `'dark'` if omitted.
- **`options.autoScroll`**: If `true`, scrolls each element into view before showing the tooltip.

## Example

See **example.html** for a running demo.

## Contributing

1. Fork or clone the repo
2. Make changes in a branch
3. Commit and open a pull request

## License

MIT
