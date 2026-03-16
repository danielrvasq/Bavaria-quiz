import "./TrainingEmergencySection.css";

interface TrainingEmergencySectionProps {
  onPrevious: () => void;
  onNext: () => void;
}

export function TrainingEmergencySection({
  onPrevious,
  onNext,
}: TrainingEmergencySectionProps) {
  return (
    <div className="training-emergency-section">
      <h1>Capacitación 3: SST</h1>
      <p>
        Para nosotros la seguridad es un valor, y por eso queremos que se sienta
        totalmente seguro en nuestras instalaciones. <br />
        El siguiente video le dará unas pautas que usted deberá observar
        mientras se encuentra de visita. <br />
        Recuerde, queremos que llegue a su casa tan sano como salió de ella.{" "}
        <br />
        !!Su familia lo espera¡¡
      </p>
      <div className="videos">
        <video src="vid/video1.mp4" autoPlay loop controls />
      </div>

      <div className="actions actions--between">
        <button type="button" className="secondary" onClick={onPrevious}>
          Anterior
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Continuar a datos
        </button>
      </div>
    </div>
  );
}
