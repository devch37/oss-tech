package com.oss.techradar.llm

import com.oss.techradar.domain.LibraryUsage
import com.oss.techradar.domain.ReportLanguage
import java.time.YearMonth
import java.util.Locale

/**
 * LLM 없이 집계 데이터만으로 월간 리포트(마크다운)를 만든다. 외부 API 호출·비용이 없다.
 *
 * LLM 리포트와 같은 5개 섹션 구조를 쓰지만, 숫자에서 읽어낼 수 있는 사실만 적는다
 * ("왜 뜨는지" 같은 해석이나 예측은 쓰지 않는다). `report.llm-provider` 가 openai/claude 가 아닐 때 사용된다.
 */
object TemplateReportWriter {

    fun write(
        language: ReportLanguage,
        domain: String,
        month: YearMonth,
        top: List<LibraryUsage>,
        rising: List<LibraryUsage>,
        declining: List<LibraryUsage>,
    ): String = when (language) {
        ReportLanguage.EN -> english(domain, month, top, rising, declining)
        ReportLanguage.KO -> korean(domain, month, top, rising, declining)
    }

    // ─── English ──────────────────────────────────────────────

    private fun english(
        domain: String,
        month: YearMonth,
        top: List<LibraryUsage>,
        rising: List<LibraryUsage>,
        declining: List<LibraryUsage>,
    ): String = buildString {
        if (top.isEmpty()) {
            appendLine("## One-line summary")
            appendLine("No library data has been collected for $domain in $month yet. Run a crawl first.")
            return@buildString
        }
        val leader = top.first()
        val hasBaseline = top.any { it.prevMonthCount > 0 }
        val rising = rising.filter { it.prevMonthCount > 0 }
        val fastest = rising.maxByOrNull { it.growthRate }

        appendLine("## One-line summary")
        append("In $domain for $month, **${leader.libraryName}** is the most-used library (${leader.usageCount} repos)")
        if (fastest != null) {
            appendLine(", and **${fastest.libraryName}** is growing fastest (${change(fastest)}).")
        } else if (hasBaseline) {
            appendLine(". No library grew by 20% or more.")
        } else {
            appendLine(". There is no previous month to compare with yet, so growth is not available.")
        }
        appendLine()

        appendLine("## 🚀 Top 3 rising libraries")
        val top3 = rising.sortedByDescending { it.growthRate }.take(3)
        if (top3.isEmpty()) {
            appendLine(if (hasBaseline) "No library grew by 20% or more this month." else "Growth needs last month's data, which has not been collected yet.")
        } else {
            appendLine("| Library | Repos now | Last month | Change |")
            appendLine("|---|---:|---:|---:|")
            top3.forEach { appendLine("| ${cell(it.libraryName)} | ${it.usageCount} | ${it.prevMonthCount} | ${change(it)} |") }
        }
        appendLine()

        appendLine("## 📊 Full ranking")
        appendLine("Ranked by the number of tracked repositories that use each library.")
        appendLine()
        appendLine("| # | Library | Repos | Change |")
        appendLine("|---:|---|---:|---:|")
        top.forEachIndexed { i, lib -> appendLine("| ${i + 1} | ${cell(lib.libraryName)} | ${lib.usageCount} | ${change(lib)} |") }
        appendLine()

        appendLine("## ⚠️ Changes worth watching")
        if (declining.isEmpty()) {
            appendLine("No library in the top ${top.size} dropped by 10% or more.")
        } else {
            declining.sortedBy { it.growthRate }.take(10).forEach {
                appendLine("- **${it.libraryName}** fell ${"%.1f".format(Locale.ROOT, -it.growthRate)}% (${it.prevMonthCount} → ${it.usageCount} repos)")
            }
        }
        appendLine()

        appendLine("## Watchlist for next month")
        val added = top.filter { it.prevMonthCount > 0 && it.usageCount > it.prevMonthCount }
            .sortedByDescending { it.usageCount - it.prevMonthCount }
            .take(3)
        if (added.isEmpty()) {
            appendLine("No library added repositories compared with last month.")
        } else {
            appendLine("Libraries that added the most repositories since last month:")
            appendLine()
            added.forEach { appendLine("- **${it.libraryName}** +${it.usageCount - it.prevMonthCount} repos (${it.prevMonthCount} → ${it.usageCount})") }
        }
    }

    // ─── 한국어 ───────────────────────────────────────────────

