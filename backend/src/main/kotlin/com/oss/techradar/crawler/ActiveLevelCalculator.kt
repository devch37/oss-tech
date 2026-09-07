package com.oss.techradar.crawler

import org.springframework.stereotype.Component
import kotlin.math.ln

/**
 * README 활성도 점수 공식:
 *   score = (commits_30d × 3 + prs_merged_30d × 2 + issues_closed_30d × 1) / ln(stars + 1)
 */
@Component
class ActiveLevelCalculator {

    fun calculate(commits30d: Int, prsMerged30d: Int, issuesClosed30d: Int, stars: Int): Double {
        // stars = 0 이면 ln(1) = 0 → 0으로 나누기 방지
        val denominator = ln((stars + 1).toDouble()).coerceAtLeast(1.0)
        val weightedActivity = commits30d * 3 + prsMerged30d * 2 + issuesClosed30d * 1
        return weightedActivity / denominator
    }
}
