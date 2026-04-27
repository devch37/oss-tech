package com.oss.techradar.api

import com.oss.techradar.api.dto.MonthlyReportDto
import com.oss.techradar.api.dto.ReportMetaDto
import com.oss.techradar.claude.ReportGeneratorService
import com.oss.techradar.common.ApiResponse
import com.oss.techradar.repository.MonthlyReportRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.YearMonth

@Tag(name = "Reports", description = "AI 월간 트렌드 리포트 조회 및 생성")
@RestController
@RequestMapping("/api/v1/reports")
class ReportController(
    private val monthlyReportRepository: MonthlyReportRepository,
    private val reportGeneratorService: ReportGeneratorService,
) {

    @Operation(
        summary = "리포트 목록 조회",
        description = "도메인별 리포트 메타 목록을 최신순으로 반환합니다. content는 포함되지 않습니다.",
    )
    @GetMapping
    fun getReports(
        @RequestParam domain: String,
    ): ApiResponse<List<ReportMetaDto>> {
        val metas = monthlyReportRepository
            .findAllByDomainOrderByReportMonthDesc(domain)
            .map { ReportMetaDto.from(it) }
        return ApiResponse.ok(metas)
    }

    @Operation(
        summary = "리포트 상세 조회",
        description = "리포트 ID로 전체 내용(마크다운)을 반환합니다.",
    )
    @GetMapping("/{id}")
    fun getReport(@PathVariable id: Long): ApiResponse<MonthlyReportDto> {
        val report = monthlyReportRepository.findById(id)
            .orElseThrow { NoSuchElementException("리포트를 찾을 수 없습니다: id=$id") }
        return ApiResponse.ok(MonthlyReportDto.from(report))
    }

    @Operation(
        summary = "리포트 수동 생성",
        description = "특정 도메인·월 리포트를 즉시 생성합니다. yearMonth 형식: YYYY-MM. 이미 존재하면 기존 리포트를 반환합니다.",
    )
    @PostMapping("/generate")
    suspend fun generateReport(
        @RequestParam domain: String,
        @RequestParam yearMonth: String,
    ): ApiResponse<MonthlyReportDto> {
        val month = runCatching { YearMonth.parse(yearMonth) }
            .getOrElse { throw IllegalArgumentException("잘못된 yearMonth 형식: '$yearMonth'. YYYY-MM 형식으로 입력해주세요.") }

        val report = reportGeneratorService.generateReport(domain, month)
        return ApiResponse.ok(MonthlyReportDto.from(report))
    }
}
