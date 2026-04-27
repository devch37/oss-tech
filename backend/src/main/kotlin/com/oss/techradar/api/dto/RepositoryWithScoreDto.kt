package com.oss.techradar.api.dto

import com.oss.techradar.domain.ActiveLevelScore
import com.oss.techradar.domain.GithubRepository

/** GithubRepository + ActiveLevelScore 조인 응답 */
data class RepositoryWithScoreDto(
    val id: Long,
    val owner: String,
    val name: String,
    val fullName: String,
    val domain: String,
    val stars: Int,
    val forks: Int,
    val language: String?,
    val score: Double?,
    val commits30d: Int?,
    val prsMerged30d: Int?,
    val issuesClosed30d: Int?,
) {
    companion object {
        /** ActiveLevelScore 엔티티 기반 (score 포함) */
        fun from(entity: ActiveLevelScore): RepositoryWithScoreDto = RepositoryWithScoreDto(
            id = entity.repository.id,
            owner = entity.repository.owner,
            name = entity.repository.name,
            fullName = "${entity.repository.owner}/${entity.repository.name}",
            domain = entity.repository.domain,
            stars = entity.repository.stars,
            forks = entity.repository.forks,
            language = entity.repository.language,
            score = entity.score,
            commits30d = entity.commits30d,
            prsMerged30d = entity.prsMerged30d,
            issuesClosed30d = entity.issuesClosed30d,
        )

        /** GithubRepository 엔티티 기반 (score 없음, stars 정렬 시) */
        fun from(entity: GithubRepository): RepositoryWithScoreDto = RepositoryWithScoreDto(
            id = entity.id,
            owner = entity.owner,
            name = entity.name,
            fullName = "${entity.owner}/${entity.name}",
            domain = entity.domain,
            stars = entity.stars,
            forks = entity.forks,
            language = entity.language,
            score = null,
            commits30d = null,
            prsMerged30d = null,
            issuesClosed30d = null,
        )
    }
}
