import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FaPenToSquare, FaPlus, FaTrashCan } from "react-icons/fa6";
import "./AdminPage.css";
import { supabase } from "../supabaseClient";

type OptionKey = "A" | "B" | "C" | "D";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: OptionKey;
  explanation: string | null;
  is_active: boolean;
  created_at?: string;
}

interface QuestionForm {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: OptionKey;
  explanation: string;
  is_active: boolean;
}

interface QuizResult {
  id: string;
  first_name: string;
  last_name: string;
  cedula: string;
  vehicle_plate: string | null;
  transport_company: string | null;
  score: number;
  passed: boolean;
  completed_at: string;
}

function emptyForm(): QuestionForm {
  return {
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    explanation: "",
    is_active: true,
  };
}

export function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyForm);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [{ data: qData, error: qError }, { data: rData, error: rError }] =
      await Promise.all([
        supabase
          .from("questions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("quiz_results")
          .select("*")
          .order("completed_at", { ascending: false })
          .limit(100),
      ]);

    if (qError || rError) {
      setError(qError?.message || rError?.message || "Error cargando datos");
    } else {
      setQuestions((qData as Question[]) || []);
      setResults((rData as QuizResult[]) || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredQuestions = useMemo(() => {
    const search = questionSearch.trim().toLowerCase();
    if (!search) {
      return questions;
    }

    return questions.filter((question) => {
      const haystack = [
        question.question_text,
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
        question.correct_option,
        question.explanation || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [questionSearch, questions]);

  const filteredResults = useMemo(() => {
    const search = resultSearch.trim().toLowerCase();
    if (!search) {
      return results;
    }

    return results.filter((result) => {
      const haystack = [
        result.first_name,
        result.last_name,
        result.cedula,
        result.vehicle_plate || "",
        result.transport_company || "",
        result.score,
        result.passed ? "aprobó" : "no aprobó",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [resultSearch, results]);

  const formatDate = (value?: string) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString();
  };

  const resetForm = () => {
    setSelectedQuestionId(null);
    setQuestionForm(emptyForm());
  };

  const openCreateQuestionModal = () => {
    resetForm();
    setIsQuestionModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false);
    resetForm();
  };

  const openEditQuestionModal = (question: Question) => {
    setSelectedQuestionId(question.id);
    setQuestionForm({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      explanation: question.explanation || "",
      is_active: question.is_active,
    });
    setIsQuestionModalOpen(true);
    setSuccessMessage(null);
    setError(null);
  };

  const upsertQuestion = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      question_text: questionForm.question_text.trim(),
      option_a: questionForm.option_a.trim(),
      option_b: questionForm.option_b.trim(),
      option_c: questionForm.option_c.trim(),
      option_d: questionForm.option_d.trim(),
      correct_option: questionForm.correct_option,
      explanation: questionForm.explanation.trim() || null,
      is_active: questionForm.is_active,
    };

    if (
      !payload.question_text ||
      !payload.option_a ||
      !payload.option_b ||
      !payload.option_c ||
      !payload.option_d
    ) {
      setError("Todos los campos de la pregunta son obligatorios.");
      setSaving(false);
      return;
    }

    let operationError: string | null = null;

    if (selectedQuestionId) {
      const { error: updateError } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", selectedQuestionId);
      operationError = updateError?.message || null;
    } else {
      const { error: createError } = await supabase
        .from("questions")
        .insert(payload);
      operationError = createError?.message || null;
    }

    if (operationError) {
      setError(operationError);
      setSaving(false);
      return;
    }

    setSuccessMessage(
      selectedQuestionId ? "Pregunta actualizada." : "Pregunta creada.",
    );
    closeQuestionModal();
    await loadData();
    setSaving(false);
  };

  const deleteQuestion = async (questionId: string) => {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar esta pregunta? Esta acción no se puede deshacer.",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccessMessage(null);

    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    setSuccessMessage("Pregunta eliminada.");
    if (selectedQuestionId === questionId) {
      closeQuestionModal();
    }
    await loadData();
    setDeleting(false);
  };

  return (
    <div className="admin-page">
      <h1>Panel de administración</h1>

      {loading && <p>Cargando datos...</p>}
      {error && <p className="admin-page__error">{error}</p>}
      {successMessage && (
        <p className="admin-page__success">{successMessage}</p>
      )}

      <section className="admin-page__section">
        <div className="admin-page__section-head">
          <h2>CRUD de preguntas</h2>
          <button
            type="button"
            className="admin-page__btn admin-page__btn--primary"
            onClick={openCreateQuestionModal}
            disabled={saving || deleting}
          >
            <FaPlus className="admin-page__btn-icon" aria-hidden="true" />
            Nueva pregunta
          </button>
        </div>

        <p className="admin-page__help">
          Usa las acciones para editar o borrar cada pregunta.
        </p>
        <div className="admin-page__grid-toolbar">
          <input
            type="search"
            placeholder="Buscar en preguntas..."
            value={questionSearch}
            onChange={(event) => setQuestionSearch(event.target.value)}
          />
        </div>
        <div className="admin-page__table-wrapper">
          <table className="admin-page__table admin-page__table--questions">
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Opciones</th>
                <th>Correcta</th>
                <th>Estado</th>
                <th>Creada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.id}>
                  <td>{question.question_text}</td>
                  <td>
                    <div>A: {question.option_a}</div>
                    <div>B: {question.option_b}</div>
                    <div>C: {question.option_c}</div>
                    <div>D: {question.option_d}</div>
                  </td>
                  <td>{question.correct_option}</td>
                  <td>
                    <span
                      className={
                        question.is_active
                          ? "admin-page__status admin-page__status--ok"
                          : "admin-page__status admin-page__status--danger"
                      }
                    >
                      {question.is_active ? "ACTIVA" : "INACTIVA"}
                    </span>
                  </td>
                  <td>{formatDate(question.created_at)}</td>
                  <td>
                    <div className="admin-page__table-actions">
                      <button
                        type="button"
                        className="admin-page__btn admin-page__btn--icon"
                        onClick={() => openEditQuestionModal(question)}
                        disabled={saving || deleting}
                        aria-label="Editar pregunta"
                        title="Editar pregunta"
                      >
                        <FaPenToSquare aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="admin-page__btn admin-page__btn--danger admin-page__btn--icon"
                        onClick={() => void deleteQuestion(question.id)}
                        disabled={saving || deleting}
                        aria-label="Borrar pregunta"
                        title="Borrar pregunta"
                      >
                        <FaTrashCan aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredQuestions.length && (
                <tr>
                  <td colSpan={6} className="admin-page__empty">
                    No hay preguntas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-page__section">
        <h2>Últimos resultados ({filteredResults.length})</h2>
        <div className="admin-page__grid-toolbar">
          <input
            type="search"
            placeholder="Buscar en resultados..."
            value={resultSearch}
            onChange={(event) => setResultSearch(event.target.value)}
          />
        </div>
        <div className="admin-page__table-wrapper">
          <table className="admin-page__table admin-page__table--results">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Placa</th>
                <th>Empresa</th>
                <th>Puntaje</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result) => (
                <tr key={result.id}>
                  <td>
                    {result.first_name} {result.last_name}
                  </td>
                  <td>{result.cedula}</td>
                  <td>{result.vehicle_plate || "-"}</td>
                  <td>{result.transport_company || "-"}</td>
                  <td>{result.score}/5</td>
                  <td>
                    <span
                      className={
                        result.passed
                          ? "admin-page__status admin-page__status--ok"
                          : "admin-page__status admin-page__status--danger"
                      }
                    >
                      {result.passed ? "APROBÓ" : "NO APROBÓ"}
                    </span>
                  </td>
                  <td>{formatDate(result.completed_at)}</td>
                </tr>
              ))}
              {!filteredResults.length && (
                <tr>
                  <td colSpan={7} className="admin-page__empty">
                    No hay resultados para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isQuestionModalOpen && (
        <div
          className="admin-page__modal-backdrop"
          onClick={closeQuestionModal}
        >
          <div
            className="admin-page__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Formulario de pregunta"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-page__modal-head">
              <h3>
                {selectedQuestionId ? "Editar pregunta" : "Nueva pregunta"}
              </h3>
              <button
                type="button"
                className="admin-page__btn"
                onClick={closeQuestionModal}
                disabled={saving || deleting}
              >
                Cerrar
              </button>
            </div>

            <form className="admin-page__form" onSubmit={upsertQuestion}>
              <label>
                Pregunta
                <textarea
                  value={questionForm.question_text}
                  onChange={(event) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      question_text: event.target.value,
                    }))
                  }
                  rows={3}
                  required
                />
              </label>

              <div className="admin-page__options-grid">
                <label>
                  Opción A
                  <input
                    value={questionForm.option_a}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        option_a: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Opción B
                  <input
                    value={questionForm.option_b}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        option_b: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Opción C
                  <input
                    value={questionForm.option_c}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        option_c: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Opción D
                  <input
                    value={questionForm.option_d}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        option_d: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="admin-page__options-grid">
                <label>
                  Opción correcta
                  <select
                    value={questionForm.correct_option}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        correct_option: event.target.value as OptionKey,
                      }))
                    }
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </label>

                <label>
                  Estado
                  <select
                    value={questionForm.is_active ? "active" : "inactive"}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        is_active: event.target.value === "active",
                      }))
                    }
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </label>
              </div>

              <label>
                Explicación (opcional)
                <textarea
                  value={questionForm.explanation}
                  onChange={(event) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      explanation: event.target.value,
                    }))
                  }
                  rows={2}
                />
              </label>

              <div className="admin-page__actions">
                <button
                  type="submit"
                  className="admin-page__btn admin-page__btn--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : selectedQuestionId
                      ? "Actualizar pregunta"
                      : "Crear pregunta"}
                </button>
                <button
                  type="button"
                  className="admin-page__btn"
                  onClick={closeQuestionModal}
                  disabled={saving || deleting}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
