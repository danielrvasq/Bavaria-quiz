import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { animate } from "animejs";
import "./App.css";
import { supabase } from "./supabaseClient";
import { ParticipantDataSection } from "./sections/ParticipantDataSection/ParticipantDataSection";
import { TrainingEmergencySection } from "./sections/TrainingEmergencySection/TrainingEmergencySection";
import { TrainingEppSection } from "./sections/TrainingTraffic1Section/TrainingTraffic1Section";
import { TrainingReportSection } from "./sections/TrainingTraffic2Section/TrainingTraffic2Section";
import { WelcomeSection } from "./sections/WelcomeSection/WelcomeSection";

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
}

interface AnswerState {
  questionId: string;
  selectedOption: OptionKey | null;
}

type Step = "training" | "quiz" | "result";

function normalizeToUpper(text: string): string {
  return text.trim().toUpperCase();
}

function normalizePlate(raw: string): string {
  const upper = raw.toUpperCase();
  return upper.replace(/[^A-Z0-9]/g, "");
}

const sectionTitles = [
  "Bienvenida",
  "Plan de trafico 1",
  "plan de trafico 2",
  "SST",
  "Datos del Conductor",
];

function App() {
  const [step, setStep] = useState<Step>("training");
  const [preQuizSection, setPreQuizSection] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(
    null,
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cedula, setCedula] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [transportCompany, setTransportCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const sectionWrapperRef = useRef<HTMLDivElement | null>(null);
  const previousTrainingSectionRef = useRef(0);

  useEffect(() => {
    if (step === "quiz" && questions.length === 0) {
      const loadQuestions = async () => {
        setLoadingQuestions(true);
        setQuestionLoadError(null);

        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("is_active", true);

        if (error) {
          console.error(error);
          setQuestionLoadError("No fue posible cargar las preguntas.");
          setLoadingQuestions(false);
          return;
        }

        const shuffled = (data || []).sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);

        if (selected.length < 5) {
          setQuestionLoadError(
            "Debes tener al menos 5 preguntas activas en la base de datos.",
          );
          setLoadingQuestions(false);
          return;
        }

        setQuestions(selected);
        setAnswers(
          selected.map((q) => ({ questionId: q.id, selectedOption: null })),
        );
        setLoadingQuestions(false);
      };

      loadQuestions();
    }
  }, [step, questions.length]);

  useEffect(() => {
    const element = sectionWrapperRef.current;

    if (!element) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      element.style.opacity = "1";
      element.style.transform = "none";
      return;
    }

    let offset = 18;
    if (step === "training") {
      offset = preQuizSection >= previousTrainingSectionRef.current ? 24 : -24;
    }

    const sectionAnimation = animate(element, {
      opacity: [0, 1],
      x: [offset, 0],
      scale: [0.99, 1],
      duration: 420,
      ease: "outCubic",
    });

    previousTrainingSectionRef.current = preQuizSection;

    return () => {
      sectionAnimation.pause();
    };
  }, [step, preQuizSection]);

  const allAnswered = useMemo(
    () =>
      answers.length === questions.length &&
      answers.length > 0 &&
      answers.every((a) => a.selectedOption),
    [answers, questions.length],
  );

  const handleSelectOption = (questionId: string, option: OptionKey) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === questionId ? { ...a, selectedOption: option } : a,
      ),
    );
  };

  const handleStartQuiz = (e: FormEvent) => {
    e.preventDefault();
    const cedulaValue = cedula.trim();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !cedulaValue ||
      !/^\d+$/.test(cedulaValue) ||
      !vehiclePlate.trim() ||
      !transportCompany.trim()
    ) {
      return;
    }
    setStep("quiz");
  };

  const handleSubmitQuiz = async () => {
    if (!allAnswered) return;

    setSubmitting(true);
    setSubmitError(null);

    const normalizedFirst = normalizeToUpper(firstName);
    const normalizedLast = normalizeToUpper(lastName);
    const normalizedPlate = normalizePlate(vehiclePlate);
    const normalizedTransportCompany = normalizeToUpper(transportCompany);

    const details = answers.map((a) => {
      const q = questions.find((question) => question.id === a.questionId)!;
      const selected = a.selectedOption as OptionKey;
      const isCorrect = selected === q.correct_option;
      return {
        question_id: q.id,
        selected_option: selected,
        correct_option: q.correct_option,
        is_correct: isCorrect,
      };
    });

    const totalScore = details.filter((d) => d.is_correct).length;
    setScore(totalScore);

    const passed = totalScore >= 4;

    const { error } = await supabase.from("quiz_results").insert({
      first_name: normalizedFirst,
      last_name: normalizedLast,
      cedula: cedula.trim(),
      vehicle_plate: normalizedPlate,
      transport_company: normalizedTransportCompany,
      score: totalScore,
      passed,
      answers: details,
      questions_snapshot: questions,
    });

    if (error) {
      console.error(error);
      setSubmitError(
        "Error guardando tus respuestas. Verifica que exista la columna transport_company.",
      );
    } else {
      setStep("result");
    }

    setSubmitting(false);
  };

  const handleRestart = () => {
    setStep("training");
    setPreQuizSection(0);
    setQuestions([]);
    setAnswers([]);
    setFirstName("");
    setLastName("");
    setCedula("");
    setVehiclePlate("");
    setTransportCompany("");
    setScore(0);
    setSubmitError(null);
    setQuestionLoadError(null);
  };

  const transitionKey =
    step === "training" ? `training-${preQuizSection}` : step;

  if (step === "training") {
    const inDataSection = preQuizSection === 4;

    let sectionContent = null;

    if (preQuizSection === 0) {
      sectionContent = <WelcomeSection onNext={() => setPreQuizSection(1)} />;
    }

    if (preQuizSection === 1) {
      sectionContent = (
        <TrainingEppSection
          onPrevious={() => setPreQuizSection(0)}
          onNext={() => setPreQuizSection(2)}
        />
      );
    }

    if (preQuizSection === 2) {
      sectionContent = (
        <TrainingReportSection
          onPrevious={() => setPreQuizSection(1)}
          onNext={() => setPreQuizSection(3)}
        />
      );
    }

    if (preQuizSection === 3) {
      sectionContent = (
        <TrainingEmergencySection
          onPrevious={() => setPreQuizSection(2)}
          onNext={() => setPreQuizSection(4)}
        />
      );
    }

    if (inDataSection) {
      sectionContent = (
        <ParticipantDataSection
          firstName={firstName}
          lastName={lastName}
          cedula={cedula}
          vehiclePlate={vehiclePlate}
          transportCompany={transportCompany}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onCedulaChange={setCedula}
          onVehiclePlateChange={setVehiclePlate}
          onTransportCompanyChange={setTransportCompany}
          onPrevious={() => setPreQuizSection(3)}
          onSubmit={handleStartQuiz}
        />
      );
    }

    return (
      <main className="layout">
        <section className="card card--training">
          <a
            className="training-center-logo-link"
            href="https://www.bavaria.co/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ir al sitio web de Bavaria"
          >
            <img
              className="training-center-logo"
              src="/img/Logo_new.png"
              alt="Logo Bavaria"
            />
          </a>
          <div
            key={transitionKey}
            ref={sectionWrapperRef}
            className="section-transition-wrapper"
          >
            <p className="section-indicator">
              {`Sección ${preQuizSection + 1} de 5: ${sectionTitles[preQuizSection]}`}
            </p>
            {sectionContent}
          </div>
        </section>
      </main>
    );
  }

  if (step === "quiz") {
    return (
      <main className="layout">
        <section className="card">
          <div
            key={transitionKey}
            ref={sectionWrapperRef}
            className="section-transition-wrapper"
          >
            <h1>Quiz de seguridad</h1>
            {loadingQuestions ? (
              <p>Cargando preguntas...</p>
            ) : questionLoadError ? (
              <p className="error-text">{questionLoadError}</p>
            ) : (
              <>
                <ol className="question-list">
                  {questions.map((q, index) => {
                    const selected = answers.find(
                      (a) => a.questionId === q.id,
                    )?.selectedOption;
                    return (
                      <li key={q.id} className="question-item">
                        <p>
                          <strong>
                            {index + 1}. {q.question_text}
                          </strong>
                        </p>
                        <div className="options-grid">
                          {(
                            [
                              ["A", q.option_a],
                              ["B", q.option_b],
                              ["C", q.option_c],
                              ["D", q.option_d],
                            ] as [OptionKey, string][]
                          ).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              className={
                                "option-btn" +
                                (selected === key
                                  ? " option-btn--selected"
                                  : "")
                              }
                              onClick={() => handleSelectOption(q.id, key)}
                            >
                              <span className="option-key">{key}.</span> {label}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {submitError && <p className="error-text">{submitError}</p>}
                <div className="actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={handleSubmitQuiz}
                    disabled={!allAnswered || submitting}
                  >
                    {submitting ? "Enviando..." : "Enviar respuestas"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    );
  }

  const passed = score >= 4;

  return (
    <main className="layout">
      <section className="card">
        <div
          key={transitionKey}
          ref={sectionWrapperRef}
          className="section-transition-wrapper"
        >
          <h1>Resultado</h1>
          <p className={passed ? "result-pass" : "result-fail"}>
            {passed
              ? "¡Felicitaciones, aprobaste la capacitación!"
              : "No aprobaste la capacitación."}
          </p>
          <p>
            Tu puntaje fue de <strong>{score}/5</strong>.
          </p>

          <h2>Retroalimentación por pregunta</h2>
          <ol className="question-list">
            {questions.map((q, index) => {
              const ans = answers.find((a) => a.questionId === q.id)!;
              const isCorrect = ans.selectedOption === q.correct_option;
              return (
                <li key={q.id} className="question-item">
                  <p>
                    <strong>
                      {index + 1}. {q.question_text}
                    </strong>
                  </p>
                  <p>
                    Tu respuesta: <strong>{ans.selectedOption}</strong> |
                    Correcta: <strong>{q.correct_option}</strong>{" "}
                    {isCorrect ? "✅" : "❌"}
                  </p>
                  {q.explanation && <p>{q.explanation}</p>}
                </li>
              );
            })}
          </ol>

          <div className="actions">
            <button type="button" className="secondary" onClick={handleRestart}>
              Volver al inicio
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
