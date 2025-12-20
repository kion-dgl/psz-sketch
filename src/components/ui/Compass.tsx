interface CompassProps {
  rotation: number; // Player rotation in radians
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function Compass({ rotation, position = 'bottom-left' }: CompassProps) {
  // Convert player rotation to compass rotation
  // Player rotation is the direction they're facing
  // Compass should rotate opposite to show world directions
  const compassRotation = -rotation;

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
  };

  const style = positionStyles[position];

  return (
    <div
      style={{
        position: 'absolute',
        ...style,
        zIndex: 1000,
        width: '80px',
        height: '80px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: '10px',
        color: 'white',
      }}
    >
      {/* Rotating compass rose */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: `rotate(${compassRotation}rad)`,
          transition: 'transform 0.1s linear',
        }}
      >
        {/* North (pointing up when rotation = 0, which is -Z direction) */}
        <div
          style={{
            position: 'absolute',
            top: '5px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#ff4444',
          }}
        >
          N
        </div>

        {/* South */}
        <div
          style={{
            position: 'absolute',
            bottom: '5px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#aaaaaa',
          }}
        >
          S
        </div>

        {/* East */}
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#aaaaaa',
          }}
        >
          E
        </div>

        {/* West */}
        <div
          style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#aaaaaa',
          }}
        >
          W
        </div>

        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '6px',
            height: '6px',
            background: 'white',
            borderRadius: '50%',
          }}
        />

        {/* North arrow */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '8px solid #ff4444',
          }}
        />
      </div>

      {/* Static label */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.6)',
          whiteSpace: 'nowrap',
        }}
      >
        Compass
      </div>

      {/* Coordinate info tooltip */}
      <div
        style={{
          position: 'absolute',
          bottom: '-45px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '8px',
          color: 'rgba(255, 255, 255, 0.5)',
          whiteSpace: 'nowrap',
          fontFamily: 'monospace',
        }}
      >
        N:-Z S:+Z E:+X W:-X
      </div>
    </div>
  );
}
