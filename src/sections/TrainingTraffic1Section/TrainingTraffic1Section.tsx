import "./TrainingTraffic1Section.css";

interface TrainingEppSectionProps {
  onPrevious: () => void;
  onNext: () => void;
}

export function TrainingEppSection({
  onPrevious,
  onNext,
}: TrainingEppSectionProps) {
  return (
    <div className="training-epp-section">
      <h1>Plan de trafico 1 - Area de empaque devolutivo y materias primas</h1>
      <p>
        Esta es el área por donde deberá circular si va a descargar materiales
        como etiquetas, tapas, tierras, azúcar, pegante, cartón, PET, plásticos,
        lata.
      </p>
      <div className="videos">
        <img
          src="img/plan de trafico 1.jpg"
          alt="Traffic plan 1 diagram showing the packaging return and raw materials area with circulation routes and designated zones for unloading materials including labels, caps, soils, sugar, adhesive, cardboard, PET, plastics, and tin cans."
        />
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
