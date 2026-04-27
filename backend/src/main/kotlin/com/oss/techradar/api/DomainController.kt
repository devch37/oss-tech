package com.oss.techradar.api

import com.oss.techradar.api.dto.DomainSummaryDto
import com.oss.techradar.common.ApiResponse
import com.oss.techradar.repository.GithubRepoRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Domains", description = "수집된 도메인 목록 조회")
@RestController
@RequestMapping("/api/v1/domains")
class DomainController(
    private val githubRepoRepository: GithubRepoRepository,
) {

    @Operation(summary = "도메인 목록 조회", description = "수집된 도메인별 레포지토리 수를 반환합니다.")
    @GetMapping
    fun getDomains(): ApiResponse<List<DomainSummaryDto>> {
        val summaries = githubRepoRepository.findDomainSummaries()
            .map { DomainSummaryDto(domain = it.domain, repositoryCount = it.repositoryCount) }
        return ApiResponse.ok(summaries)
    }
}
