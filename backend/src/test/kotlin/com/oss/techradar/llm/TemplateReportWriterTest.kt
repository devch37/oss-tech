package com.oss.techradar.llm

import com.oss.techradar.domain.LibraryUsage
import com.oss.techradar.domain.ReportLanguage
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.YearMonth

class TemplateReportWriterTest {

    private val month = YearMonth.of(2026, 11)

    private fun lib(name: String, now: Int, prev: Int, rate: Double) = LibraryUsage(
        libraryName = name,
        domain = "frontend",
        collectedMonth = month,
        usageCount = now,
        prevMonthCount = prev,
        growthRate = rate,
    )

    private val top = listOf(
        lib("typescript", 28, 27, 3.7),
        lib("zustand", 12, 8, 50.0),
        lib("jquery", 9, 12, -25.0),
    )
    private val rising = top.filter { it.growthRate >= 20.0 }
    private val declining = top.filter { it.growthRate <= -10.0 }

    @Test
    fun `영어 리포트 - 5개 섹션과 라이브러리 수치를 담는다`() {
        val md = TemplateReportWriter.write(ReportLanguage.EN, "frontend", month, top, rising, declining)

        listOf("## One-line summary", "## 🚀 Top 3 rising libraries", "## 📊 Full ranking", "## ⚠️ Changes worth watching", "## Watchlist for next month")
            .forEach { assertTrue(md.contains(it), "섹션 누락: $it") }
        assertTrue(md.contains("**typescript** is the most-used library (28 repos)"))
        assertTrue(md.contains("**zustand** is growing fastest (+50.0%)"))
        assertTrue(md.contains("| zustand | 12 | 8 | +50.0% |"))
        assertTrue(md.contains("**jquery** fell 25.0% (12 → 9 repos)"))
        assertFalse(md.contains("급상승"), "영어 리포트에 한국어 섹션명 없음")
    }

    @Test
    fun `한국어 리포트 - 한국어 섹션과 수치`() {
        val md = TemplateReportWriter.write(ReportLanguage.KO, "frontend", month, top, rising, declining)

        assertTrue(md.contains("## 한 줄 요약"))
        assertTrue(md.contains("## 🚀 급상승 라이브러리 TOP 3"))
        assertTrue(md.contains("**jquery** 25.0% 감소 (12 → 9개 레포)"))
        assertFalse(md.contains("Top 3 rising"))
    }

    @Test
    fun `지난달 데이터가 없으면 증가율 대신 안내 문구를 쓴다`() {
        val first = listOf(lib("react", 5, 0, 100.0), lib("vue", 3, 0, 100.0))
        val md = TemplateReportWriter.write(ReportLanguage.EN, "frontend", month, first, first, emptyList())

        assertTrue(md.contains("no previous month to compare"))
        assertTrue(md.contains("Growth needs last month's data"))
        assertFalse(md.contains("growing fastest"), "첫 달에는 가장 빠른 성장을 주장하지 않는다")
    }

    @Test
    fun `데이터가 없으면 크롤링 안내만 담는다`() {
        val md = TemplateReportWriter.write(ReportLanguage.EN, "frontend", month, emptyList(), emptyList(), emptyList())

        assertTrue(md.contains("No library data has been collected"))
        assertFalse(md.contains("Full ranking"))
    }

    @Test
    fun `표 셀의 파이프 문자는 이스케이프한다`() {
        val weird = listOf(lib("a|b", 4, 2, 100.0))
        val md = TemplateReportWriter.write(ReportLanguage.EN, "frontend", month, weird, weird, emptyList())

        assertTrue(md.contains("a\\|b"))
    }
}
