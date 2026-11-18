package com.oss.techradar.crawler.parser

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.oss.techradar.domain.FileType
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * go.mod — `require` 블록/단일 행에서 **직접** 의존성(모듈 경로)만 추출한다.
 * `// indirect` 는 다른 의존성이 끌고 온 것이라 "이 프로젝트가 고른 라이브러리"가 아니므로 제외한다.
 */
@Component
class GoModDependencyParser : DependencyParser {
    override val fileType = FileType.GO_MOD

    override fun parse(content: String): List<String> {
        val result = linkedSetOf<String>()
        var inBlock = false
        for (raw in content.lineSequence()) {
            val line = raw.trim()
            when {
                inBlock && line.startsWith(")") -> inBlock = false
                inBlock -> addModule(line, result)
                line.startsWith("require (") || line == "require(" -> inBlock = true
                line.startsWith("require ") -> addModule(line.removePrefix("require").trim(), result)
            }
        }
        return result.toList()
    }

    private fun addModule(entry: String, out: MutableSet<String>) {
        if (entry.isEmpty() || entry.startsWith("//") || entry.contains("// indirect")) return
        val module = entry.substringBefore("//").trim().split(Regex("\\s+")).firstOrNull().orEmpty()
        if (module.isNotEmpty() && module.contains('.')) out.add(module)
    }
}

/** Cargo.toml — [dependencies] / [dev-dependencies] / [build-dependencies] / [workspace.dependencies] 의 크레이트 이름 */
@Component
class CargoDependencyParser : DependencyParser {
    override val fileType = FileType.CARGO

    private val sectionRegex = Regex("^\\[(.+)]$")
    private val keyRegex = Regex("^([A-Za-z0-9_-]+)\\s*(?:=|\\.)")

    override fun parse(content: String): List<String> {
        val result = linkedSetOf<String>()
        var inDeps = false
        for (raw in content.lineSequence()) {
            val line = raw.trim()
            if (line.isEmpty() || line.startsWith("#")) continue
            val section = sectionRegex.find(line)?.groupValues?.get(1)
            if (section != null) {
                inDeps = isDependencySection(section)
                // [dependencies.serde] 처럼 크레이트 이름이 헤더에 들어간 형태
                dependencyTableName(section)?.let { result.add(it) }
                continue
            }
            if (inDeps) keyRegex.find(line)?.groupValues?.get(1)?.let { result.add(it) }
        }
        return result.toList()
    }

    private fun isDependencySection(section: String): Boolean {
        val s = section.trim()
        return s == "dependencies" || s == "dev-dependencies" || s == "build-dependencies" ||
            s == "workspace.dependencies" || s.endsWith(".dependencies") && s.startsWith("target.") ||
            s.endsWith(".dev-dependencies") && s.startsWith("target.")
    }

    private fun dependencyTableName(section: String): String? {
        val m = Regex("^(?:workspace\\.)?(?:dev-|build-)?dependencies\\.([A-Za-z0-9_-]+)$").find(section.trim())
        return m?.groupValues?.get(1)
    }
}

/**
 * pyproject.toml — PEP 621 `[project] dependencies`/`optional-dependencies`, PEP 735 `[dependency-groups]`,
 * Poetry `[tool.poetry.dependencies]` 를 읽는다. 이름은 requirements.txt 와 같은 방식으로 정규화한다.
 */
@Component
class PyprojectDependencyParser : DependencyParser {
    override val fileType = FileType.PYPROJECT

    private val sectionRegex = Regex("^\\[(.+)]$")
    private val quoted = Regex("\"([^\"]+)\"|'([^']+)'")
    private val keyRegex = Regex("^([A-Za-z0-9_.-]+)\\s*=")

