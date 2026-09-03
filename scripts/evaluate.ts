/**
 * KellyOS evaluation script — PASS/FAIL checks for core engines.
 * Run: npm run evaluate
 */
import { scoreProject } from "../src/services/scoring/projectScoring";
import { allocateBudget, allocationWithinBudget } from "../src/services/allocation/allocationEngine";
import { matchNGOsToProject } from "../src/services/matching/ngoMatching";
import { analyzeProjectRisks, highestRiskLevel } from "../src/services/risk/riskEngine";
import { DemoAIProvider } from "../src/services/ai/demoProvider";
import * as fs from "fs";
import * as path from "path";

type Result = { name: string; pass: boolean; detail: string };
const results: Result[] = [];

function check(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}: ${detail}`);
}

async function main() {
  console.log("KellyOS Evaluation\n");

  // A. Extraction from seed document
  const docPath = path.join(process.cwd(), "demo-data/documents/project-sunrise.md");
  const text = fs.readFileSync(docPath, "utf-8");
  const ai = new DemoAIProvider();
  const extracted = await ai.extractProject(text, "project-sunrise.md");
  check(
    "Extraction",
    extracted.projectName.toLowerCase().includes("sunrise") &&
      extracted.beneficiaries.count === 2400 &&
      extracted.requestedBudget >= 7000000,
    `name=${extracted.projectName}, beneficiaries=${extracted.beneficiaries.count}, budget=${extracted.requestedBudget}`
  );

  // B. Ranking stability
  const company = {
    name: "Northstar Industries",
    industries: ["Manufacturing"],
    csrFocus: ["Education", "Healthcare", "Sports & Youth Development", "Community Development"],
    targetRegions: ["Haryana", "Delhi NCR", "Punjab", "Rajasthan"],
    beneficiaryGroups: ["Students", "Women", "Youth", "Rural Communities", "Teachers"],
    strategicThemes: ["Sports ecosystem", "Rural education", "Community health"],
    annualBudget: 50000000,
  };

  const projects = [
    {
      name: "Project Sunrise",
      category: "Education",
      description: "Digital learning rural students Haryana",
      geography: ["Haryana", "Punjab"],
      beneficiaryCount: 2400,
      beneficiaryGroups: ["Students", "Teachers"],
      requestedBudget: 8000000,
      durationMonths: 18,
      outcomes: ["reading", "teachers", "labs"],
      risks: ["devices"],
      requiredExpertise: ["Education", "Digital Learning"],
      dataCompleteness: 0.9,
    },
    {
      name: "Project GreenStep",
      category: "Community Development",
      description: "Waste segregation Delhi",
      geography: ["Delhi NCR"],
      beneficiaryCount: 2000,
      beneficiaryGroups: ["Students"],
      requestedBudget: 3500000,
      durationMonths: 12,
      outcomes: ["segregation"],
      risks: ["municipal"],
      requiredExpertise: ["Environment"],
      dataCompleteness: 0.6,
    },
  ];

  const scored = projects.map((p) => ({ name: p.name, ...scoreProject(p, company) }));
  const ranked = [...scored].sort((a, b) => b.overallScore - a.overallScore);
  check(
    "Ranking",
    ranked[0].name === "Project Sunrise" && ranked[0].overallScore > ranked[1].overallScore,
    `#1 ${ranked[0].name} (${ranked[0].overallScore}) > ${ranked[1].name} (${ranked[1].overallScore})`
  );

  // C. Allocation within budget
  const allocation = allocateBudget({
    totalBudget: 10000000,
    projects: scored.map((s, i) => ({
      projectId: String(i),
      projectName: s.name,
      score: s.overallScore,
      requestedBudget: projects[i].requestedBudget,
      riskLevel: "LOW",
      confidence: s.confidence,
    })),
  });
  check(
    "Allocation",
    allocationWithinBudget(allocation, 10000000),
    `sum=${allocation.reduce((s, a) => s + a.recommended, 0)} <= 10000000`
  );

  // D. Risk detection
  const risks = analyzeProjectRisks({
    projectName: "Project Sunrise",
    expectedProgress: 70,
    actualProgress: 45,
    overdueMilestones: 1,
    delayedMilestones: 1,
    budgetApproved: 8000000,
    budgetSpent: 5000000,
  });
  check(
    "Risk",
    highestRiskLevel(risks) === "HIGH" || risks.some((r) => r.level === "HIGH"),
    `levels=${risks.map((r) => r.level).join(",")}`
  );

  // E. Matching
  const matches = matchNGOsToProject(
    {
      id: "1",
      name: "Project Sunrise",
      category: "Education",
      geography: ["Haryana", "Punjab"],
      beneficiaryGroups: ["Students", "Teachers"],
      requiredExpertise: ["Education", "Digital Learning"],
      description: "Digital learning",
    },
    [
      {
        id: "seva",
        name: "Seva Foundation",
        primaryExpertise: ["Education", "Digital Learning", "Teacher Training"],
        regions: ["Haryana", "Punjab"],
        beneficiaryGroups: ["Students", "Teachers"],
        yearsOfExperience: 14,
        projectCount: 12,
        executionReliability: 87,
        isNew: false,
        historyCategories: ["Education"],
      },
      {
        id: "jal",
        name: "Jal Jeevan Initiative",
        primaryExpertise: ["Water & Sanitation"],
        regions: ["Rajasthan"],
        beneficiaryGroups: ["Rural Communities"],
        yearsOfExperience: 11,
        projectCount: 9,
        executionReliability: 79,
        isNew: false,
        historyCategories: ["Community Development"],
      },
    ]
  );
  check(
    "Matching",
    matches[0].ngoName === "Seva Foundation" && matches[0].matchScore > matches[1].matchScore,
    `top=${matches[0].ngoName} (${matches[0].matchScore}%)`
  );

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
