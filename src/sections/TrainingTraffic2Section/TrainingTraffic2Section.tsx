import "./TrainingTraffic2Section.css";

interface TrainingReportSectionProps {
  onPrevious: () => void;
  onNext: () => void;
}

export function TrainingReportSection({
  onPrevious,
  onNext,
}: TrainingReportSectionProps) {
  return (
    <div className="training-report-section">
      <h1>Plan de trafico 2 - Area de descargue de malta, jarabe y soda</h1>
      <p>
        Esta es el área por donde deberá circular si va a descargar materiales
        como químicos, malta, soda, jarabe; cargue de levadura, afrecho, agua
        celite, basuras.
      </p>
      <div className="videos">
        <img src="img/plan de trafico 2.jpg" alt="" />
        <video src="vid/video1.mp4" autoPlay loop controls />
      </div>

      <div className="actions actions--between">
        <button type="button" className="secondary" onClick={onPrevious}>
          Anterior
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
