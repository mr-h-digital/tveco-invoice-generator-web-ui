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
          {/* Photo layer — subtle, moody */}
          <div
            className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${image})`, backgroundPosition: position, opacity: 0.12 }}
          />
          {/* Gradient: stronger at top (nav area), fades out toward content */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(10,12,15,0.85) 0%, rgba(10,12,15,0.55) 30%, rgba(17,19,24,0.4) 70%, rgba(17,19,24,0.7) 100%)' }} />
          {/* Left-edge orange accent glow — ties to TVECO brand */}
          <div className="absolute inset-y-0 left-0 w-px pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,107,0,0.4) 30%, rgba(255,107,0,0.4) 70%, transparent 100%)' }} />
        </>
      )}
      <div className="relative flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
