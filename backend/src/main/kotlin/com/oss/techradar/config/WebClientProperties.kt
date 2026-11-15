package com.oss.techradar.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "webclient")
data class WebClientProperties(
    val timeout: TimeoutConfig = TimeoutConfig(),
    val github: GitHubConfig = GitHubConfig(),
    val claude: ClaudeConfig = ClaudeConfig(),
    val openai: OpenAiConfig = OpenAiConfig(),
) {
    data class TimeoutConfig(
        val connectMs: Long = 5_000,
        val readMs: Long = 30_000,
    )

    data class GitHubConfig(
        val baseUrl: String = "https://api.github.com",
        val token: String = "",
    )

    /** OpenAI Responses API (POST /v1/responses) 설정 */
    data class OpenAiConfig(
        val baseUrl: String = "https://api.openai.com",
        val apiKey: String = "",
        val model: String = "gpt-5-mini",
        /** 추론(reasoning) 토큰도 이 한도에 포함된다. 과금은 실제 생성한 토큰만큼이므로 한도를 넉넉히 둬도 비용이 늘지 않는다. */
        val maxOutputTokens: Int = 16_000,
        /** none/minimal/low/medium/high 등 (모델마다 지원 값이 다름). 비우면 모델 기본값을 쓴다. */
        val reasoningEffort: String = "",
        /** 추론 모델은 응답이 느려 일반 API 타임아웃(30초)으로는 끊긴다. */
        val readTimeoutMs: Long = 180_000,
        /** 일시적 오류(429 rate limit, 5xx) 후 재시도 대기 */
        val retryDelayMs: Long = 2_000,
    )

    data class ClaudeConfig(
        val baseUrl: String = "https://api.anthropic.com",
        val apiKey: String = "",
        val model: String = "claude-sonnet-4-6",
    )
}
