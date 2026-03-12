# Pi Webfetch Extension

A [Pi](https://github.com/mariozechner/pi-coding-agent) extension for fetching and converting web content to various formats.

## Features

- **Multiple Output Formats**: Convert fetched content to:
  - **Markdown** (default) - HTML converted to clean, readable markdown
  - **Text** - Plain text with all HTML stripped
  - **HTML** - Raw HTML content
  - **JSON** - Parse and format JSON responses
  - **Images** - Fetch and return images as base64-encoded data URLs
- **CSS Selectors**: Extract specific content from pages using CSS selectors (e.g., `article`, `#content`, `.post-body`)
- **Cloudflare Bypass**: Automatically detects and bypasses Cloudflare protection using fallback User-Agent
- **Smart Truncation**: Output is truncated to 50KB/2000 lines, with full content saved to a temp file when needed
- **SSL Support**: Handles SSL certificate issues gracefully (like `curl -k`)
- **Timeout Control**: Configurable request timeouts

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **HTML Parsing**: [Cheerio](https://cheerio.js.org/)
- **Markdown Conversion**: [Turndown](https://github.com/mixmark-io/turndown)
- **HTTP Client**: Undici

## Installation

Install as a Pi package:

```bash
# Install from GitHub
pi install git:github.com/almahdi/pi-webfetch

# Or install from HTTPS
pi install https://github.com/almahdi/pi-webfetch

# Or install project-local (in .pi/git/)
pi install git:github.com/almahdi/pi-webfetch -l
```

## Usage

Once installed, the `webfetch` tool is automatically available in pi.
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

Fetch an image (returns base64-encoded data URL):
```typescript
webfetch({
  url: "https://example.com/image.png"
})
// Returns: { content: "Image fetched successfully...", details: { isImage: true, imageData: "data:image/png;base64,...", imageSize: 1024 } }
```

## Cloudflare Protection

The extension automatically handles Cloudflare-protected websites:

1. **Detection**: Checks for `403` status with `cf-mitigated: challenge` header or `server: cloudflare`
2. **Bypass**: Retries request with simplified User-Agent (`webfetch/1.1.0`)
3. **Reporting**: Reports bypass attempt via progress update
4. **Metadata**: Sets `cloudflareBypassed: true` in response details

No configuration needed - it works automatically when Cloudflare is detected.

## Image Support

When fetching an image URL, the tool:

1. **Detects** image MIME types (`image/png`, `image/jpeg`, `image/webp`, etc.)
2. **Excludes** SVG (treated as text/XML)
3. **Converts** to base64-encoded data URL
4. **Returns** metadata including:
   - `isImage: true`
   - `imageData: "data:image/png;base64,..."`
   - `imageSize: <bytes>`
   - `format: "image"`

Supported formats: PNG, JPEG, GIF, WebP, AVIF, and other standard image formats.

## Response Details

All responses include detailed metadata in the `details` field:

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The fetched URL |
| `status` | number | HTTP status code (e.g., 200) |
| `statusText` | string | HTTP status text (e.g., "OK") |
| `contentType` | string | Response Content-Type header |
| `totalBytes` | number | Size of response in bytes |
| `totalLines` | number | Number of lines in response |
| `truncated` | boolean | Whether output was truncated |
| `format` | string | Requested format (`markdown`, `text`, `html`, `json`, `image`) |
| `selector` | string? | CSS selector used (if any) |
| `isImage` | boolean? | True if response is an image |
| `imageData` | string? | Base64 data URL (for images) |
| `imageSize` | number? | Image size in bytes (for images) |
| `cloudflareBypassed` | boolean? | True if Cloudflare bypass was used |

## Testing

Run the test suite:

```bash
npx tsx tests/webfetch.test.ts
```

The test suite includes:
- Cloudflare bypass tests (3 tests)
- Image fetching tests (6 tests)
- Existing functionality tests (8 tests)
- User-Agent handling tests (2 tests)
- Error handling tests (6 tests)
- Metadata tests (3 tests)

**Total: 28 tests**

Note: These are structural tests. Integration tests with live URLs require internet connectivity.

## License

This project is licensed under the MIT License.

```
Copyright (c) 2026 Ali Almahdi

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

[github.com/almahdi/pi-webfetch](https://github.com/almahdi/pi-webfetch)
