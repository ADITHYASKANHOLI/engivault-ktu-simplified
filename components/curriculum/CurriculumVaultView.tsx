"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Subject } from "@/types";

interface CurriculumVaultViewProps {
  initialSubjects: Subject[];
  initialQuery?: string;
}

interface SyllabusModule {
  num: string;
  title: string;
  description: string;
  hours: number;
  examSlots: string;
}

interface CourseCodex {
  code: string;
  title: string;
  slug: string;
  branch: string;
  semester: number;
  credits: number;
  type: string;
  verified: boolean;
  description: string;
  modules: SyllabusModule[];
  studyDossiers: {
    title: string;
    description: string;
    format: string;
    size: string;
    downloadUrl: string;
  }[];
  youtubePlaylist: {
    title: string;
    lectureCount: number;
    url: string;
  };
  qpVault: {
    title: string;
    count: number;
    url: string;
  };
}

// Canonical KTU Curricular Syllabus Data aligned with Stitch design and KTU B.Tech Regulations
const KTU_CURRICULAR_COMPENDIUM: CourseCodex[] = [
  {
    code: "CST 201",
    title: "Data Structures",
    slug: "data-structures",
    branch: "cse",
    semester: 3,
    credits: 4,
    type: "CORE COURSE",
    verified: true,
    description:
      "Linear data structures, trees, graphs, sorting techniques, memory allocation, and algorithmic performance evaluation under KTU S3 CSE curriculum.",
    modules: [
      {
        num: "M01",
        title: "Introduction to Data Structures & Arrays",
        description:
          "Abstract Data Types (ADTs), Time & Space complexity notations, sparse matrices, polynomial representation, multidimensional array memory mapping.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q1, Q2 (PART A & B)",
      },
      {
        num: "M02",
        title: "Stacks and Queues",
        description:
          "Stack ADT, recursion evaluation, infix to postfix conversions, expression evaluation, Circular Queue, Deque, Priority Queue implementation using arrays.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q3, Q4",
      },
      {
        num: "M03",
        title: "Linked Lists",
        description:
          "Singly linked list, doubly linked list, circular list, linked representation of stacks/queues, polynomial addition using linked lists, memory allocation & garbage collection.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q5, Q6",
      },
      {
        num: "M04",
        title: "Trees and Binary Search Trees",
        description:
          "Tree terminologies, binary tree traversal algorithms (recursive & iterative), expression trees, Binary Search Tree (BST) operations, balanced trees introduction (AVL concept).",
        hours: 11,
        examSlots: "EXAM SLOTS: Q7, Q8",
      },
      {
        num: "M05",
        title: "Graphs, Searching and Sorting Techniques",
        description:
          "Graph representations (Adjacency matrix/list), BFS & DFS traversals, Minimum Spanning Trees (Prim's & Kruskal's), Quick Sort, Merge Sort, Heap Sort, Hashing techniques and collision resolution.",
        hours: 12,
        examSlots: "EXAM SLOTS: Q9, Q10",
      },
    ],
    studyDossiers: [
      {
        title: "Comprehensive CST201 Professor Manuscript",
        description: "Hand-annotated complete modules (1 to 5) with dry-run diagrams.",
        format: "PDF",
        size: "14.8 MB",
        downloadUrl: "/materials",
      },
      {
        title: "Trees & BST Derivation Quick-Sheet",
        description: "AVL balancing, rotation algorithm traces and C snippet proofs.",
        format: "PDF",
        size: "4.2 MB",
        downloadUrl: "/materials",
      },
    ],
    youtubePlaylist: {
      title: "NPTEL & KTU Consortium: CST201 Video Compendium",
      lectureCount: 34,
      url: "https://www.youtube.com/results?search_query=KTU+CST201+Data+Structures",
    },
    qpVault: {
      title: "KTU QP Vault (2019 Scheme): Solved May 2023, Dec 2023, Jan 2024",
      count: 3,
      url: "/materials",
    },
  },
  {
    code: "MAT 203",
    title: "Discrete Mathematical Structures",
    slug: "engineering-mathematics",
    branch: "cse",
    semester: 3,
    credits: 4,
    type: "ALLIED MATH",
    verified: true,
    description:
      "Mathematical reasoning, propositional & predicate calculus, relations & lattices, group theory, generating functions, and recurrence relations.",
    modules: [
      {
        num: "M01",
        title: "Propositional Logic & Proofs",
        description: "Equivalence, normal forms, rules of inference, mathematical induction.",
        hours: 8,
        examSlots: "EXAM SLOTS: Q1, Q2",
      },
      {
        num: "M02",
        title: "Sets, Relations & Lattices",
        description: "Equivalence relations, partial orderings, Hasse diagrams, lattices as posets.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q3, Q4",
      },
      {
        num: "M03",
        title: "Algebraic Structures & Groups",
        description: "Semigroups, monoids, groups, subgroups, Lagrange's theorem, homomorphism.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q5, Q6",
      },
      {
        num: "M04",
        title: "Combinatorics & Recurrence",
        description: "Pigeonhole principle, permutations, generating functions, linear recurrence relations.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q7, Q8",
      },
      {
        num: "M05",
        title: "Graph Theory & Trees",
        description: "Eulerian & Hamiltonian graphs, planar graphs, graph coloring, trees and cut-sets.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q9, Q10",
      },
    ],
    studyDossiers: [
      {
        title: "DMS Complete Handwritten Codex",
        description: "Module 1-5 solved proof structures and relation tables.",
        format: "PDF",
        size: "18.1 MB",
        downloadUrl: "/materials",
      },
    ],
    youtubePlaylist: {
      title: "KTU MAT203 Video Lectures (Malayalam & English)",
      lectureCount: 28,
      url: "https://www.youtube.com/results?search_query=KTU+MAT203+Discrete+Mathematical+Structures",
    },
    qpVault: {
      title: "MAT 203 Previous Question Papers (2019 Scheme)",
      count: 4,
      url: "/materials",
    },
  },
  {
    code: "CST 206",
    title: "Operating Systems",
    slug: "operating-systems",
    branch: "cse",
    semester: 4,
    credits: 4,
    type: "CORE COURSE",
    verified: true,
    description:
      "Processes, threads, CPU scheduling algorithms, inter-process communication, deadlock prevention & avoidance, virtual memory, paging and file system structure.",
    modules: [
      {
        num: "M01",
        title: "OS Overview & Process Management",
        description: "Dual-mode operation, system calls, PCB, process states, threads, scheduling algorithms.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q1, Q2",
      },
      {
        num: "M02",
        title: "Process Synchronization & Deadlocks",
        description: "Critical section problem, Peterson's algorithm, semaphores, Banker's algorithm, deadlock recovery.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q3, Q4",
      },
      {
        num: "M03",
        title: "Memory Management Strategies",
        description: "Contiguous allocation, paging, segmentation, page tables, TLB performance.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q5, Q6",
      },
      {
        num: "M04",
        title: "Virtual Memory & Page Replacement",
        description: "Demand paging, FIFO, LRU, Optimal page replacement, thrashing, working set model.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q7, Q8",
      },
      {
        num: "M05",
        title: "Storage & File Systems",
        description: "Disk scheduling (FCFS, SSTF, SCAN), file allocation methods, free space management.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q9, Q10",
      },
    ],
    studyDossiers: [
      {
        title: "KTU OS Master Notes PDF",
        description: "Comprehensive handwritten derivations and scheduling algorithm traces.",
        format: "PDF",
        size: "11.4 MB",
        downloadUrl: "/materials",
      },
    ],
    youtubePlaylist: {
      title: "Full YouTube Syllabus Playlist: CST 206 OS",
      lectureCount: 32,
      url: "https://www.youtube.com/results?search_query=KTU+CST206+Operating+Systems",
    },
    qpVault: {
      title: "KTU Solved QP Archive: Operating Systems CST 206",
      count: 3,
      url: "/materials",
    },
  },
  {
    code: "EST 110",
    title: "Engineering Graphics",
    slug: "engineering-graphics",
    branch: "me",
    semester: 1,
    credits: 3,
    type: "ENGINEERING SCIENCE",
    verified: true,
    description:
      "Principles of engineering drawing, orthographic projection, projection of lines and solids, isometric projection, and sectional views.",
    modules: [
      {
        num: "M01",
        title: "Projection of Points & Lines",
        description: "First angle projections, points in quadrants, lines inclined to both planes.",
        hours: 8,
        examSlots: "EXAM SLOTS: Q1, Q2",
      },
      {
        num: "M02",
        title: "Projection of Solids",
        description: "Prisms, pyramids, cylinders, cones with axis inclined to reference planes.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q3, Q4",
      },
      {
        num: "M03",
        title: "Sections of Solids & Development",
        description: "Section planes perpendicular to one plane and inclined to the other, surface development.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q5, Q6",
      },
      {
        num: "M04",
        title: "Isometric Projection",
        description: "Isometric view vs isometric projection, isometric scale, solids and frustums.",
        hours: 8,
        examSlots: "EXAM SLOTS: Q7, Q8",
      },
      {
        num: "M05",
        title: "Perspective Projection & CAD Overview",
        description: "Visual ray method, vanishing point method, CAD commands and layering.",
        hours: 8,
        examSlots: "EXAM SLOTS: Q9, Q10",
      },
    ],
    studyDossiers: [
      {
        title: "Engineering Graphics Step-by-Step Drawing Guide",
        description: "Line projection proofs and 3D isometric solution steps.",
        format: "PDF",
        size: "16.2 MB",
        downloadUrl: "/materials",
      },
    ],
    youtubePlaylist: {
      title: "KTU EST 110 Visual Video Lecture Series",
      lectureCount: 22,
      url: "https://www.youtube.com/results?search_query=KTU+EST110+Engineering+Graphics",
    },
    qpVault: {
      title: "EST 110 University Exam Drawings Vault",
      count: 4,
      url: "/materials",
    },
  },
  {
    code: "EST 130",
    title: "Basics of Electrical Engineering",
    slug: "electrical-engineering",
    branch: "eee",
    semester: 1,
    credits: 3,
    type: "ENGINEERING SCIENCE",
    verified: true,
    description:
      "DC circuits, AC fundamentals, magnetic circuits, transformers, and electrical machines under KTU first year curriculum.",
    modules: [
      {
        num: "M01",
        title: "DC Circuit Analysis",
        description: "Kirchhoff's laws, Mesh and Nodal analysis, star-delta transformations.",
        hours: 8,
        examSlots: "EXAM SLOTS: Q1, Q2",
      },
      {
        num: "M02",
        title: "Magnetic Circuits & Electromagnetic Induction",
        description: "MMF, flux, reluctance, self and mutual induction, Faraday's laws.",
        hours: 8,
        examSlots: "EXAM SLOTS: Q3, Q4",
      },
      {
        num: "M03",
        title: "AC Fundamentals",
        description: "RMS and average values, form factor, R-L-C series circuits, power factor.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q5, Q6",
      },
      {
        num: "M04",
        title: "Three-Phase AC Systems",
        description: "Star and delta connections, relation between line and phase values, 3-phase power measurement.",
        hours: 8,
        examSlots: "EXAM SLOTS: Q7, Q8",
      },
      {
        num: "M05",
        title: "Transformers & Electrical Machines",
        description: "Ideal transformer, EMF equation, losses, DC motor principle, alternator basics.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q9, Q10",
      },
    ],
    studyDossiers: [
      {
        title: "EST 130 Handwritten Circuit Notes",
        description: "Solved numericals for single-phase and three-phase power.",
        format: "PDF",
        size: "9.8 MB",
        downloadUrl: "/materials",
      },
    ],
    youtubePlaylist: {
      title: "EST 130 Electrical Engineering Class Recordings",
      lectureCount: 19,
      url: "https://www.youtube.com/results?search_query=KTU+EST130+Basics+of+Electrical+Engineering",
    },
    qpVault: {
      title: "Solved Electrical Engineering University Papers",
      count: 3,
      url: "/materials",
    },
  },
  {
    code: "MAT 101",
    title: "Linear Algebra & Calculus",
    slug: "engineering-mathematics",
    branch: "ce",
    semester: 1,
    credits: 4,
    type: "BASIC SCIENCE",
    verified: true,
    description:
      "Matrix theory, linear systems, eigenvalues, differential calculus of single and multiple variables, and definite integrals.",
    modules: [
      {
        num: "M01",
        title: "Linear Systems & Matrix Rank",
        description: "Gauss elimination, echelon forms, rank of matrices, system consistency.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q1, Q2",
      },
      {
        num: "M02",
        title: "Eigenvalues & Cayley-Hamilton",
        description: "Eigenvalues, eigenvectors, diagonalisation, quadratic forms reduction.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q3, Q4",
      },
      {
        num: "M03",
        title: "Single Variable Calculus & Series",
        description: "Mean value theorems, indeterminate forms, Taylor series, convergence tests.",
        hours: 10,
        examSlots: "EXAM SLOTS: Q5, Q6",
      },
      {
        num: "M04",
        title: "Multivariable Differential Calculus",
        description: "Partial derivatives, chain rule, maxima and minima, Lagrange multipliers.",
        hours: 9,
        examSlots: "EXAM SLOTS: Q7, Q8",
      },
      {
        num: "M05",
        title: "Multiple Integrals & Vector Calculus",
        description: "Double and triple integrals, area and volume applications, gradient, divergence, curl.",
        hours: 11,
        examSlots: "EXAM SLOTS: Q9, Q10",
      },
    ],
    studyDossiers: [
      {
        title: "MAT 101 Complete Professor Notes",
        description: "Matrix proofs, derivative tricks, and step-by-step question solutions.",
        format: "PDF",
        size: "15.6 MB",
        downloadUrl: "/materials",
      },
    ],
    youtubePlaylist: {
      title: "MAT 101 Full University Syllabus Compendium",
      lectureCount: 26,
      url: "https://www.youtube.com/results?search_query=KTU+MAT101+Linear+Algebra+and+Calculus",
    },
    qpVault: {
      title: "MAT 101 Solved Question Bank",
      count: 5,
      url: "/materials",
    },
  },
];

