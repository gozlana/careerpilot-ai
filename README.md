# 🚀 CareerPilot AI

> An AI-powered multi-agent career assistant built with **Microsoft Azure AI Foundry** that helps job seekers analyze resumes, identify skill gaps, prepare for interviews, and accelerate their career growth.

---

## 📌 Overview

CareerPilot AI leverages **Azure AI Foundry** and a **multi-agent architecture** to provide intelligent career guidance.

The application analyzes a user's resume against a target job description and generates personalized recommendations to improve hiring success.

---

## ✨ Features

- 📄 Resume PDF Upload
- 🎯 ATS Resume Analysis
- 🧠 Skill Gap Detection
- 💬 AI-Generated Interview Questions
- 📚 Personalized Learning Path
- ✉️ AI Cover Letter Generation
- 📥 Professional PDF Report Export
- 🤖 Multi-Agent Reasoning using Azure AI Foundry

---

## 🏗️ Architecture

```
Resume
│
▼
Resume Agent
│
▼
ATS Analysis Agent
│
▼
Skill Gap Agent
│
▼
Interview Agent
│
▼
Learning Path Agent
│
▼
Cover Letter Agent
│
▼
PDF Report
```

---

## 🛠️ Tech Stack

### Frontend

- React
- JavaScript
- HTML5
- CSS3

### Backend

- Node.js
- Express.js

### AI

- Microsoft Azure AI Foundry
- Azure AI Models
- Multi-Agent Reasoning

### Other

- pdf-parse
- jsPDF
- Multer

---

## 📷 Screenshots

### Home Page

(Add screenshot here)

### Resume Analysis

(Add screenshot here)

### Skill Gap Analysis

(Add screenshot here)

### PDF Report

(Add screenshot here)

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/gozlana/careerpilot-ai.git
```

### Install backend

```bash
cd server
npm install
```

### Install frontend

```bash
cd ../client
npm install
```

### Configure environment

Create a `.env` file inside the `server` folder:

```env
AZURE_FOUNDRY_ENDPOINT=your_endpoint
AZURE_FOUNDRY_API_KEY=your_key
AZURE_FOUNDRY_MODEL=your_model
```

### Run backend

```bash
cd server
node index.cjs
```

### Run frontend

```bash
cd client
npm start
```

---

## 🎯 Workflow

1. Upload Resume (PDF)
2. Enter Target Job Role
3. Paste Job Description
4. AI analyzes resume
5. Skill gaps are identified
6. Interview questions are generated
7. Learning roadmap is created
8. Cover letter is generated
9. Download comprehensive PDF report

---

## 🌟 Why CareerPilot AI?

CareerPilot AI demonstrates how **multiple AI agents** can collaborate to solve a complex real-world problem. By orchestrating specialized agents through **Microsoft Azure AI Foundry**, the platform delivers personalized career guidance that is practical, scalable, and intelligent.

---

## 👨‍💻 Author

**Ahmed Ghouzlane**

Software Engineering Student

Built for the **Microsoft Agents League Hackathon 2026**

---

## 📄 License

This project is licensed under the MIT License.
