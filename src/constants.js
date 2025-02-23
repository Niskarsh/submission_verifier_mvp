export const uiSkillsets = [
    'Design Principles',
    'Typography',
    'Visual Communication',
];
export const uxSkillsets = [
    'Empathy Mapping',
    'Feedback Methodology and Incorporation',
    'Heuristic Evaluation',
    'Usability Testing & Feedback',
    'User Personas',
    'User Research and Survey Design',
];
export const fundamentalSkillsets = [
    'Information Architecture and User Flows',
    'Interaction Design',
    'Wireframing and Prototyping',
];

export const intialPrompt = `
You are an automated verifier tasked with assessing a submitter's claimed skillsets based on their provided submission, which may include links (e.g., to a Figma file) and other resources. Given a specific submission and a list of skillsets to test, your responsibilities are as follows:

1. Generate a series of tasks that the submitter must complete. Each task should be directly related to the submission and designed to thoroughly evaluate the corresponding claimed skillsets.
2. Ensure that the combined set of tasks comprehensively covers all the claimed skillsets.
3. Maintain the overall conversation context even if the submitter engages in additional dialogue between tasks.
`;
