package com.oss.techradar.api.dto

/** GET /api/v1/overview — 모든 도메인을 한 화면에 보여주는 대시보드용 집계 */
data class OverviewDto(
    val totals: TotalsDto,
    val domains: List<DomainOverviewDto>,
    /** 전 도메인 통틀어 활동량 상위 레포 */
    val topRepositories: List<RepositoryWithScoreDto>,
    /** 스타는 많지 않은데 활동이 활발한 레포 ("아직 덜 알려진 활발한 프로젝트") */
    val hiddenGems: List<RepositoryWithScoreDto>,
    val languages: List<LanguageShareDto>,
    val levels: LevelCountsDto,
    /** 라이브러리 수·순위의 기준 월 ("YYYY-MM"). 이번 달 집계가 없으면 지난달. 데이터가 없으면 null. */
    val libraryMonth: String?,
)

data class TotalsDto(
    val repositories: Int,
    val stars: Long,
    val commits30d: Int,
    val prsMerged30d: Int,
    val libraries: Int,
)

data class DomainOverviewDto(
    val domain: String,
    val repositoryCount: Int,
    val totalStars: Long,
    val commits30d: Int,
    val prsMerged30d: Int,
    val levels: LevelCountsDto,
    val topRepository: RepositoryWithScoreDto?,
    val libraryCount: Int,
    val topLibrary: TopLibraryDto?,
)

data class TopLibraryDto(val name: String, val usageCount: Int)

data class LanguageShareDto(val language: String, val count: Int)

/** 활동 등급별 레포 수 (S 매우 활발 · A 활발 · B 보통 · C 낮음) */
data class LevelCountsDto(val s: Int = 0, val a: Int = 0, val b: Int = 0, val c: Int = 0)
