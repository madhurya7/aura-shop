import { describe, it, expect } from "vitest";

/**
 * Tests for review/rating calculation logic.
 */

function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

function buildBulkRatingsMap(
  reviews: { product_id: string; rating: number }[]
): Record<string, { avg_rating: number; review_count: number }> {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews) {
    if (!map[r.product_id]) map[r.product_id] = { sum: 0, count: 0 };
    map[r.product_id].sum += r.rating;
    map[r.product_id].count += 1;
  }

  const result: Record<string, { avg_rating: number; review_count: number }> = {};
  for (const [id, v] of Object.entries(map)) {
    result[id] = {
      avg_rating: Math.round((v.sum / v.count) * 10) / 10,
      review_count: v.count,
    };
  }
  return result;
}

describe("Average Rating Calculation", () => {
  it("calculates average of multiple ratings", () => {
    expect(calculateAverageRating([5, 4, 3])).toBe(4);
  });

  it("handles single rating", () => {
    expect(calculateAverageRating([5])).toBe(5);
  });

  it("rounds to 1 decimal place", () => {
    expect(calculateAverageRating([5, 4])).toBe(4.5);
  });

  it("returns 0 for empty array", () => {
    expect(calculateAverageRating([])).toBe(0);
  });

  it("handles all same ratings", () => {
    expect(calculateAverageRating([3, 3, 3, 3])).toBe(3);
  });

  it("handles decimal result", () => {
    expect(calculateAverageRating([5, 4, 4, 3])).toBe(4);
  });
});

describe("Bulk Ratings Map", () => {
  it("groups ratings by product", () => {
    const reviews = [
      { product_id: "prod-1", rating: 5 },
      { product_id: "prod-1", rating: 3 },
      { product_id: "prod-2", rating: 4 },
    ];

    const result = buildBulkRatingsMap(reviews);
    expect(result["prod-1"].avg_rating).toBe(4);
    expect(result["prod-1"].review_count).toBe(2);
    expect(result["prod-2"].avg_rating).toBe(4);
    expect(result["prod-2"].review_count).toBe(1);
  });

  it("handles empty reviews", () => {
    expect(buildBulkRatingsMap([])).toEqual({});
  });

  it("handles single product multiple reviews", () => {
    const reviews = [
      { product_id: "prod-1", rating: 5 },
      { product_id: "prod-1", rating: 4 },
      { product_id: "prod-1", rating: 3 },
      { product_id: "prod-1", rating: 2 },
      { product_id: "prod-1", rating: 1 },
    ];

    const result = buildBulkRatingsMap(reviews);
    expect(result["prod-1"].avg_rating).toBe(3);
    expect(result["prod-1"].review_count).toBe(5);
  });
});
