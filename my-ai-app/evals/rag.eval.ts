import { evalite } from "evalite";
import { answerRelevancy, contextRecall, faithfulness } from "evalite/scorers";
import { embeddingModelList, modelList } from "../lib/ai/models";
import { RAG_agent_evalite, testingModels } from "./evalite-models";

evalite("RAG Test", {
  data: () => [
    {
      input: "What does Jane Doe do for a living?",
      expected: {
        answer: "Jane Doe is a Product Owner",
        groundTruth: [
          `Jane Doe | Product Manager/Owner
          Sydney, Australia |+61400000000| jane.doe@example.com | www.linkedin.com/in/jane-doe/
          More than 4 years of experience in tech products as a Product Manager/Owner with strong
          interpersonal skills, along with a background in customer service, combined with knowledge
          of the tech industry and agile work methodologies, which gives me the ability to always
          search for customer-centric solutions
          `,
          `Product Owner | TechCorp Feb 2025 - Present
          Sydney Office, CBD NSW 2000
          Director of Product & Technology, John Smith | john.smith@techcorp.com
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
      input: "Where is Jane Doe currently employed?",
      expected: {
        answer: "Jane Doe works at TechCorp",
        groundTruth: [
          `Jane Doe | Product Manager/Owner
          Sydney, Australia |+61400000000| jane.doe@example.com | www.linkedin.com/in/jane-doe/
          More than 4 years of experience in tech products as a Product Manager/Owner with strong
          interpersonal skills, along with a background in customer service, combined with knowledge
          of the tech industry and agile work methodologies, which gives me the ability to always
          search for customer-centric solutions
          `,
          `Product Owner | TechCorp Feb 2025 - Present
          Sydney Office, CBD NSW 2000
          Director of Product & Technology, John Smith | john.smith@techcorp.com
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
    {
      only: true,
      input: "What is the habitat of the brushtail possum?",
      expected: {
        answer: `Brushtail Possums are very common in urban parks
            and gardens. In cities, possums often seek shelter,
            warmth and protection in the dark holes in buildings.`,
        groundTruth: [
          `Habitat
            Brushtail Possums can be found in a wide range of
            forests and woodlands across the state. They are
            generally absent from the driest areas.
            Brushtail Possums are very common in urban parks
            and gardens. In cities, possums often seek shelter,
            warmth and protection in the dark holes in buildings. 
            A favoured spot is between the ceiling and the roof, and
            this can be a problem to some people. `,
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
