package com.oss.techradar.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "webclient")
data class WebClientProperties(
    val timeout: TimeoutConfig = TimeoutConfig(),
    val github: GitHubConfig = GitHubConfig(),
    val claude: ClaudeConfig = ClaudeConfig(),
) {
    data class TimeoutConfig(
        val connectMs: Long = 5_000,
        val readMs: Long = 30_000,
    )

    data class GitHubConfig(
        val baseUrl: String = "https://api.github.com",
        val token: String = "",
    )

    data class ClaudeConfig(
        val baseUrl: String = "https://api.anthropic.com",
        val apiKey: String = "",
        val model: String = "claude-sonnet-4-6",
    )
}
