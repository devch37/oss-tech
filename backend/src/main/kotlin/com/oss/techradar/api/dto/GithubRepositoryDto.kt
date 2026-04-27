package com.oss.techradar.api.dto

import com.oss.techradar.domain.GithubRepository
import java.time.LocalDateTime

data class GithubRepositoryDto(
    val id: Long,
    val owner: String,
    val name: String,
    val fullName: String,
    val domain: String,
    val stars: Int,
    val forks: Int,
    val language: String?,
    val lastPushedAt: LocalDateTime?,
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun from(entity: GithubRepository): GithubRepositoryDto = GithubRepositoryDto(
            id = entity.id,
            owner = entity.owner,
            name = entity.name,
            fullName = "${entity.owner}/${entity.name}",
            domain = entity.domain,
            stars = entity.stars,
            forks = entity.forks,
            language = entity.language,
            lastPushedAt = entity.lastPushedAt,
            updatedAt = entity.updatedAt,
        )
    }
}
