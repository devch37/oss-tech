package com.oss.techradar.config

import io.netty.channel.ChannelOption
import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.WebClient
import reactor.netty.http.client.HttpClient
import java.time.Duration

@Configuration
@EnableConfigurationProperties(WebClientProperties::class)
class WebClientConfig(private val props: WebClientProperties) {

    private val log = LoggerFactory.getLogger(javaClass)

    @Bean("gitHubWebClient")
    fun gitHubWebClient(): WebClient {
        val builder = WebClient.builder()
            .baseUrl(props.github.baseUrl)
            .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
            .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
            .clientConnector(buildConnector())
            // 기본 256KB 로는 /pulls?per_page=100 (PR 본문 포함, 수 MB) 응답을 읽지 못한다 (DataBufferLimitException)
            .codecs { it.defaultCodecs().maxInMemorySize(GITHUB_MAX_IN_MEMORY_BYTES) }

        val authorization = githubAuthorization(props.github.token)
        if (authorization != null) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, authorization)
        } else {
            log.warn(
                "GITHUB_TOKEN 이 비어 있거나 자리표시자라 인증 없이 GitHub API 를 호출합니다. " +
                    "한도가 매우 낮아(core 60회/시간, search 10회/분) 크롤링이 중간에 실패할 수 있습니다.",
            )
        }
        return builder.build()
    }

    @Bean("claudeWebClient")
    fun claudeWebClient(): WebClient = WebClient.builder()
        .baseUrl(props.claude.baseUrl)
        .defaultHeader("x-api-key", props.claude.apiKey)
        .defaultHeader("anthropic-version", "2023-06-01")
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .clientConnector(buildConnector())
        .build()

    @Bean("openAiWebClient")
    fun openAiWebClient(): WebClient {
        val builder = WebClient.builder()
            .baseUrl(props.openai.baseUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .clientConnector(buildConnector(props.openai.readTimeoutMs))
        // 키가 없으면 헤더를 달지 않는다. 호출 전에 OpenAiReportLlm 이 설정 누락을 먼저 안내한다.
        apiKeyOrNull(props.openai.apiKey)?.let { builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer $it") }
        return builder.build()
    }

    companion object {
        private const val GITHUB_MAX_IN_MEMORY_BYTES = 16 * 1024 * 1024

        /**
         * 토큰이 비어 있으면 null. 빈 값으로 `Authorization: Bearer ` 를 보내면 GitHub 이 401(Bad credentials)로 거절하므로
         * 헤더 자체를 생략해야 인증 없는 호출이라도 동작한다.
         */
        fun githubAuthorization(token: String): String? =
            token.trim()
                .takeIf { it.isNotEmpty() && !isPlaceholder(it) }
                ?.let { "Bearer $it" }

        /**
         * `.env.example` 를 그대로 복사하면 GITHUB_TOKEN 이 `ghp_xxxx` 같은 자리표시자가 된다.
         * 이 값을 실제 토큰처럼 보내면 GitHub 이 401 로 거절하므로 "토큰 없음"으로 취급한다.
         */
        /** 비었거나 `sk-xxxx` 같은 자리표시자면 null — 실제 키처럼 보내 401 을 받는 일을 막는다. */
        fun apiKeyOrNull(key: String): String? =
            key.trim().takeIf { it.isNotEmpty() && !isPlaceholder(it) && !Regex("(?i)^sk-(ant-|proj-)?x+$").matches(it) }

        private fun isPlaceholder(token: String): Boolean =
            Regex("(?i)^(ghp_x+|github_pat_x+|x{4,}|your[_-]?token.*|changeme|<.*>)$").matches(token)
    }

    private fun buildConnector(readTimeoutMs: Long = props.timeout.readMs): ReactorClientHttpConnector {
        val httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, props.timeout.connectMs.toInt())
            .responseTimeout(Duration.ofMillis(readTimeoutMs))
        return ReactorClientHttpConnector(httpClient)
    }
}
