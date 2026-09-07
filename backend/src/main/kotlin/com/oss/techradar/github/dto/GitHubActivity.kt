package com.oss.techradar.github.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty

/** GET /repos/{owner}/{repo}/pulls?state=closed */
@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubPullRequest(
    @JsonProperty("merged_at") val mergedAt: String? = null,
)

/** GET /repos/{owner}/{repo}/issues?state=closed — pull_request 필드가 있으면 실제로는 PR */
@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubIssue(
    @JsonProperty("pull_request") val pullRequest: Any? = null,
)

/** GET /repos/{owner}/{repo}/contents/{path} */
@JsonIgnoreProperties(ignoreUnknown = true)
data class GitHubContent(
    val content: String? = null,
    val encoding: String? = null,
)
