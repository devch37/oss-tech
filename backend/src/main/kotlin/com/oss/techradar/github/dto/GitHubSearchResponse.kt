package com.oss.techradar.github.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubSearchResponse(
    @JsonProperty("total_count") val totalCount: Int = 0,
    val items: List<GitHubSearchItem> = emptyList(),
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubSearchItem(
    val name: String,
    val owner: GitHubOwner,
    @JsonProperty("stargazers_count") val stargazersCount: Int = 0,
    @JsonProperty("forks_count") val forksCount: Int = 0,
    val language: String? = null,
    @JsonProperty("pushed_at") val pushedAt: String? = null,
    @JsonProperty("default_branch") val defaultBranch: String? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubOwner(
    val login: String,
)
