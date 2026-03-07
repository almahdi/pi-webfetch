# Pi Webfetch Extension

A [Pi](https://github.com/mariozechner/pi-coding-agent) extension for fetching and converting web content to various formats.

## Features

- **Multiple Output Formats**: Convert fetched content to:
  - **Markdown** (default) - HTML converted to clean, readable markdown
  - **Text** - Plain text with all HTML stripped
  - **HTML** - Raw HTML content
  - **JSON** - Parse and format JSON responses
- **CSS Selectors**: Extract specific content from pages using CSS selectors (e.g., `article`, `#content`, `.post-body`)
- **Smart Truncation**: Output is truncated to 50KB/2000 lines, with full content saved to a temp file when needed
- **SSL Support**: Handles SSL certificate issues gracefully
- **Timeout Control**: Configurable request timeouts

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **HTML Parsing**: [Cheerio](https://cheerio.js.org/)
- **Markdown Conversion**: [Turndown](https://github.com/mixmark-io/turndown)
- **HTTP Client**: Undici

## Installation

```bash
# Install dependencies
npm install
```

## Usage

This extension is designed to be used with the Pi coding agent. Add it to your project's `package.json`:

```json
{
  "pi": {
    "extensions": ["./index.ts"]
  }
}
```

### Tool Parameters

The `webfetch` tool accepts the following parameters:

| Parameter  | Type     | Required | Description                                                    |
|------------|----------|----------|----------------------------------------------------------------|
| `url`      | string   | Yes      | URL to fetch                                                   |
| `format`   | string   | No       | Output format: `markdown` (default), `text`, `html`, `json`    |
| `selector` | string   | No       | CSS selector to extract specific content                       |
| `timeout`  | number   | No       | Request timeout in milliseconds (default: 30000)               |

### Example Usage

Fetch a webpage as markdown:
```typescript
webfetch({
  url: "https://example.com/article",
  format: "markdown"
})
```

Extract specific content using a CSS selector:
```typescript
webfetch({
  url: "https://example.com/blog",
  format: "markdown",
  selector: ".post-content"
})
```

Fetch JSON from an API:
```typescript
webfetch({
  url: "https://api.example.com/data",
  format: "json"
})
```

## License

This project is licensed under the MIT License.

```
Copyright (c) 2025 Ali Almahdi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Ali Almahdi - [ali.ac](https://ali.ac) - [@alialmahdi](https://x.com/alialmahdi)

## Repository

[github.com/almahdi/webfetch](https://github.com/almahdi/webfetch)
