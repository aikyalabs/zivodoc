import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@src/components/atoms/button';

interface Props {
  projectId: string;
  apiUrl?: string;
  cdnUrl?: string;
}

export function ChatEmbedSnippet({
  projectId,
  apiUrl,
  cdnUrl = 'https://cdn.zivodoc.com/chat.js',
}: Props) {
  const [copied, setCopied] = useState(false);

  const apiAttr = apiUrl ? `\n  data-api="${apiUrl}"` : '';
  const snippet = `<script
  src="${cdnUrl}"
  data-project="${projectId}"${apiAttr}
  data-title="Ask the docs"
  data-theme="auto"
  defer
></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-muted/30">
        <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
          <span>Drop into any docs page — works in plain HTML, Mintlify, Docusaurus, Next.js…</span>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7">
            {copied ? (
              <>
                <Check className="mr-1.5 size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto px-3 py-3 text-xs leading-relaxed">
          <code>{snippet}</code>
        </pre>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>
          The widget loads asynchronously, weighs ~4 KB gzipped, and queries{' '}
          <code className="rounded bg-muted px-1 py-0.5">{apiUrl ?? 'api.zivodoc.com'}</code> with a
          public project ID. No secrets are exposed. Conversations are rate-limited per IP and
          billed against your org's BYOK AI key.
        </p>
      </div>
    </div>
  );
}
