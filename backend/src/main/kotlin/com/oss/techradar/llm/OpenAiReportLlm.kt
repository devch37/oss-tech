package com.oss.techradar.llm

import com.oss.techradar.config.WebClientConfig
import com.oss.techradar.config.WebClientProperties
import com.oss.techradar.llm.dto.OpenAiResponsesRequest
import com.oss.techradar.llm.dto.OpenAiResponsesResponse
import kotlinx.coroutines.delay
import kotlinx.coroutines.reactive.awaitSingle
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpStatusCode
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import org.springframework.web.reactive.function.client.bodyToMono
import reactor.core.publisher.Mono

/**
 * OpenAI Responses API(POST /v1/responses) 로 리포트를 작성한다.
 * Chat Completions 도 계속 지원되지만 OpenAI 는 신규 프로젝트에 Responses 를 권장한다.
 */
@Component
@ConditionalOnProperty(name = ["report.llm-provider"], havingValue = "openai", matchIfMissing = true)
class OpenAiReportLlm(
    @Qualifier("openAiWebClient") private val webClient: WebClient,
    private val props: WebClientProperties,
) : ReportLlm {

    private val log = LoggerFactory.getLogger(javaClass)

    override suspend fun generate(system: String, user: String): String {
        val cfg = props.openai
        if (WebClientConfig.apiKeyOrNull(cfg.apiKey) == null) {
            throw LlmUnavailableException(
                "OPENAI_API_KEY 가 설정되지 않았습니다. .env 에 키를 넣고 백엔드를 재시작하세요.",
            )
        }

        val request = OpenAiResponsesRequest(
            model = cfg.model,
            instructions = system,
            input = user,
            maxOutputTokens = cfg.maxOutputTokens,
            reasoning = cfg.reasoningEffort.trim().takeIf { it.isNotEmpty() }?.let { OpenAiResponsesRequest.Reasoning(it) },
        )

        val response = callWithRetry(request)

        response.error?.let { error("OpenAI 응답 오류: ${it.code} ${it.message}") }
        if (response.status == "incomplete") {
            // reasoning 토큰도 max_output_tokens 에 포함되어, 추론만 하다 본문이 잘릴 수 있다
            error("OpenAI 응답이 중간에 끊겼습니다 (${response.incompleteDetails?.reason}). OPENAI_MAX_OUTPUT_TOKENS 를 늘려 보세요.")
        }
        return response.extractText().takeIf { it.isNotBlank() }
            ?: error("OpenAI 응답에 본문(output_text)이 없습니다 (status=${response.status})")
    }

    /** 429(rate limit)/5xx 는 1회 재시도. 크레딧·한도·인증 오류는 재시도해도 소용없어 즉시 안내한다. */
    private suspend fun callWithRetry(request: OpenAiResponsesRequest): OpenAiResponsesResponse =
        try {
            post(request)
        } catch (first: WebClientResponseException) {
            val mapped = first.toActionableOrSelf()
            if (mapped is LlmUnavailableException || !first.isRetryable()) throw mapped
            log.warn("OpenAI API 실패 (HTTP ${first.statusCode.value()}), ${props.openai.retryDelayMs}ms 후 1회 재시도")
            delay(props.openai.retryDelayMs)
            try {
                post(request)
            } catch (second: WebClientResponseException) {
                throw second.toActionableOrSelf()
            }
        }

    private suspend fun post(request: OpenAiResponsesRequest): OpenAiResponsesResponse =
        webClient.post()
            .uri("/v1/responses")
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatusCode::isError) { res ->
                res.bodyToMono<String>().defaultIfEmpty("").flatMap { body ->
                    Mono.error(
                        WebClientResponseException.create(
                            res.statusCode().value(),
                            "OpenAI API error: $body",
                            res.headers().asHttpHeaders(),
                            body.toByteArray(Charsets.UTF_8),
                            Charsets.UTF_8,
                        ),
                    )
                }
            }
            .bodyToMono(OpenAiResponsesResponse::class.java)
            .awaitSingle()

    private fun WebClientResponseException.isRetryable(): Boolean =
        statusCode.value() == 429 || statusCode.is5xxServerError

    /** 사용자가 조치해야 하는 오류(인증·크레딧·한도)는 [LlmUnavailableException] 으로, 그 외는 원래 예외 그대로. */
    private fun WebClientResponseException.toActionableOrSelf(): Exception {
        val body = responseBodyAsString
        return when {
            statusCode.value() == 401 -> LlmUnavailableException(
                "OPENAI_API_KEY 가 올바르지 않습니다 (401). 키를 확인하거나 새로 발급해 .env 를 고친 뒤 백엔드를 재시작하세요.",
            )
            statusCode.value() == 429 && BILLING_CODES.any { it in body } -> LlmUnavailableException(
                "OpenAI 크레딧이 소진되었거나 사용 한도에 도달했습니다. " +
                    "https://platform.openai.com/settings/organization/billing 에서 크레딧을 충전하거나 한도를 확인하세요.",
            )
            else -> this
        }
    }

    companion object {
        /** OpenAI error-codes 문서의 "재시도해도 복구되지 않는" 결제/한도 코드 */
        private val BILLING_CODES = listOf(
            "credit_balance_exhausted",
            "insufficient_quota",
            "organization_spend_limit_exceeded",
            "project_spend_limit_exceeded",
            "organization_usage_limit_exceeded",
        )
    }
}
