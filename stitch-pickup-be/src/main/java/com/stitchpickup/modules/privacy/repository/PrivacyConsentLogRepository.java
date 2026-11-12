package com.stitchpickup.modules.privacy.repository;

import com.stitchpickup.modules.privacy.entity.PrivacyConsentLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrivacyConsentLogRepository extends JpaRepository<PrivacyConsentLog, UUID> {

    List<PrivacyConsentLog> findByUserIdOrderByAcceptedAtDesc(UUID userId);

    boolean existsByUserIdAndPolicyVersionAndAcceptedTrue(UUID userId, String policyVersion);
}

