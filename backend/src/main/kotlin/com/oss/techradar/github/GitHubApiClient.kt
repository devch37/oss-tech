package com.oss.techradar.github

import com.oss.techradar.github.dto.GitHubContent
import com.oss.techradar.github.dto.GitHubIssue
import com.oss.techradar.github.dto.GitHubPullRequest
import com.oss.techradar.github.dto.GitHubSearchItem
import com.oss.techradar.github.dto.GitHubSearchResponse
import kotlinx.coroutines.delay
import kotlinx.coroutines.reactive.awaitSingle
import kotlinx.coroutines.reactor.awaitSingleOrNull
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpStatusCode
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import org.springframework.web.reactive.function.client.awaitBodyOrNull
import org.springframework.web.reactive.function.client.bodyToMono
import reactor.core.publisher.Mono
import java.util.Base64

/**
 * GitHub REST API 클라이언트. 모든 호출은 core rate limit(5,000/h, 인증 시)만 사용하고
 * Search API(30/min)는 도메인당 1회(레포 검색)만 사용한다.
 */
@Component
class GitHubApiClient(
    @Qualifier("gitHubWebClient") private val webClient: WebClient,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    /** topic 기반 레포 검색 — 도메인당 1회 호출 */
    suspend fun searchRepositories(topic: String, perPage: Int): List<GitHubSearchItem> =
        retryOnRateLimit {
            webClient.get()
                .uri { builder ->
                    builder.path("/search/repositories")
                        .queryParam("q", "topic:$topic")
                        .queryParam("sort", "stars")
                        .queryParam("order", "desc")
                        .queryParam("per_page", perPage)
                        .build()
                }
                .retrieve()
                .failOnError()
                .bodyToMono<GitHubSearchResponse>()
                .awaitSingle()
        }.items

    /**
     * [sinceIso] 이후 커밋 수. per_page=1로 요청해 응답의 Link 헤더 rel="last" 페이지 번호를
     * 그대로 총 개수로 사용한다 (Link 헤더가 없으면 결과가 0~1건이라는 뜻).
     */
    suspend fun countCommitsSince(owner: String, repo: String, sinceIso: String): Int =
        retryOnRateLimit {
            val entity = webClient.get()
                .uri { builder ->
                    builder.path("/repos/$owner/$repo/commits")
                        .queryParam("since", sinceIso)
                        .queryParam("per_page", 1)
                        .build()
                }
                .retrieve()
                .failOnError(notFoundIsEmpty = true)
                .toEntityList(Any::class.java)
                .awaitSingleOrNull()
                ?: return@retryOnRateLimit 0

            parseLastPageFromLinkHeader(entity.headers.getFirst("Link"))
                ?: (entity.body?.size ?: 0)
        }

    /** 최근 갱신된 닫힌 PR 100건 중 [sinceIso] 이후 머지된 것만 카운트 (근사치) */
    suspend fun countMergedPrsSince(owner: String, repo: String, sinceIso: String): Int =
        retryOnRateLimit {
            val prs = webClient.get()
                .uri { builder ->
                    builder.path("/repos/$owner/$repo/pulls")
                        .queryParam("state", "closed")
                        .queryParam("sort", "updated")
                        .queryParam("direction", "desc")
                        .queryParam("per_page", 100)
                        .build()
                }
                .retrieve()
                .failOnError(notFoundIsEmpty = true)
                .bodyToMono(object : ParameterizedTypeReference<List<GitHubPullRequest>>() {})
                .awaitSingleOrNull()
                ?: emptyList()

            prs.count { it.mergedAt != null && it.mergedAt >= sinceIso }
        }

    /** 최근 갱신된 닫힌 이슈 100건(PR 제외) 중 [sinceIso] 이후 것만 카운트 (근사치) */
    suspend fun countClosedIssuesSince(owner: String, repo: String, sinceIso: String): Int =
        retryOnRateLimit {
            val issues = webClient.get()
                .uri { builder ->
                    builder.path("/repos/$owner/$repo/issues")
                        .queryParam("state", "closed")
                        .queryParam("since", sinceIso)
                        .queryParam("per_page", 100)
                        .build()
                }
                .retrieve()
                .failOnError(notFoundIsEmpty = true)
                .bodyToMono(object : ParameterizedTypeReference<List<GitHubIssue>>() {})
                .awaitSingleOrNull()
                ?: emptyList()

            issues.count { it.pullRequest == null }
        }

    /** 파일 내용 조회. 없으면(404) null. */
    suspend fun getFileContent(owner: String, repo: String, path: String): String? =
        retryOnRateLimit {
            val content = webClient.get()
                .uri("/repos/$owner/$repo/contents/$path")
                .retrieve()
                .failOnError(notFoundIsEmpty = true)
                .awaitBodyOrNull<GitHubContent>()
                ?: return@retryOnRateLimit null

            if (content.encoding == "base64" && content.content != null) {
                String(Base64.getMimeDecoder().decode(content.content), Charsets.UTF_8)
            } else {
                content.content
            }
        }

    // ─── 내부 헬퍼 ──────────────────────────────────────────

    /** 404를 예외 대신 빈 결과로 취급할지 여부에 따라 onStatus 핸들러를 구성 */
    private fun WebClient.ResponseSpec.failOnError(notFoundIsEmpty: Boolean = false): WebClient.ResponseSpec =
        onStatus(HttpStatusCode::isError) { res ->
            if (notFoundIsEmpty && res.statusCode().value() == 404) {
                Mono.empty()
            } else {
                res.bodyToMono<String>().defaultIfEmpty("").flatMap { body ->
                    Mono.error(
                        WebClientResponseException.create(
                            res.statusCode().value(),
                            "GitHub API error: $body",
                            res.headers().asHttpHeaders(),
                            body.toByteArray(Charsets.UTF_8),
                            Charsets.UTF_8,
                        ),
                    )
                }
            }
        }

    private fun parseLastPageFromLinkHeader(linkHeader: String?): Int? {
        if (linkHeader == null) return null
        val lastLink = linkHeader.split(",").find { it.contains("rel=\"last\"") } ?: return null
        val match = Regex("[?&]page=(\\d+)").find(lastLink) ?: return null
        return match.groupValues[1].toIntOrNull()
    }

    /** 403/429(rate limit) 시 Retry-After(없으면 5초) 대기 후 1회 재시도 */
    private suspend fun <T> retryOnRateLimit(block: suspend () -> T): T =
        try {
            block()
        } catch (e: WebClientResponseException) {
            if (e.statusCode.value() == 403 || e.statusCode.value() == 429) {
                val retryAfterSec = e.headers.getFirst("Retry-After")?.toLongOrNull() ?: 5L
                log.warn("GitHub API rate limit (HTTP ${e.statusCode.value()}), ${retryAfterSec}초 후 1회 재시도")
                delay(retryAfterSec * 1_000)
                block()
            } else {
                throw e
            }
        }
}
