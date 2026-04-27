# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM gradle:8.13-jdk21 AS builder

WORKDIR /app

# 의존성 캐시 레이어 (소스 변경 시 재사용)
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle

# 의존성만 먼저 다운로드 (소스 없이 실패해도 캐시 목적)
RUN gradle dependencies --no-daemon || true

# 전체 소스 복사 후 빌드
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 보안: 비루트 사용자
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 빌드 아티팩트 복사 (oss-tech-backend-*.jar)
COPY --from=builder /app/build/libs/*.jar app.jar

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health 2>/dev/null | grep -q '"status":"UP"' || exit 1

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
