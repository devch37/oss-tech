package com.oss.techradar.crawler.parser

/** PEP 503 이름 정규화 — requirements.txt 와 pyproject.toml 에서 같은 패키지가 같은 이름으로 집계되게 한다. */
object PythonPackageName {
    private val leadingName = Regex("^[A-Za-z0-9][A-Za-z0-9._-]*")
    private val separators = Regex("[-_.]+")

    /** "PyYAML>=6" → "pyyaml", "typing_extensions" → "typing-extensions". 이름이 아니면 빈 문자열. */
    fun normalize(raw: String): String {
        val name = leadingName.find(raw.trim())?.value ?: return ""
        return separators.replace(name.lowercase(), "-").trim('-')
    }
}
