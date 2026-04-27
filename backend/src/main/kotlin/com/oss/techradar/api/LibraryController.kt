package com.oss.techradar.api

import com.oss.techradar.api.dto.LibraryRankDto
import com.oss.techradar.api.dto.LibraryTrendDto
import com.oss.techradar.api.dto.PagedResult
import com.oss.techradar.common.ApiResponse
import com.oss.techradar.repository.LibraryUsageRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.YearMonth

@Tag(name = "Libraries", description = "라이브러리 순위 및 트렌드 조회")
@RestController
@RequestMapping("/api/v1/libraries")
class LibraryController(
    private val libraryUsageRepository: LibraryUsageRepository,
) {

    @Operation(
        summary = "라이브러리 순위 조회",
        description = "도메인·월 기준 라이브러리 사용 빈도 순위를 반환합니다. month 형식: YYYY-MM",
    )
    @GetMapping
    fun getLibraries(
        @RequestParam domain: String,
        @RequestParam month: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ApiResponse<PagedResult<LibraryRankDto>> {
        val yearMonth = runCatching { YearMonth.parse(month) }
            .getOrElse { throw IllegalArgumentException("잘못된 month 형식: '$month'. YYYY-MM 형식으로 입력해주세요.") }

        val items = libraryUsageRepository
            .findRankByDomainAndMonth(domain, yearMonth.atDay(1), PageRequest.of(page, size))
            .map { LibraryRankDto.from(it) }

        return ApiResponse.ok(PagedResult(content = items, page = page, size = size))
    }

    @Operation(
        summary = "라이브러리 트렌드 조회",
        description = "특정 라이브러리의 최근 6개월 월별 사용 추이를 반환합니다.",
    )
    @GetMapping("/{name}/trend")
    fun getLibraryTrend(
        @PathVariable name: String,
        @RequestParam domain: String,
    ): ApiResponse<LibraryTrendDto> {
        val all = libraryUsageRepository.findTrendByLibraryAndDomain(name, domain)
        val recent6 = all.takeLast(6)   // 오래된 순 정렬이므로 뒤에서 6개
        return ApiResponse.ok(LibraryTrendDto.from(name, domain, recent6))
    }
}
