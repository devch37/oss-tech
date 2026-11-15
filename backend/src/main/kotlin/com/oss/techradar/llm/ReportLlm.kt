package com.oss.techradar.llm

/** 월간 리포트를 작성하는 LLM. 제공자(OpenAI/Claude)는 `report.llm-provider` 로 고른다. */
interface ReportLlm {
    /** [system] 지침과 [user] 프롬프트로 마크다운 본문을 생성해 돌려준다. */
    suspend fun generate(system: String, user: String): String
}

/**
 * API 키 누락, 크레딧 소진, 사용 한도 초과처럼 **사용자가 직접 조치해야 하는** LLM 문제.
 * 재시도해도 해결되지 않으므로 원인과 해결 방법을 메시지에 담아 그대로 보여준다.
 */
class LlmUnavailableException(message: String) : RuntimeException(message)
