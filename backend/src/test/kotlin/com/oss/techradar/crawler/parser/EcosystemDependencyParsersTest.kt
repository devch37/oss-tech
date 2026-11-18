package com.oss.techradar.crawler.parser

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class EcosystemDependencyParsersTest {

    // ─── go.mod ───────────────────────────────────────────────

    @Test
    fun `go mod - require 블록의 직접 의존성만 추출하고 indirect 는 제외`() {
        val content = """
            module github.com/acme/tool

            go 1.22

            require (
                github.com/spf13/cobra v1.8.0
                github.com/stretchr/testify v1.9.0 // test helper
                golang.org/x/sys v0.20.0 // indirect
            )

            require github.com/rs/zerolog v1.32.0
            require github.com/foo/bar v0.1.0 // indirect

            replace github.com/old/mod => ./local
        """.trimIndent()

        assertEquals(
            listOf("github.com/spf13/cobra", "github.com/stretchr/testify", "github.com/rs/zerolog"),
            GoModDependencyParser().parse(content),
        )
    }

    // ─── Cargo.toml ───────────────────────────────────────────

    @Test
    fun `cargo - 의존성 섹션과 하위 테이블, workspace 상속 형태를 모두 읽는다`() {
        val content = """
            [package]
            name = "demo"
            version = "0.1.0"

            [dependencies]
            serde = { version = "1", features = ["derive"] }
            tokio = "1"
            anyhow.workspace = true

            [dev-dependencies]
            criterion = "0.5"

            [dependencies.reqwest]
            version = "0.12"

            [features]
            default = []
        """.trimIndent()

        assertEquals(
            listOf("reqwest", "serde", "tokio", "anyhow", "criterion").sorted(),
            CargoDependencyParser().parse(content).sorted(),
        )
    }

    @Test
    fun `cargo - package 섹션의 키는 의존성으로 세지 않는다`() {
        val content = "[package]\nname = \"x\"\nedition = \"2021\"\n"
        assertEquals(emptyList<String>(), CargoDependencyParser().parse(content))
    }

    // ─── pyproject.toml ───────────────────────────────────────

    @Test
    fun `pyproject - PEP 621 여러 줄 배열과 optional-dependencies`() {
        val content = """
            [project]
            name = "demo"
            dependencies = [
                "Pydantic>=2.0",
                "typing_extensions; python_version < '3.11'",
                'httpx[http2]~=0.27',
            ]

            [project.optional-dependencies]
            dev = ["pytest>=8", "ruff"]

            [build-system]
            requires = ["hatchling"]
        """.trimIndent()

        assertEquals(
            listOf("pydantic", "typing-extensions", "httpx", "pytest", "ruff"),
            PyprojectDependencyParser().parse(content),
        )
    }

    @Test
    fun `pyproject - 한 줄 배열도 읽고 build-system requires 는 무시`() {
        val content = """
            [project]
            dependencies = ["numpy", "pandas>=2"]

            [build-system]
            requires = ["setuptools"]
        """.trimIndent()

        assertEquals(listOf("numpy", "pandas"), PyprojectDependencyParser().parse(content))
    }

    @Test
    fun `pyproject - Poetry 의존성은 키가 패키지 이름이고 python 은 제외`() {
        val content = """
            [tool.poetry.dependencies]
            python = "^3.11"
            Django = "^5.0"
            celery = { version = "^5", extras = ["redis"] }

            [tool.poetry.group.dev.dependencies]
            black = "*"
        """.trimIndent()

        assertEquals(listOf("django", "celery", "black"), PyprojectDependencyParser().parse(content))
    }

    @Test
    fun `pip 와 pyproject 는 같은 패키지를 같은 이름으로 정규화한다`() {
        val fromPip = PipDependencyParser().parse("PyYAML==6.0\ntyping_extensions>=4")
        val fromToml = PyprojectDependencyParser().parse("[project]\ndependencies = [\"pyyaml\", \"Typing-Extensions\"]")
        assertEquals(fromPip.sorted(), fromToml.sorted())
    }

    // ─── pubspec.yaml ─────────────────────────────────────────

    @Test
    fun `pubspec - dependencies 와 dev_dependencies 한 단계 아래 키만`() {
        val content = """
            name: demo_app
            environment:
              sdk: ">=3.0.0 <4.0.0"

            dependencies:
              flutter:
                sdk: flutter
              provider: ^6.1.0
              dio: ^5.4.0

            dev_dependencies:
              flutter_test:
                sdk: flutter
              mocktail: ^1.0.0

            flutter:
              uses-material-design: true
        """.trimIndent()

        assertEquals(
            listOf("flutter", "provider", "dio", "flutter_test", "mocktail"),
            PubspecDependencyParser().parse(content),
        )
    }

    // ─── composer.json ────────────────────────────────────────

    @Test
    fun `composer - require 와 require-dev, php 와 ext 는 제외`() {
        val content = """
            {
              "require": { "php": "^8.2", "ext-json": "*", "laravel/framework": "^11.0" },
              "require-dev": { "phpunit/phpunit": "^11" }
            }
        """.trimIndent()

        assertEquals(
            listOf("laravel/framework", "phpunit/phpunit"),
            ComposerDependencyParser(ObjectMapper()).parse(content),
        )
    }

    @Test
    fun `composer - 깨진 JSON 은 빈 목록`() {
        assertEquals(emptyList<String>(), ComposerDependencyParser(ObjectMapper()).parse("{ not json"))
    }

    // ─── Gemfile ──────────────────────────────────────────────

    @Test
    fun `gemfile - gem 선언의 이름만, 주석과 source 줄은 제외`() {
        val content = """
            source "https://rubygems.org"
            # gem "commented"
            gem 'rails', '~> 7.1'
            gem "pg"
              gem 'puma'
            group :test do
              gem "rspec"
            end
        """.trimIndent()

        assertEquals(listOf("rails", "pg", "puma", "rspec"), GemfileDependencyParser().parse(content))
    }
}
