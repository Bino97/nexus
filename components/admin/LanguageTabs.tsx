'use client';

interface LanguageTabsProps {
  examples: {
    [key: string]: {
      label: string;
      code: string;
      language?: string;
    };
  };
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function LanguageTabs({ examples, activeTab: controlledTab, onTabChange }: LanguageTabsProps) {
  const languages = Object.keys(examples);
  const activeTab = controlledTab || languages[0];

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex gap-2 border-b border-border">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => handleTabChange(lang)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === lang
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {examples[lang].label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <pre className="overflow-x-auto rounded bg-secondary p-4 text-sm">
          <code className="text-foreground">{examples[activeTab].code}</code>
        </pre>
      </div>
    </div>
  );
}
