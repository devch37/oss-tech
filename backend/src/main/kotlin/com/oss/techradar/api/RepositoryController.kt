package com.oss.techradar.api

import com.oss.techradar.api.dto.PagedResult
import com.oss.techradar.api.dto.RepositoryWithScoreDto
import com.oss.techradar.common.ApiResponse
import com.oss.techradar.repository.ActiveLevelScoreRepository
import com.oss.techradar.repository.GithubRepoRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Repositories", description = "GitHub 레포지토리 목록 조회")
@RestController
@RequestMapping("/api/v1/repositories")
class RepositoryController(
    private val githubRepoRepository: GithubRepoRepository,
    private val activeLevelScoreRepository: ActiveLevelScoreRepository,
) {

    @Operation(
        summary = "레포지토리 목록 조회",
        description = "도메인별 레포지토리 목록. sort=score(기본) 또는 sort=stars 선택 가능.",
    )
    @Transactional(readOnly = true)   // LAZY 로딩(repository 필드) 트랜잭션 보장
    @GetMapping
    fun getRepositories(
        @RequestParam domain: String,
        @RequestParam(defaultValue = "score") sort: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ApiResponse<PagedResult<RepositoryWithScoreDto>> {
        val pageable = PageRequest.of(page, size)

        val items = when (sort) {
            "score" -> activeLevelScoreRepository
                .findLatestTopByDomain(domain, pageable)
                .map { RepositoryWithScoreDto.from(it) }      // ActiveLevelScore → DTO

            "stars" -> githubRepoRepository
                .findTopByDomainOrderByStars(domain, pageable)
                .content
                .map { RepositoryWithScoreDto.from(it) }      // GithubRepository → DTO (score=null)

            else -> throw IllegalArgumentException("지원하지 않는 sort 값: '$sort'. 'score' 또는 'stars'를 사용하세요.")
        }

        return ApiResponse.ok(PagedResult(content = items, page = page, size = size))
    }
}
