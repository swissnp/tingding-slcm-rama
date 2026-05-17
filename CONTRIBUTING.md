# Contributing

Thanks for improving this extension.

## Local Setup

1. Clone the repository.
2. Run `npm run check`.
3. Load the folder in Chrome with **Load unpacked** from `chrome://extensions`.
4. Test changes manually on the supported SLCM pages.

## Pull Requests

- Keep permissions in `manifest.json` as narrow as possible.
- Avoid adding dependencies unless they solve a real maintenance problem.
- Do not commit captured HTML, PDFs, personal notes, credentials, cookies, screenshots, or institutional data.
- Include manual test notes for behavior that cannot be covered by the syntax check.

## Style

- Use plain JavaScript compatible with the configured `minimum_chrome_version`.
- Prefer small, readable functions over large inline handlers.
- Keep user-facing text concise.
