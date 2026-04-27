package com.oss.techradar.api.dto

import com.oss.techradar.domain.ActiveLevelScore
import java.time.LocalDateTime

data class ActiveLevelScoreDto(
    val id: Long,
    val repositoryId: Long,
    val repoFullName: String,
    val domain: String,
    val score: Double,
    val commits30d: Int,
    val prsMerged30d: Int,
    val issuesClosed30d: Int,
    val calculatedAt: LocalDateTime,
) {
    companion object {
        fun from(entity: ActiveLevelScore): ActiveLevelScoreDto = ActiveLevelScoreDto(
            id = entity.id,
            repositoryId = entity.repository.id,
            repoFullName = "${entity.repository.owner}/${entity.repository.name}",
            domain = entity.repository.domain,
            score = entity.score,
            commits30d = entity.commits30d,
            prsMerged30d = entity.prsMerged30d,
            issuesClosed30d = entity.issuesClosed30d,
            calculatedAt = entity.calculatedAt,
        )
    }
}
