import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DocsContent } from '@/components/admin/DocsContent';

export default async function DocsPage() {
  const session = await getSession();

  if (!session?.isAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">NEXUS Integration Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to integrate your applications with NEXUS authentication across multiple frameworks
          </p>
        </div>

        <DocsContent />

        {/* Footer */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
          <p className="text-sm text-foreground">
            <strong>Need help?</strong> Check the NEXUS GitHub repository for more examples and community support.
          </p>
        </div>
      </div>
    </div>
  );
}
