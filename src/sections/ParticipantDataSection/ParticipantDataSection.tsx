import type { FormEvent } from "react";
import "./ParticipantDataSection.css";

interface ParticipantDataSectionProps {
  firstName: string;
  lastName: string;
  cedula: string;
  vehiclePlate: string;
  transportCompany: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onCedulaChange: (value: string) => void;
  onVehiclePlateChange: (value: string) => void;
  onTransportCompanyChange: (value: string) => void;
  onPrevious: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function ParticipantDataSection({
  firstName,
  lastName,
  cedula,
  vehiclePlate,
  transportCompany,
  onFirstNameChange,
  onLastNameChange,
  onCedulaChange,
  onVehiclePlateChange,
  onTransportCompanyChange,
  onPrevious,
  onSubmit,
}: ParticipantDataSectionProps) {
  return (
    <form className="participant-data-section" onSubmit={onSubmit}>
      <h1>Datos del participante</h1>
      <p>
        Completa tus datos para iniciar el quiz. <br />
        Al enviar este formulario, no se recopilarán automáticamente sus datos,
        como nombre y cédula, a menos que usted los proporcione.
      </p>

      <div className="participant-data-section__row">
        <label>
          Nombres
          <input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            required
          />
        </label>
        <label>
          Apellidos
          <input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="participant-data-section__row">
        <label>
          Cédula
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]+"
            value={cedula}
            onChange={(e) => onCedulaChange(e.target.value.replace(/\D/g, ""))}
            required
          />
        </label>
        <label>
          Placa del vehículo
          <input
            value={vehiclePlate}
            onChange={(e) => onVehiclePlateChange(e.target.value)}
            placeholder="ABC123"
            required
          />
        </label>
      </div>

      <div className="participant-data-section__row participant-data-section__row--single">
        <label>
          Empresa transportadora
          <input
            value={transportCompany}
            onChange={(e) => onTransportCompanyChange(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="actions actions--between">
        <button type="button" className="secondary" onClick={onPrevious}>
          Anterior
        </button>
        <button type="submit" className="primary">
          Iniciar quiz
        </button>
      </div>
    </form>
  );
}
