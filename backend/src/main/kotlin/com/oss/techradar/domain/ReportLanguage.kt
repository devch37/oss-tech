package com.oss.techradar.domain

/** AI 월간 리포트를 생성/조회하는 언어. [code]는 DB와 API의 `lang` 값으로 쓰인다. */
enum class ReportLanguage(val code: String) {
    EN("en"),
    KO("ko");

    companion object {
        fun fromCode(code: String): ReportLanguage =
            entries.find { it.code.equals(code.trim(), ignoreCase = true) }
                ?: throw IllegalArgumentException(
                    "지원하지 않는 lang 값: '$code'. ${entries.joinToString { "'${it.code}'" }} 중 하나를 사용하세요.",
                )
    }
}
