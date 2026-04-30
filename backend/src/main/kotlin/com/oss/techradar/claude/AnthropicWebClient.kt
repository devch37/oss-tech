package com.oss.techradar.claude

import com.oss.techradar.claude.dto.ClaudeRequest
import com.oss.techradar.claude.dto.ClaudeResponse
import kotlinx.coroutines.delay
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.HttpStatusCode
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import kotlinx.coroutines.reactive.awaitSingle
import org.springframework.web.reactive.function.client.bodyToMono
import reactor.core.publisher.Mono

@Component
class AnthropicWebClient(
    @Qualifier("claudeWebClient") private val webClient: WebClient,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    suspend fun sendMessage(request: ClaudeRequest): ClaudeResponse =
        retryOnce { executePost(request) }

    private suspend fun executePost(request: ClaudeRequest): ClaudeResponse =
        webClient.post()
            .uri("/v1/messages")
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatusCode::isError) { res ->
                res.bodyToMono<String>().flatMap { body ->
                    Mono.error(
                        WebClientResponseException.create(
                            res.statusCode().value(),
                            "Anthropic API error: $body",
                            res.headers().asHttpHeaders(),
                            body.toByteArray(Charsets.UTF_8),
                            Charsets.UTF_8,
                        )
                    )
                }
            }
            .bodyToMono(ClaudeResponse::class.java)
            .awaitSingle()

    /**
     * API 실패 시 2초 대기 후 1회 재시도.
     * 재시도도 실패하면 예외를 그대로 전파한다.
     */
    private suspend fun <T> retryOnce(block: suspend () -> T): T =
        try {
            block()
        } catch (e: WebClientResponseException) {
            log.warn("Anthropic API 실패 (HTTP ${e.statusCode.value()}), 2초 후 1회 재시도")
            delay(2_000)
            block()
        }
}
