// M10 demo/QA roster -- Champion's approved 50-member scale (2026-09-13),
// reduced from Stage 14 Section A's ~200-300 illustrative figure because
// every member must be created through the real signup/auth flow (no
// service-role, no direct auth.users manipulation -- confirmed constraint).
// Weighted per Champion's decision: higher representation for Business &
// Administration, Transport & Logistics, Trade & Technical, Education;
// moderate for Technology, Sales & Marketing, Engineering & Construction;
// lower for Legal, Healthcare. Extends, not replaces, Stage 14's named cast
// (John Michael Mwangi, Sarah Kessy, David Mwakalindile, Grace Rweyemamu).
//
// Every profession/skill name below is drawn verbatim from
// supabase/seed/taxonomy.sql -- no invented taxonomy value.

export type Availability =
  | "Open to opportunities"
  | "Open to selected opportunities"
  | "Not currently available";

export type VerificationPlan =
  | "FULL" // both tracks approved -- directory-visible, matching-eligible
  | "MEMBERSHIP_ONLY" // membership confirmed, credentials still pending -- fails the AND gate
  | "PENDING" // submitted, nothing decided yet -- verification queue "Pending" tab
  | "NEEDS_CORRECTION"; // credentials flagged -- verification queue "Needs correction" tab

export interface RosterMember {
  firstName: string;
  lastName: string;
  location: string;
  profession: string;
  industry: string;
  employmentStatus:
    | "EMPLOYED"
    | "SELF_EMPLOYED"
    | "BUSINESS_OWNER"
    | "FREELANCER"
    | "STUDENT"
    | "UNEMPLOYED"
    | "RETIRED";
  yearsOfExperience: string;
  institution: string;
  qualification: string;
  skills: string[];
  availabilityLabel: Availability;
  verification: VerificationPlan;
}

// Location pool used throughout: Mwanza, Dar es Salaam, Arusha, Dodoma,
// Mbeya, Tanga, Morogoro -- all already established in the M1-M9 test
// fixtures, no new location invented.

