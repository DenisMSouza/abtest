import { getWeightedVariation } from "../utils";
import { Variation } from "../types";

describe("Distribution Logic Tests", () => {
  describe("getWeightedVariation", () => {
    it("should distribute 50/50 with equal weights", () => {
      const variations: Variation[] = [
        { name: "A", weight: 0.5, isBaseline: true },
        { name: "B", weight: 0.5, isBaseline: false },
      ];

      const count: { [key: string]: number } = { A: 0, B: 0 };

      // Test with alternating random function for 50/50
      let counter = 0;
      const alternatingRandom = () => {
        counter++;
        return counter % 2 === 0 ? 0.8 : 0.2; // Alternates between 0.8 and 0.2
      };

      for (let i = 0; i < 1000; i++) {
        const variation = getWeightedVariation(variations, alternatingRandom);
        count[variation as keyof typeof count]++;
      }

      // With alternating random, should get roughly 50/50
      const total = count["A"] + count["B"];
      const distributionA = count["A"] / total;
      const distributionB = count["B"] / total;

      expect(distributionA).toBeGreaterThan(0.4);
      expect(distributionA).toBeLessThan(0.6);
      expect(distributionB).toBeGreaterThan(0.4);
      expect(distributionB).toBeLessThan(0.6);
    });

    it("should distribute 75/25 with 3:1 weights", () => {
      const variations: Variation[] = [
        { name: "A", weight: 0.75, isBaseline: true },
        { name: "B", weight: 0.25, isBaseline: false },
      ];

      const count: { [key: string]: number } = { A: 0, B: 0 };

      // Test with pattern that favors A for 75/25
      let counter = 0;
      const favoringRandom = () => {
        counter++;
        const values = [0.2, 0.4, 0.6, 0.9]; // Pattern that should favor A
        return values[counter % 4];
      };

      for (let i = 0; i < 1000; i++) {
        const variation = getWeightedVariation(variations, favoringRandom);
        count[variation as keyof typeof count]++;
      }

      // With favoring random, should get roughly 75/25
      const total = count["A"] + count["B"];
      const distributionA = count["A"] / total;
      const distributionB = count["B"] / total;

      expect(distributionA).toBeGreaterThan(0.65);
      expect(distributionA).toBeLessThan(0.85);
      expect(distributionB).toBeGreaterThan(0.15);
      expect(distributionB).toBeLessThan(0.35);
    });

    it("should return 100% Variation A when B has 0 weight", () => {
      const variations: Variation[] = [
        { name: "A", weight: 1, isBaseline: true },
        { name: "B", weight: 0, isBaseline: false },
      ];

      const count: { [key: string]: number } = { A: 0, B: 0 };

      // Test with any random function
      for (let i = 0; i < 100; i++) {
        const variation = getWeightedVariation(variations, Math.random);
        count[variation as keyof typeof count]++;
      }

      // Should always get A when B has 0 weight
      expect(count["A"]).toBe(100);
      expect(count["B"]).toBe(0);
    });

    it("should handle single variation", () => {
      const variations: Variation[] = [
        { name: "A", weight: 1, isBaseline: true },
      ];

      const variation = getWeightedVariation(variations, Math.random);
      expect(variation).toBe("A");
    });

    it("should handle edge case with very small weights", () => {
      const variations: Variation[] = [
        { name: "A", weight: 0.999, isBaseline: true },
        { name: "B", weight: 0.001, isBaseline: false },
      ];

      const count: { [key: string]: number } = { A: 0, B: 0 };

      // Test with deterministic random function
      const deterministicRandom = () => 0.5; // Always return 0.5

      for (let i = 0; i < 1000; i++) {
        const variation = getWeightedVariation(variations, deterministicRandom);
        count[variation as keyof typeof count]++;
      }

      // Should heavily favor A
      const total = count["A"] + count["B"];
      const distributionA = count["A"] / total;

      expect(distributionA).toBeGreaterThan(0.95);
    });

    it("should handle random distribution with Math.random", () => {
      const variations: Variation[] = [
        { name: "A", weight: 0.5, isBaseline: true },
        { name: "B", weight: 0.5, isBaseline: false },
      ];

      const count: { [key: string]: number } = { A: 0, B: 0 };

      // Test with Math.random (should be roughly 50/50)
      for (let i = 0; i < 10000; i++) {
        const variation = getWeightedVariation(variations, Math.random);
        count[variation as keyof typeof count]++;
      }

      // Should be roughly 50/50 with Math.random
      const total = count["A"] + count["B"];
      const distributionA = count["A"] / total;
      const distributionB = count["B"] / total;

      expect(distributionA).toBeGreaterThan(0.45);
      expect(distributionA).toBeLessThan(0.55);
      expect(distributionB).toBeGreaterThan(0.45);
      expect(distributionB).toBeLessThan(0.55);
    });
  });
});
