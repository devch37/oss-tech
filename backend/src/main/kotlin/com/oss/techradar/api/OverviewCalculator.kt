package com.oss.techradar.api

import com.oss.techradar.api.dto.DomainOverviewDto
import com.oss.techradar.api.dto.LanguageShareDto
import com.oss.techradar.api.dto.LevelCountsDto
import com.oss.techradar.api.dto.OverviewDto
import com.oss.techradar.api.dto.RepositoryWithScoreDto
import com.oss.techradar.api.dto.TopLibraryDto
import com.oss.techradar.api.dto.TotalsDto

/** 도메인 하나의 라이브러리 집계 요약 */
data class DomainLibraries(val count: Int, val top: TopLibraryDto?)

/**
 * 레포 목록(최신 활동 점수 포함)과 라이브러리 요약에서 대시보드 수치를 계산한다.
 * DB·Spring 에 의존하지 않는 순수 함수라 단위 테스트가 쉽다.
 */
object OverviewCalculator {
    const val TOP_REPOSITORIES = 10
    const val HIDDEN_GEMS = 6
    const val MAX_GEMS_PER_DOMAIN = 2
    const val TOP_LANGUAGES = 8

    /** 프론트 등급 기준(GRADE_THRESHOLDS)과 같다: S ≥ 50, A ≥ 20, B ≥ 5, 나머지 C */
    private const val LEVEL_S = 50.0
    private const val LEVEL_A = 20.0
    private const val LEVEL_B = 5.0

    /** "활발하다"의 최소 기준 — 등급 A 이상 */
    private const val GEM_MIN_SCORE = LEVEL_A

    fun build(
        repositories: List<RepositoryWithScoreDto>,
        librariesByDomain: Map<String, DomainLibraries>,
        domainOrder: List<String>,
        libraryMonth: String?,
    ): OverviewDto {
        val byDomain = repositories.groupBy { it.domain }

        // 같은 레포가 두 분야(예: frontend + mobile)에 걸려 있으면 분야별 표에는 각각 나오지만,
        // 전체 합계·순위·언어·등급 분포에서는 한 번만 센다 (활동 점수가 높은 쪽을 남김).
        val unique = repositories.sortedByDescending { it.score ?: 0.0 }.distinctBy { it.fullName }

        val domains = domainOrder.map { domain ->
            val repos = byDomain[domain].orEmpty()
            val libs = librariesByDomain[domain]
            DomainOverviewDto(
                domain = domain,
                repositoryCount = repos.size,
                totalStars = repos.sumOf { it.stars.toLong() },
                commits30d = repos.sumOf { it.commits30d ?: 0 },
                prsMerged30d = repos.sumOf { it.prsMerged30d ?: 0 },
                levels = levelCounts(repos),
                topRepository = repos.maxByOrNull { it.score ?: 0.0 }?.takeIf { (it.score ?: 0.0) > 0.0 },
                libraryCount = libs?.count ?: 0,
                topLibrary = libs?.top,
            )
        }

        return OverviewDto(
            totals = TotalsDto(
                repositories = unique.size,
                stars = unique.sumOf { it.stars.toLong() },
                commits30d = unique.sumOf { it.commits30d ?: 0 },
                prsMerged30d = unique.sumOf { it.prsMerged30d ?: 0 },
                libraries = domains.sumOf { it.libraryCount },
            ),
            domains = domains,
            topRepositories = unique
                .filter { (it.score ?: 0.0) > 0.0 }
                .sortedByDescending { it.score }
                .take(TOP_REPOSITORIES),
            hiddenGems = hiddenGems(byDomain),
            languages = languages(unique),
            levels = levelCounts(unique),
            libraryMonth = libraryMonth,
        )
    }

    fun levelCounts(repositories: List<RepositoryWithScoreDto>): LevelCountsDto {
        var s = 0; var a = 0; var b = 0; var c = 0
        repositories.forEach {
            val score = it.score ?: return@forEach // 점수가 없는 레포는 등급에 넣지 않는다
            when {
                score >= LEVEL_S -> s++
                score >= LEVEL_A -> a++
                score >= LEVEL_B -> b++
                else -> c++
            }
        }
        return LevelCountsDto(s, a, b, c)
    }

    /**
     * 도메인 안에서 스타가 중앙값 이하인데 활동 등급이 A 이상인 레포.
     * 한 도메인이 목록을 독차지하지 않게 도메인당 [MAX_GEMS_PER_DOMAIN]개까지만 넣는다.
     */
    fun hiddenGems(byDomain: Map<String, List<RepositoryWithScoreDto>>): List<RepositoryWithScoreDto> =
        byDomain.values
            .flatMap { repos ->
                if (repos.size < 4) return@flatMap emptyList() // 비교할 표본이 너무 적으면 "덜 알려졌다"는 말이 의미 없다
                val medianStars = repos.map { it.stars }.sorted().let { it[it.size / 2] }
                repos
                    .filter { (it.score ?: 0.0) >= GEM_MIN_SCORE && it.stars <= medianStars }
                    .sortedByDescending { it.score }
                    .take(MAX_GEMS_PER_DOMAIN)
            }
            .sortedByDescending { it.score }
            .distinctBy { it.fullName }
            .take(HIDDEN_GEMS)

    fun languages(repositories: List<RepositoryWithScoreDto>): List<LanguageShareDto> =
        repositories
            .mapNotNull { it.language?.takeIf { l -> l.isNotBlank() } }
            .groupingBy { it }
            .eachCount()
            .entries
            .sortedWith(compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key })
            .take(TOP_LANGUAGES)
            .map { LanguageShareDto(it.key, it.value) }
}
