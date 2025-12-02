'use client';

interface FrameworkSelectorProps {
  activeFramework: string;
  onFrameworkChange: (framework: string) => void;
}

const frameworks = [
  { id: 'nextjs', label: 'Next.js' },
  { id: 'express', label: 'Express' },
  { id: 'flask', label: 'Flask' },
  { id: 'go', label: 'Go' },
];

export function FrameworkSelector({ activeFramework, onFrameworkChange }: FrameworkSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {frameworks.map((framework) => (
        <button
          key={framework.id}
          onClick={() => onFrameworkChange(framework.id)}
          className={`rounded-lg border p-3 text-center transition-all ${
            activeFramework === framework.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary'
          }`}
        >
          <p className="text-sm font-medium">{framework.label}</p>
        </button>
      ))}
    </div>
  );
}