    override fun parse(content: String): List<String> {
        val result = linkedSetOf<String>()
        var section = ""
        var inArray = false // 여러 줄 배열 안인지
        var arrayCollects = false

        for (raw in content.lineSequence()) {
            val line = raw.substringBefore(" #").trim()
            if (line.isEmpty() || line.startsWith("#")) continue

            if (!inArray) {
                val header = sectionRegex.find(line)?.groupValues?.get(1)
                if (header != null) {
                    section = header.trim()
                    continue
                }
            }

            when {
                // Poetry: 키가 곧 패키지 이름
                isPoetrySection(section) -> {
                    keyRegex.find(line)?.groupValues?.get(1)?.takeIf { it != "python" }
                        ?.let { addName(it, result) }
                }
                // PEP 621 / PEP 735: 따옴표 안 요구사항 문자열
                section == "project" || section == "project.optional-dependencies" || section == "dependency-groups" -> {
                    if (!inArray) {
                        val key = keyRegex.find(line)?.groupValues?.get(1)
                        arrayCollects = when (section) {
                            "project" -> key == "dependencies"
                            else -> key != null
                        }
                        if (line.contains('[')) {
                            val body = line.substringAfter('[')
                            if (arrayCollects) collectQuoted(body, result)
                            inArray = !closesArray(body)
                        }
                    } else {
                        if (arrayCollects) collectQuoted(line, result)
                        if (closesArray(line)) inArray = false
                    }
                }
            }
        }
        return result.toList()
    }

    private fun isPoetrySection(section: String): Boolean =
        section == "tool.poetry.dependencies" || section == "tool.poetry.dev-dependencies" ||
            Regex("^tool\\.poetry\\.group\\.[^.]+\\.dependencies$").matches(section)

    /** 따옴표 안의 `]`(예: "httpx[http2]")는 배열 끝이 아니다 — 따옴표 문자열을 걷어낸 뒤 `]` 를 찾는다. */
    private fun closesArray(text: String): Boolean = quoted.replace(text, "").contains(']')

    private fun collectQuoted(text: String, out: MutableSet<String>) {
        quoted.findAll(text).forEach { addName(it.groupValues[1].ifEmpty { it.groupValues[2] }, out) }
    }

    private fun addName(raw: String, out: MutableSet<String>) {
        val name = PythonPackageName.normalize(raw)
        if (name.isNotEmpty()) out.add(name)
    }
}

/** pubspec.yaml — `dependencies:` / `dev_dependencies:` 바로 아래 한 단계 들여쓰기된 키 */
@Component
class PubspecDependencyParser : DependencyParser {
    override val fileType = FileType.PUBSPEC

    private val topLevel = Regex("^([A-Za-z_]+):\\s*$")
    private val entry = Regex("^ {2}([A-Za-z0-9_]+):")

    override fun parse(content: String): List<String> {
        val result = linkedSetOf<String>()
        var inDeps = false
        for (raw in content.lineSequence()) {
            if (raw.isBlank() || raw.trimStart().startsWith("#")) continue
            val top = topLevel.find(raw)?.groupValues?.get(1)
            if (top != null) {
                inDeps = top == "dependencies" || top == "dev_dependencies"
                continue
            }
            if (!raw.startsWith(" ")) inDeps = false // 다른 최상위 키(예: environment: ...)
            if (inDeps) entry.find(raw)?.groupValues?.get(1)?.let { result.add(it) }
        }
        return result.toList()
    }
}

/** composer.json — `require` / `require-dev` (php·ext-* 는 라이브러리가 아니므로 제외) */
@Component
class ComposerDependencyParser(private val objectMapper: ObjectMapper) : DependencyParser {
    override val fileType = FileType.COMPOSER

    private val log = LoggerFactory.getLogger(javaClass)

    override fun parse(content: String): List<String> = try {
        val root = objectMapper.readTree(content) as? ObjectNode
        listOf("require", "require-dev")
            .flatMap { key -> (root?.get(key) as? ObjectNode)?.fieldNames()?.asSequence()?.toList() ?: emptyList() }
            .filter { it != "php" && !it.startsWith("ext-") && !it.startsWith("lib-") }
            .distinct()
    } catch (e: Exception) {
        log.warn("composer.json 파싱 실패, 건너뜀: ${e.message}")
        emptyList()
    }
}

/** Gemfile — `gem 'name'` / `gem "name"` */
@Component
class GemfileDependencyParser : DependencyParser {
    override val fileType = FileType.GEMFILE

    private val gemRegex = Regex("^\\s*gem\\s+['\"]([^'\"]+)['\"]")

    override fun parse(content: String): List<String> =
        content.lineSequence()
            .mapNotNull { gemRegex.find(it)?.groupValues?.get(1) }
            .distinct()
            .toList()
}
