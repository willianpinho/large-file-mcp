import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Large File MCP Server",
  description: "Production-ready MCP server for intelligent handling of large files with smart chunking, navigation, and streaming capabilities",

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Large File MCP Server' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/reference' },
      { text: 'Examples', link: '/examples/use-cases' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Large File MCP?', link: '/guide/introduction' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Installation', link: '/guide/installation' },
        ]
      },
      {
        text: 'Usage',
        items: [
          { text: 'Basic Usage', link: '/guide/usage' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Best Practices', link: '/guide/best-practices' },
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Tools Overview', link: '/api/reference' },
          { text: 'read_large_file_chunk', link: '/api/read-chunk' },
          { text: 'search_in_large_file', link: '/api/search' },
          { text: 'get_file_structure', link: '/api/structure' },
          { text: 'navigate_to_line', link: '/api/navigate' },
          { text: 'get_file_summary', link: '/api/summary' },
          { text: 'stream_large_file', link: '/api/stream' },
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Use Cases', link: '/examples/use-cases' },
          { text: 'Log Analysis', link: '/examples/log-analysis' },
          { text: 'Code Navigation', link: '/examples/code-navigation' },
          { text: 'CSV Processing', link: '/examples/csv-processing' },
        ]
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Performance', link: '/guide/performance' },
          { text: 'Caching', link: '/guide/caching' },
          { text: 'Troubleshooting', link: '/guide/troubleshooting' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/willianpinho/large-file-mcp' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Willian Pinho'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/willianpinho/large-file-mcp/edit/master/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
