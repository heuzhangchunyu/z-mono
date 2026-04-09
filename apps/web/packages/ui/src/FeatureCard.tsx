interface FeatureCardProps {
  title: string;
  description: string;
}

export default function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="feature-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}
