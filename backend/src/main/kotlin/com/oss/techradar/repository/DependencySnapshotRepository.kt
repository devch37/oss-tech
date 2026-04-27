package com.oss.techradar.repository

import com.oss.techradar.domain.DependencySnapshot
import com.oss.techradar.domain.FileType
import org.springframework.data.jpa.repository.JpaRepository

interface DependencySnapshotRepository : JpaRepository<DependencySnapshot, Long> {

    fun findAllByRepositoryId(repositoryId: Long): List<DependencySnapshot>

    fun findAllByRepositoryIdAndFileType(
        repositoryId: Long,
        fileType: FileType,
    ): List<DependencySnapshot>
}
