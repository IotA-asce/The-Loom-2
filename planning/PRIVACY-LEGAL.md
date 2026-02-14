# Privacy & Legal Compliance Document

**Project:** The Loom 2 - Manga Branching Narrative Generator  
**Document Version:** 1.0  
**Last Updated:** 2026-02-13  
**Status:** Draft - Pending Legal Review

---

## Table of Contents

1. [Privacy-First Architecture](#1-privacy-first-architecture)
2. [Data Collection & Storage](#2-data-collection--storage)
3. [Privacy Policy Draft](#3-privacy-policy-draft)
4. [GDPR Compliance](#4-gdpr-compliance)
5. [CCPA Compliance](#5-ccpa-compliance)
6. [Terms of Service Draft](#6-terms-of-service-draft)
7. [Copyright Considerations](#7-copyright-considerations)
8. [Content Policy](#8-content-policy)
9. [Implementation Checklist](#9-implementation-checklist)
10. [Risk Assessment](#10-risk-assessment)
11. [International Considerations](#11-international-considerations)
12. [Document Maintenance](#12-document-maintenance)

---

## 1. Privacy-First Architecture

### 1.1 Core Principles

The Loom 2 is built on four fundamental privacy principles:

| Principle | Description |
|-----------|-------------|
| **No Server** | All processing happens client-side in the user's browser. No backend servers process or store user data. |
| **No Data Collection** | We do not collect any user data without explicit consent. No analytics, no tracking, no telemetry by default. |
| **User Control** | Users have complete control over their data with full export and deletion capabilities. |
| **Transparency** | Open source codebase and clear privacy documentation ensure users can verify our claims. |

### 1.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S DEVICE                               │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │ Manga Files  │─────▶│   Browser    │─────▶│  IndexedDB   │      │
│  │  (Local)     │      │  (Client)    │      │  (Local DB)  │      │
│  └──────────────┘      └──────┬───────┘      └──────────────┘      │
│                               │                                     │
│                               ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              LLM API REQUESTS (User's API Keys)              │   │
│  │  • Analysis text only (no raw images)                        │   │
│  │  • Encrypted transmission (HTTPS)                            │   │
│  │  • Direct to provider (Google/OpenAI)                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Privacy Guarantees

- ✅ **Manga Never Leaves Device**: Raw manga images are never uploaded to any server
- ✅ **API Keys Stay Local**: Your API keys are stored encrypted in your browser only
- ✅ **No Server Processing**: Analysis is done via direct API calls from your browser
- ✅ **No Analytics by Default**: Optional opt-in only for analytics

---

## 2. Data Collection & Storage

### 2.1 What We Store (Local Only)

All data is stored locally in the user's browser using IndexedDB:

| Data Type | Purpose | Storage Format | Retention |
|-----------|---------|----------------|-----------|
| Manga metadata | Library organization (titles, file paths, page counts) | JSON objects | Until deleted by user |
| Analysis results | Display analysis, generated narratives | JSON objects | Until deleted by user |
| User preferences | Settings, display preferences, API provider selection | Key-value pairs | Until deleted by user |
| API keys | Authentication with LLM providers | AES-256-GCM encrypted | Until removed by user |
| Token usage | Cost tracking, usage statistics | Numeric counters | Until cleared by user |
| App state | UI state, current session | JSON objects | Session only |

### 2.2 What We DON'T Store

| Data Type | Reason |
|-----------|--------|
| ❌ Manga images | Only file references stored; images remain on disk |
| ❌ User accounts | No account system; completely anonymous |
| ❌ Personal identifiers | No names, emails, or identifying information |
| ❌ Server logs | No server means no server logs |
| ❌ Analytics data | Only with explicit opt-in consent |
| ❌ Cookies | Only essential preference storage (no tracking) |
| ❌ IP addresses | Never collected or stored |
| ❌ Device fingerprints | No tracking or fingerprinting |

### 2.3 Storage Technical Details

**Storage Technology:**
- **Primary**: IndexedDB (browser-native, structured storage)
- **Fallback**: LocalStorage (for small preference items)
- **Session**: Memory-only for temporary state

**Encryption:**
- **API Keys**: AES-256-GCM encryption with user-derived key
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Encryption Key**: Derived from browser-specific entropy + user password (if set)

**Data Location:**
- All data stored in user's browser
- No cloud synchronization
- No backup to external servers
- User responsible for their own backups

**Data Export:**
- Full JSON export available
- CSV export for usage statistics
- Import functionality for restoration

---

## 3. Privacy Policy Draft

> **Note:** This is a template draft. Final version should be reviewed by legal counsel before publication.

---

### **PRIVACY POLICY - THE LOOM 2**

**Effective Date:** [DATE]  
**Last Updated:** [DATE]

#### 1. Introduction

The Loom 2 ("we," "our," or "us") respects your privacy. This Privacy Policy explains how we handle information when you use our manga branching narrative generator application.

**Key Point:** The Loom 2 is a client-side only application. We do not operate servers that collect or process your data. All data processing and storage occurs locally on your device.

#### 2. Information We Collect

##### 2.1 Information Stored Locally

We store the following information **only on your device** using browser storage:

- **Manga Metadata**: File names, paths, and organizational information about your manga collection
- **Analysis Data**: Results from AI analysis of your manga panels
- **User Preferences**: Your application settings and display preferences
- **API Credentials**: Your LLM provider API keys (stored in encrypted form)
- **Usage Statistics**: Token usage and cost tracking information

##### 2.2 Information We Do Not Collect

We do NOT collect or store:

- Manga images or content (only local file references)
- Your name, email address, or any personal identifiers
- Your IP address or location data
- Browsing history or usage patterns (unless you opt-in to analytics)
- Any data on our servers

##### 2.3 Optional Analytics

With your explicit consent, we may collect anonymized usage analytics to improve the application:

- Feature usage statistics (anonymized)
- Error reports (anonymized)
- Performance metrics

**You can opt-in or opt-out at any time** through the Settings panel.

#### 3. How We Use Information

| Purpose | Description |
|---------|-------------|
| Library Management | Organize and display your manga collection |
| Analysis Processing | Generate branching narratives using your chosen LLM provider |
| Settings Persistence | Remember your preferences between sessions |
| Cost Tracking | Help you monitor API usage and costs |
| App Improvement | Only if you opt-in to analytics |

#### 4. Information Sharing

##### 4.1 LLM Providers

When you use the analysis features, your manga analysis requests are sent directly to your chosen LLM provider:

- **Google Gemini**: Subject to [Google Privacy Policy](https://policies.google.com/privacy)
- **OpenAI**: Subject to [OpenAI Privacy Policy](https://openai.com/privacy)

**Important:** We do not intercept, view, or store these requests. They go directly from your browser to the provider.

##### 4.2 No Other Sharing

We do not:
- Sell your data to anyone
- Share data with advertisers
- Share data with analytics companies (unless you opt-in)
- Transfer data to third parties

#### 5. Data Security

##### 5.1 Local Storage Security

- API keys are encrypted using AES-256-GCM before storage
- Encryption keys are derived using PBKDF2 with 100,000 iterations
- Data is stored in your browser's IndexedDB, isolated to your device

##### 5.2 Transmission Security

- All API communications use HTTPS/TLS 1.3 encryption
- No data is transmitted to our servers (we don't have any)

##### 5.3 Limitations

While we implement strong security measures, no security system is impenetrable. Please keep your device secure and use strong passwords.

#### 6. Your Rights and Choices

##### 6.1 Right to Access

You can export all your data at any time:
- Navigate to Settings → Privacy → Export Data
- Data will be downloaded as a JSON file

##### 6.2 Right to Deletion

You can delete all stored data:
- Navigate to Settings → Privacy → Clear All Data
- This permanently removes all local storage

##### 6.3 Right to Portability

Exported data is in standard JSON format, compatible with other applications.

##### 6.4 Right to Opt-Out

- Analytics: Toggle off in Settings → Privacy → Analytics
- All data collection can be stopped by clearing data and uninstalling

#### 7. Children's Privacy

The Loom 2 is not intended for use by children under 13 years of age. We do not knowingly collect any information from children under 13.

If you are a parent or guardian and believe your child has provided us with information, please contact us so we can assist with deletion.

#### 8. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:
- Posting the new Privacy Policy in the application
- Updating the "Last Updated" date
- Providing in-app notification for material changes

Continued use after changes constitutes acceptance of the updated policy.

#### 9. Contact Us

For privacy-related questions or requests:

**Email:** [privacy@theloom2.example]  
**GitHub Issues:** [github.com/theloom2/issues]  
**Response Time:** Within 30 days

---

## 4. GDPR Compliance (for EU Users)

### 4.1 GDPR Applicability

While The Loom 2 does not operate servers or collect personal data in the traditional sense, EU users have the following rights under GDPR:

| GDPR Principle | Our Implementation |
|----------------|-------------------|
| **Lawfulness, Fairness, Transparency** | Clear privacy policy; open source code |
| **Purpose Limitation** | Data used only for stated purposes |
| **Data Minimization** | Only essential data is stored |
| **Accuracy** | Users can edit all stored data |
| **Storage Limitation** | User-controlled deletion at any time |
| **Integrity & Confidentiality** | Encryption, local-only storage |
| **Accountability** | Documented privacy practices |

### 4.2 User Rights Under GDPR

| Right | Implementation | How to Exercise |
|-------|----------------|-----------------|
| **Access (Art. 15)** | Export all stored data | Settings → Privacy → Export Data |
| **Rectification (Art. 16)** | Edit any stored information | Direct editing in application |
| **Erasure (Art. 17)** | Delete all personal data | Settings → Privacy → Clear All Data |
| **Portability (Art. 20)** | JSON export format | Settings → Privacy → Export Data |
| **Objection (Art. 21)** | Opt-out of analytics | Settings → Privacy → Analytics Toggle |
| **Restriction (Art. 18)** | Pause data processing | Close application or disable features |

### 4.3 Lawful Basis for Processing

| Processing Activity | Legal Basis |
|--------------------|-------------|
| Storing user preferences | Legitimate interest (app functionality) |
| Storing manga metadata | User consent (implied by use) |
| API key storage | Contract necessity (user request) |
| Analytics (if enabled) | Consent (explicit opt-in) |

### 4.4 Data Processing Agreement

**Controller Relationship:**
- **The Loom 2**: Not a data controller (no server, no collection)
- **User**: Controller of their own data
- **LLM Providers**: Separate data controllers for API requests

**No Processor Relationship:**
Since we do not process user data on servers, we are not data processors under GDPR.

### 4.5 Cross-Border Transfers

- All data remains on user's device in EU
- API calls to LLM providers may transfer data outside EU
- Users choose their LLM provider and accept their terms
- No transfers by The Loom 2 itself

### 4.6 GDPR Contact for EU Users

For GDPR-related requests:
- **Data Protection Officer:** Not required (no systematic monitoring or large-scale processing)
- **Supervisory Authority:** Users may contact their local data protection authority
- **Our Response Time:** 30 days for all requests

---

## 5. CCPA Compliance (for California Users)

### 5.1 CCPA Requirements Compliance

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Notice at Collection** | ✅ | Privacy Policy provided at first use |
| **Right to Know** | ✅ | Export feature shows all data |
| **Right to Delete** | ✅ | Clear all data feature available |
| **Right to Opt-Out of Sale** | ✅ | N/A - We don't sell data |
| **Right to Non-Discrimination** | ✅ | No penalties for privacy choices |

### 5.2 Categories of Personal Information

Under CCPA, we do not collect personal information in categories:

| Category | Collected? | Notes |
|----------|-----------|-------|
| Identifiers (name, email, etc.) | ❌ No | No account system |
| Commercial information | ❌ No | No transactions |
| Internet activity | ❌ No | No tracking |
| Geolocation | ❌ No | No location collection |
| Biometric information | ❌ No | N/A |
| Protected classifications | ❌ No | N/A |

### 5.3 "Do Not Sell My Personal Information"

**We Do Not Sell Data.**

The Loom 2 does not and will not:
- Sell personal information for monetary value
- Sell personal information for non-monetary consideration
- Share personal information for cross-context behavioral advertising

No opt-out button is required as we do not engage in any "selling" activities.

### 5.4 Financial Incentive Notice

We do not offer any financial incentives for the collection, sale, or deletion of personal information.

### 5.5 CCPA Contact

For CCPA-related requests from California residents:
- **Email:** [privacy@theloom2.example]
- **Response Time:** 45 days (as required by CCPA)
- **Verification:** We will verify your identity before processing requests

---

## 6. Terms of Service Draft

> **Note:** This is a template draft. Final version should be reviewed by legal counsel before publication.

---

### **TERMS OF SERVICE - THE LOOM 2**

**Effective Date:** [DATE]  
**Last Updated:** [DATE]

Please read these Terms of Service ("Terms") carefully before using The Loom 2 application.

#### 1. Acceptance of Terms

By downloading, installing, or using The Loom 2 ("the Application"), you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Application.

**Minimum Age:** You must be at least 13 years old to use this Application.

#### 2. License to Use

##### 2.1 Grant

We grant you a limited, non-exclusive, non-transferable, revocable license to use the Application for personal, non-commercial purposes.

##### 2.2 Restrictions

You may NOT:
- Modify, reverse engineer, or create derivative works of the Application
- Redistribute, sell, or sublicense the Application
- Use the Application for any illegal purpose
- Remove or alter any proprietary notices
- Use the Application to generate harmful, illegal, or infringing content

##### 2.3 Open Source

The Application is open source under the [LICENSE NAME]. Source code is available at [REPOSITORY URL].

#### 3. Your Content

##### 3.1 Manga Content

You retain all rights to the manga files you process using the Application. We claim no ownership over your content.

**You represent and warrant that:**
- You have the legal right to possess and process any manga you use
- Your use does not infringe any third party's intellectual property rights
- Your content does not violate any applicable laws

##### 3.2 Generated Content

You own the branching narratives and stories generated by the Application using your inputs.

**Important:** Generated content is based on AI models provided by third parties. You are responsible for ensuring your use of generated content complies with applicable laws and the LLM provider's terms.

#### 4. API Keys and Third-Party Services

##### 4.1 Your Responsibility

The Application requires API keys from third-party LLM providers (Google, OpenAI, etc.):

- You are solely responsible for obtaining and securing your API keys
- You are responsible for all costs associated with API usage
- You must comply with the LLM provider's Terms of Service

##### 4.2 No Liability

We are not responsible for:
- LLM provider service availability or quality
- Costs incurred from API usage
- Content generated by LLM providers
- Changes to LLM provider terms or pricing

#### 5. Disclaimer of Warranties

**THE APPLICATION IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.**

We disclaim all warranties, express or implied, including but not limited to:
- Merchantability
- Fitness for a particular purpose
- Non-infringement
- Accuracy of results
- Uninterrupted or error-free operation

#### 6. Limitation of Liability

**TO THE MAXIMUM EXTENT PERMITTED BY LAW:**

We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
- Loss of profits
- Loss of data
- Business interruption
- Personal injury or property damage

**Maximum Liability:** Our total liability shall not exceed the amount you paid for the Application (which is $0 as it is free and open source).

#### 7. Indemnification

You agree to indemnify and hold harmless the Application developers from any claims, damages, or expenses arising from:
- Your use of the Application
- Your violation of these Terms
- Your violation of any third-party rights
- Your content or generated output

#### 8. Termination

##### 8.1 By You

You may terminate your use of the Application at any time by uninstalling it.

##### 8.2 By Us

We may terminate or suspend your license immediately if you violate these Terms.

##### 8.3 Effect

Upon termination:
- Your license to use the Application ends
- You may delete all local data
- Provisions that by their nature should survive termination shall survive

#### 9. Changes to Terms

We may modify these Terms at any time. We will notify you of material changes by:
- In-app notification
- Posting updated Terms at [URL]
- Updating the "Last Updated" date

Continued use after changes constitutes acceptance of the updated Terms.

#### 10. Governing Law

These Terms shall be governed by and construed in accordance with the laws of [JURISDICTION], without regard to conflict of law principles.

#### 11. Dispute Resolution

##### 11.1 Informal Resolution

Please contact us first to try to resolve any disputes informally.

##### 11.2 Arbitration

Any dispute shall be resolved through binding arbitration in [LOCATION], except that either party may seek injunctive relief in court.

#### 12. Severability

If any provision of these Terms is found unenforceable, the remaining provisions shall continue in full effect.

#### 13. Contact Information

For questions about these Terms:
- **Email:** [legal@theloom2.example]
- **GitHub:** [github.com/theloom2]

---

## 7. Copyright Considerations

### 7.1 User-Uploaded Manga

**Rights Ownership:**
- Users retain all rights to manga they own and upload
- The Loom 2 claims no ownership of user content

**User Responsibility:**
- Users must have legal right to the manga they process
- Users must not infringe third-party copyrights
- Users are responsible for ensuring their use is lawful

**Our Position:**
- We do not host, distribute, or display manga content
- We only store file references and metadata
- We cannot and do not verify user's rights to content

### 7.2 Fair Use Analysis

The processing performed by The Loom 2 may qualify as fair use:

| Fair Use Factor | Application to The Loom 2 |
|-----------------|---------------------------|
| **Purpose** | Transformative - creates new narrative content |
| **Nature** | User's own copies; processing for personal use |
| **Amount** | Only metadata stored; minimal use |
| **Market Effect** | No effect on manga market; personal use only |

> **Disclaimer:** This is not legal advice. Fair use is a complex legal doctrine. Consult a legal professional for guidance specific to your situation.

### 7.3 Generated Content

**Ownership:**
- Users own the branching narratives they create
- Output is based on user's creative input and direction

**Third-Party Rights:**
- LLM providers may have terms regarding generated content
- Users must comply with their chosen provider's terms
- Some jurisdictions may have specific rules about AI-generated content

**Not Legal Advice:**
The Application does not provide legal advice about copyright or content ownership.

### 7.4 Application Code Licensing

**License:** [Specify license - e.g., MIT, GPL, Apache 2.0]

**Key Terms:**
- Open source availability
- Attribution requirements
- Modification permissions
- Warranty disclaimers

See LICENSE file in the repository for full terms.

### 7.5 Contributing Guidelines

For contributors to the open source project:

- **Contributor License Agreement:** Not required for most open source licenses
- **Copyright Assignment:** Contributors retain copyright to their contributions
- **License Grant:** Contributions licensed under same terms as project

---

## 8. Content Policy

### 8.1 Prohibited Uses

The following uses of The Loom 2 are strictly prohibited:

| Category | Prohibition | Enforcement |
|----------|-------------|-------------|
| **Illegal Content** | Generating content that violates laws | Permanent ban; law enforcement notification if required |
| **CSAM** | Any content involving minors in sexual contexts | Immediate action; law enforcement notification |
| **Violence/Threats** | Generating direct threats or violent content | Account suspension |
| **Harassment** | Creating content to harass individuals | Account suspension |
| **Hate Speech** | Generating content promoting hatred | Warning or suspension |
| **Copyright Infringement** | Processing content you don't have rights to | Warning; cooperation with DMCA |
| **Malware** | Creating malicious code or instructions | Permanent ban |
| **Impersonation** | Generating content to impersonate others | Warning or suspension |

### 8.2 Zero Tolerance Policy

**Child Sexual Abuse Material (CSAM):**
- Zero tolerance policy
- Immediate reporting to law enforcement
- No appeals process

### 8.3 Reporting Violations

**How to Report:**
- GitHub Issues: [github.com/theloom2/issues]
- Email: [abuse@theloom2.example]
- Anonymous reporting available

**Report Should Include:**
- Description of violation
- Evidence (screenshots, etc.)
- Context and details

**Our Response:**
- Acknowledgment within 24 hours
- Investigation within 72 hours
- Action taken will be documented

### 8.4 Enforcement Actions

| Violation Level | Action |
|-----------------|--------|
| Minor (first offense) | Warning |
| Minor (repeat) | Temporary restriction |
| Serious | Permanent suspension |
| Illegal | Law enforcement referral |

**Appeals:**
- Appeals can be submitted via email
- Response within 14 days
- Final decision at our discretion

---

## 9. Implementation Checklist

### 9.1 Legal Documents

| Item | Status | Priority | Notes |
|------|--------|----------|-------|
| Privacy Policy (public page) | ⬜ Not Started | Critical | Review by legal counsel |
| Terms of Service (public page) | ⬜ Not Started | Critical | Review by legal counsel |
| Cookie Notice | ⬜ Not Started | Medium | If using non-essential cookies |
| DMCA Policy | ⬜ Not Started | Low | If allowing user content sharing |
| Acceptable Use Policy | ⬜ Not Started | Medium | Can combine with ToS |

### 9.2 UI Implementation

| Feature | Location | Priority | Notes |
|---------|----------|----------|-------|
| Privacy settings panel | Settings → Privacy | Critical | All privacy controls |
| Data export functionality | Settings → Privacy → Export | Critical | JSON/CSV formats |
| "Clear all data" button | Settings → Privacy → Delete | Critical | Confirmation required |
| Analytics opt-in toggle | Settings → Privacy → Analytics | Critical | Default OFF |
| Cookie consent banner | App startup | Medium | If using cookies |
| Privacy policy link | Footer/About | Critical | Easy to find |
| Terms of service link | Footer/About | Critical | Easy to find |
| API key encryption setup | First run wizard | High | User password optional |

### 9.3 Compliance Features

| Feature | GDPR | CCPA | Implementation |
|---------|------|------|----------------|
| Data export (JSON) | Required | Required | Export all IndexedDB data |
| Data deletion | Required | Required | Clear IndexedDB + confirmation |
| Consent tracking | Required | N/A | Store consent timestamp |
| Privacy policy version | Required | Required | Track accepted version |
| Opt-out mechanism | Required | Required | Toggle in settings |
| "Do Not Sell" | N/A | Required | N/A - don't sell |
| Age verification | Best practice | N/A | Confirm 13+ on first use |

### 9.4 Technical Implementation

```javascript
// Example: Privacy-first data handling patterns

// 1. Always check consent before analytics
if (privacySettings.analyticsConsent) {
    trackEvent('feature_used', { feature: 'analysis' });
}

// 2. Encrypt sensitive data before storage
async function storeApiKey(provider, key) {
    const encrypted = await encrypt(key, await getEncryptionKey());
    await db.apiKeys.put({ provider, key: encrypted });
}

// 3. Provide clear data export
async function exportUserData() {
    const data = {
        metadata: await db.manga.toArray(),
        preferences: await db.preferences.toArray(),
        analysis: await db.analysis.toArray(),
        exportDate: new Date().toISOString(),
        version: APP_VERSION
    };
    downloadJson(data, `loom2-export-${Date.now()}.json`);
}

// 4. Complete data deletion with confirmation
async function clearAllData() {
    const confirmed = await confirmDialog(
        'This will permanently delete ALL your data. This cannot be undone.'
    );
    if (confirmed) {
        await db.delete();
        localStorage.clear();
        // Reload to clean state
        window.location.reload();
    }
}
```

---

## 10. Risk Assessment

### 10.1 Risk Categories

#### LOW RISK ✅

| Risk | Reasoning | Mitigation |
|------|-----------|------------|
| Data breach (our systems) | No servers to breach | N/A - not applicable |
| Unauthorized data access | Data stays on user's device | Encryption of sensitive data |
| PII exposure | No PII collection | Maintain minimal data policy |
| Server logs exposure | No server logs | N/A - not applicable |
| Third-party data sharing | No data sharing (except LLM APIs) | Clear documentation |

#### MEDIUM RISK ⚠️

| Risk | Reasoning | Mitigation |
|------|-----------|------------|
| LLM provider data handling | Data sent to third parties | Clear provider selection; provider terms disclosure |
| Browser storage vulnerabilities | Local storage could be accessed | Encryption; security best practices |
| User misunderstanding | Users may not understand local-only nature | Clear messaging; documentation |
| Device compromise | Physical access to device | Encourage strong device security |
| API key theft | Keys stored locally | Encryption; user education |

#### HIGH RISK ❌

None identified for current architecture.

### 10.2 Risk Matrix

| Risk | Likelihood | Impact | Overall | Priority |
|------|------------|--------|---------|----------|
| LLM provider data breach | Low | Medium | Low | Monitor |
| Browser vulnerability exploit | Low | High | Medium | Implement encryption |
| User data loss (no backup) | Medium | Medium | Medium | Implement export |
| Legal misunderstanding | Medium | Medium | Medium | Clear documentation |
| Malicious content generation | Low | High | Medium | Content policy |

### 10.3 Mitigation Strategies

| Strategy | Implementation | Status |
|----------|----------------|--------|
| Encryption at rest | AES-256-GCM for API keys | ⬜ Planned |
| Clear user education | Tooltips, documentation | ⬜ Planned |
| Data export | Regular backup reminders | ⬜ Planned |
| Provider transparency | Clear ToS links | ⬜ Planned |
| Content filtering | Optional safety settings | ⬜ Planned |

---

## 11. International Considerations

### 11.1 Jurisdiction

**Primary Jurisdiction:** [TO BE DETERMINED]

**Considerations:**
- Developer location
- Primary user base location
- Legal entity location (if any)

### 11.2 Applicable Privacy Laws

| Jurisdiction | Law | Applicability | Compliance |
|--------------|-----|---------------|------------|
| European Union | GDPR | All users in EU | ✅ Compliant by design |
| United Kingdom | UK GDPR | UK users | ✅ Compliant by design |
| California, USA | CCPA/CPRA | California residents | ✅ Compliant by design |
| Canada | PIPEDA | Canadian users | ✅ Compliant by design |
| Australia | Privacy Act | Australian users | ✅ Compliant by design |
| Brazil | LGPD | Brazilian users | ✅ Compliant by design |
| Singapore | PDPA | Singapore users | ✅ Compliant by design |
| Japan | APPI | Japanese users | ✅ Compliant by design |
| South Korea | PIPA | Korean users | ✅ Compliant by design |
| China | PIPL | Chinese users | ⚠️ Review required |

### 11.3 China PIPL Considerations

**Potential Issues:**
- Cross-border data transfer restrictions
- Data localization requirements
- Government access requirements

**Mitigation:**
- PIPL compliance review recommended
- Consider blocking access from China if compliance not feasible
- Document legal basis for any China users

### 11.4 International Data Transfers

Since The Loom 2 is client-side only:
- **No transfers by us:** All data stays on user's device
- **User-initiated transfers:** API calls to LLM providers
- **User responsibility:** Users choose providers and accept their terms

### 11.5 Localization Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| EU data localization | ✅ Compliant | Data stays on EU user's device |
| China data localization | ⚠️ Review | May need to block China users |
| Russia data localization | ⚠️ Review | May need to block Russia users |

### 11.6 Dispute Resolution

**Recommended Clause:**

```
Any disputes arising from these Terms shall be resolved through 
binding arbitration in [JURISDICTION]. For EU consumers, nothing 
in these Terms limits your rights under EU consumer protection law.
```

---

## 12. Document Maintenance

### 12.1 Review Schedule

| Trigger | Action | Timeline | Responsible |
|---------|--------|----------|-------------|
| Annual review | Full document review | Every 12 months | Project maintainer |
| New feature | Privacy impact assessment | Before release | Development team |
| Legal change | Compliance update | Within 30 days of law change | Legal counsel |
| Incident | Post-incident review | Within 7 days | Project maintainer |
| User feedback | Document update | Quarterly review | Project maintainer |

### 12.2 Version Control

**Document Versioning:**
- Major.Minor.Patch (e.g., 1.2.0)
- Major: Significant legal changes
- Minor: New sections or features
- Patch: Corrections, clarifications

**Change History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-02-13 | Initial document | Project team |
| | | | |

### 12.3 User Notification

**When to Notify Users:**
- Material changes to Privacy Policy
- New data collection practices
- Changes to third-party processors
- Changes to user rights

**Notification Methods:**
1. In-app notification on next launch
2. Email (if email collection added in future)
3. GitHub release notes
4. Updated "Last Updated" date in documents

**Grace Period:**
- 30 days for material changes
- Immediate for security-related updates

### 12.4 Record Keeping

**Maintain Records Of:**
- All document versions
- User consent timestamps (if applicable)
- Privacy impact assessments
- Legal review correspondence
- Incident reports

**Retention Period:**
- Legal documents: 7 years
- Consent records: Duration of user relationship + 2 years
- Incident reports: 7 years

---

## Appendices

### Appendix A: Privacy Policy Template (Minimal)

For quick reference, here is a minimal privacy policy:

```markdown
# Privacy Policy - The Loom 2

**Last Updated:** [DATE]

## Summary
The Loom 2 is a client-side application. We don't have servers. 
Your data stays on your device.

## What We Store
- Manga file information (titles, paths)
- Your settings and preferences
- Analysis results
- Your API keys (encrypted)

All stored locally in your browser.

## What We Don't Do
- Collect personal information
- Track you across websites
- Sell your data
- Store manga images

## Your Rights
- Export your data anytime
- Delete all data anytime
- Opt-out of analytics (if enabled)

## Contact
[Your contact information]
```

### Appendix B: Terms of Service Template (Minimal)

```markdown
# Terms of Service - The Loom 2

**Last Updated:** [DATE]

## Using the Application
- You must be 13+ years old
- Use at your own risk
- Provided "as is" without warranty

## Your Content
- You own your manga and generated content
- You're responsible for having rights to content you process
- Don't use for illegal purposes

## API Keys
- You provide your own API keys
- You're responsible for API costs
- Follow your provider's terms

## Liability
- We're not liable for damages
- Max liability is $0 (it's free)

## Contact
[Your contact information]
```

### Appendix C: Quick Compliance Checklist

```
☐ Privacy Policy published
☐ Terms of Service published
☐ Data export implemented
☐ Data deletion implemented
☐ Analytics opt-in implemented (default off)
☐ API key encryption implemented
☐ Cookie notice (if applicable)
☐ Age verification (13+)
☐ Legal review completed
☐ Documents linked in app
```

### Appendix D: Contact Information Template

```
**Project:** The Loom 2
**Repository:** github.com/[username]/the-loom-2
**License:** [LICENSE NAME]

**Privacy Questions:** privacy@theloom2.example
**Legal Issues:** legal@theloom2.example
**Abuse Reports:** abuse@theloom2.example
**General:** contact@theloom2.example

**Response Time:** 30 days for legal/privacy requests
```

---

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Privacy & Legal Compliance |
| **Project** | The Loom 2 |
| **Version** | 1.0.0 |
| **Status** | Draft |
| **Created** | 2026-02-13 |
| **Next Review** | 2027-02-13 |
| **Author** | Project Team |
| **Reviewers** | Pending Legal Review |

---

**Disclaimer:** This document is a template and guidance document. It does not constitute legal advice. Before publishing or implementing, consult with qualified legal counsel familiar with your specific jurisdiction and circumstances.
