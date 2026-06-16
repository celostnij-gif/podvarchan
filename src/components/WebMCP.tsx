'use client'

import Script from 'next/script'

/**
 * WebMCP component — exposes site tools to AI agents via
 * navigator.modelContext.provideContext().
 *
 * See https://webmachinelearning.github.io/webmcp/
 *     https://developer.chrome.com/blog/webmcp-epp
 */
export default function WebMCP() {
  return (
    <Script
      id="webmcp"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: WEBMCP_SCRIPT }}
    />
  )
}

// Self-contained script that registers tools via WebMCP API.
// Uses IIFE to avoid global scope pollution.
const WEBMCP_SCRIPT = `(function() {
  'use strict';

  var CONTEXT;
  var TOOLS = {};
  var ABORT = new AbortController();

  function defineTool(name, description, inputSchema, execute) {
    TOOLS[name] = { name: name, description: description, inputSchema: inputSchema, execute: execute };
  }

  // Define site tools
  defineTool(
    'searchSite',
    'Search the Podvarchan.com site content — blog posts, services, pages.',
    {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' }
      },
      required: ['query']
    },
    async function(args) {
      try {
        var res = await fetch('/api/search?q=' + encodeURIComponent(args.query));
        return await res.text();
      } catch(e) {
        return 'Search unavailable: ' + e.message;
      }
    }
  );

  defineTool(
    'getPageContent',
    'Get the Markdown content of any page on the site by its path.',
    {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Page path, e.g. /uslugi/gipnoterapiya-onlayn or /blog/chto-takoe-gipnoterapiya' }
      },
      required: ['path']
    },
    async function(args) {
      try {
        var url = window.location.origin + args.path;
        if (!args.path.startsWith('/')) url = window.location.origin + '/' + args.path;
        var res = await fetch(url, { headers: { 'Accept': 'text/markdown' } });
        return await res.text();
      } catch(e) {
        return 'Failed to fetch page: ' + e.message;
      }
    }
  );

  defineTool(
    'listServices',
    'List all available hypnotherapy services with descriptions.',
    {
      type: 'object',
      properties: {}
    },
    async function() {
      try {
        var res = await fetch('/uslugi/', { headers: { 'Accept': 'text/markdown' } });
        return await res.text();
      } catch(e) {
        return 'Failed to list services: ' + e.message;
      }
    }
  );

  defineTool(
    'listBlogPosts',
    'List recent blog posts with titles and summaries.',
    {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category slug to filter by' }
      }
    },
    async function(args) {
      try {
        var path = args.category ? '/blog/kategoriya/' + args.category : '/blog/';
        var res = await fetch(path, { headers: { 'Accept': 'text/markdown' } });
        return await res.text();
      } catch(e) {
        return 'Failed to list posts: ' + e.message;
      }
    }
  );

  defineTool(
    'getContactInfo',
    'Get contact information for the hypnotherapist.',
    {
      type: 'object',
      properties: {}
    },
    async function() {
      try {
        var res = await fetch('/kontakty/', { headers: { 'Accept': 'text/markdown' } });
        return await res.text();
      } catch(e) {
        return 'Failed to get contact info: ' + e.message;
      }
    }
  );

  // Register all tools via WebMCP API when available
  function register() {
    if (typeof navigator === 'undefined' || !navigator.modelContext || typeof navigator.modelContext.provideContext !== 'function') {
      // WebMCP not available yet — retry on DOMContentLoaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', register);
      }
      return;
    }

    navigator.modelContext.provideContext({
      tools: Object.keys(TOOLS).map(function(k) {
        var tool = TOOLS[k];
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: tool.execute
        };
      }),
      signal: ABORT.signal
    }).catch(function(err) {
      console.warn('WebMCP registration failed:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
})();`
