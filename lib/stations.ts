// lib/stations.ts

export interface Station {
  id: number;
  title: string;
  candidateInstructions: string;
  actorInstructions: string;
  feedbackDomains: string;
}

export const stations: Station[] = [
    {
        id: 1,
        title: "Station 1: General Adult Patient Management",
        candidateInstructions: `You are working in liaison psychiatry and have assessed Mr Septimus Harding, a 63-year-old man on the cardiology ward. He had a non-ST-elevation myocardial infarction (NSTEMI) three weeks ago...`, // Truncated for brevity
        actorInstructions: `You are Henrietta Lacks, a medical student in a liaison psychiatry team. It has been arranged that the doctor in front of you is going to teach you about an interesting case...`, // Truncated for brevity
        feedbackDomains: `Differential Diagnosis\nThe candidate successfully identifies that this is a case of (mild to moderate) depression following a myocardial infarction...`, // Truncated for brevity
    },
    {
        id: 2,
        title: "Station 2: General Adult Patient Management",
        candidateInstructions: `You are working on an acute inpatient unit. Your colleague has asked you to review Mrs Agatha Achebe, who is a 31-year-old woman with a long-established diagnosis of paranoid schizophrenia...`, // Truncated
        actorInstructions: `You are 31-year-old Mrs Agatha Achebe. You have been diagnosed with paranoid schizophrenia since you were 23...`, // Truncated
        feedbackDomains: `Knowledge\nThe candidate correctly identifies akathisia. They recognize its core features...`, // Truncated
    },
    // ... Paste all 16 of your complete station objects here.
    {
        id: 16,
        title: "Station 16: Mental State Examination",
        candidateInstructions: `You are working on an acute psychiatric ward where a 54-year-old man, Mr Josiah Crawley, has just been admitted...`, // Truncated
        actorInstructions: `You are Mr Josiah Crawley, a 54-year-old man. You are feeling very low and anxious...`, // Truncated
        feedbackDomains: `Knowledge\nThe candidate identifies that this is a case of psychotic depression...`, // Truncated
    }
];