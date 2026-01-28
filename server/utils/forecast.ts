/**
 * Simple Linear Regression and Forecasting Utilities
 */

export const ForecastUtils = {
    /**
     * Calculates the linear trend of a series of numbers.
     * Returns the slope, intercept, and a prediction for the next value.
     */
    calculateTrend(values: number[]) {
        const n = values.length
        if (n < 2) return { slope: 0, trend: 'stable', nextValue: values[0] || 0, growth: 0 }

        // X axis is just time steps 0, 1, 2...
        // Y axis is the values

        let sumX = 0
        let sumY = 0
        let sumXY = 0
        let sumXX = 0

        for (let i = 0; i < n; i++) {
            sumX += i
            sumY += values[i]
            sumXY += i * values[i]
            sumXX += i * i
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        // Predict next value (at index n)
        const nextValue = slope * n + intercept
        
        // Calculate growth percentage (last vs first in trend line, or just slope relative to avg)
        const firstVal = slope * 0 + intercept
        const lastVal = slope * (n - 1) + intercept
        const growth = firstVal !== 0 ? (lastVal - firstVal) / firstVal : 0

        let trend: 'growing' | 'stable' | 'shrinking' = 'stable'
        if (growth > 0.05) trend = 'growing'
        if (growth < -0.05) trend = 'shrinking'

        return {
            slope,
            intercept,
            nextValue,
            growth,
            trend
        }
    },

    /**
     * Projects future variable spending based on weighted average of recent months.
     * Weights recent months higher.
     */
    projectVariableSpending(history: number[]): number {
        if (history.length === 0) return 0
        
        // Weighted average: [oldest ... newest]
        // Weights: 1, 2, 3 ...
        let sumWeighted = 0
        let sumWeights = 0
        
        history.forEach((val, idx) => {
            const weight = idx + 1
            sumWeighted += val * weight
            sumWeights += weight
        })
        
        return sumWeighted / sumWeights
    }
}
