import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, chart);

        // Insert the rendered SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }

        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '6px',
        color: '#c33',
      }}>
        <h3>Diagram Rendering Error</h3>
        <p>{error}</p>
        <details style={{ marginTop: '1rem' }}>
          <summary>Show diagram source</summary>
          <pre style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f5f5f5',
            overflow: 'auto',
            fontSize: '0.85rem',
          }}>
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '1rem',
      }}
    />
  );
}
