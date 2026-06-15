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
          <div
            style={{
              background: "#eef6ff",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            <h2>Resume Match Score</h2>

            <h1 style={{ color: "#2563eb" }}>
              {result.matchScore}%
            </h1>

            <h3>
              {result.matchScore >= 80
                ? "🟢 Excellent Match"
                : result.matchScore >= 60
                  ? "🟡 Good Match"
                  : "🔴 Needs Improvement"}
            </h3>

            <progress
              value={result.matchScore}
              max="100"
              style={{
                width: "100%",
                height: "20px",
              }}
            />
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

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>🤖 Resume Agent</h3>
            <p>{result.summary}</p>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>🎯 Skill Gap Agent</h3>

            <ul>
              {(result.skillGaps || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>✉️ Cover Letter Agent</h3>

            <p style={{ whiteSpace: "pre-line" }}>
              {result.coverLetter}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>📋 Job Description Match Agent</h3>

            <h4>✅ Found Keywords</h4>
            <ul>
              {(result.keywordMatches || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h4>❌ Missing Keywords</h4>
            <ul>
              {(result.missingKeywords || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>💼 Interview Agent</h3>

            <ul>
              {(result.interviewQuestions || []).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <h3>📚 Learning Agent</h3>

            <ul>
              {(result.learningPath || []).map((item, index) => (
                <li key={index}>
                  {typeof item === "string"
                    ? item
                    : `${item.title || ""}: ${item.description || ""} ${item.resources || ""}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
