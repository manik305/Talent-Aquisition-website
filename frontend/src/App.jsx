import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  const [candidates, setCandidates] = useState([]);
  const [jd, setJd] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('candidates'); // candidates, roles, ingest, analytics
  const [jdInput, setJdInput] = useState('');
  const [resumeInput, setResumeInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newCandidateResult, setNewCandidateResult] = useState(null);
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: 'success', text: 'Executive HUD initialized. Connection to Euron backend stable.' });


  // Ingest Sub-Tab and Structured Candidate Form States
  const [ingestSubTab, setIngestSubTab] = useState('resume'); // resume, structured
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [expYearsInput, setExpYearsInput] = useState('');
  
  // Last Experience
  const [expCompany, setExpCompany] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expDuration, setExpDuration] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expTech, setExpTech] = useState('');
  const [expGrowth, setExpGrowth] = useState(false);
  
  // Last Education
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduYear, setEduYear] = useState('');

  // Fetch active JD and ranked candidates from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const jdRes = await fetch(`${API_BASE}/job-description`);
      if (jdRes.ok) {
        const jdData = await jdRes.json();
        setJd(jdData);
        if (jdData) setJdInput(jdData.parsed_raw_text || '');
      }

      const rankRes = await fetch(`${API_BASE}/rank`);
      if (rankRes.ok) {
        const rankData = await rankRes.json();
        setCandidates(rankData);
        if (rankData.length > 0) {
          setSelectedCandidate(rankData[0]); // Default to first candidate
        }
      } else {
        showStatus('error', 'Failed to retrieve rankings from backend.');
      }
    } catch (err) {
      console.warn('Backend server not reached. Utilizing local high-fidelity mock fallback.', err);
      loadLocalMocks();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalMocks = () => {
    const mockJd = {
      title: "Senior Backend Engineer",
      min_experience_years: 4,
      required_skills: ["Python", "FastAPI", "Pinecone", "Docker", "AWS"],
      nice_to_have_skills: ["Kubernetes", "TypeScript", "Redis", "System Design"],
      environmental_context: "High-growth AI Talent Tech Startup",
      parsed_raw_text: "Senior Backend Engineer\nRequirements:\n- Minimum 4+ years of relevant experience\n- Strong skills in Python backend frameworks, especially FastAPI\n- Deep familiarity with Vector Databases like Pinecone\n- Experience in containerization and deployment (Docker, AWS)"
    };
    setJd(mockJd);
    setJdInput(mockJd.parsed_raw_text);

    const mockCandidates = [
      {
        rank: 1,
        candidate: {
          id: "cand-1",
          name: "Sarah Chen",
          email: "sarah.chen@ai-atrium.io",
          phone: "555-019-3824",
          location: "San Francisco, CA",
          skills: ["Python", "FastAPI", "Pinecone", "React", "Docker", "Kubernetes", "AWS", "SQL", "TypeScript"],
          total_years_exp: 8.0,
          experience: [
            { company: "AI Solutions Lab", title: "Lead Software Engineer", duration_months: 36, description: "Architected and scaled a distributed candidate search backend using FastAPI and Pinecone vector store, reducing latency by 45%. Promoted from Senior Engineer for leading high-throughput ingestion pipelines.", technologies_used: ["Python", "FastAPI", "Pinecone", "AWS", "Docker"], role_growth: true },
            { company: "Quantum Systems Inc", title: "Senior Engineer", duration_months: 24, description: "Built real-time analytical dashboards using React, TypeScript, and Python. Supervised a team of 4 junior engineers on clean coding and unit test suites.", technologies_used: ["React", "TypeScript", "Python", "SQL", "Docker"], role_growth: true },
            { company: "Blue Ocean Software", title: "Software Developer", duration_months: 36, description: "Optimized database queries and restructured REST APIs, increasing query speeds by 20%.", technologies_used: ["Python", "SQL", "JavaScript"], role_growth: false }
          ],
          education: [{ institution: "University of California, Berkeley", degree: "BS", field_of_study: "Computer Science", graduation_year: 2017 }]
        },
        scores: { semantic_score: 94.2, trajectory_score: 95.0, cognitive_score: 96.5, overall_score: 95.4 },
        key_strengths: [
          "Demonstrated core competency in Python, FastAPI, and Pinecone vector storage.",
          "Clear trajectory of upward promotion and scope expansion into Lead Developer roles.",
          "Strong domain fit for high-scale, distributed architectures."
        ],
        gaps: [
          "Lacks explicit resume documentation for low-level Go implementation which is a minor nice-to-have."
        ],
        fit_justification: "Sarah ranks first due to exceptional alignment across all three axes. She has deep knowledge of our tech stack, combined with a 95.0 trajectory score reflecting multiple promotions. Her cognitive score of 96.5 highlights her outstanding systems scaling history.",
        custom_interview_questions: [
          "How did you design the indexing partitions in Pinecone at AI Solutions Lab to sustain low latencies during peak ingestion hours?",
          "Explain your strategy for migrating relational schemas to accommodate unstructured metadata parsing."
        ]
      },
      {
        rank: 2,
        candidate: {
          id: "cand-5",
          name: "Elena Rostova",
          email: "elena.r@fintech-ventures.com",
          phone: "555-783-0919",
          location: "Boston, MA",
          skills: ["Python", "FastAPI", "Go", "Docker", "PostgreSQL", "Kubernetes", "Redis", "Prometheus"],
          total_years_exp: 5.0,
          experience: [
            { company: "Fintech Ventures", title: "Principal Platform Engineer", duration_months: 36, description: "Designed core platform framework for high-availability financial tools. Integrated Prometheus monitoring, reducing incident resolution times by 50%. Promoted from Lead Engineer.", technologies_used: ["Go", "Python", "Docker", "Kubernetes", "Redis", "Prometheus"], role_growth: true },
            { company: "Helix Solutions", title: "Senior DevOps Engineer", duration_months: 24, description: "Set up full CI/CD deployment pipelines on AWS and migrated system clusters to Kubernetes.", technologies_used: ["Kubernetes", "Docker", "AWS", "Go", "PostgreSQL"], role_growth: true }
          ],
          education: [{ institution: "Massachusetts Institute of Technology", degree: "BS", field_of_study: "Computer Science", graduation_year: 2020 }]
        },
        scores: { semantic_score: 87.5, trajectory_score: 92.0, cognitive_score: 90.0, overall_score: 89.9 },
        key_strengths: [
          "Superb DevOps and platform scaling records in high-integrity fintech sectors.",
          "Two consecutive promotions, advancing rapidly to Principal Engineer level in 3 years."
        ],
        gaps: [
          "Resume does not detail vector database integrations (e.g. Pinecone). Needs training on semantic indexing."
        ],
        fit_justification: "Elena has stellar architectural fundamentals and represents a phenomenal leadership candidate. She ranks second due to slightly lower direct vector search experience, though she makes up for it in platform scalability.",
        custom_interview_questions: [
          "Although your profile shows heavy Kubernetes orchestrations, have you worked with vector-search systems or RAG embeddings? If not, how would you design an ingestion channel for high dimensional indexes?"
        ]
      },
      {
        rank: 3,
        candidate: {
          id: "cand-2",
          name: "Marcus Knight",
          email: "m.knight@cloudspace.co",
          phone: "555-014-9988",
          location: "New York, NY",
          skills: ["Java", "Spring Boot", "AWS", "SQL", "Kubernetes", "Redis", "Docker", "System Design"],
          total_years_exp: 6.5,
          experience: [
            { company: "CloudSpace LLC", title: "Senior Staff Architect", duration_months: 48, description: "Spearheaded the migration of monolithic financial operations into AWS serverless microservices. Designed high-availability ledger databases capable of 10k transactions per second.", technologies_used: ["Java", "AWS", "Spring Boot", "Redis", "Kubernetes"], role_growth: true },
            { company: "Apex Financial Corp", title: "Senior Backend Developer", duration_months: 30, description: "Re-engineered transaction processing logic, boosting computational efficiency by 30%.", technologies_used: ["Java", "SQL", "Spring Boot", "Docker"], role_growth: false }
          ],
          education: [{ institution: "Cornell University", degree: "MS", field_of_study: "Software Engineering", graduation_year: 2019 }]
        },
        scores: { semantic_score: 76.4, trajectory_score: 84.5, cognitive_score: 88.0, overall_score: 83.5 },
        key_strengths: [
          "Elite enterprise architecture experience.",
          "Strong tenure and stability (4 years continuous at CloudSpace)."
        ],
        gaps: [
          "Java-focused background. Lacks direct professional Python/FastAPI backend exposure."
        ],
        fit_justification: "Marcus has immense system-design depth. However, our primary tech stack is Python/FastAPI, causing a slight penalty on his semantic alignment score, placing him third.",
        custom_interview_questions: [
          "Our system runs on FastAPI. Given your deep Java/Spring background, how would you adapt your concurrency design models to Python's asyncio loops?"
        ]
      }
    ];
    setCandidates(mockCandidates);
    setSelectedCandidate(mockCandidates[0]);
    showStatus('info', 'Loaded Vanguard high-fidelity offline sandbox models.');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage({ type: 'info', text: 'System status stable. Vanguard channels listening.' });
    }, 5000);
  };

  const handleJdSubmit = async (e) => {
    e.preventDefault();
    if (!jdInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/job-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: jdInput
      });
      if (res.ok) {
        const data = await res.json();
        setJd(data);
        showStatus('success', `Job Ingested: "${data.title}" mapped.`);
        const rankRes = await fetch(`${API_BASE}/rank`);
        if (rankRes.ok) {
          const rankData = await rankRes.json();
          setCandidates(rankData);
          if (rankData.length > 0) setSelectedCandidate(rankData[0]);
        }
        setActiveTab('candidates');
      } else {
        showStatus('error', 'Backend failed to parse role details.');
      }
    } catch (err) {
      showStatus('success', 'Local Sandbox: Simulated role requirements updated!');
      setActiveTab('candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!resumeInput.trim() && !selectedFile) return;
    setLoading(true);
    setNewCandidateResult(null); // Clear previous visual summary
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        const virtualFile = new File([resumeInput], 'resume.txt', { type: 'text/plain' });
        formData.append('file', virtualFile);
      }
      
      const uploadUrl = customName.trim()
        ? `${API_BASE}/candidates/upload?custom_id=${encodeURIComponent(customName.trim())}`
        : `${API_BASE}/candidates/upload`;
        
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        showStatus('success', `Candidate Indexed: ${data.name}`);
        setResumeInput('');
        setSelectedFile(null);
        setCustomName('');
        const rankRes = await fetch(`${API_BASE}/rank`);
        if (rankRes.ok) {
          const rankData = await rankRes.json();
          setCandidates(rankData);
          const found = rankData.find(c => c.candidate.id === data.id);
          if (found) {
            setSelectedCandidate(found);
            setNewCandidateResult(found); // Triggers the rotated 3D evaluation result card!
          } else if (rankData.length > 0) {
            setSelectedCandidate(rankData[0]);
          }
        }
        setActiveTab('candidates');
      } else {
        showStatus('error', 'Failed to parse resume.');
      }
    } catch (err) {
      console.warn('Sandbox Fallback Triggered:', err);
      const name = customName.trim() || (selectedFile ? selectedFile.name.split('.')[0] : "New Candidate");
      const matchedSkills = jd ? jd.required_skills.filter((s, i) => i < 2) : ["Python", "FastAPI"];
      const mockResult = {
        rank: candidates.length + 1,
        candidate: {
          id: `cand-${Date.now()}`,
          name: name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: "555-992-0012",
          location: "Remote, USA",
          skills: [...matchedSkills, "JavaScript", "Docker", "Agile"],
          total_years_exp: 5.5,
          experience: [
            { company: "Vanguard Tech", title: "Senior Developer", duration_months: 36, description: "Designed REST microservices and automated parsing channels. Applied Python and FastAPI.", technologies_used: ["Python", "FastAPI"], role_growth: true }
          ],
          education: [{ institution: "State Technical College", degree: "BS", field_of_study: "Software Engineering", graduation_year: 2020 }]
        },
        scores: { semantic_score: 84.0, trajectory_score: 82.0, cognitive_score: 85.0, overall_score: 83.9 },
        key_strengths: [
          "Solid FastAPI backend history with vertical promotion.",
          "High alignment on core requirements."
        ],
        gaps: ["Lacks vector search databases (Pinecone)."],
        fit_justification: `Simulated local profile for ${name} matching ${matchedSkills.join(', ')} perfectly.`,
        custom_interview_questions: ["How would you structure a FastAPI codebase to separate business layers from SQL access points?"]
      };
      const updated = [...candidates, mockResult].sort((a, b) => b.scores.overall_score - a.scores.overall_score).map((c, i) => ({ ...c, rank: i + 1 }));
      const foundInUpdated = updated.find(c => c.candidate.name === name) || mockResult;
      setCandidates(updated);
      setSelectedCandidate(foundInUpdated);
      setNewCandidateResult(foundInUpdated); // Triggers rotated 3D evaluation result card!
      showStatus('success', `Ingested "${name}" into Local Sandbox Index.`);
      setResumeInput('');
      setSelectedFile(null);
      setCustomName('');
      setActiveTab('candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const filename = file.name.toLowerCase();
    if (filename.endsWith('.txt') || filename.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeInput(event.target.result);
        showStatus('success', `File Loaded: "${file.name}" (plain text) ready for parsing.`);
      };
      reader.readAsText(file);
    } else {
      setResumeInput(`[Binary Document Reference: ${file.name}] ready for direct backend binary parsing.`);
      showStatus('success', `File Loaded: "${file.name}" (binary) queued for direct parsing.`);
    }
  };

  const clearStructuredForm = () => {
    setCustomName('');
    setEmailInput('');
    setPhoneInput('');
    setLocationInput('');
    setSkillsInput('');
    setExpYearsInput('');
    setExpCompany('');
    setExpTitle('');
    setExpDuration('');
    setExpDescription('');
    setExpTech('');
    setExpGrowth(false);
    setEduInstitution('');
    setEduDegree('');
    setEduField('');
    setEduYear('');
  };

  const handleStructuredSubmit = async (e) => {
    e.preventDefault();
    if (!customName.trim() || !emailInput.trim()) {
      showStatus('error', 'Name and Email are required.');
      return;
    }
    setLoading(true);

    const experience = [];
    if (expCompany.trim() || expTitle.trim()) {
      experience.push({
        company: expCompany.trim() || 'Unknown',
        title: expTitle.trim() || 'Software Engineer',
        duration_months: parseInt(expDuration) || 12,
        description: expDescription.trim() || '',
        technologies_used: expTech.split(',').map(s => s.trim()).filter(Boolean),
        role_growth: expGrowth
      });
    }

    const education = [];
    if (eduInstitution.trim() || eduDegree.trim()) {
      education.push({
        institution: eduInstitution.trim() || 'Unknown',
        degree: eduDegree.trim() || 'Degree',
        field_of_study: eduField.trim() || 'Field',
        graduation_year: parseInt(eduYear) || null
      });
    }

    const payload = {
      id: `cand-${Date.now().toString(36)}`,
      name: customName.trim(),
      email: emailInput.trim(),
      phone: phoneInput.trim(),
      location: locationInput.trim(),
      skills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      experience,
      education,
      total_years_exp: parseFloat(expYearsInput) || 0.0,
      parsed_raw_text: `${customName} is a manually injected structured candidate.`
    };

    try {
      const res = await fetch(`${API_BASE}/candidates/structured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        showStatus('success', `Direct Data Injected: "${data.name}" added successfully.`);
        clearStructuredForm();
        const rankRes = await fetch(`${API_BASE}/rank`);
        if (rankRes.ok) {
          const rankData = await rankRes.json();
          setCandidates(rankData);
          if (rankData.length > 0) setSelectedCandidate(rankData[0]);
        }
        setActiveTab('candidates');
      } else {
        showStatus('error', 'Failed to index structured candidate.');
      }
    } catch (err) {
      const newCand = {
        rank: candidates.length + 1,
        candidate: payload,
        scores: { semantic_score: 82.0, trajectory_score: 80.0, cognitive_score: 85.0, overall_score: 82.6 },
        key_strengths: [
          "Manually indexed structural components.",
          `Demonstrated capabilities in ${payload.skills.slice(0, 3).join(', ')}.`
        ],
        gaps: ["Awaiting active qualitative AI verification from live Euri backend."],
        fit_justification: `Manually injected profile for ${payload.name} added under local sandbox conditions.`,
        custom_interview_questions: ["Can you describe the system architecture of your most recent application?"]
      };
      const updated = [...candidates, newCand].sort((a, b) => b.scores.overall_score - a.scores.overall_score).map((c, i) => ({ ...c, rank: i + 1 }));
      setCandidates(updated);
      setSelectedCandidate(newCand);
      showStatus('success', `Ingested "${payload.name}" into Local Sandbox Index.`);
      clearStructuredForm();
      setActiveTab('candidates');
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(cand => 
    cand.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cand.candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="hud-wrapper">
      {/* SVG gradients */}
      <svg aria-hidden="true" style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="emeraldGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>

      {/* Persistent Left Sidebar Navigation */}
      <nav className="hud-sidebar">
        <div>
          {/* Logo Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #cfbcff, #6750a4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(207, 188, 255, 0.2)' }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>insights</span>
            </div>
            <div>
              <h1 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>TalentSphere</h1>
              <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Executive Control</p>
            </div>
          </div>

          <button 
            onClick={() => { setActiveTab('ingest'); setResumeInput(''); }}
            className="form-button"
            style={{ width: '100%', marginBottom: '2rem', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Ingest Candidate
          </button>

          <div style={{ display: 'flex', flexDirection: 'col', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('candidates')}
              className={`nav-link ${activeTab === 'candidates' ? 'nav-link-active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span> Candidates Board
            </button>
            <button 
              onClick={() => setActiveTab('roles')}
              className={`nav-link ${activeTab === 'roles' ? 'nav-link-active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>work</span> Active Target JD
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`nav-link ${activeTab === 'analytics' ? 'nav-link-active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>database</span> System Operations
            </button>
          </div>
        </div>

        {/* Sidebar Profile Card */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              alt="Recruiter profile avatar" 
              className="border-white/10"
              style={{ width: '36px', height: '36px', borderRadius: '50px', objectCover: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqiFzBD-ZNJPMFS2vyfiNhdzLomKywHLD0gIn5KJ3NeRLM6-gWqQpO9neXdPQTCOytEafy4iJpCYNGenrNnS6TW0gt_y2MPXE7j78RMbC-eO1jBD870ntaJZY5JHSpUsOE3_6s8zc1sF_dE-dLWSqSCLvepbge_pPOFWC5f8VJrIOV4fOU4J1oqGjf8T1E9e9tIGx9eIn-F1EpXSI26DIBs8GyFOBVvmrGjIPD_Qm9u6oamXiBEtw-Q3LpG2K-SaD0Vj2vxg1X-kw"
            />
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Alex Rodriguez</p>
              <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Sourcing Director</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace Frame */}
      <div className="hud-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="font-mono-jetbrains" style={{ fontSize: '11px', color: 'var(--primary)', border: '1px solid rgba(207, 188, 255, 0.15)', background: 'var(--on-primary-glow)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>Sourcing Command Cockpit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0f0d13', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono', color: 'var(--emerald-neon)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50px', background: 'var(--emerald-neon)', display: 'inline-block' }} /> EURI API Active
          </span>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
          </button>
        </div>
      </div>

      {/* Content Canvas */}
      <main className={`hud-canvas ${selectedCandidate ? 'canvas-shifted' : ''}`}>
        {loading && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 8, 0.75)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="perspective-container">
              <div className="rotated-screen-loading">
                <div className="matrix-overlay" />
                <div className="scanner-line" />
                
                <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1.2s linear infinite' }} />
                  <div>
                    <h3 className="font-mono-jetbrains" style={{ color: '#fff', fontSize: '13px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CALCULATING COGNITIVE ALIGNMENT</h3>
                    <p className="font-mono-jetbrains" style={{ color: 'var(--emerald-neon)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', animation: 'pulse 1.5s infinite' }}>
                      {selectedFile ? `Analyzing File: ${selectedFile.name}` : "Extracting Multi-Service Semantic Maps"}
                    </p>
                  </div>
                  
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'left', fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Stage 1: In-Memory Binary Decoding</span>
                      <span style={{ color: 'var(--emerald-neon)' }}>ACTIVE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span>Stage 2: Gemini Embedding v2 Vectors</span>
                      <span style={{ color: 'var(--primary)', animation: 'pulse 1s infinite' }}>COMPUTING...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Stage 3: Hybrid 3D Re-Ranking</span>
                      <span>QUEUED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {newCandidateResult && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 8, 0.8)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="perspective-container">
              <div className="rotated-screen-result">
                {/* Glowing Matrix Grid */}
                <div className="matrix-overlay" style={{ opacity: 0.4 }} />
                
                {/* Success Indicator Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', zIndex: 5, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--emerald-neon)', fontSize: '20px' }}>verified</span>
                    <span className="font-mono-jetbrains" style={{ color: 'var(--emerald-neon)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase' }}>EVALUATION COMPLETED</span>
                  </div>
                  <button 
                    onClick={() => setNewCandidateResult(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
                
                {/* Body details */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center', zIndex: 5, position: 'relative' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '14px', background: 'var(--on-primary-glow)', border: '2px solid var(--emerald-neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', color: 'var(--emerald-neon)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
                    {newCandidateResult.candidate.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{newCandidateResult.candidate.name}</h2>
                    <p className="font-mono-jetbrains" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>
                      {newCandidateResult.candidate.experience.length > 0 ? newCandidateResult.candidate.experience[0].title : 'Technical Expert'}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{newCandidateResult.candidate.email}</p>
                  </div>
                </div>
                
                {/* Score breakdown metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', zIndex: 5, position: 'relative' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                    <span className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>SEMANTIC FIT</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>{Math.round(newCandidateResult.scores.semantic_score)}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                    <span className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>TRAJECTORY</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#a78bfa', fontFamily: 'JetBrains Mono' }}>{Math.round(newCandidateResult.scores.trajectory_score)}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', boxShadow: '0 0 10px rgba(16, 185, 129, 0.05)' }}>
                    <span className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--emerald-neon)', display: 'block', marginBottom: '0.25rem', fontWeight: '700' }}>OVERALL MATCH</span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--emerald-neon)', fontFamily: 'JetBrains Mono' }}>{Math.round(newCandidateResult.scores.overall_score)}%</span>
                  </div>
                </div>
                
                {/* Matching keys / Skills */}
                <div style={{ marginBottom: '1.5rem', zIndex: 5, position: 'relative' }}>
                  <h4 className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.5rem' }}>Keys & Skill Alignment</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {newCandidateResult.candidate.skills.slice(0, 8).map((skill, i) => {
                      const isMatch = jd && jd.required_skills.some(s => s.toLowerCase() === skill.toLowerCase());
                      return (
                        <span 
                          key={i} 
                          style={{ 
                            padding: '0.25rem 0.6rem', 
                            background: isMatch ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)', 
                            border: isMatch ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', 
                            color: isMatch ? 'var(--emerald-neon)' : 'var(--text-secondary)', 
                            borderRadius: '6px', 
                            fontSize: '9.5px', 
                            fontFamily: 'JetBrains Mono',
                            fontWeight: isMatch ? '700' : 'normal',
                            boxShadow: isMatch ? '0 0 10px rgba(16, 185, 129, 0.1)' : 'none'
                          }}
                        >
                          {skill} {isMatch && '✓'}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {/* Fit rationale and closing button */}
                <div style={{ background: 'var(--on-primary-glow)', border: '1px solid rgba(207, 188, 255, 0.15)', padding: '0.85rem', borderRadius: '10px', fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.5rem', zIndex: 5, position: 'relative' }}>
                  <strong>AI Analysis Summary:</strong> {newCandidateResult.fit_justification}
                </div>
                
                <button 
                  onClick={() => setNewCandidateResult(null)}
                  className="form-button form-button-primary" 
                  style={{ width: '100%', padding: '0.85rem', zIndex: 5, position: 'relative', fontSize: '11px' }}
                >
                  Anchor to Cockpit Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active JD Banner Header */}
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
              {jd ? jd.title : 'No Target Role Selected'}
            </h2>
            <p className="font-mono-jetbrains" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {jd ? `${jd.environmental_context} • Min Exp: ${jd.min_experience_years} Years • Active Assessment Mode` : 'Awaiting target requirements...'}
            </p>
          </div>

          {/* Bento Stats Panel */}
          <div className="stats-grid">
            <div className="glass-card stats-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', uppercase: 'true' }}>Total Pool Evaluated</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>group</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>1,248</div>
              <div className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--emerald-neon)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>arrow_upward</span> +12 Ingested this week
              </div>
            </div>

            <div className="glass-card stats-card" style={{ borderColor: 'rgba(207, 188, 255, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Top Cognitive Match</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>verified</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>
                {candidates.length > 0 ? candidates[0].candidate.name.split(' ')[0] : 'None'}
              </div>
              <div className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                {candidates.length > 0 ? `${candidates[0].scores.overall_score}% AI Match Score` : '0%'}
              </div>
            </div>

            <div className="glass-card stats-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Average Talent Score</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>analytics</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>
                {candidates.length > 0 ? Math.round(candidates.reduce((acc, c) => acc + c.scores.overall_score, 0) / candidates.length) : 0}
                <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: '600' }}>/100</span>
              </div>
              <div className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Market Benchmark: 76</div>
            </div>
          </div>

          {/* Tab 1: Candidates board */}
          {activeTab === 'candidates' && (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Candidate Rankings Matrix</h3>
                <div className="relative">
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by skill or name..."
                    style={{ background: '#0a0e1a', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.45rem 1rem 0.45rem 2rem', fontSize: '11px', color: '#fff', outline: 'none', width: '200px' }}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="candidates-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px', textAlign: 'center' }}>Rank</th>
                      <th>Candidate Info</th>
                      <th>Current Position</th>
                      <th style={{ textAlign: 'center' }}>Experience</th>
                      <th style={{ textAlign: 'center' }}>Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((cand) => {
                        const isSelected = selectedCandidate && selectedCandidate.candidate.id === cand.candidate.id;
                        const scoreColor = cand.scores.overall_score >= 85 ? 'text-emerald-400' : (cand.scores.overall_score >= 75 ? 'text-[#a78bfa]' : 'text-amber-400');
                        const progressClass = cand.scores.overall_score >= 85 ? 'progress-ring-fill' : (cand.scores.overall_score >= 75 ? 'progress-ring-fill-secondary' : 'progress-ring-fill-tertiary');
                        
                        const radius = 15;
                        const circumference = 2 * Math.PI * radius;
                        const offset = circumference - (cand.scores.overall_score / 100) * circumference;

                        return (
                          <tr 
                            key={cand.candidate.id}
                            onClick={() => setSelectedCandidate(cand)}
                            className={isSelected ? 'selected-row' : ''}
                          >
                            <td style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: cand.rank === 1 ? 'var(--emerald-neon)' : 'var(--text-muted)' }}>
                              {cand.rank < 10 ? `0${cand.rank}` : cand.rank}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50px', background: '#0A0E1A', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '12px' }}>
                                  {cand.candidate.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '13.5px' }}>{cand.candidate.name}</div>
                                  <div className="font-mono-jetbrains" style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{cand.candidate.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {cand.candidate.experience.length > 0 ? (
                                <div>
                                  <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '12.5px' }}>{cand.candidate.experience[0].title}</p>
                                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{cand.candidate.experience[0].company}</p>
                                </div>
                              ) : (
                                'Staff Engineer'
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                              {cand.candidate.total_years_exp} Yrs
                            </td>
                            <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.75rem' }}>
                              <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                                  <circle className="progress-ring" cx="18" cy="18" fill="none" r={radius} strokeWidth="2.5" />
                                  <circle 
                                    className={progressClass} 
                                    cx="18" 
                                    cy="18" 
                                    fill="none" 
                                    r={radius} 
                                    strokeWidth="2.5" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className={`font-mono-jetbrains ${scoreColor}`} style={{ position: 'absolute', fontSize: '9px', fontWeight: 'bold' }}>
                                  {cand.scores.overall_score}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', fontSize: '11px' }}>No candidates meet search filters. Ingest resume data to populate indexes.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Job Description editor */}
          {activeTab === 'roles' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-2-1, 2fr 1fr)', gap: '1.5rem', alignItems: 'start' }}>
              <div className="glass-card">
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '1rem' }}>Active Sourcing Target Requirements</h3>
                <form onSubmit={handleJdSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-input-container">
                    <label className="form-input-label">Paste Raw JD Text</label>
                    <textarea 
                      value={jdInput}
                      onChange={(e) => setJdInput(e.target.value)}
                      placeholder="Senior Python Backend Architect..."
                      style={{ width: '100%', height: '320px', background: '#0a0e1a', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#fff', resize: 'none', lineHeight: '1.6' }}
                    />
                  </div>
                  <button type="submit" className="form-button form-button-primary" style={{ width: '100%', padding: '0.85rem' }}>
                    Re-extract Requirements & Rank Candidates
                  </button>
                </form>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h4 className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Structure Mapping</h4>
                {jd ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '12.5px' }}>
                    <div>
                      <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Role Title</p>
                      <p style={{ fontWeight: '700', color: 'var(--primary)' }}>{jd.title}</p>
                    </div>
                    <div>
                      <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Required Threshold Experience</p>
                      <p style={{ fontWeight: '600', color: '#fff' }}>{jd.min_experience_years} Years Minimum</p>
                    </div>
                    <div>
                      <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Core Required Focus</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {jd.required_skills.map((s, i) => (
                          <span key={i} style={{ padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--emerald-neon)', borderRadius: '4px', fontSize: '9px', fontWeight: '600', fontFamily: 'JetBrains Mono' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Secondary Nice-To-Haves</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {jd.nice_to_have_skills.map((s, i) => (
                          <span key={i} style={{ padding: '0.2rem 0.5rem', background: 'rgba(207, 188, 255, 0.1)', border: '1px solid rgba(207, 188, 255, 0.2)', color: 'var(--primary)', borderRadius: '4px', fontSize: '9px', fontWeight: '600', fontFamily: 'JetBrains Mono' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-mono-jetbrains" style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>JD profile template unassigned.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Candidate resume ingestion */}
          {activeTab === 'ingest' && (
            <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <button 
                  type="button"
                  onClick={() => setIngestSubTab('resume')}
                  className={`nav-link ${ingestSubTab === 'resume' ? 'nav-link-active' : ''}`}
                  style={{ background: 'transparent', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  AI Resume Ingest
                </button>
                <button 
                  type="button"
                  onClick={() => setIngestSubTab('structured')}
                  className={`nav-link ${ingestSubTab === 'structured' ? 'nav-link-active' : ''}`}
                  style={{ background: 'transparent', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  Direct Data Injection
                </button>
              </div>

              {ingestSubTab === 'resume' ? (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '1.25rem' }}>Ingest Candidate CV Portfolio</h3>
                  <form onSubmit={handleResumeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-input-container">
                      <label className="form-input-label">Candidate Name (Optional Override)</label>
                      <input 
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Elena Rodriguez"
                        className="form-input-field"
                      />
                    </div>
                    
                    <div className="form-input-container">
                      <label className="form-input-label">Upload CV File (.pdf, .docx, .doc, .md, .txt)</label>
                      <div style={{ border: '2px dashed rgba(207, 188, 255, 0.15)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', position: 'relative', transition: 'border-color 0.2s' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '0.5rem' }}>cloud_upload</span>
                        <p className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Drag and drop or click to select PDF, Word, MD, or Text resume files</p>
                        <input 
                          type="file" 
                          accept=".pdf,.docx,.doc,.txt,.md,.json" 
                          onChange={handleFileChange}
                          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    <div className="form-input-container">
                      <label className="form-input-label">Paste CV Text</label>
                      <textarea 
                        value={resumeInput}
                        onChange={(e) => setResumeInput(e.target.value)}
                        placeholder="Sarah Chen&#10;Email: sarah.chen@gmail.com&#10;Skills: Python, FastAPI, React&#10;Experience: Senior Engineer at Apex Corp..."
                        className="form-input-field"
                        style={{ height: '260px', resize: 'none', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                      />
                    </div>
                    <button type="submit" className="form-button form-button-primary" style={{ width: '100%', padding: '0.85rem' }}>
                      Index Candidate & Run Evaluation Math
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '1.25rem' }}>Structured Profile Injection</h3>
                  <form onSubmit={handleStructuredSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Part 1: Core Details */}
                    <div>
                      <h4 className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>1. Core Candidate Coordinates</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-2, 1fr 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-input-container">
                          <label className="form-input-label">Candidate Name *</label>
                          <input 
                            type="text" 
                            required
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="John Smith" 
                            className="form-input-field" 
                          />
                        </div>
                        <div className="form-input-container">
                          <label className="form-input-label">Email Address *</label>
                          <input 
                            type="email" 
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="john.smith@gmail.com" 
                            className="form-input-field" 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-2, 1fr 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-input-container">
                          <label className="form-input-label">Phone Number</label>
                          <input 
                            type="text" 
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="555-010-4492" 
                            className="form-input-field" 
                          />
                        </div>
                        <div className="form-input-container">
                          <label className="form-input-label">Location (City, State)</label>
                          <input 
                            type="text" 
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            placeholder="Seattle, WA" 
                            className="form-input-field" 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-2-1, 2fr 1fr)', gap: '1rem' }}>
                        <div className="form-input-container">
                          <label className="form-input-label">Skills (Comma-separated, e.g. Python, FastAPI, Docker)</label>
                          <input 
                            type="text" 
                            value={skillsInput}
                            onChange={(e) => setSkillsInput(e.target.value)}
                            placeholder="Python, FastAPI, Pinecone, AWS" 
                            className="form-input-field" 
                          />
                        </div>
                        <div className="form-input-container">
                          <label className="form-input-label">Years of Experience</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={expYearsInput}
                            onChange={(e) => setExpYearsInput(e.target.value)}
                            placeholder="5.5" 
                            className="form-input-field" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Last Professional Tenure */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <h4 className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>2. Last Employment Milestones</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-2, 1fr 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-input-container">
                          <label className="form-input-label">Company Name</label>
                          <input 
                            type="text" 
                            value={expCompany}
                            onChange={(e) => setExpCompany(e.target.value)}
                            placeholder="Alpha Solutions" 
                            className="form-input-field" 
                          />
                        </div>
                        <div className="form-input-container">
                          <label className="form-input-label">Job Title</label>
                          <input 
                            type="text" 
                            value={expTitle}
                            onChange={(e) => setExpTitle(e.target.value)}
                            placeholder="Senior Systems Architect" 
                            className="form-input-field" 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-2-1, 1fr 2fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-input-container">
                          <label className="form-input-label">Duration (Months)</label>
                          <input 
                            type="number" 
                            value={expDuration}
                            onChange={(e) => setExpDuration(e.target.value)}
                            placeholder="36" 
                            className="form-input-field" 
                          />
                        </div>
                        <div className="form-input-container">
                          <label className="form-input-label">Technologies Used (Comma-separated)</label>
                          <input 
                            type="text" 
                            value={expTech}
                            onChange={(e) => setExpTech(e.target.value)}
                            placeholder="Python, AWS, PostgreSQL, Docker" 
                            className="form-input-field" 
                          />
                        </div>
                      </div>
                      <div className="form-input-container" style={{ marginBottom: '1rem' }}>
                        <label className="form-input-label">Role Growth / Accomplishments Summary</label>
                        <textarea 
                          value={expDescription}
                          onChange={(e) => setExpDescription(e.target.value)}
                          placeholder="Supervised a team of 4 platform developers. Redesigned internal API gateways..." 
                          className="form-input-field" 
                          style={{ height: '80px', resize: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px' }}>
                        <input 
                          type="checkbox" 
                          id="expGrowthCheckbox"
                          checked={expGrowth}
                          onChange={(e) => setExpGrowth(e.target.checked)}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <label htmlFor="expGrowthCheckbox" style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', userSelect: 'none' }}>
                          Candidate demonstrated vertical promotions or scope expansion in this tenure (Trajectory Boost)
                        </label>
                      </div>
                    </div>

                    {/* Part 3: Last Education Milestone */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <h4 className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>3. Academic Background</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-15-1, 1.5fr 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-input-container">
                          <label className="form-input-label">University / Institution</label>
                          <input 
                            type="text" 
                            value={eduInstitution}
                            onChange={(e) => setEduInstitution(e.target.value)}
                            placeholder="University of Washington" 
                            className="form-input-field" 
                          />
                        </div>
                        <div className="form-input-container">
                          <label className="form-input-label">Degree (e.g. BS, MS)</label>
                          <input 
                            type="text" 
                            value={eduDegree}
                            onChange={(e) => setEduDegree(e.target.value)}
                            placeholder="BS" 
                            className="form-input-field" 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'var(--grid-2-1, 2fr 1fr)', gap: '1rem' }}>
                        <div className="form-input-container">
                          <label className="form-input-label">Field of Study</label>
                          <input 
                            type="text" 
                            value={eduField}
                            onChange={(e) => setEduField(e.target.value)}
                            placeholder="Computer Science" 
                            className="form-input-field" 
                          />
                        </div>
                        <div className="form-input-container">
                          <label className="form-input-label">Graduation Year</label>
                          <input 
                            type="number" 
                            value={eduYear}
                            onChange={(e) => setEduYear(e.target.value)}
                            placeholder="2021" 
                            className="form-input-field" 
                          />
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="form-button form-button-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}>
                      Inject Structured Candidate & Re-Rank Pool
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Analytics */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div className="glass-card">
                <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Index Engine</p>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Pinecone DB</h4>
                <p className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '0.5rem' }}>Model: text-embedding-3-small</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50px', background: 'var(--emerald-neon)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  <span className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--emerald-neon)', fontWeight: 'bold' }}>CONNECTED</span>
                </div>
              </div>

              <div className="glass-card">
                <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Model Telemetry</p>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>124ms Latency</h4>
                <p className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '0.5rem' }}>Gemini 3.5 Flash completions</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50px', background: 'var(--emerald-neon)', display: 'inline-block' }} />
                  <span className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--emerald-neon)', fontWeight: 'bold' }}>HEALTHY</span>
                </div>
              </div>

              <div className="glass-card">
                <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Interface Service</p>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Euri API Hub</h4>
                <p className="font-mono-jetbrains" style={{ fontSize: '10px', color: 'var(--primary)', marginTop: '0.5rem' }}>URL: https://api.euron.one</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50px', background: 'var(--emerald-neon)', display: 'inline-block' }} />
                  <span className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--emerald-neon)', fontWeight: 'bold' }}>ONLINE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Detailed Side Drawer */}
      {selectedCandidate && (
        <aside className="hud-drawer">
          {/* Drawer Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', border: '2px solid rgba(16,185,129,0.3)', bg: '#0A0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: 'var(--emerald-neon)' }}>
                  {selectedCandidate.candidate.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--emerald-neon)', color: '#000', fontSize: '8px', fontFamily: 'JetBrains Mono', fontWeight: 'bold', padding: '0.1rem 0.35rem', borderRadius: '50px', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}>
                  #{selectedCandidate.rank} Fit
                </div>
              </div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>{selectedCandidate.candidate.name}</h4>
                <p className="font-mono-jetbrains" style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{selectedCandidate.candidate.experience.length > 0 ? selectedCandidate.candidate.experience[0].title : 'Engineer'}</p>
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                  <button className="form-button" style={{ padding: '0.3rem 0.6rem', fontSize: '9px', background: 'var(--emerald-neon)', color: '#000', fontWeight: '700' }}>Advance Match</button>
                  <button className="form-button" style={{ padding: '0.3rem 0.6rem', fontSize: '9px' }}>Email</button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCandidate(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>

          {/* Drawer Body Scroll */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Score Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem 0', textAlign: 'center' }}>
                <p className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Semantic Match</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', fontFamily: 'JetBrains Mono', marginTop: '0.15rem' }}>{Math.round(selectedCandidate.scores.semantic_score)}%</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem 0', textAlign: 'center' }}>
                <p className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Trajectory Match</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#a78bfa', fontFamily: 'JetBrains Mono', marginTop: '0.15rem' }}>{Math.round(selectedCandidate.scores.trajectory_score)}%</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem 0', textAlign: 'center' }}>
                <p className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Cognitive Match</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--tertiary)', fontFamily: 'JetBrains Mono', marginTop: '0.15rem' }}>{Math.round(selectedCandidate.scores.cognitive_score)}%</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem 0', textAlign: 'center' }}>
                <p className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Overall Weighted</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--emerald-neon)', fontFamily: 'JetBrains Mono', marginTop: '0.15rem' }}>{Math.round(selectedCandidate.scores.overall_score)}%</p>
              </div>
            </div>

            {/* Employment timeline */}
            <section>
              <h5 className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)', uppercase: 'true', letterSpacing: '0.15em', marginBottom: '1rem' }}>Employment Milestones</h5>
              <div className="timeline-path">
                {selectedCandidate.candidate.experience.map((exp, idx) => (
                  <div key={idx} style={{ position: 'relative', marginBottom: '1.25rem' }}>
                    <span className={`timeline-pin ${exp.role_growth ? 'pin-growth' : ''}`} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h6 style={{ fontSize: '11.5px', color: '#fff', fontWeight: '600' }}>{exp.title}</h6>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{exp.company} • {exp.duration_months} Months</p>
                      </div>
                      {exp.role_growth && (
                        <span style={{ padding: '0.1rem 0.35rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--emerald-neon)', fontSize: '7.5px', fontWeight: '800', borderRadius: '50px', fontFamily: 'JetBrains Mono' }}>GROWTH</span>
                      )}
                    </div>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.4' }}>{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skill coverage progress bars */}
            <section>
              <h5 className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)', uppercase: 'true', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>AI Skill Coverage Analysis</h5>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'JetBrains Mono', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Technical Architecture</span>
                    <span style={{ color: 'var(--emerald-neon)', fontWeight: '700' }}>Exceptional</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#0a0e1a', borderRadius: '50px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--emerald-neon), #34d399)', width: '95%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'JetBrains Mono', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>System Concurrency</span>
                    <span style={{ color: '#a78bfa', fontWeight: '700' }}>Strong</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#0a0e1a', borderRadius: '50px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--primary)', width: '84%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'JetBrains Mono', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Vector Ingestion Spacing</span>
                    <span style={{ color: 'var(--tertiary)', fontWeight: '700' }}>Growth Area</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#0a0e1a', borderRadius: '50px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--tertiary)', width: '45%' }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Cognitive text justification */}
            <section>
              <h5 className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--text-muted)', uppercase: 'true', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>Cognitive Fit Rationale</h5>
              <div style={{ background: 'var(--on-primary-glow)', border: '1px solid rgba(207,188,255,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {selectedCandidate.fit_justification}
              </div>
            </section>

            {/* Custom tailored interview prompts */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                <span className="material-symbols-outlined text-indigo-400" style={{ fontSize: '14px' }}>smart_toy</span>
                <h5 className="font-mono-jetbrains" style={{ fontSize: '8px', color: 'var(--primary)', uppercase: 'true', letterSpacing: '0.15em' }}>AI Tailored Prompts</h5>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedCandidate.custom_interview_questions.slice(0, 3).map((q, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderLeft: '3px solid var(--primary)', borderRadius: '6px', padding: '0.75rem', fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    "{q}"
                  </div>
                ))}
              </div>
            </section>

          </div>
        </aside>
      )}
    </div>
  );
}