// -- Higher representation: Business & Administration, Transport &
// Logistics, Trade & Technical, Education. -----------------------------
const BUSINESS: RosterMember[] = [
  { firstName: "Sarah", lastName: "Kessy", location: "Mwanza", profession: "HR Manager", industry: "Business Services", employmentStatus: "EMPLOYED", yearsOfExperience: "8", institution: "University of Dar es Salaam", qualification: "Bachelor's in Human Resource Management", skills: ["Recruitment", "Leadership", "Payroll"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Neema", lastName: "Mushi", location: "Arusha", profession: "HR Officer", industry: "Manufacturing", employmentStatus: "EMPLOYED", yearsOfExperience: "3", institution: "Institute of Finance Management", qualification: "Diploma in Human Resource Management", skills: ["Onboarding", "Record Keeping"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
  { firstName: "Joseph", lastName: "Kimaro", location: "Dodoma", profession: "Office Administrator", industry: "Government Services", employmentStatus: "EMPLOYED", yearsOfExperience: "5", institution: "College of Business Education", qualification: "Diploma in Business Administration", skills: ["Scheduling", "Filing", "Customer Service"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Rehema", lastName: "Chacha", location: "Mwanza", profession: "Operations Manager", industry: "Retail", employmentStatus: "EMPLOYED", yearsOfExperience: "10", institution: "University of Dodoma", qualification: "Bachelor's in Business Management", skills: ["Inventory Management", "Team Leadership", "Budgeting"], availabilityLabel: "Not currently available", verification: "FULL" },
  { firstName: "Method", lastName: "Nyakunga", location: "Mbeya", profession: "Project Manager", industry: "Construction", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "12", institution: "Ardhi University", qualification: "Bachelor's in Project Management", skills: ["Planning", "Risk Management", "Stakeholder Coordination"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Anitha", lastName: "Mrema", location: "Tanga", profession: "HR Manager", industry: "Hospitality", employmentStatus: "EMPLOYED", yearsOfExperience: "6", institution: "Mzumbe University", qualification: "Bachelor's in Human Resource Management", skills: ["Recruitment", "Training and Development"], availabilityLabel: "Open to opportunities", verification: "PENDING" },
];

const TRANSPORT: RosterMember[] = [
  { firstName: "Grace", lastName: "Rweyemamu", location: "Mwanza", profession: "Driver", industry: "Logistics", employmentStatus: "EMPLOYED", yearsOfExperience: "9", institution: "VETA Mwanza", qualification: "Class C Driving Certificate", skills: ["Defensive Driving", "Class C Driving License"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Elias", lastName: "Mabula", location: "Mwanza", profession: "Driver", industry: "Logistics", employmentStatus: "EMPLOYED", yearsOfExperience: "6", institution: "VETA Mwanza", qualification: "Class C Driving Certificate", skills: ["Long-Distance Driving", "Vehicle Maintenance"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Hamisi", lastName: "Selemani", location: "Dar es Salaam", profession: "Driver", industry: "Transport", employmentStatus: "FREELANCER", yearsOfExperience: "4", institution: "VETA Dar es Salaam", qualification: "Class B Driving Certificate", skills: ["Defensive Driving"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
  { firstName: "Peniel", lastName: "Mwakalinga", location: "Arusha", profession: "Driver", industry: "Tourism", employmentStatus: "EMPLOYED", yearsOfExperience: "7", institution: "VETA Arusha", qualification: "Class C Driving Certificate", skills: ["Tour Driving", "Customer Service"], availabilityLabel: "Not currently available", verification: "FULL" },
  { firstName: "Zawadi", lastName: "Kilonzo", location: "Dodoma", profession: "Logistics Coordinator", industry: "Distribution", employmentStatus: "EMPLOYED", yearsOfExperience: "5", institution: "National Institute of Transport", qualification: "Diploma in Logistics and Transport Management", skills: ["Fleet Scheduling", "Inventory Tracking"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Isaya", lastName: "Ngowi", location: "Mbeya", profession: "Fleet Manager", industry: "Logistics", employmentStatus: "EMPLOYED", yearsOfExperience: "11", institution: "National Institute of Transport", qualification: "Bachelor's in Transport and Logistics", skills: ["Fleet Maintenance", "Cost Control"], availabilityLabel: "Open to opportunities", verification: "MEMBERSHIP_ONLY" },
];

const TRADE: RosterMember[] = [
  { firstName: "David", lastName: "Mwakalindile", location: "Mwanza", profession: "Accountant", industry: "Finance", employmentStatus: "EMPLOYED", yearsOfExperience: "7", institution: "Institute of Finance Management", qualification: "Bachelor's in Accounting", skills: ["Bookkeeping", "Tax Compliance", "Financial Reporting"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Baraka", lastName: "Shirima", location: "Arusha", profession: "Welder", industry: "Construction", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "8", institution: "VETA Arusha", qualification: "Trade Test Grade I in Welding", skills: ["Arc Welding", "Metal Fabrication"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Godlisten", lastName: "Mahundi", location: "Mwanza", profession: "Mechanic", industry: "Automotive", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "10", institution: "VETA Mwanza", qualification: "Trade Test Grade I in Motor Vehicle Mechanics", skills: ["Engine Repair", "Diagnostics"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Furaha", lastName: "Massawe", location: "Tanga", profession: "Carpenter", industry: "Construction", employmentStatus: "FREELANCER", yearsOfExperience: "6", institution: "VETA Tanga", qualification: "Trade Test Grade II in Carpentry", skills: ["Furniture Making", "Framing"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
  { firstName: "Consolata", lastName: "Mwanri", location: "Dodoma", profession: "Tailor", industry: "Retail", employmentStatus: "BUSINESS_OWNER", yearsOfExperience: "9", institution: "VETA Dodoma", qualification: "Trade Test Grade I in Tailoring", skills: ["Pattern Making", "Garment Construction"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Athumani", lastName: "Juma", location: "Mbeya", profession: "Electrician", industry: "Construction", employmentStatus: "EMPLOYED", yearsOfExperience: "5", institution: "VETA Mbeya", qualification: "Trade Test Grade II in Electrical Installation", skills: ["Wiring", "Circuit Testing"], availabilityLabel: "Open to opportunities", verification: "PENDING" },
  { firstName: "Salome", lastName: "Kway", location: "Morogoro", profession: "Plumber", industry: "Construction", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "4", institution: "VETA Morogoro", qualification: "Trade Test Grade II in Plumbing", skills: ["Pipe Fitting", "Leak Repair"], availabilityLabel: "Open to opportunities", verification: "FULL" },
];

const EDUCATION: RosterMember[] = [
  { firstName: "John Michael", lastName: "Mwangi", location: "Mwanza", profession: "Civil Engineer", industry: "Construction", employmentStatus: "EMPLOYED", yearsOfExperience: "6", institution: "University of Dar es Salaam", qualification: "Bachelor's in Civil Engineering", skills: ["Structural Design", "Site Supervision", "AutoCAD"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Elizabeth", lastName: "Massaka", location: "Tanga", profession: "Teacher", industry: "Education", employmentStatus: "EMPLOYED", yearsOfExperience: "8", institution: "Dar es Salaam University College of Education", qualification: "Bachelor's in Education", skills: ["Curriculum Planning", "Classroom Management"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
  { firstName: "Rashid", lastName: "Kigoda", location: "Tanga", profession: "Teacher", industry: "Education", employmentStatus: "EMPLOYED", yearsOfExperience: "3", institution: "Mkwawa University College of Education", qualification: "Diploma in Education", skills: ["Lesson Planning"], availabilityLabel: "Not currently available", verification: "FULL" },
  { firstName: "Happiness", lastName: "Mgaya", location: "Dodoma", profession: "Tutor", industry: "Education", employmentStatus: "FREELANCER", yearsOfExperience: "2", institution: "University of Dodoma", qualification: "Bachelor's in Mathematics Education", skills: ["Tutoring", "Exam Preparation"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Wilbert", lastName: "Komba", location: "Mbeya", profession: "School Administrator", industry: "Education", employmentStatus: "EMPLOYED", yearsOfExperience: "9", institution: "University of Dodoma", qualification: "Master's in Educational Leadership", skills: ["Staff Supervision", "Budgeting"], availabilityLabel: "Open to opportunities", verification: "FULL" },
];

// -- Moderate representation: Technology, Sales & Marketing, Engineering &
// Construction. -----------------------------------------------------------
const TECHNOLOGY: RosterMember[] = [
  { firstName: "Yohana", lastName: "Sanga", location: "Dar es Salaam", profession: "Software Developer", industry: "Technology", employmentStatus: "EMPLOYED", yearsOfExperience: "4", institution: "Nelson Mandela African Institution of Science and Technology", qualification: "Bachelor's in Computer Science", skills: ["JavaScript", "SQL", "Problem Solving"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Prisca", lastName: "Urio", location: "Arusha", profession: "IT Support", industry: "Technology", employmentStatus: "EMPLOYED", yearsOfExperience: "3", institution: "Institute of Accountancy Arusha", qualification: "Diploma in Information Technology", skills: ["Troubleshooting", "Network Setup"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Erasto", lastName: "Bundala", location: "Mwanza", profession: "Data Analyst", industry: "Finance", employmentStatus: "EMPLOYED", yearsOfExperience: "2", institution: "St. Augustine University of Tanzania", qualification: "Bachelor's in Statistics", skills: ["Excel", "SQL", "Data Visualization"], availabilityLabel: "Open to selected opportunities", verification: "NEEDS_CORRECTION" },
  // 50th roster member (M10 dataset-audit correction, 2026-09-15): the
  // roster previously totaled 49, one short of Champion's approved
  // 50-member target -- see the M10 Dataset Count Review. Added to
  // Technology (moderate-representation tier, tied with Sales at 3
  // before this addition) rather than an already-larger category, to
  // correct the balance without distorting it. Profession/skill drawn
  // verbatim from supabase/seed/taxonomy.sql, previously unused by any
  // other roster member.
  { firstName: "Kelly", lastName: "Mwasongwe", location: "Morogoro", profession: "Network Technician", industry: "Technology", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "4", institution: "Dar es Salaam Institute of Technology", qualification: "Diploma in Information Technology", skills: ["Networking", "Troubleshooting"], availabilityLabel: "Open to opportunities", verification: "FULL" },
];

const SALES: RosterMember[] = [
  { firstName: "Fatuma", lastName: "Rajabu", location: "Dar es Salaam", profession: "Sales Representative", industry: "Retail", employmentStatus: "EMPLOYED", yearsOfExperience: "5", institution: "College of Business Education", qualification: "Diploma in Sales and Marketing", skills: ["Negotiation", "Client Relations"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Deo", lastName: "Mhagama", location: "Mwanza", profession: "Marketing Officer", industry: "FMCG", employmentStatus: "EMPLOYED", yearsOfExperience: "6", institution: "University of Dar es Salaam", qualification: "Bachelor's in Marketing", skills: ["Campaign Planning", "Social Media"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Winnie", lastName: "Materu", location: "Arusha", profession: "Customer Service", industry: "Telecommunications", employmentStatus: "EMPLOYED", yearsOfExperience: "2", institution: "Institute of Accountancy Arusha", qualification: "Diploma in Business Administration", skills: ["Customer Support", "Complaint Resolution"], availabilityLabel: "Open to opportunities", verification: "PENDING" },
];

const ENGINEERING: RosterMember[] = [
  { firstName: "Costantine", lastName: "Lyimo", location: "Arusha", profession: "Mechanical Engineer", industry: "Manufacturing", employmentStatus: "EMPLOYED", yearsOfExperience: "7", institution: "Nelson Mandela African Institution of Science and Technology", qualification: "Bachelor's in Mechanical Engineering", skills: ["CAD Design", "Maintenance Planning"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Devotha", lastName: "Kalinga", location: "Dodoma", profession: "Electrical Engineer", industry: "Energy", employmentStatus: "EMPLOYED", yearsOfExperience: "5", institution: "University of Dodoma", qualification: "Bachelor's in Electrical Engineering", skills: ["Circuit Design", "Power Systems"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Emmanuel", lastName: "Malongo", location: "Mbeya", profession: "Site Supervisor", industry: "Construction", employmentStatus: "EMPLOYED", yearsOfExperience: "8", institution: "Mbeya University of Science and Technology", qualification: "Diploma in Civil Engineering", skills: ["Site Coordination", "Quality Control"], availabilityLabel: "Not currently available", verification: "FULL" },
  { firstName: "Zainab", lastName: "Mfaume", location: "Dar es Salaam", profession: "Architect", industry: "Construction", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "10", institution: "Ardhi University", qualification: "Bachelor's in Architecture", skills: ["Building Design", "AutoCAD"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
  { firstName: "Pendo", lastName: "Sanga", location: "Mwanza", profession: "Quantity Surveyor", industry: "Construction", employmentStatus: "EMPLOYED", yearsOfExperience: "4", institution: "Ardhi University", qualification: "Bachelor's in Quantity Surveying", skills: ["Cost Estimation", "Contract Administration"], availabilityLabel: "Open to opportunities", verification: "FULL" },
];

const CREATIVE: RosterMember[] = [
  { firstName: "Lightness", lastName: "Mwakyusa", location: "Dar es Salaam", profession: "Graphic Designer", industry: "Media", employmentStatus: "FREELANCER", yearsOfExperience: "3", institution: "Bagamoyo Arts and Culture Institute", qualification: "Diploma in Graphic Design", skills: ["Adobe Photoshop", "Branding"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Kelvin", lastName: "Mwandapa", location: "Mwanza", profession: "Photographer", industry: "Media", employmentStatus: "BUSINESS_OWNER", yearsOfExperience: "5", institution: "Bagamoyo Arts and Culture Institute", qualification: "Certificate in Photography", skills: ["Event Photography", "Photo Editing"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
];

// -- Lower representation: Legal, Healthcare. ------------------------------
const LEGAL: RosterMember[] = [
  { firstName: "Amani", lastName: "Chuma", location: "Dar es Salaam", profession: "Advocate", industry: "Legal Services", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "9", institution: "University of Dar es Salaam", qualification: "Bachelor's of Laws (LLB)", skills: ["Contract Law", "Litigation"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
  { firstName: "Veronica", lastName: "Ndosi", location: "Mwanza", profession: "Paralegal", industry: "Legal Services", employmentStatus: "EMPLOYED", yearsOfExperience: "3", institution: "Institute of Judicial Administration", qualification: "Diploma in Law", skills: ["Legal Research", "Case Filing"], availabilityLabel: "Open to opportunities", verification: "FULL" },
];

const HEALTHCARE: RosterMember[] = [
  { firstName: "Catherine", lastName: "Mwasota", location: "Mbeya", profession: "Nurse", industry: "Healthcare", employmentStatus: "EMPLOYED", yearsOfExperience: "6", institution: "Muhimbili University of Health and Allied Sciences", qualification: "Diploma in Nursing", skills: ["Patient Care", "Emergency Response"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Gideon", lastName: "Mtitu", location: "Dodoma", profession: "Clinical Officer", industry: "Healthcare", employmentStatus: "EMPLOYED", yearsOfExperience: "7", institution: "Muhimbili University of Health and Allied Sciences", qualification: "Diploma in Clinical Medicine", skills: ["Diagnosis", "Patient Counseling"], availabilityLabel: "Not currently available", verification: "FULL" },
];

// -- A deliberate handful of NOT_SET-availability and eligibility-gate
// failures (unverified/partially-verified), per Champion's explicit
// request that the roster include candidates who FAIL the M6 gate, not
// only ones who pass it. -------------------------------------------------
const GATE_FAILURES: RosterMember[] = [
  { firstName: "Ibrahim", lastName: "Lugendo", location: "Mwanza", profession: "Driver", industry: "Logistics", employmentStatus: "EMPLOYED", yearsOfExperience: "3", institution: "VETA Mwanza", qualification: "Class C Driving Certificate", skills: ["Defensive Driving"], availabilityLabel: "Open to opportunities", verification: "PENDING" },
  { firstName: "Editha", lastName: "Ngalula", location: "Arusha", profession: "HR Officer", industry: "Business Services", employmentStatus: "EMPLOYED", yearsOfExperience: "2", institution: "Institute of Accountancy Arusha", qualification: "Diploma in Human Resource Management", skills: ["Recruitment"], availabilityLabel: "Not currently available", verification: "MEMBERSHIP_ONLY" },
  { firstName: "Onesmo", lastName: "Mrisho", location: "Dodoma", profession: "Accountant", industry: "Finance", employmentStatus: "EMPLOYED", yearsOfExperience: "1", institution: "Institute of Finance Management", qualification: "Diploma in Accounting", skills: ["Bookkeeping"], availabilityLabel: "Open to opportunities", verification: "NEEDS_CORRECTION" },
];

// -- A small extra batch to reach the approved 50-member target, weighted
// toward the same higher-priority categories per Champion's decision. -----
const EXTRA: RosterMember[] = [
  { firstName: "Nuru", lastName: "Kaijage", location: "Mwanza", profession: "Driver", industry: "Logistics", employmentStatus: "EMPLOYED", yearsOfExperience: "5", institution: "VETA Mwanza", qualification: "Class C Driving Certificate", skills: ["Route Planning", "Vehicle Maintenance"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Beatus", lastName: "Mrema", location: "Dar es Salaam", profession: "Office Administrator", industry: "Business Services", employmentStatus: "EMPLOYED", yearsOfExperience: "4", institution: "College of Business Education", qualification: "Diploma in Business Administration", skills: ["Scheduling", "Customer Service"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Scholastica", lastName: "Rutta", location: "Mwanza", profession: "Carpenter", industry: "Construction", employmentStatus: "FREELANCER", yearsOfExperience: "3", institution: "VETA Mwanza", qualification: "Trade Test Grade II in Carpentry", skills: ["Furniture Making"], availabilityLabel: "Open to selected opportunities", verification: "FULL" },
  { firstName: "Ombeni", lastName: "Lwenge", location: "Tanga", profession: "Teacher", industry: "Education", employmentStatus: "EMPLOYED", yearsOfExperience: "5", institution: "Dar es Salaam University College of Education", qualification: "Bachelor's in Education", skills: ["Curriculum Planning"], availabilityLabel: "Open to opportunities", verification: "FULL" },
  { firstName: "Restituta", lastName: "Mwakisu", location: "Morogoro", profession: "Bookkeeper", industry: "Finance", employmentStatus: "SELF_EMPLOYED", yearsOfExperience: "6", institution: "Institute of Finance Management", qualification: "Diploma in Accounting", skills: ["Bookkeeping", "Payroll"], availabilityLabel: "Open to opportunities", verification: "FULL" },
];

export const ROSTER: RosterMember[] = [
  ...BUSINESS,
  ...TRANSPORT,
  ...TRADE,
  ...EDUCATION,
  ...TECHNOLOGY,
  ...SALES,
  ...ENGINEERING,
  ...CREATIVE,
  ...LEGAL,
  ...HEALTHCARE,
  ...GATE_FAILURES,
  ...EXTRA,
];
