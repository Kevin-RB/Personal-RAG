import { evalite } from "evalite";
import { answerRelevancy, contextRecall, faithfulness } from "evalite/scorers";
import { embeddingModelList, modelList } from "../lib/ai/models";
import { RAG_agent_evalite, testingModels } from "./evalite-models";

evalite("RAG Test", {
  data: () => [
    {
      input: "What does Camila Dossman do for a living?",
      expected: {
        answer: "Camila Dossman is a Product Owner",
        groundTruth: [
          `Maria Camila Dossman | Product Manager/Owner
          Brisbane, Australia |+61415681726| camila.dossman@hotmail.com | www.linkedin.com/in/camila-dossman/
          More than 4 years of experience in tech products as a Product Manager/Owner with strong
          interpersonal skills, along with a background in customer service, combined with knowledge
          of the tech industry and agile work methodologies, which gives me the ability to always
          search for customer-centric solutions
          `,
          `Product Owner | CarExpert Feb 2025 - Present
          Brisbane Office, Fortitude Valley QLD 4006
          Director of Product & Technology, Phoebe Rockliffe | phoebe@carexpert.com.au
          ● Defined and prioritized product backlog items in collaboration with stakeholders,
          ensuring alignment with business goals and user needs.
          ● Acted as the primary liaison between business stakeholders and development teams,
          translating high-level requirements into clear, actionable user stories.
          ● Led sprint planning, backlog grooming, and review sessions to ensure consistent
          delivery of high-quality, incremental product value.
          ● Ensured all features met a high standard of quality through clear acceptance criteria,
          UAT, and close QA collaboration.
          `,
        ],
      },
    },
    {
      input: "Where is Camila Dossman currently employed?",
      expected: {
        answer: "Camila Dossman works at CarExpert",
        groundTruth: [
          `Maria Camila Dossman | Product Manager/Owner
          Brisbane, Australia |+61415681726| camila.dossman@hotmail.com | www.linkedin.com/in/camila-dossman/
          More than 4 years of experience in tech products as a Product Manager/Owner with strong
          interpersonal skills, along with a background in customer service, combined with knowledge
          of the tech industry and agile work methodologies, which gives me the ability to always
          search for customer-centric solutions
          `,
          `Product Owner | CarExpert Feb 2025 - Present
          Brisbane Office, Fortitude Valley QLD 4006
          Director of Product & Technology, Phoebe Rockliffe | phoebe@carexpert.com.au
          ● Defined and prioritized product backlog items in collaboration with stakeholders,
          ensuring alignment with business goals and user needs.
          ● Acted as the primary liaison between business stakeholders and development teams,
          translating high-level requirements into clear, actionable user stories.
          ● Led sprint planning, backlog grooming, and review sessions to ensure consistent
          delivery of high-quality, incremental product value.
          ● Ensured all features met a high standard of quality through clear acceptance criteria,
          UAT, and close QA collaboration.
          `,
        ],
      },
    },
    {
      input: "What is the diet of a bushtail possum?",
      expected: {
        answer: `
        Brushtail Possums eat plant material, supplemented
          with bird eggs, baby birds and some insects. They
          mainly eat leaves of eucalypts but also some shrubs
          (mainly wattles), herbs, flowers and fruit. `,
        groundTruth: [
          `Diet
            Brushtail Possums eat plant material, supplemented
            with bird eggs, baby birds and some insects. They
            mainly eat leaves of eucalypts but also some shrubs
            (mainly wattles), herbs, flowers and fruit. They forage in
            the canopy, in lower levels of the forest and on the
            ground. In urban areas, the Common Brushtail Possum
            will eat a variety of food including fruit and bread.
            The Brushtail Possum’s liver cannot cope with an
            abundance of toxins in eucalypt leaves so they need to
            have a varied diet.
            Brushtail Possums prefer eucalyptus leaves with a high
            nutrient content. They can distinguish between high and
            low nutrient quality leaves, even when the foliage of
            these plants is intermingled`,
        ],
      },
    },
  ],
  task: async (input) => {
    const response = await RAG_agent_evalite.generate({
      prompt: input,
    });
    return response.text;
  },
  scorers: [
    {
      scorer: ({ input, output, expected }) =>
        faithfulness({
          question: input,
          answer: output,
          groundTruth: expected.groundTruth,
          model: testingModels.ollama,
        }),
    },
    {
      scorer: ({ input, output }) =>
        answerRelevancy({
          question: input,
          answer: output,
          model: testingModels.ollama,
          embeddingModel: embeddingModelList.useOllama,
        }),
    },
    {
      scorer: ({ input, expected, output }) =>
        contextRecall({
          question: input,
          answer: output,
          groundTruth: expected.groundTruth,
          model: modelList.useOllama,
        }),
    },
  ],
});
