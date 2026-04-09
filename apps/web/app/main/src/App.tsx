import { FeatureCard, StatusPanel } from '@z-mono/ui';
import { InfiniteCanvas } from '@z-mono/infinite-canvas';

const features = [
  {
    title: 'Multi App Layout',
    description: 'Place multiple frontend entry apps under apps/web/app.'
  },
  {
    title: 'Component Packages',
    description: 'Publish reusable UI pieces from apps/web/packages independently.'
  },
  {
    title: 'Turbo Workflow',
    description: 'Build and develop frontend packages and apps from one monorepo.'
  }
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">web workspace</p>
        <h1>One frontend workspace, multiple apps and publishable packages</h1>
        <p className="hero-copy">
          The current example app lives in apps/web/app/main and consumes UI components from
          apps/web/packages/ui.
        </p>
      </section>

      <section className="grid-section">
        <div className="feature-grid">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
        <StatusPanel />
      </section>

      <section className="canvas-section">
        <InfiniteCanvas />
      </section>
    </main>
  );
}
