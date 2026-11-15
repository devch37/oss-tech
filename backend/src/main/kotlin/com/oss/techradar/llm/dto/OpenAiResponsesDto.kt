package com.oss.techradar.llm.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty

/** POST /v1/responses 요청. null 필드는 아예 보내지 않는다(모델이 지원하지 않는 값을 실수로 보내 400 이 나는 것을 막음). */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class OpenAiResponsesRequest(
    val model: String,
    val instructions: String,
    val input: String,
    @JsonProperty("max_output_tokens") val maxOutputTokens: Int,
    val reasoning: Reasoning? = null,
) {
    data class Reasoning(val effort: String)
}

/** POST /v1/responses 응답 중 필요한 부분만. 나머지는 무시한다. */
@JsonIgnoreProperties(ignoreUnknown = true)
data class OpenAiResponsesResponse(
    val id: String? = null,
    /** completed | incomplete | failed ... */
    val status: String? = null,
    @JsonProperty("incomplete_details") val incompleteDetails: IncompleteDetails? = null,
    val error: ErrorBody? = null,
    val output: List<OutputItem> = emptyList(),
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    data class IncompleteDetails(val reason: String? = null)

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class ErrorBody(val code: String? = null, val message: String? = null)

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OutputItem(val type: String? = null, val content: List<Content>? = null)

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class Content(val type: String? = null, val text: String? = null)

    /** output 배열의 assistant 메시지(output_text)만 이어 붙인다. reasoning 항목은 건너뛴다. */
    fun extractText(): String =
        output.asSequence()
            .filter { it.type == "message" }
            .flatMap { it.content.orEmpty().asSequence() }
            .filter { it.type == "output_text" }
            .mapNotNull { it.text }
            .joinToString("\n")
}
