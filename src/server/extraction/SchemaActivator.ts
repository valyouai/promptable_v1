// src/server/extraction/SchemaActivator.ts

/**
 * Phase 4 - Schema Activator
 * 
 * This module maps loosely extracted keys into a target schema,
 * ensuring consistent field alignment regardless of source phrasing.
 */

export class SchemaActivator {
    private static readonly schemaMap: Record<string, string> = {
        // Mapping common aliases or variations to target schema fields
        "Research Aim": "Research Objective",
        "Goal": "Research Objective",
        "Purpose": "Research Objective",
        "Approach": "Methods",
        "Methodology": "Methods",
        "Data Used": "Dataset(s)",
        "Dataset Used": "Dataset(s)",
        "Results": "Key Findings",
        "Findings": "Key Findings",
        "Constraints": "Limitations",
        "Weaknesses": "Limitations",
        "Future Directions": "Future Work",
        "Use Cases": "Applications",
        "Practical Applications": "Applications",
    };

    public static activate(rawOutput: Record<string, any>): Record<string, any> {
        const activatedOutput: Record<string, any> = {};

        for (const [key, value] of Object.entries(rawOutput)) {
            const mappedKey = this.schemaMap[key] || key;
            activatedOutput[mappedKey] = value;
        }

        return activatedOutput;
    }
} 