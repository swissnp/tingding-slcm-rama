# SLCM Evaluator

A small Chrome extension that helps fill SLCM evaluation forms with a user-selected 1-5 score.

This project is not affiliated with, endorsed by, or maintained by any institution or SLCM platform operator.

## Disclaimer

This project does not promote, encourage, or endorse misuse of evaluation systems or violations of institutional policy. It is provided as-is for personal use where permitted. The author accepts no responsibility or liability for any academic, professional, technical, or other consequences from using this project.

## What It Does

- Adds an **Auto Evaluate All** control to the SLCM evaluation list page.
- Lets the user choose a score from 1/5 through 5/5.
- Opens matching evaluation forms one at a time.
- Selects the configured score for each radio-button question and submits the form.

Use this only where you are allowed to do so. You are responsible for complying with your institution's academic, professional, and platform-use policies.

## Supported Pages

The extension is scoped to secure SLCM survey pages matching:

- `https://*/slcm/survey/portal_index.php*`
- `https://*/slcm/survey/ans_eva_form.php*`

The manifest intentionally avoids broad `http://*/*`, `https://*/*`, and `file:///*` permissions.

## Install Locally

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project directory.
5. Open the SLCM evaluation list page and use the floating control.

## Development

This project has no runtime dependencies.

```sh
npm run check
```

The check script validates JavaScript syntax and parses `manifest.json`.

## Project Files

- `manifest.json` - Chrome extension manifest.
- `background.js` - Opens and tracks evaluation tabs.
- `portal_script.js` - Adds the list-page UI and gathers form URLs.
- `form_script.js` - Fills and submits individual forms.
- `icon*.png` - Extension icons.

## License

MIT. See [LICENSE](LICENSE).
