import { describe, it, expect } from "vitest";
import { checkCompleteness } from "@/lib/profile/completeness";
import { resumeStep } from "@/lib/profile/resume";
import type { MemberProfile } from "@/types/member";

// Stage 22 checklist test 14: the 7-rule completeness check and the
// resume-step calculator.

function baseProfile(): MemberProfile {
  return {
    id: "m1",
    authUserId: "u1",
    role: "MEMBER",
    firstName: "Test",
    lastName: "Member",
    phone: null,
    email: "t@m1test.com",
    profileStatus: "REGISTERED",
    membershipStatus: "NOT_SUBMITTED",
    credentialsStatus: "NOT_SUBMITTED",
    photoUrl: null,
    dateOfBirth: null,
    gender: null,
    location: null,
    primaryProfessionId: null,
    professionFreetext: null,
    jobTitle: null,
    industry: null,
    employmentStatus: null,
    yearsOfExperience: null,
    availability: "NOT_SET",
    createdAt: "",
    updatedAt: "",
    profession: null,
    education: [],
    experience: [],
    skills: [],
    documents: [],
  };
}

function completeProfile(): MemberProfile {
  return {
    ...baseProfile(),
    location: "Dar es Salaam",
    professionFreetext: "Bricklayer",
    employmentStatus: "SELF_EMPLOYED",
    yearsOfExperience: 4,
    education: [
      {
        id: "e1",
        memberId: "m1",
        institution: "VETA",
        qualification: "Certificate",
        fieldOfStudy: null,
        startYear: 2015,
        endYear: 2017,
        isCurrent: false,
      },
    ],
    skills: [{ id: "s1", name: "Bricklaying" }],
    documents: [
      {
        id: "d1",
        memberId: "m1",
        type: "CV",
        filename: "cv.pdf",
        storagePath: "m1/cv/cv.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1000,
      },
    ],
    availability: "OPEN",
  };
}

describe("checkCompleteness", () => {
  it("a fresh profile is missing all 7 fields, in step order", () => {
    const r = checkCompleteness(baseProfile());
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual([
      "personal",
      "profession",
      "experience",
      "education",
      "skills",
      "cv",
      "availability",
    ]);
  });

  it("a fully filled profile is complete", () => {
    const r = checkCompleteness(completeProfile());
    expect(r.complete).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it("accepts a free-text profession (no taxonomy id)", () => {
    const p = completeProfile();
    p.primaryProfessionId = null;
    p.professionFreetext = "Boda-boda rider";
    expect(checkCompleteness(p).complete).toBe(true);
  });

  it("accepts a taxonomy profession id with no free text", () => {
    const p = completeProfile();
    p.primaryProfessionId = "prof-uuid";
    p.professionFreetext = null;
    expect(checkCompleteness(p).complete).toBe(true);
  });

  it("flags a missing CV specifically", () => {
    const p = completeProfile();
    p.documents = [];
    const r = checkCompleteness(p);
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(["cv"]);
  });

  it("a CERTIFICATE document does not satisfy the CV rule", () => {
    const p = completeProfile();
    p.documents = [
      {
        id: "d2",
        memberId: "m1",
        type: "CERTIFICATE",
        filename: "cert.pdf",
        storagePath: "m1/other/cert.pdf",
        mimeType: "application/pdf",
        sizeBytes: 500,
      },
    ];
    expect(checkCompleteness(p).missing).toEqual(["cv"]);
  });

  it("NOT_SET availability is incomplete; a real value is complete", () => {
    const p = completeProfile();
    p.availability = "NOT_SET";
    expect(checkCompleteness(p).missing).toEqual(["availability"]);
    p.availability = "SELECTIVE";
    expect(checkCompleteness(p).complete).toBe(true);
  });

  it("employment status without years is incomplete", () => {
    const p = completeProfile();
    p.yearsOfExperience = null;
    expect(checkCompleteness(p).missing).toEqual(["experience"]);
  });

  it("zero years of experience is valid", () => {
    const p = completeProfile();
    p.yearsOfExperience = 0;
    expect(checkCompleteness(p).complete).toBe(true);
  });
});

describe("resumeStep", () => {
  it("a fresh profile resumes at step 1", () => {
    expect(resumeStep(baseProfile())).toBe(1);
  });

  it("with personal + profession done, resumes at step 3 (experience)", () => {
    const p = baseProfile();
    p.location = "Mwanza";
    p.professionFreetext = "Driver";
    expect(resumeStep(p)).toBe(3);
  });

  it("with steps 1-4 done, resumes at step 5 (skills)", () => {
    const p = completeProfile();
    p.skills = [];
    p.documents = [];
    p.availability = "NOT_SET";
    expect(resumeStep(p)).toBe(5);
  });

  it("only the CV missing resumes at step 6", () => {
    const p = completeProfile();
    p.documents = [];
    expect(resumeStep(p)).toBe(6);
  });

  it("a fully complete profile resumes at the review step (8)", () => {
    expect(resumeStep(completeProfile())).toBe(8);
  });
});