export function CurriculumVaultView({
  initialSubjects,
  initialQuery = "",
}: CurriculumVaultViewProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>("cse");
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [activeFilter, setActiveFilter] = useState<"all" | "notes" | "video" | "pyq">("all");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "CST 201": true, // Default expanded as in Stitch reference
  });
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);

  // Toggle module accordion
  const toggleCourseModules = (courseCode: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [courseCode]: !prev[courseCode],
    }));
  };

  // Filter courses based on branch, semester, filter type, and search query
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return KTU_CURRICULAR_COMPENDIUM.filter((course) => {
      // Branch filter: When branch is selected, show matching or allow user to browse
      const matchesBranch = selectedBranch === "all" || course.branch === selectedBranch;

      // Semester filter
      const matchesSemester = selectedSemester === 0 || course.semester === selectedSemester;

      // Search match
      const matchesSearch =
        !q ||
        course.code.toLowerCase().includes(q) ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.modules.some(
          (m) =>
            m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
        );

      // Filter by type
      let matchesType = true;
      if (activeFilter === "notes") matchesType = course.studyDossiers.length > 0;
      if (activeFilter === "video") matchesType = !!course.youtubePlaylist;
      if (activeFilter === "pyq") matchesType = !!course.qpVault;

      // If user typed a search query, prioritize search results across all branches/semesters
      if (q) {
        return matchesSearch && matchesType;
      }

      return (matchesBranch || matchesSemester) && matchesType;
    });
  }, [selectedBranch, selectedSemester, searchQuery, activeFilter]);

  return (
    <div className="flex flex-col w-full bg-surface-canvas text-on-surface font-body min-h-screen">
      {/* 1. Top Archival Navigation & Dossier Control Strip */}
      <section className="w-full bg-surface-warm border-b border-border-subtle py-space-md">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md flex-wrap">
            <span className="font-code-tabular text-label-caps uppercase tracking-widest text-secondary px-space-xs py-0.5 bg-surface-container rounded border border-border-subtle font-semibold">
              ARCHIVE REF: KTU-ENG-2024.B
            </span>
            <div className="h-3 w-px bg-border-firm hidden sm:block"></div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              APJ Abdul Kalam Technological University (Kerala) Academic Repository
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 font-code-tabular text-label-caps text-primary px-space-sm py-1 bg-surface-container-low border border-border-subtle rounded">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
              SYLLABUS V2.4 CURATED
            </span>
            <button
              onClick={() => setSchemeModalOpen(true)}
              className="inline-flex items-center gap-1 font-code-tabular text-label-caps text-on-surface hover:text-secondary px-space-sm py-1 border border-border-firm rounded bg-surface transition-colors cursor-pointer"
              type="button"
            >
              SCHEME: <strong className="text-primary font-semibold">2019 SCHEME</strong>
              <span className="material-symbols-outlined text-sm">tune</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Title & Academic Matrix Workspace Header */}
      <header className="w-full bg-surface-canvas py-space-xl border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-gutter">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end">
            <div className="lg:col-span-8 space-y-space-xs">
              <div className="flex items-center gap-space-xs text-secondary font-code-tabular text-label-caps">
                <span>CURRICULUM VAULT</span>
                <span>/</span>
                <span>KERALA TECHNOLOGICAL UNIVERSITY</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                Open Engineering Codex &amp; Syllabi
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
                Human-curated lecture indices, handwritten KTU professor compendiums, verified exam question vaults, and module-wise video recordings organized under open scholarly governance.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-end gap-space-xs text-left lg:text-right font-code-tabular text-xs text-on-surface-variant">
              <div><span className="text-outline">CURATORIAL PROTOCOL:</span> FOLE-KTU-OPEN-ACAD</div>
              <div><span className="text-outline">PEER REPOSITORIES:</span> 2,840 ARTIFACTS</div>
              <div><span className="text-outline">LAST AUDITED:</span> OCTOBER 24, 2024</div>
            </div>
          </div>

          {/* 3. Engineering Branch Switcher (Horizontal Segmented Matrix) */}
          <div className="mt-space-xl pt-space-lg border-t border-border-subtle">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-code-tabular text-label-caps uppercase text-outline">
                SELECT DISCIPLINE / PROGRAMME
              </span>
              <span className="font-code-tabular text-label-caps text-secondary hidden sm:inline-block">
                FOUR-YEAR B.TECH DEGREE PROGRAMME
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm" role="tablist">
              <button
                type="button"
                onClick={() => setSelectedBranch("cse")}
                className={`text-left p-space-md rounded transition-all cursor-pointer ${
                  selectedBranch === "cse"
                    ? "bg-surface-warm border-2 border-primary shadow-xs"
                    : "bg-surface-canvas border border-border-subtle hover:border-border-firm"
                }`}
              >
                <div className="flex items-center justify-between mb-space-xs">
                  <span className={`font-code-tabular text-code-tabular font-bold ${selectedBranch === "cse" ? "text-secondary" : "text-on-surface-variant"}`}>
                    CSE
                  </span>
                  <span className={`material-symbols-outlined text-base ${selectedBranch === "cse" ? "text-primary" : "text-outline"}`}>
                    domain_verification
                  </span>
                </div>
                <div className="font-headline-sm text-sm font-semibold text-primary leading-tight">
                  Computer Science &amp; Engineering
                </div>
                <div className="font-code-tabular text-label-caps text-outline mt-space-xs">
                  48 CREDITS INDEXED
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBranch("ece")}
                className={`text-left p-space-md rounded transition-all cursor-pointer ${
                  selectedBranch === "ece"
                    ? "bg-surface-warm border-2 border-primary shadow-xs"
                    : "bg-surface-canvas border border-border-subtle hover:border-border-firm"
                }`}
              >
                <div className="flex items-center justify-between mb-space-xs">
                  <span className={`font-code-tabular text-code-tabular font-bold ${selectedBranch === "ece" ? "text-secondary" : "text-on-surface-variant"}`}>
                    ECE
                  </span>
                  <span className={`material-symbols-outlined text-base ${selectedBranch === "ece" ? "text-primary" : "text-outline"}`}>
                    radio
                  </span>
                </div>
                <div className="font-headline-sm text-sm font-semibold text-on-surface leading-tight">
                  Electronics &amp; Communication
                </div>
                <div className="font-code-tabular text-label-caps text-outline mt-space-xs">
                  46 CREDITS INDEXED
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBranch("me")}
                className={`text-left p-space-md rounded transition-all cursor-pointer ${
                  selectedBranch === "me"
                    ? "bg-surface-warm border-2 border-primary shadow-xs"
                    : "bg-surface-canvas border border-border-subtle hover:border-border-firm"
                }`}
              >
                <div className="flex items-center justify-between mb-space-xs">
                  <span className={`font-code-tabular text-code-tabular font-bold ${selectedBranch === "me" ? "text-secondary" : "text-on-surface-variant"}`}>
                    ME
                  </span>
                  <span className={`material-symbols-outlined text-base ${selectedBranch === "me" ? "text-primary" : "text-outline"}`}>
                    precision_manufacturing
                  </span>
                </div>
                <div className="font-headline-sm text-sm font-semibold text-on-surface leading-tight">
                  Mechanical Engineering
                </div>
                <div className="font-code-tabular text-label-caps text-outline mt-space-xs">
                  52 CREDITS INDEXED
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBranch("ce")}
                className={`text-left p-space-md rounded transition-all cursor-pointer ${
                  selectedBranch === "ce"
                    ? "bg-surface-warm border-2 border-primary shadow-xs"
                    : "bg-surface-canvas border border-border-subtle hover:border-border-firm"
                }`}
              >
                <div className="flex items-center justify-between mb-space-xs">
                  <span className={`font-code-tabular text-code-tabular font-bold ${selectedBranch === "ce" ? "text-secondary" : "text-on-surface-variant"}`}>
                    CE
                  </span>
                  <span className={`material-symbols-outlined text-base ${selectedBranch === "ce" ? "text-primary" : "text-outline"}`}>
                    architecture
                  </span>
                </div>
                <div className="font-headline-sm text-sm font-semibold text-on-surface leading-tight">
                  Civil Engineering
                </div>
                <div className="font-code-tabular text-label-caps text-outline mt-space-xs">
                  44 CREDITS INDEXED
                </div>
              </button>
            </div>
          </div>

          {/* 4. Semester Horizontal Tab Deck (S1 to S8) */}
          <div className="mt-space-lg flex items-center justify-between overflow-x-auto border-b border-border-firm pb-px gap-1">
            <div className="flex items-center gap-1 min-w-max">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-space-md py-space-sm font-code-tabular text-code-tabular font-medium transition-colors border-b-2 cursor-pointer ${
                    selectedSemester === sem
                      ? "font-bold text-primary border-primary bg-surface-container-low"
                      : "text-on-surface-variant hover:text-primary border-transparent"
                  }`}
                >
                  {sem === 3 ? "S3 (Third Sem)" : `S${sem}`}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-space-sm font-code-tabular text-label-caps text-outline shrink-0">
              <span>CURRENT: S3 AUTUMN 2024</span>
              <span className="w-1 h-1 rounded-full bg-border-firm"></span>
              <span>6 CORE COURSES</span>
            </div>
          </div>
        </div>
      </header>

      {/* 5. Filter & Search Utilities Toolbar */}
      <section className="w-full bg-surface-canvas border-b border-border-subtle py-space-md sticky top-16 z-30 bg-surface-canvas/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          {/* Search Bar with ⌘K Indicator */}
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by KTU Code (CST201, MAT203), Topic or Module..."
              className="w-full bg-surface border border-border-firm rounded pl-10 pr-space-md py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-code-tabular text-[10px] text-outline border border-border-subtle px-1 rounded bg-surface-warm pointer-events-none">
              ⌘K
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center flex-wrap gap-space-xs font-code-tabular text-label-caps">
            <span className="text-outline mr-1 uppercase">Filter By Type:</span>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-space-sm py-1 rounded transition-colors cursor-pointer ${
                activeFilter === "all"
                  ? "bg-primary text-on-primary border border-primary font-bold"
                  : "bg-surface border border-border-firm text-on-surface hover:border-primary"
              }`}
            >
              ALL ({filteredCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("notes")}
              className={`px-space-sm py-1 rounded transition-colors cursor-pointer ${
                activeFilter === "notes"
                  ? "bg-primary text-on-primary border border-primary font-bold"
                  : "bg-surface border border-border-firm text-on-surface hover:border-primary"
              }`}
            >
              VERIFIED NOTES
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("video")}
              className={`px-space-sm py-1 rounded transition-colors cursor-pointer ${
                activeFilter === "video"
                  ? "bg-primary text-on-primary border border-primary font-bold"
                  : "bg-surface border border-border-firm text-on-surface hover:border-primary"
              }`}
            >
              VIDEO PLAYLISTS
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("pyq")}
              className={`px-space-sm py-1 rounded transition-colors cursor-pointer ${
                activeFilter === "pyq"
                  ? "bg-primary text-on-primary border border-primary font-bold"
                  : "bg-surface border border-border-firm text-on-surface hover:border-primary"
              }`}
            >
              PREVIOUS PAPERS
            </button>
          </div>
        </div>
      </section>

      {/* 6. Main Curriculum Dossier Canvas (12-Column Editorial Grid) */}
      <div className="w-full max-w-7xl mx-auto px-gutter py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Primary Subject Catalog (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-xl">
            {filteredCourses.length === 0 ? (
              /* Dynamic Empty Search Result State */
              <div className="p-space-2xl bg-surface border border-dashed border-border-firm text-center rounded">
                <span className="material-symbols-outlined text-4xl text-outline mb-space-sm">
                  folder_off
                </span>
                <h3 className="font-headline-sm text-primary font-semibold">No Curated Artifacts Found</h3>
                <p className="font-body-sm text-on-surface-variant max-w-md mx-auto mt-space-xs leading-relaxed">
                  No course matches your query. In accordance with open learning protocols, you can request archival retrieval or upload community-reviewed KTU transcripts.
                </p>
                <div className="mt-space-md flex items-center justify-center gap-space-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="px-space-md py-1.5 border border-border-firm rounded font-code-tabular text-label-caps text-on-surface bg-surface-warm hover:border-primary cursor-pointer"
                  >
                    CLEAR QUERY
                  </button>
                  <Link
                    href="/contact"
                    className="px-space-md py-1.5 bg-primary text-on-primary rounded font-code-tabular text-label-caps hover:bg-secondary cursor-pointer"
                  >
                    SUBMIT CODEX REQUEST
                  </Link>
                </div>
              </div>
            ) : (
              filteredCourses.map((course) => {
                const isExpanded = expandedModules[course.code] ?? false;

                return (
                  <article
                    key={course.code}
                    className="bg-surface border border-border-subtle rounded-sm shadow-xs overflow-hidden"
                  >
                    {/* Card Header Bar */}
                    <div className="p-space-lg bg-surface-warm border-b border-border-subtle">
                      <div className="flex flex-wrap items-start justify-between gap-space-sm mb-space-xs">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="font-code-tabular text-code-tabular font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">
                            {course.code}
                          </span>
                          <span className="font-code-tabular text-label-caps text-secondary font-semibold">
                            {course.type} • {course.credits} CREDITS
                          </span>
                          {course.verified && (
                            <span className="inline-flex items-center gap-1 font-code-tabular text-label-caps px-2 py-0.5 bg-[#F0F7F2] border border-[#A9C8AD] text-primary rounded">
                              <span className="material-symbols-outlined text-xs text-status-success">verified</span>
                              KTU VERIFIED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/subjects/${course.slug}`}
                            className="inline-flex items-center gap-1 font-code-tabular text-label-caps text-on-surface hover:text-secondary p-1 border border-border-firm rounded bg-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            OFFICIAL SYLLABUS (PDF)
                          </Link>
                        </div>
                      </div>
                      <h2 className="font-headline-md text-headline-md text-primary mt-1">
                        <Link href={`/subjects/${course.slug}`} className="hover:underline">
                          {course.title} ({course.code})
                        </Link>
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Module Expansion Deck (5-Module Breakdown) */}
                    <div className="p-space-lg border-b border-border-subtle bg-surface">
                      <div className="flex items-center justify-between mb-space-md">
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-secondary text-base">format_list_numbered</span>
                          <h3 className="font-code-tabular text-label-caps uppercase tracking-wider text-primary font-bold">
                            KTU 5-MODULE SYLLABUS BREAKDOWN
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCourseModules(course.code)}
                          className="font-code-tabular text-label-caps text-outline hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>EXAM WEIGHTAGE: 100 MARKS END-SEM</span>
                          <span className="material-symbols-outlined text-sm">
                            {isExpanded ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                      </div>

                      {/* Expandable Module Breakdown Accordion */}
                      {isExpanded && (
                        <div className="flex flex-col border border-border-subtle rounded divide-y divide-border-subtle font-body-sm text-body-sm">
                          {course.modules.map((mod) => (
                            <div key={mod.num} className="p-space-md hover:bg-surface-warm/60 transition-colors">
                              <div className="flex items-start justify-between gap-space-md">
                                <div className="flex items-start gap-space-md">
                                  <span className="font-code-tabular text-code-tabular font-bold text-secondary bg-surface-container px-2 py-1 rounded shrink-0">
                                    {mod.num}
                                  </span>
                                  <div>
                                    <h4 className="font-semibold text-on-surface">{mod.title}</h4>
                                    <p className="text-on-surface-variant text-sm mt-0.5 leading-relaxed">
                                      {mod.description}
                                    </p>
                                    <div className="flex items-center gap-space-md mt-2 font-code-tabular text-label-caps text-outline flex-wrap">
                                      <span>EST. HOURS: {mod.hours}</span>
                                      <span>•</span>
                                      <span className="text-secondary font-semibold">{mod.examSlots}</span>
                                    </div>
                                  </div>
                                </div>
                                <Link
                                  href={`/subjects/${course.slug}`}
                                  className="shrink-0 p-1 text-on-surface-variant hover:text-primary"
                                  title="Explore Module Lectures"
                                >
                                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isExpanded && (
                        /* Condensed 5-Module Strip when collapsed */
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-sm font-code-tabular">
                          {course.modules.map((mod) => (
                            <div key={mod.num} className="p-space-sm bg-surface-canvas border border-border-subtle rounded">
                              <span className="text-secondary font-bold block text-xs">{mod.num}</span>
                              <span className="text-[11px] text-on-surface block mt-1 leading-snug truncate">
                                {mod.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Academic Artifacts & Downloads (PDFs & Media) */}
                    <div className="p-space-lg bg-surface-warm/40">
                      <h4 className="font-code-tabular text-label-caps uppercase text-outline mb-space-sm tracking-wider">
                        AVAILABLE STUDY DOSSIERS &amp; PEDAGOGICAL RESOURCES
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                        {course.studyDossiers.map((dossier, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col justify-between p-space-md bg-surface border border-border-subtle rounded hover:border-border-firm transition-all"
                          >
                            <div className="flex items-start gap-space-sm">
                              <span className="material-symbols-outlined text-status-danger text-2xl shrink-0">
                                picture_as_pdf
                              </span>
                              <div>
                                <h5 className="font-semibold text-on-surface text-sm">{dossier.title}</h5>
                                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                  {dossier.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-space-md pt-space-xs border-t border-border-subtle font-code-tabular text-xs">
                              <span className="text-outline">
                                {dossier.format} • {dossier.size}
                              </span>
                              <Link
                                href={dossier.downloadUrl}
                                className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline"
                              >
                                <span>DOWNLOAD</span>
                                <span className="material-symbols-outlined text-xs">file_download</span>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* YouTube Curated Lecture Series Ribbon */}
                      {course.youtubePlaylist && (
                        <div className="mt-space-md p-space-md bg-surface border border-border-subtle rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
                          <div className="flex items-center gap-space-md">
                            <div className="w-10 h-10 rounded bg-[#FF0000]/10 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[#FF0000] text-xl">smart_display</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-code-tabular text-label-caps text-[#FF0000] font-bold">
                                  YOUTUBE VERIFIED PLAYLIST
                                </span>
                                <span className="font-code-tabular text-label-caps text-outline">
                                  {course.youtubePlaylist.lectureCount} LECTURES
                                </span>
                              </div>
                              <p className="font-body-sm text-sm text-on-surface font-medium">
                                {course.youtubePlaylist.title}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/subjects/${course.slug}`}
                            className="inline-flex items-center gap-1.5 px-space-md py-1.5 bg-primary text-on-primary font-code-tabular text-label-caps rounded hover:bg-secondary transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <span>LAUNCH PLAYLIST</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </Link>
                        </div>
                      )}

                      {/* Previous Year Solved Exam Papers */}
                      {course.qpVault && (
                        <div className="mt-space-sm flex items-center justify-between p-space-sm px-space-md bg-surface-container-low rounded border border-border-subtle font-code-tabular text-code-tabular">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-sm">history_edu</span>
                            <span className="text-on-surface text-xs font-semibold">{course.qpVault.title}</span>
                          </div>
                          <Link
                            href={course.qpVault.url}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            ACCESS ARCHIVE ({course.qpVault.count} QPs) →
                          </Link>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Secondary Meta Rail (4 Cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-space-lg">
            {/* KTU Semester Academic Calendar Tracker */}
            <div className="bg-surface border border-border-subtle p-space-lg rounded shadow-xs">
              <div className="flex items-center justify-between border-b border-border-subtle pb-space-sm mb-space-md">
                <span className="font-code-tabular text-label-caps uppercase text-secondary font-bold">
                  KTU TIMELINE • S3 2024
                </span>
                <span className="font-code-tabular text-label-caps text-outline">WEEK 09 OF 16</span>
              </div>
              <div className="relative pl-6 space-y-space-md border-l-2 border-border-firm">
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-status-success border-2 border-surface"></span>
                  <div className="font-code-tabular text-xs text-secondary font-bold">OCT 14–18, 2024 (CONCLUDED)</div>
                  <div className="font-semibold text-on-surface text-sm">Series Test I (First Internal)</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Covered: Modules 1 &amp; 2 across all 6 registered subjects.</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface"></span>
                  <div className="font-code-tabular text-xs text-primary font-bold">NOV 25–29, 2024 (IN 3 WEEKS)</div>
                  <div className="font-semibold text-on-surface text-sm">Series Test II (Second Internal)</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Focus: Modules 3, 4 &amp; 5. Syllabus cut-off point.</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-border-firm border-2 border-surface"></span>
                  <div className="font-code-tabular text-xs text-outline font-semibold">DEC 18, 2024</div>
                  <div className="font-semibold text-on-surface-variant text-sm">University End-Semester Exam</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">100-mark comprehensive centralized evaluation.</p>
                </div>
              </div>
            </div>

            {/* Archival Peer Review & Verification Ledger */}
            <div className="bg-surface-warm border border-border-subtle p-space-lg rounded">
              <div className="flex items-center gap-space-xs mb-space-sm">
                <span className="material-symbols-outlined text-secondary text-base">verified_user</span>
                <h3 className="font-code-tabular text-label-caps uppercase text-primary font-bold">
                  PEER CURATION LEDGER
                </h3>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                All PDF notes and solutions are peer-reviewed by engineering scholars across Kerala Government and aided engineering institutes before release.
              </p>
              <div className="mt-space-md border-t border-border-subtle pt-space-md flex flex-col gap-space-sm font-code-tabular text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-medium">College of Engineering Trivandrum (CET)</span>
                  <span className="text-secondary font-bold">14 Docs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-medium">Model Engineering College (MEC)</span>
                  <span className="text-secondary font-bold">09 Docs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-medium">GEC Thrissur</span>
                  <span className="text-secondary font-bold">12 Docs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-medium">TKM College of Engineering</span>
                  <span className="text-secondary font-bold">06 Docs</span>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs border-t border-border-subtle">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1 font-code-tabular text-label-caps text-secondary font-bold hover:underline"
                >
                  <span>CONTRIBUTE YOUR NOTES / QUESTION VAULT</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Essential Quick References */}
            <div className="bg-surface border border-border-subtle p-space-lg rounded">
              <h3 className="font-code-tabular text-label-caps uppercase text-outline mb-space-sm">
                DISCIPLINARY CODES
              </h3>
              <ul className="font-code-tabular text-xs space-y-2 text-on-surface-variant">
                <li className="flex items-center justify-between py-1 border-b border-border-subtle">
                  <span>CST 201: Data Structures</span>
                  <span className="text-outline">SLOT A</span>
                </li>
                <li className="flex items-center justify-between py-1 border-b border-border-subtle">
                  <span>CST 203: Logic System Design</span>
                  <span className="text-outline">SLOT B</span>
                </li>
                <li className="flex items-center justify-between py-1 border-b border-border-subtle">
                  <span>CST 205: Object Oriented (Java)</span>
                  <span className="text-outline">SLOT C</span>
                </li>
                <li className="flex items-center justify-between py-1 border-b border-border-subtle">
                  <span>MAT 203: Discrete Mathematics</span>
                  <span className="text-outline">SLOT D</span>
                </li>
                <li className="flex items-center justify-between py-1 border-b border-border-subtle">
                  <span>EST 200: Design &amp; Engineering</span>
                  <span className="text-outline">SLOT E</span>
                </li>
                <li className="flex items-center justify-between py-1">
                  <span>MCN 201: Sustainable Engineering</span>
                  <span className="text-outline">SLOT F</span>
                </li>
              </ul>
            </div>

            {/* Curated Learning Ethos Quote */}
            <div className="p-space-md bg-surface-container-low border-l-2 border-primary rounded-r">
              <p className="font-body-sm text-xs italic text-on-surface-variant leading-relaxed">
                &ldquo;We do not study for credentialism alone. We construct understanding through deliberate, unhurried examination of foundational principles.&rdquo;
              </p>
              <div className="font-code-tabular text-[10px] text-outline mt-2 tracking-wider uppercase">
                — FOLE CHARTER OF SCHOLARSHIP
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Scheme Information Modal Dialog */}
      {schemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card border border-border-subtle max-w-md w-full rounded p-space-lg shadow-xl space-y-space-md">
            <div className="flex items-center justify-between border-b border-border-subtle pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary">tune</span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Academic Scheme</h3>
              </div>
              <button
                type="button"
                onClick={() => setSchemeModalOpen(false)}
                className="p-1 hover:bg-surface-warm rounded text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant space-y-space-xs leading-relaxed">
              <p>
                <strong>Academic Scheme: 2019 Scheme (KTU).</strong> All syllabi, question blueprints, and credit evaluations are aligned to APJ Abdul Kalam Technological University revised regulation directives.
              </p>
              <div className="p-space-sm bg-surface-warm rounded border border-border-subtle font-code-tabular text-xs text-on-surface">
                <div>Regulation: KTU B.Tech Ordinance 2019</div>
                <div>Curriculum Code: B.Tech Full-Time</div>
                <div>Assessment: 40 Internal / 60 End-Sem (100 Marks Total)</div>
              </div>
            </div>
            <div className="flex justify-end pt-space-xs">
              <button
                type="button"
                onClick={() => setSchemeModalOpen(false)}
                className="px-space-md py-1.5 bg-primary text-on-primary rounded font-code-tabular text-label-caps hover:bg-secondary cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
