// src/server/simulator/fixtures/SchemaStressFixtures.ts

export const schemaStressMocks = {
    sample1: {
        chunk1: {
            validComplete: `{
        "principles": ["Efficiency", "Clarity"],
        "methods": ["Method A", "Method B"],
        "frameworks": ["Framework 1"],
        "theories": ["Theory X"]
      }`,
            missingFields: `{
        "principles": ["Efficiency"]
      }`,
            emptyArrays: `{
        "principles": [],
        "methods": [],
        "frameworks": [],
        "theories": []
      }`,
            extraFields: `{
        "principles": ["Efficiency"],
        "methods": ["Method A"],
        "frameworks": ["Framework 1"],
        "theories": ["Theory X"],
        "unexpected": "oops!"
      }`,
            invalidFormat: `{
        "principles": "Efficiency",
        "methods": 12345,
        "frameworks": ["Framework 1"],
        "theories": null
      }`,
            justText: `"Not explicitly mentioned."`
        }
    }
};

export function getSchemaStressMockResponse(sampleId: string, chunkId: string, variation: keyof typeof schemaStressMocks.sample1.chunk1): string | undefined {
    return schemaStressMocks[sampleId as keyof typeof schemaStressMocks]?.[chunkId as keyof typeof schemaStressMocks[keyof typeof schemaStressMocks]]?.[variation];
} 