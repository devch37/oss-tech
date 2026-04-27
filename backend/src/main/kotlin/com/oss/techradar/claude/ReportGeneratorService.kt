package com.oss.techradar.claude

import com.oss.techradar.claude.dto.ClaudeRequest
import com.oss.techradar.config.WebClientProperties
import com.oss.techradar.domain.LibraryUsage
import com.oss.techradar.domain.MonthlyReport
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
     * 특정 도메인·월의 리포트를 생성하고 저장한다.
     * 이미 존재하면 기존 레코드를 반환한다.
     */
    @Transactional
    suspend fun generateReport(domain: String, month: YearMonth): MonthlyReport {
        // 1. 중복 생성 방지
        monthlyReportRepository.findByDomainAndReportMonth(domain, month.atDay(1))
            ?.let { return it }

        // 2. 집계 데이터 조회
        val top20 = libraryUsageRepository.findRankByDomainAndMonth(
            domain = domain,
            collectedMonth = month.atDay(1),
            pageable = PageRequest.of(0, 20),
        )
        val rising   = top20.filter { it.growthRate >= 20.0 }
        val declining = top20.filter { it.growthRate <= -10.0 }

        // 3. 프롬프트 구성 + Claude API 호출
        val prompt = buildPrompt(domain, month, top20, rising, declining)
        val request = ClaudeRequest(
            model = props.claude.model,
            maxTokens = 4096,
            system = SYSTEM_PROMPT,
            messages = listOf(ClaudeRequest.Message(role = "user", content = prompt)),
        )
        val content = anthropicWebClient.sendMessage(request).extractText()

        log.info("[$domain] $month 리포트 생성 완료 (${content.length}자)")

        // 4. DB 저장
        return monthlyReportRepository.save(
            MonthlyReport(
                domain = domain,
                reportMonth = month,
                content = content,
                generatedAt = LocalDateTime.now(),
            )
        )
    }

    /**
     * 매월 1일 오전 9시 — 전월 데이터로 모든 도메인 리포트 자동 생성.
     * @Scheduled 는 suspend 불가 → reportScope.launch 로 위임.
     */
    @Scheduled(cron = "0 0 9 1 * *")
    fun scheduledGenerate() {
        val prevMonth = YearMonth.now().minusMonths(1)
        reportScope.launch {
            DEFAULT_DOMAINS.forEach { domain ->
                runCatching { generateReport(domain, prevMonth) }
                    .onSuccess { log.info("[$domain] $prevMonth 리포트 생성 완료") }
                    .onFailure { log.error("[$domain] 리포트 생성 실패", it) }
            }
        }
    }

    // ─── 프롬프트 빌더 ────────────────────────────────────────

    private fun buildPrompt(
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
            val arrow = when {
                lib.growthRate >= 20.0  -> "🚀"
                lib.growthRate <= -10.0 -> "⚠️"
                else                    -> "  "
            }
            appendLine("${i + 1}. $arrow ${lib.libraryName} — ${lib.usageCount}개 레포 (${growth}%)")
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

    companion object {
        val DEFAULT_DOMAINS = listOf("fastapi", "nextjs", "spring-boot", "react", "vue")

        private val SYSTEM_PROMPT = """
            당신은 10년 경력의 시니어 백엔드 개발자입니다.
            매달 팀에게 오픈소스 트렌드를 공유하는 역할을 맡고 있습니다.
            친근하면서도 인사이트 있는 톤으로 한국어 마크다운 리포트를 작성해주세요.
            숫자 데이터를 단순 나열하지 말고, 왜 이 라이브러리가 주목받는지 맥락을 설명해주세요.
        """.trimIndent()
    }
}
