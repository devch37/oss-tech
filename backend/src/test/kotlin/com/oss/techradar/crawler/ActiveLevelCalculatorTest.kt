package com.oss.techradar.crawler

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import kotlin.math.ln

class ActiveLevelCalculatorTest {

    private val calculator = ActiveLevelCalculator()

    @Test
    fun `calculate - README 공식대로 계산`() {
        // given: commits=10, prs=5, issues=3, stars=99 → ln(100)=4.605...
        val result = calculator.calculate(commits30d = 10, prsMerged30d = 5, issuesClosed30d = 3, stars = 99)

        // then
        val expected = (10 * 3 + 5 * 2 + 3 * 1) / ln(100.0)
        assertEquals(expected, result, 0.0001)
    }

    @Test
    fun `calculate - stars가 0이어도 0으로 나누지 않는다`() {
        val result = calculator.calculate(commits30d = 5, prsMerged30d = 0, issuesClosed30d = 0, stars = 0)

        // ln(1) = 0 → coerceAtLeast(1.0) 적용
        assertEquals(15.0, result, 0.0001)
    }

    @Test
    fun `calculate - 활동이 전혀 없으면 0점`() {
        val result = calculator.calculate(commits30d = 0, prsMerged30d = 0, issuesClosed30d = 0, stars = 1000)
        assertEquals(0.0, result, 0.0001)
    }
}
