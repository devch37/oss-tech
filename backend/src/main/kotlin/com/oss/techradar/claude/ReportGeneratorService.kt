package com.oss.techradar.claude

import com.oss.techradar.claude.dto.ClaudeRequest
import com.oss.techradar.config.WebClientProperties
import com.oss.techradar.crawler.CrawlDomains
import com.oss.techradar.domain.LibraryUsage
import com.oss.techradar.domain.MonthlyReport
import com.oss.techradar.domain.ReportLanguage
import com.oss.techradar.repository.LibraryUsageRepository
import com.oss.techradar.repository.MonthlyReportRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.YearMonth

@Service
class ReportGeneratorService(
    private val anthropicWebClient: AnthropicWebClient,
    private val libraryUsageRepository: LibraryUsageRepository,
    private val monthlyReportRepository: MonthlyReportRepository,
    private val props: WebClientProperties,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val reportScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /**
     * 특정 도메인·월·언어의 리포트를 생성하고 저장한다.
     * 이미 존재하면 기존 레코드를 반환한다.
     */
    @Transactional
    suspend fun generateReport(
        domain: String,
        month: YearMonth,
        language: ReportLanguage = ReportLanguage.EN,
    ): MonthlyReport {
        // 1. 중복 생성 방지 (도메인·월·언어 단위)
        monthlyReportRepository.findByDomainAndReportMonthAndLanguage(domain, month, language.code)
            ?.let { return it }

        // 2. 집계 데이터 조회
        val top20 = libraryUsageRepository.findRankByDomainAndMonth(
            domain = domain,
            collectedMonth = month,
            pageable = PageRequest.of(0, 20),
        )
        val rising   = top20.filter { it.growthRate >= 20.0 }
        val declining = top20.filter { it.growthRate <= -10.0 }

        // 3. 프롬프트 구성 + Claude API 호출
        val prompt = buildPrompt(language, domain, month, top20, rising, declining)
        val request = ClaudeRequest(
            model = props.claude.model,
            maxTokens = 4096,
            system = systemPromptFor(language),
            messages = listOf(ClaudeRequest.Message(role = "user", content = prompt)),
        )
        val content = anthropicWebClient.sendMessage(request).extractText()

        log.info("[$domain] $month (${language.code}) 리포트 생성 완료 (${content.length}자)")

        // 4. DB 저장
        return monthlyReportRepository.save(
            MonthlyReport(
                domain = domain,
                reportMonth = month,
                language = language.code,
                content = content,
                generatedAt = LocalDateTime.now(),
            )
        )
    }

    /**
     * 매월 1일 오전 9시 — 전월 데이터로 모든 도메인 × 모든 언어 리포트 자동 생성.
     * @Scheduled 는 suspend 불가 → reportScope.launch 로 위임.
     * 한 조합이 실패해도 나머지는 계속 생성한다.
     */
    @Scheduled(cron = "0 0 9 1 * *")
    fun scheduledGenerate() {
        val prevMonth = YearMonth.now().minusMonths(1)
        reportScope.launch {
            DEFAULT_DOMAINS.forEach { domain ->
                ReportLanguage.entries.forEach { language ->
                    runCatching { generateReport(domain, prevMonth, language) }
                        .onSuccess { log.info("[$domain] $prevMonth (${language.code}) 리포트 생성 완료") }
                        .onFailure { log.error("[$domain] ${language.code} 리포트 생성 실패", it) }
                }
            }
        }
    }

    // ─── 프롬프트 빌더 ────────────────────────────────────────

    private fun systemPromptFor(language: ReportLanguage): String = when (language) {
        ReportLanguage.KO -> SYSTEM_PROMPT_KO
        ReportLanguage.EN -> SYSTEM_PROMPT_EN
    }

    private fun buildPrompt(
        language: ReportLanguage,
        domain: String,
        month: YearMonth,
        top: List<LibraryUsage>,
        rising: List<LibraryUsage>,
        declining: List<LibraryUsage>,
    ): String = when (language) {
        ReportLanguage.KO -> buildPromptKo(domain, month, top, rising, declining)
        ReportLanguage.EN -> buildPromptEn(domain, month, top, rising, declining)
    }

    private fun buildPromptKo(
        domain: String,
        month: YearMonth,
        top: List<LibraryUsage>,
        rising: List<LibraryUsage>,
        declining: List<LibraryUsage>,
    ): String = buildString {
        appendLine("**분석 도메인**: $domain | **분석 월**: $month")
        appendLine()
        appendLine("### 전체 순위 TOP ${top.size} (레포 사용 수 기준)")
        top.forEachIndexed { i, lib ->
            val growth = "%.1f".format(lib.growthRate)
            appendLine("${i + 1}. ${trendMarker(lib)} ${lib.libraryName} — ${lib.usageCount}개 레포 (${growth}%)")
        }
        if (rising.isNotEmpty()) {
            appendLine()
            appendLine("### 🚀 급상승 라이브러리 (growthRate ≥ 20%)")
            rising.take(10).forEach { lib ->
                appendLine("- ${lib.libraryName}: ${"%.1f".format(lib.growthRate)}% ↑  (현재 ${lib.usageCount}개, 전월 ${lib.prevMonthCount}개)")
            }
        }
        if (declining.isNotEmpty()) {
            appendLine()
            appendLine("### ⚠️ 하락 라이브러리 (growthRate ≤ −10%)")
            declining.take(10).forEach { lib ->
                appendLine("- ${lib.libraryName}: ${"%.1f".format(lib.growthRate)}% ↓  (현재 ${lib.usageCount}개, 전월 ${lib.prevMonthCount}개)")
            }
        }
        appendLine()
        appendLine("위 데이터를 기반으로 아래 5개 섹션으로 구성된 마크다운 리포트를 작성해주세요.")
        appendLine("각 섹션에서 숫자를 단순 나열하지 말고, 기술적 맥락과 인사이트를 함께 설명해주세요.")
        appendLine()
        appendLine("## 리포트 섹션 구성")
        appendLine("1. **이번 달 한 줄 요약** — $domain 생태계의 이번 달 핵심 트렌드 한 문장")
        appendLine("2. **🚀 급상승 라이브러리 TOP 3** — 왜 주목받는지 기술적 이유 포함")
        appendLine("3. **📊 전체 순위표** — 마크다운 테이블 형식")
        appendLine("4. **⚠️ 주의 깊게 볼 변화** — 하락 라이브러리, 패러다임 변화 신호")
        appendLine("5. **다음 달 예측** — 현재 트렌드 기반 예측 (1~2개 키워드 중심)")
    }

    private fun buildPromptEn(
        domain: String,
        month: YearMonth,
        top: List<LibraryUsage>,
        rising: List<LibraryUsage>,
        declining: List<LibraryUsage>,
    ): String = buildString {
        appendLine("**Domain**: $domain | **Month**: $month")
        appendLine()
        appendLine("### Overall ranking, top ${top.size} (by number of repositories using each library)")
        top.forEachIndexed { i, lib ->
            val growth = "%.1f".format(lib.growthRate)
            appendLine("${i + 1}. ${trendMarker(lib)} ${lib.libraryName} — ${lib.usageCount} repos (${growth}%)")
        }
        if (rising.isNotEmpty()) {
            appendLine()
            appendLine("### 🚀 Rising libraries (growthRate ≥ 20%)")
            rising.take(10).forEach { lib ->
                appendLine("- ${lib.libraryName}: ${"%.1f".format(lib.growthRate)}% ↑  (now ${lib.usageCount} repos, last month ${lib.prevMonthCount})")
            }
        }
        if (declining.isNotEmpty()) {
            appendLine()
            appendLine("### ⚠️ Declining libraries (growthRate ≤ −10%)")
            declining.take(10).forEach { lib ->
                appendLine("- ${lib.libraryName}: ${"%.1f".format(lib.growthRate)}% ↓  (now ${lib.usageCount} repos, last month ${lib.prevMonthCount})")
            }
        }
        appendLine()
        appendLine("Using the data above, write a markdown report in English with exactly the five sections below.")
        appendLine("In every section, explain the technical context and what it means instead of just listing numbers.")
        appendLine()
        appendLine("## Report sections")
        appendLine("1. **One-line summary** — the single most important trend in the $domain ecosystem this month")
        appendLine("2. **🚀 Top 3 rising libraries** — why each one is gaining traction, with technical reasons")
        appendLine("3. **📊 Full ranking** — a markdown table")
        appendLine("4. **⚠️ Changes worth watching** — declining libraries and signs of a paradigm shift")
        appendLine("5. **Next month outlook** — a prediction built on the current trend, centered on 1–2 keywords")
    }

    private fun trendMarker(lib: LibraryUsage): String = when {
        lib.growthRate >= 20.0  -> "🚀"
        lib.growthRate <= -10.0 -> "⚠️"
        else                    -> "  "
    }

    companion object {
        // 크롤러가 수집하는 도메인(frontend/backend/devops/mobile/data/security)과 동일하게 유지
        val DEFAULT_DOMAINS = CrawlDomains.TOPIC_BY_DOMAIN.keys.toList()

        private val SYSTEM_PROMPT_KO = """
            당신은 10년 경력의 시니어 백엔드 개발자입니다.
            매달 팀에게 오픈소스 트렌드를 공유하는 역할을 맡고 있습니다.
            친근하면서도 인사이트 있는 톤으로 한국어 마크다운 리포트를 작성해주세요.
            숫자 데이터를 단순 나열하지 말고, 왜 이 라이브러리가 주목받는지 맥락을 설명해주세요.
        """.trimIndent()

        private val SYSTEM_PROMPT_EN = """
            You are a senior software engineer with ten years of experience.
            Every month you share open-source trends with your team.
            Write the report in English, as markdown, in a friendly but insightful tone.
            Don't just list numbers — explain the context behind why each library is gaining or losing attention.
        """.trimIndent()
    }
}
