/**
 * Pi webfetch extension
 * Fetches web content and converts to various formats (markdown, text, html, json)
 *
 * @version 1.0.0
 * @author Ali Almahdi
 * @copyright Copyright (c) 2026 Ali Almahdi
 * @license MIT
 * @see https://github.com/almahdi/pi-webfetch
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import {
  truncateHead,
  formatSize,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
} from "@mariozechner/pi-coding-agent";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Agent } from "undici";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 pi-webfetch/1.0.0";

const DEFAULT_TIMEOUT = 30000;

// Agent for handling SSL certificate issues (like curl -k)
const sslAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "webfetch",
    label: "Web Fetch",
    description:
      "Fetch content from a URL and convert to various formats. " +
      "Supports markdown (default), text, html, and json output. " +
      "Can extract specific content using CSS selectors. " +
      "Output is truncated to 50KB/2000 lines, with full content saved to a temp file if needed.",
    promptSnippet: "Fetch and extract content from web pages",
    promptGuidelines: [
      "Use this tool when you need to fetch content from a URL.",
      "Prefer markdown format for readable content, json for API responses.",
      "Use CSS selectors to extract specific parts of a page when needed.",
    ],
    parameters: Type.Object({
      url: Type.String({
        description: "URL to fetch",
      }),
      format: StringEnum(["markdown", "text", "html", "json"] as const, {
        description:
          "Output format: markdown (default, HTML converted to MD), text (plain text), html (raw), json (parse as JSON)",
      }),
      selector: Type.Optional(
        Type.String({
          description:
            "CSS selector to extract specific content (e.g., 'article', '#content', '.post-body')",
        })
      ),
      timeout: Type.Optional(
        Type.Number({
          description: `Request timeout in milliseconds (default: ${DEFAULT_TIMEOUT})`,
        })
      ),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { url, format = "markdown", selector, timeout = DEFAULT_TIMEOUT } = params;

      // Check if already aborted
      if (signal?.aborted) {
        throw new Error("Request was cancelled before starting");
      }

      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        throw new Error(`Invalid URL: ${url}`);
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error(
          `Unsupported protocol: ${parsedUrl.protocol}. Only http and https are supported.`
        );
      }

      // Report progress
      onUpdate?.({
        content: [{ type: "text", text: `Fetching ${url}...` }],
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Forward abort from parent signal
      const onAbort = () => {
        controller.abort();
        clearTimeout(timeoutId);
      };
      signal?.addEventListener("abort", onAbort);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": USER_AGENT,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
          signal: controller.signal,
          redirect: "follow",
          dispatcher: sslAgent,
        });
      } catch (err) {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onAbort);

        const errorMessage = (err as Error).message || String(err);
        if (errorMessage.includes("aborted") || errorMessage.includes("AbortError")) {
          throw new Error(`Request timed out after ${timeout}ms or was cancelled`);
        }
        throw new Error(`Failed to fetch ${url}: ${errorMessage}`);
      }

      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${url}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const rawContent = await response.text();

      onUpdate?.({
        content: [{ type: "text", text: `Processing ${format} format...` }],
      });

      // Process content based on format
      let content: string;
      let finalContentType = contentType;

      if (format === "json") {
        // Parse as JSON
        try {
          const json = JSON.parse(rawContent);
          content = JSON.stringify(json, null, 2);
          finalContentType = "application/json";
        } catch {
          throw new Error(`Failed to parse response as JSON: ${url}`);
        }
      } else if (format === "html") {
        // Raw HTML
        content = rawContent;
      } else {
        // For markdown and text, we need to parse HTML
        let html = rawContent;

        // Extract with selector if provided
        if (selector) {
          const $ = cheerio.load(rawContent);
          const selected = $(selector);
          if (selected.length === 0) {
            throw new Error(`No elements found for selector: ${selector}`);
          }
          html = selected.html() || selected.text();
        }

        if (format === "text") {
          // Plain text - strip all HTML
          const $ = cheerio.load(html);
          // Remove script and style elements
          $("script, style, noscript").remove();
          content = $("body").text() || $.root().text();
          // Clean up whitespace
          content = content.replace(/\s+/g, " ").trim();
        } else {
          // Markdown (default)
          const $ = cheerio.load(html);
          // Remove script and style elements before converting
          $("script, style, noscript").remove();

          const turndown = new TurndownService({
            headingStyle: "atx",
            hr: "---",
            bulletListMarker: "-",
            codeBlockStyle: "fenced",
            fence: "```",
            emDelimiter: "*",
            strongDelimiter: "**",
          });

          // Get HTML to convert
          const htmlToConvert = selector ? html : $("body").html() || $.html();
          content = turndown.turndown(htmlToConvert);
        }
      }

      // Truncate output
      const truncation = truncateHead(content, {
        maxLines: DEFAULT_MAX_LINES,
        maxBytes: DEFAULT_MAX_BYTES,
      });

      let result = truncation.content;
      const details: WebfetchDetails = {
        url,
        status: response.status,
        statusText: response.statusText,
        contentType: finalContentType,
        totalBytes: content.length,
        totalLines: content.split("\n").length,
        truncated: truncation.truncated,
        format,
        selector,
      };

      if (truncation.truncated) {
        // Write full content to temp file
        const tempDir = mkdtempSync(join(tmpdir(), "webfetch-"));
        const tempFile = join(tempDir, "content" + getExtension(format));
        writeFileSync(tempFile, content, "utf-8");

        result += `\n\n---`;
        result += `\n[Output truncated: ${truncation.outputLines} of ${truncation.totalLines} lines`;
        result += ` (${formatSize(truncation.outputBytes)} of ${formatSize(truncation.totalBytes)})]`;
        result += `\nFull output saved to: ${tempFile}`;
      }

      return {
        content: [{ type: "text", text: result }],
        details,
      };
    },
  });
}

function getExtension(format: string): string {
  switch (format) {
    case "markdown":
      return ".md";
    case "html":
      return ".html";
    case "json":
      return ".json";
    case "text":
      return ".txt";
    default:
      return ".txt";
  }
}

interface WebfetchDetails {
  url: string;
  status: number;
  statusText: string;
  contentType: string;
  totalBytes: number;
  totalLines: number;
  truncated: boolean;
  format: string;
  selector?: string;
}
