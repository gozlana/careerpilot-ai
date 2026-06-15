import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

function App() {
  const [resume, setResume] = useState("");
  const [role, setRole] = useState("");
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [jobDescription, setJobDescription] = useState("");

  const analyzeResume = async () => {
    if (!role.trim()) {
      alert("Please enter a target job role.");
      return;
    }

    if (!resume.trim() && !selectedFile) {
      alert("Please upload a PDF or paste your resume.");
      return;
    }

    setLoading(true);

    try {
      let finalResumeText = resume;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("resume", selectedFile);

        const uploadResponse = await fetch("http://localhost:5000/api/upload-pdf", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          alert(uploadData.error || "PDF upload failed");
          return;
        }

        finalResumeText = uploadData.resumeText;
        setResume(uploadData.resumeText);

        if (!finalResumeText || !role) {
          alert("Please upload/paste a resume and enter a target role.");
          return;
        }
      }

      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: finalResumeText,
          targetRole: role,
          jobDescription: jobDescription,
        }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        alert(data.error || "Analysis failed");
        return;
      }

      setResult(data);

    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    let y = 20;

    const addPageIfNeeded = (space = 20) => {
      if (y + space > 280) {
        doc.addPage();
        y = 20;
      }
    };

    const addHeading = (text) => {
      addPageIfNeeded(20);
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(text, 20, y);
      y += 10;
      doc.setFont(undefined, "normal");
    };

    const addParagraph = (text) => {
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(text || "N/A", 170);
      addPageIfNeeded(lines.length * 7);
      doc.text(lines, 20, y);
      y += lines.length * 7 + 10;
    };

    const addBullets = (items) => {
      doc.setFontSize(12);

      (items || []).forEach((item) => {
        const text =
          (
            typeof item === "string"
              ? item
              : `${item.title || ""}: ${item.description || ""}`
          ).replace(/^[•\-\s]+/, "");

        const lines = doc.splitTextToSize(`• ${text}`, 160);
        addPageIfNeeded(lines.length * 7);
        doc.text(lines, 25, y);
        y += lines.length * 7 + 3;
      });

      y += 8;
    };

    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text("CareerPilot AI Report", 20, y);
    y += 18;

    doc.setFontSize(16);
    doc.text(`Resume Match Score: ${result.matchScore || 0}%`, 20, y);
    y += 18;

    addHeading("Resume Analysis");
    addParagraph(result.summary);

    addHeading("Skill Gaps");
    addBullets(result.skillGaps);

    addHeading("Missing Keywords");
    addBullets(result.missingKeywords);

    addHeading("Interview Questions");
    addBullets(result.interviewQuestions);

    addHeading("Learning Path");
    addBullets(result.learningPath);

    doc.addPage();
    y = 20;

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Cover Letter", 20, y);

    y += 10;

    doc.setFont(undefined, "normal");
    doc.setFontSize(12);

    const coverLines = doc.splitTextToSize(result.coverLetter || "", 170);
    doc.text(coverLines, 20, y);

    y += coverLines.length * 7;
    doc.save("CareerPilot_Report.pdf");
  };

  const copyCoverLetter = () => {
    if (!result?.coverLetter) return;

    navigator.clipboard.writeText(result.coverLetter);
    alert("Cover letter copied!");
  };

  const downloadCoverLetter = () => {
    if (!result?.coverLetter) return;

    const blob = new Blob([result.coverLetter], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "cover-letter.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ textAlign: "center" }}>🚀 CareerPilot AI</h1>

      <h3>Target Job Role</h3>

      <input
        type="text"
        placeholder="Software Engineer"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px",
        }}
      />

      <h3>Paste Job Description</h3>

      <textarea
        rows="8"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste the job description here..."
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px",
        }}
      />

      <h3>Upload Resume (PDF)</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />

      <br />
      <br />

      <h3>Paste Resume</h3>

      <textarea
        rows="10"
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        placeholder="Paste your resume here..."
        style={{
          width: "100%",
          padding: "10px",
        }}
      />

      <br />
      <br />

      <button
        onClick={analyzeResume}
        disabled={loading}
        style={{
          backgroundColor: "#2563eb",
          color: "white",
          padding: "12px 24px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        {loading ? "🤖 AI is analyzing your resume..." : "Analyze Resume"}
      </button>

      {result && (
        <div style={{ marginTop: "40px" }}>
          <div className="cp-match-card">
            <div className="cp-match-left">
              <div className="cp-match-icon">🎯</div>
              <div>
                <h2>Resume Match Score</h2>
                <p>How closely your resume matches the job requirements.</p>
              </div>
            </div>

            <div className="cp-score-circle">
              <span>{result.atsScore || 85}%</span>
            </div>

            <div className="cp-match-status">
              <span className="cp-status-dot"></span>
              Excellent Match
            </div>

            <div className="cp-progress">
              <div
                className="cp-progress-fill"
                style={{ width: `${result.atsScore || 85}%` }}
              ></div>
            </div>
          </div>

          <h2>📊 Analysis Result</h2>
          <button
            onClick={() => {
              setResult(null);
              setResume("");
              setRole("");
              setSelectedFile(null);

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            style={{
              marginTop: "20px",
              backgroundColor: "#16a34a",
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            🔄 Analyze Another Resume
          </button>

          <button
            onClick={downloadReport}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "10px",
            }}
          >
            📄 Download Report
          </button>

          <div className="cp-resume-agent">
            <h2>🤖 Resume Agent</h2>
            <p className="cp-resume-subtitle">AI-generated professional resume summary</p>

            <div className="cp-resume-summary">
              {result.summary || result.resumeSummary || "No resume summary available."}
            </div>
          </div>

          <div className="cp-skillgap">
            <div className="cp-skillgap-header">
              <h2>🎯 Skill Gap Agent</h2>
              <p>
                Missing skills or improvements based on the comparison between your resume
                and the job description.
              </p>
            </div>

            <div className="cp-skillgap-note">
              <span>ℹ️</span>
              <p>
                These are the key skills and areas that can help you better match the job
                requirements and strengthen your profile.
              </p>
            </div>

            <div className="cp-skillgap-list">
              {(result.skillGaps || [])
                .filter((gap) => {
                  const text = String(gap).toLowerCase().trim();

                  return (
                    text &&
                    !text.startsWith("compared to the resume summary") &&
                    !text.startsWith("compared") &&
                    !text.startsWith("resume summary") &&
                    text.length > 10
                  );
                })
                .map((gap, index) => {
                  const cleanGap = String(gap)
                    .replace(/^\s*[-•*]+\s*/, "")
                    .replace(/^Missing skills.*description\s*/i, "")
                    .trim();

                  const title =
                    cleanGap
                      .replace(/^Proficiency with/i, "")
                      .replace(/^Proficiency in/i, "")
                      .replace(/^Experience with/i, "")
                      .replace(/^Experience in/i, "")
                      .replace(/^Knowledge of/i, "")
                      .split(",")[0]
                      .trim();

                  const invalidPhrases = [
                    "compared to the resume summary",
                    "resume summary",
                    "compared",
                    "missing skills",
                  ];

                  if (
                    invalidPhrases.some((phrase) =>
                      cleanGap.toLowerCase().startsWith(phrase)
                    )
                  ) {
                    return null;
                  }

                  if (
                    !title ||
                    title.length < 4 ||
                    title.toLowerCase() === "compared"
                  ) {
                    return null;
                  }

                  const priority = index < 2 ? "High" : index < 5 ? "Medium" : "Low";

                  const icon =
                    index === 0
                      ? "☕"
                      : index === 1
                        ? "💻"
                        : index === 2
                          ? "🔄"
                          : index === 3
                            ? "🌿"
                            : index === 4
                              ? "🛡️"
                              : "🚀";

                  return (
                    <div className="cp-skillgap-item" key={index}>
                      <div className="cp-skillgap-icon">{icon}</div>

                      <div className="cp-skillgap-text">
                        <h4>{title}</h4>
                        <p>{cleanGap}</p>
                      </div>

                      <span className={`cp-priority ${priority.toLowerCase()}`}>
                        {priority}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="cp-skillgap-footer">
              🚀 Focus on high-priority skills first to improve your match score.
            </div>
          </div>

          <div className="cp-cover-letter">
            <div className="cp-cover-header">
              <div className="cp-cover-icon">✉️</div>

              <div>
                <h2>Cover Letter Agent</h2>
                <p>AI-generated personalized cover letter</p>
              </div>
            </div>

            <div className="cp-cover-body">
              <div className="cp-ai-badge">✨ Generated by AI</div>

              <p style={{ whiteSpace: "pre-wrap" }}>
                {result.coverLetter}
              </p>
            </div>
          </div>
          <div className="cp-cover-actions">
            <button onClick={copyCoverLetter}>
              📋 Copy
            </button>
            <button onClick={downloadCoverLetter}>
              📄 Download
            </button>
          </div>

          <div className="cp-agent-card cp-jd-agent">
            <div className="cp-agent-header cp-jd-header">
              <div className="cp-agent-icon">📄</div>

              <div className="cp-jd-title">
                <h2>Job Description Match Agent</h2>
                <p>AI-powered ATS keyword comparison</p>
              </div>
            </div>

            <div className="cp-jd-stats">
              <div className="cp-jd-stat found">
                <span>{result.foundKeywords?.length || 0}</span>
                <p>Found Keywords</p>
              </div>

              <div className="cp-jd-stat missing">
                <span>{result.missingKeywords?.length || 0}</span>
                <p>Missing Keywords</p>
              </div>
            </div>

            <div className="cp-jd-columns">
              <div className="cp-jd-box found">
                {(result.foundKeywords || []).length > 0 ? (
                  <div className="cp-keyword-list">
                    {(result.foundKeywords || []).map((keyword, index) => (
                      <span className="cp-keyword found" key={index}>
                        ✅ {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="cp-empty-keywords found">
                    <div>🔍</div>
                    <h4>No matching keywords found</h4>
                    <p>Your resume does not currently include matching job keywords.</p>
                  </div>
                )}
              </div>

              <div className="cp-jd-box missing">
                {(result.missingKeywords || []).length > 0 ? (
                  <div className="cp-keyword-list">
                    {(result.missingKeywords || []).map((keyword, index) => (
                      <span className="cp-keyword missing" key={index}>
                        ❌ {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="cp-empty-keywords missing">
                    <div>🎉</div>
                    <h4>No missing keywords</h4>
                    <p>Your resume covers the major keywords from this job description.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="cp-jd-tip">
              💡 Tip: Add missing keywords naturally into your resume to improve ATS compatibility.
            </div>
          </div>

          <div className="agent-card interview-agent-card">
            <div className="agent-header interview-header">
              <div className="agent-icon">💼</div>
              <div>
                <h2>Interview Agent</h2>
                <p>AI-generated interview questions based on your resume and job role.</p>
              </div>
            </div>

            <div className="interview-list">
              {(result.interviewQuestions || []).map((question, index) => (
                <div className="interview-question" key={index}>
                  <div className="question-number">{index + 1}</div>
                  <p>{typeof question === "string" ? question : question.question}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="agent-card learning-agent-card">
            <div className="agent-header">
              <div className="agent-icon">📚</div>

              <div>
                <h2>Learning Agent</h2>
                <p>Your personalized roadmap to close skill gaps.</p>
              </div>
            </div>

            <div className="learning-grid">

              {result.learningPath?.map((item, index) => (
                <div className="learning-item" key={index}>
                  <div className="learning-number">
                    {index + 1}
                  </div>

                  <div className="learning-content">
                    {typeof item === "string"
                      ? item
                      : item.description || item.title}
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
