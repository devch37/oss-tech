package com.oss.techradar.llm

import com.oss.techradar.claude.AnthropicWebClient
import com.oss.techradar.claude.dto.ClaudeRequest
import com.oss.techradar.config.WebClientProperties
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

/** `LLM_PROVIDER=claude` 일 때만 쓰는 Anthropic 구현. 기본은 OpenAI. */
@Component
@ConditionalOnProperty(name = ["report.llm-provider"], havingValue = "claude")
class ClaudeReportLlm(
    private val anthropicWebClient: AnthropicWebClient,
    private val props: WebClientProperties,
) : ReportLlm {

    override suspend fun generate(system: String, user: String): String =
        anthropicWebClient.sendMessage(
            ClaudeRequest(
                model = props.claude.model,
                maxTokens = 4096,
                system = system,
                messages = listOf(ClaudeRequest.Message(role = "user", content = user)),
            ),
        ).extractText()
}
