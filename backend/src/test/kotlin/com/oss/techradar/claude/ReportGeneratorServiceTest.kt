package com.oss.techradar.claude

import com.oss.techradar.claude.dto.ClaudeRequest
import com.oss.techradar.claude.dto.ClaudeResponse
import com.oss.techradar.config.WebClientProperties
import com.oss.techradar.domain.LibraryUsage
import com.oss.techradar.domain.MonthlyReport
import com.oss.techradar.domain.ReportLanguage
import com.oss.techradar.repository.LibraryUsageRepository
import com.oss.techradar.repository.MonthlyReportRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.data.domain.Pageable
import java.time.LocalDateTime
import java.time.YearMonth

class ReportGeneratorServiceTest {

    private val anthropicWebClient: AnthropicWebClient = mockk()
    private val libraryUsageRepository: LibraryUsageRepository = mockk()
    private val monthlyReportRepository: MonthlyReportRepository = mockk()
    private val props = WebClientProperties(
        claude = WebClientProperties.ClaudeConfig(model = "claude-sonnet-4-6"),
    )

    private lateinit var service: ReportGeneratorService

    private val testDomain = "fastapi"
    private val testMonth = YearMonth.of(2026, 3)

    private fun makeLibraryUsage(
        name: String,
        usageCount: Int,
        growthRate: Double,
        prevMonthCount: Int = 0,
    ) = LibraryUsage(
        libraryName = name,
        domain = testDomain,
        collectedMonth = testMonth,
        usageCount = usageCount,
        prevMonthCount = prevMonthCount,
        growthRate = growthRate,
    )

    private fun makeSuccessResponse(text: String) = ClaudeResponse(
        id = "msg_test",
        type = "message",
        role = "assistant",
        content = listOf(ClaudeResponse.ContentBlock(type = "text", text = text)),
        model = "claude-sonnet-4-6",
    )

    @BeforeEach
    fun setUp() {
        service = ReportGeneratorService(
            anthropicWebClient = anthropicWebClient,
            libraryUsageRepository = libraryUsageRepository,
            monthlyReportRepository = monthlyReportRepository,
            props = props,
        )
    }

    @Test
    fun `generateReport - 신규 리포트 정상 생성 및 저장`() = runTest {
        // given
        val libraries = listOf(
            makeLibraryUsage("pydantic", 1240, 5.0, 1180),
            makeLibraryUsage("httpx", 980, 25.0, 784),    // 급상승
            makeLibraryUsage("sqlalchemy", 870, -12.0, 989), // 하락
        )
        val savedReport = MonthlyReport(
            id = 1L,
            domain = testDomain,
            reportMonth = testMonth,
            language = "en",
            content = "# 리포트 내용",
            generatedAt = LocalDateTime.now(),
        )

        every {
            monthlyReportRepository.findByDomainAndReportMonthAndLanguage(testDomain, testMonth, "en")
        } returns null
        every {
            libraryUsageRepository.findRankByDomainAndMonth(testDomain, testMonth, any())
        } returns libraries
        coEvery { anthropicWebClient.sendMessage(any()) } returns makeSuccessResponse("# 리포트 내용")
        every { monthlyReportRepository.save(any()) } returns savedReport

        // when
        val result = service.generateReport(testDomain, testMonth)

        // then
        assertEquals(1L, result.id)
        coVerify(exactly = 1) { anthropicWebClient.sendMessage(any()) }
        coVerify(exactly = 1) { monthlyReportRepository.save(any()) }
    }

    @Test
    fun `generateReport - 이미 존재하면 Claude 호출 없이 기존 리포트 반환`() = runTest {
        // given
        val existing = MonthlyReport(
            id = 99L,
            domain = testDomain,
            reportMonth = testMonth,
            language = "en",
            content = "기존 리포트",
            generatedAt = LocalDateTime.now().minusDays(1),
        )
        every {
            monthlyReportRepository.findByDomainAndReportMonthAndLanguage(testDomain, testMonth, "en")
        } returns existing

        // when
        val result = service.generateReport(testDomain, testMonth)

        // then: Claude API 미호출
        assertEquals(99L, result.id)
        coVerify(exactly = 0) { anthropicWebClient.sendMessage(any()) }
        coVerify(exactly = 0) { monthlyReportRepository.save(any()) }
    }

    @Test
    fun `generateReport - 프롬프트에 도메인·월·라이브러리명 포함 확인`() = runTest {
        // given
        val libraries = listOf(
            makeLibraryUsage("pydantic", 1240, 25.0, 990),
            makeLibraryUsage("httpx", 980, 5.0, 933),
        )
        val requestSlot = slot<ClaudeRequest>()

        every {
            monthlyReportRepository.findByDomainAndReportMonthAndLanguage(any(), any(), any())
        } returns null
        every {
            libraryUsageRepository.findRankByDomainAndMonth(any(), any(), any())
        } returns libraries
        coEvery { anthropicWebClient.sendMessage(capture(requestSlot)) } returns makeSuccessResponse("내용")
        every { monthlyReportRepository.save(any()) } returnsArgument 0

        // when
        service.generateReport(testDomain, testMonth)

        // then: 프롬프트 내용 검증
        val prompt = requestSlot.captured.messages.first().content
        assertTrue(prompt.contains("fastapi"), "프롬프트에 도메인 포함")
        assertTrue(prompt.contains("2026-03"), "프롬프트에 월 포함")
        assertTrue(prompt.contains("pydantic"), "프롬프트에 라이브러리명 포함")
    }

