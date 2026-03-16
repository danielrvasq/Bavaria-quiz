import "./WelcomeSection.css";

interface WelcomeSectionProps {
  onNext: () => void;
}

export function WelcomeSection({ onNext }: WelcomeSectionProps) {
  return (
    <div className="welcome-section">
      <div className="welcome-section__overlay">
        <div className="welcome-section__content">
          <h1>Bienvenido a la Cerveceria de Barranquilla</h1>
          <p>El lugar donde se envasa la alegría de Colombia.</p>
        </div>

        <div className="welcome-section__actions">
          <button type="button" className="primary" onClick={onNext}>
            Empezar ahora
          </button>
        </div>
      </div>
    </div>
  );
}
