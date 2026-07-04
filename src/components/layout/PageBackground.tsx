interface PageBackgroundProps {
  children: React.ReactNode;
  image?: string;
  position?: string;
}

export function PageBackground({ children, image, position = 'center' }: PageBackgroundProps) {
  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      {image && (
        <>
          {/* Photo layer — visible but not distracting */}
          <div
            className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${image})`, backgroundPosition: position, opacity: 0.35 }}
          />
          {/* Light scrim — just enough to keep text readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(10,12,15,0.60) 0%, rgba(10,12,15,0.30) 35%, rgba(17,19,24,0.20) 65%, rgba(17,19,24,0.55) 100%)' }}
          />
          {/* Left-edge orange accent */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none"
            style={{ width: 2, background: 'linear-gradient(to bottom, transparent 0%, rgba(255,107,0,0.5) 25%, rgba(255,107,0,0.5) 75%, transparent 100%)' }}
          />
        </>
      )}
      <div className="relative flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