    private fun korean(
        domain: String,
        month: YearMonth,
        top: List<LibraryUsage>,
        rising: List<LibraryUsage>,
        declining: List<LibraryUsage>,
    ): String = buildString {
        if (top.isEmpty()) {
            appendLine("## 한 줄 요약")
            appendLine("$month $domain 라이브러리 데이터가 아직 수집되지 않았습니다. 먼저 크롤링을 실행하세요.")
            return@buildString
        }
        val leader = top.first()
        val hasBaseline = top.any { it.prevMonthCount > 0 }
        val rising = rising.filter { it.prevMonthCount > 0 }
        val fastest = rising.maxByOrNull { it.growthRate }

        appendLine("## 한 줄 요약")
        append("$month $domain 에서 가장 많이 쓰인 라이브러리는 **${leader.libraryName}** (${leader.usageCount}개 레포)")
        if (fastest != null) {
            appendLine("이고, 가장 빠르게 늘어난 것은 **${fastest.libraryName}** (${change(fastest, NEW_KO)}) 입니다.")
        } else if (hasBaseline) {
            appendLine("입니다. 20% 이상 늘어난 라이브러리는 없었습니다.")
        } else {
            appendLine("입니다. 비교할 지난달 데이터가 아직 없어 증가율은 계산되지 않았습니다.")
        }
        appendLine()

        appendLine("## 🚀 급상승 라이브러리 TOP 3")
        val top3 = rising.sortedByDescending { it.growthRate }.take(3)
        if (top3.isEmpty()) {
            appendLine(if (hasBaseline) "이번 달에 20% 이상 늘어난 라이브러리가 없습니다." else "증가율을 계산하려면 지난달 데이터가 필요한데 아직 수집되지 않았습니다.")
        } else {
            appendLine("| 라이브러리 | 현재 레포 수 | 지난달 | 증감 |")
            appendLine("|---|---:|---:|---:|")
            top3.forEach { appendLine("| ${cell(it.libraryName)} | ${it.usageCount} | ${it.prevMonthCount} | ${change(it, NEW_KO)} |") }
        }
        appendLine()

        appendLine("## 📊 전체 순위표")
        appendLine("추적 중인 레포지토리 중 각 라이브러리를 쓰는 레포 수 기준입니다.")
        appendLine()
        appendLine("| 순위 | 라이브러리 | 레포 수 | 증감 |")
        appendLine("|---:|---|---:|---:|")
        top.forEachIndexed { i, lib -> appendLine("| ${i + 1} | ${cell(lib.libraryName)} | ${lib.usageCount} | ${change(lib, NEW_KO)} |") }
        appendLine()

        appendLine("## ⚠️ 주의 깊게 볼 변화")
        if (declining.isEmpty()) {
            appendLine("상위 ${top.size}개 중 10% 이상 줄어든 라이브러리가 없습니다.")
        } else {
            declining.sortedBy { it.growthRate }.take(10).forEach {
                appendLine("- **${it.libraryName}** ${"%.1f".format(Locale.ROOT, -it.growthRate)}% 감소 (${it.prevMonthCount} → ${it.usageCount}개 레포)")
            }
        }
        appendLine()

        appendLine("## 다음 달 관전 포인트")
        val added = top.filter { it.prevMonthCount > 0 && it.usageCount > it.prevMonthCount }
            .sortedByDescending { it.usageCount - it.prevMonthCount }
            .take(3)
        if (added.isEmpty()) {
            appendLine("지난달보다 레포가 늘어난 라이브러리가 없습니다.")
        } else {
            appendLine("지난달보다 레포가 가장 많이 늘어난 라이브러리입니다.")
            appendLine()
            added.forEach { appendLine("- **${it.libraryName}** +${it.usageCount - it.prevMonthCount}개 레포 (${it.prevMonthCount} → ${it.usageCount})") }
        }
    }

    // ─── 공통 ─────────────────────────────────────────────────

    private const val NEW_EN = "new"
    private const val NEW_KO = "신규"

    /** 지난달 값이 없으면(첫 수집) 증감률이 항상 +100% 라 의미가 없으므로 "new" 로 표기한다. */
    private fun change(lib: LibraryUsage, newLabel: String = NEW_EN): String =
        if (lib.prevMonthCount == 0) newLabel else "%+.1f%%".format(Locale.ROOT, lib.growthRate)

    /** 마크다운 표 셀에서 `|` 가 열 구분자로 해석되지 않게 한다. */
    private fun cell(text: String): String = text.replace("|", "\\|")
}