    @Test
    fun `generateReport - 급상승 라이브러리가 프롬프트에 섹션으로 포함`() = runTest {
        // given: growthRate 25.0 → 급상승 (≥20%), growthRate 5.0 → 일반
        val libraries = listOf(
            makeLibraryUsage("uvicorn", 500, 25.0, 400),
            makeLibraryUsage("starlette", 300, 5.0, 286),
        )
        val requestSlot = slot<ClaudeRequest>()

        every { monthlyReportRepository.findByDomainAndReportMonthAndLanguage(any(), any(), any()) } returns null
        every { libraryUsageRepository.findRankByDomainAndMonth(any(), any(), any()) } returns libraries
        coEvery { anthropicWebClient.sendMessage(capture(requestSlot)) } returns makeSuccessResponse("내용")
        every { monthlyReportRepository.save(any()) } returnsArgument 0

        // when
        service.generateReport(testDomain, testMonth, ReportLanguage.KO)

        // then
        val prompt = requestSlot.captured.messages.first().content
        assertTrue(prompt.contains("급상승"), "급상승 섹션 존재")
        assertTrue(prompt.contains("uvicorn"), "급상승 라이브러리명 포함")
        assertFalse(
            prompt.substringAfter("급상승").contains("starlette"),
            "일반 라이브러리는 급상승 섹션에 미포함",
        )
    }

    @Test
    fun `generateReport - 기본 언어는 영어이며 영어 프롬프트 사용`() = runTest {
        val libraries = listOf(
            makeLibraryUsage("uvicorn", 500, 25.0, 400),
            makeLibraryUsage("starlette", 300, 5.0, 286),
        )
        val requestSlot = slot<ClaudeRequest>()

        every { monthlyReportRepository.findByDomainAndReportMonthAndLanguage(any(), any(), any()) } returns null
        every { libraryUsageRepository.findRankByDomainAndMonth(any(), any(), any()) } returns libraries
        coEvery { anthropicWebClient.sendMessage(capture(requestSlot)) } returns makeSuccessResponse("content")
        every { monthlyReportRepository.save(any()) } returnsArgument 0

        service.generateReport(testDomain, testMonth)

        val request = requestSlot.captured
        val prompt = request.messages.first().content
        assertTrue(prompt.contains("Rising libraries"), "영어 급상승 섹션")
        assertTrue(request.system.contains("English"), "시스템 프롬프트가 영어 작성을 지시")
        assertFalse(prompt.contains("급상승"), "영어 프롬프트에 한국어 섹션명 없음")
    }

    @Test
    fun `generateReport - 한국어 요청은 한국어 시스템 프롬프트와 ko 언어로 저장`() = runTest {
        val savedSlot = slot<MonthlyReport>()

        every { monthlyReportRepository.findByDomainAndReportMonthAndLanguage(testDomain, testMonth, "ko") } returns null
        every { libraryUsageRepository.findRankByDomainAndMonth(any(), any(), any()) } returns emptyList()
        val requestSlot = slot<ClaudeRequest>()
        coEvery { anthropicWebClient.sendMessage(capture(requestSlot)) } returns makeSuccessResponse("내용")
        every { monthlyReportRepository.save(capture(savedSlot)) } returnsArgument 0

        service.generateReport(testDomain, testMonth, ReportLanguage.KO)

        assertTrue(requestSlot.captured.system.contains("한국어"), "시스템 프롬프트가 한국어 작성을 지시")
        assertEquals("ko", savedSlot.captured.language)
    }

    @Test
    fun `generateReport - 같은 월이라도 언어가 다르면 별도로 생성`() = runTest {
        val enExisting = MonthlyReport(
            id = 1L, domain = testDomain, reportMonth = testMonth, language = "en",
            content = "existing en", generatedAt = LocalDateTime.now(),
        )
        every { monthlyReportRepository.findByDomainAndReportMonthAndLanguage(testDomain, testMonth, "en") } returns enExisting
        every { monthlyReportRepository.findByDomainAndReportMonthAndLanguage(testDomain, testMonth, "ko") } returns null
        every { libraryUsageRepository.findRankByDomainAndMonth(any(), any(), any()) } returns emptyList()
        coEvery { anthropicWebClient.sendMessage(any()) } returns makeSuccessResponse("한국어 본문")
        every { monthlyReportRepository.save(any()) } returnsArgument 0

        // en은 이미 있으므로 Claude 호출 없음
        assertEquals(1L, service.generateReport(testDomain, testMonth, ReportLanguage.EN).id)
        coVerify(exactly = 0) { anthropicWebClient.sendMessage(any()) }

        // ko는 없으므로 새로 생성
        assertEquals("ko", service.generateReport(testDomain, testMonth, ReportLanguage.KO).language)
        coVerify(exactly = 1) { anthropicWebClient.sendMessage(any()) }
    }
}
