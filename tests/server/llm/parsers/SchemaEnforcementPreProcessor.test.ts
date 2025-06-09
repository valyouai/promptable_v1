import { enforceSchemaCompliance } from '@/server/llm/parsers/SchemaEnforcementPreProcessor';

describe('SchemaEnforcementPreProcessor', () => {
    describe('enforceSchemaCompliance', () => {
        it('should correctly flatten objects with a "value" property', () => {
            const input = { principles: [{ value: "ABC" }] };
            const expected = { principles: ["ABC"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should correctly flatten objects with a "name" property', () => {
            const input = { methods: [{ name: "MethodName" }] };
            const expected = { methods: ["MethodName"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should correctly flatten objects with a "text" property', () => {
            const input = { theories: [{ text: "TheoryText" }] };
            const expected = { theories: ["TheoryText"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should correctly flatten objects with a "label" property', () => {
            const input = { frameworks: [{ label: "FrameworkLabel" }] };
            const expected = { frameworks: ["FrameworkLabel"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should correctly flatten objects with a "description" property', () => {
            const input = { principles: [{ description: "PrincipleDesc" }] };
            const expected = { principles: ["PrincipleDesc"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should stringify unexpected objects within arrays', () => {
            const input = { principles: [{ unexpected: 123 }] };
            const expected = { principles: ["{\"unexpected\":123}"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should stringify complex nested objects within arrays', () => {
            const input = { methods: [{ complex: { nested: true, number: 42 } }] };
            const result = enforceSchemaCompliance(input);
            // To handle potential key order differences in JSON strings, parse and compare
            expect(JSON.parse(result.methods![0] as string)).toEqual({ complex: { nested: true, number: 42 } });
        });

        it('should return "[Malformed Object Detected]" for empty objects', () => {
            const input = { theories: [{}] };
            const expected = { theories: ["[Malformed Object Detected]"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should handle various primitive types by converting them to strings', () => {
            const input = { principles: [null, undefined, true, false, 123, 0.5] };
            // String(null) -> "null", String(undefined) -> "undefined"
            const expected = { principles: ["null", "undefined", "true", "false", "123", "0.5"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should handle an array of mixed valid items correctly', () => {
            const input = {
                principles: [
                    "StringVal",
                    { value: "ObjectValue" },
                    { name: "ObjectName" },
                    { unknown: "data" },
                    123,
                    null
                ]
            };
            const expected = {
                principles: [
                    "StringVal",
                    "ObjectValue",
                    "ObjectName",
                    '{"unknown":"data"}',
                    "123",
                    "null"
                ]
            };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

        it('should default non-array fields to empty arrays', () => {
            const input = {
                principles: "not an array",
                methods: null,
                frameworks: undefined,
                theories: { object: true }
            };
            const expectedOutput = {
                principles: [],
                methods: [],
                frameworks: [],
                theories: []
            };
            expect(enforceSchemaCompliance(input)).toEqual(expectedOutput);
        });

        it('should return empty arrays for fields not present in the input', () => {
            const input = { principles: ["Only this field"] }; // methods, frameworks, theories are missing
            const expectedOutput = {
                principles: ["Only this field"],
                methods: [],
                frameworks: [],
                theories: []
            };
            expect(enforceSchemaCompliance(input)).toEqual(expectedOutput);
        });

        it('should handle empty input object', () => {
            const input = {};
            const expectedOutput = {
                principles: [],
                methods: [],
                frameworks: [],
                theories: []
            };
            expect(enforceSchemaCompliance(input)).toEqual(expectedOutput);
        });

        it('should handle input being null or undefined', () => {
            const expectedOutput = {
                principles: [],
                methods: [],
                frameworks: [],
                theories: []
            };
            expect(enforceSchemaCompliance(null)).toEqual(expectedOutput);
            expect(enforceSchemaCompliance(undefined)).toEqual(expectedOutput);
        });

        it('should maintain string items as is', () => {
            const input = { principles: ["KeepThisString"] };
            const expected = { principles: ["KeepThisString"] };
            expect(enforceSchemaCompliance(input)).toEqual(expected);
        });

    });
}); 