import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            lineHeight: '1.8',
            p: {
              lineHeight: '1.8',
              marginTop: '1.05em',
              marginBottom: '1.05em'
            },
            li: {
              lineHeight: '1.8',
              marginTop: '0.4em',
              marginBottom: '0.4em'
            }
          }
        },
        invert: {
          css: {
            '--tw-prose-pre-bg': 'rgb(12 17 24)',
            '--tw-prose-pre-code': 'rgb(232 240 248)',
            '--tw-prose-code': 'rgb(226 232 240)',
            lineHeight: '1.8',
            p: {
              lineHeight: '1.8',
              marginTop: '1.05em',
              marginBottom: '1.05em'
            },
            li: {
              lineHeight: '1.8',
              marginTop: '0.4em',
              marginBottom: '0.4em'
            },
            pre: {
              borderRadius: '0.75rem',
              padding: '1.125rem 1.25rem',
              borderWidth: '1px',
              borderColor: 'rgba(148, 163, 184, 0.22)'
            },
            'pre code': {
              fontWeight: '400'
            },
            '.mermaid': {
              marginTop: '1.35em',
              marginBottom: '1.35em'
            },
            '.mermaid + p': {
              marginTop: '1.15em'
            }
          }
        }
      }
    }
  },
  plugins: [typography]
} satisfies Config;
